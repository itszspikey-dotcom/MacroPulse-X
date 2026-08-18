import { FoodItem, ServingOption } from '../types/nutrition';
import { roundCalories, roundMacro } from './nutritionMath';

// Local cache for sub-second repeat lookups
const memoryProductCache = new Map<string, FoodItem>();

export type MarketRegion = 'de' | 'world' | 'fr' | 'uk' | 'us';

export interface ApiStatusReport {
  region: MarketRegion;
  name: string;
  endpoint: string;
  status: 'operational' | 'degraded' | 'offline';
  latencyMs: number;
  lastChecked: number;
}

/**
 * Determine if a barcode belongs to Germany (GS1 prefix 400 - 440)
 */
export function isGermanBarcode(barcode: string): boolean {
  const clean = barcode.replace(/\D/g, '');
  if (clean.length >= 3) {
    const prefix = parseInt(clean.substring(0, 3), 10);
    return prefix >= 400 && prefix <= 440;
  }
  return false;
}

function parseNutriments(
  nutriments: any,
  productName: string,
  brand?: string,
  barcode?: string,
  image?: string,
  language = 'en'
): FoodItem {
  // 1. Calories resolution
  let kcal = 0;
  if (typeof nutriments['energy-kcal_100g'] === 'number') {
    kcal = nutriments['energy-kcal_100g'];
  } else if (typeof nutriments['energy-kcal'] === 'number') {
    kcal = nutriments['energy-kcal'];
  } else if (typeof nutriments['energy_100g'] === 'number') {
    const rawEnergy = nutriments['energy_100g'];
    if (nutriments['energy_unit'] === 'kcal') {
      kcal = rawEnergy;
    } else {
      kcal = rawEnergy / 4.184; // convert kJ to kcal
    }
  }

  // 2. Macros resolution
  const protein = typeof nutriments.proteins_100g === 'number' ? nutriments.proteins_100g : (nutriments.proteins || 0);
  const carbs = typeof nutriments.carbohydrates_100g === 'number' ? nutriments.carbohydrates_100g : (nutriments.carbohydrates || 0);
  const fat = typeof nutriments.fat_100g === 'number' ? nutriments.fat_100g : (nutriments.fat || 0);
  const fiber = typeof nutriments.fiber_100g === 'number' ? nutriments.fiber_100g : (nutriments.fiber || 0);
  const sugar = typeof nutriments.sugars_100g === 'number' ? nutriments.sugars_100g : (nutriments.sugars || 0);

  // Sodium calculation (salt to sodium: 1g salt ≈ 400mg sodium)
  let sodiumMg = 0;
  if (typeof nutriments.sodium_100g === 'number') {
    sodiumMg = nutriments.sodium_100g * 1000;
  } else if (typeof nutriments.salt_100g === 'number') {
    sodiumMg = (nutriments.salt_100g / 2.5) * 1000;
  }

  // Serving size parse
  let defaultServingSize = 100;
  let defaultServingUnit: any = 'g';
  const servingOptions: ServingOption[] = [
    { unit: 'g', label: 'grams (g)', gramWeight: 1 },
    { unit: 'oz', label: 'ounces (oz)', gramWeight: 28.35 },
  ];

  if (nutriments.serving_size || nutriments.serving_quantity) {
    const servingQty = Number(nutriments.serving_quantity);
    if (!isNaN(servingQty) && servingQty > 0) {
      defaultServingSize = servingQty;
      servingOptions.unshift({
        unit: 'serving',
        label: `1 serving (${servingQty}g)`,
        gramWeight: servingQty,
      });
    }
  }

  return {
    id: `off_${barcode || Math.random().toString(36).substring(2, 9)}`,
    name: productName || 'Unnamed Product',
    brand: brand || 'Unknown Brand',
    barcode: barcode || undefined,
    source: 'open_food_facts',
    caloriesPer100g: roundCalories(kcal),
    proteinPer100g: roundMacro(protein),
    carbsPer100g: roundMacro(carbs),
    fatPer100g: roundMacro(fat),
    fiberPer100g: roundMacro(fiber),
    defaultServingSize,
    defaultServingUnit,
    servingOptions,
    micros: {
      sugar: roundMacro(sugar),
      sodium: roundCalories(sodiumMg),
      saturatedFat: roundMacro(nutriments['saturated-fat_100g'] || 0),
    },
    imageUrl: image || undefined,
    nutriScore: nutriments.nutrition_grades?.toUpperCase(),
    novaGroup: nutriments.nova_group,
    isVerified: true,
  };
}

/**
 * Real Open Food Facts Barcode Lookup with localized German priority & World fallback
 */
export async function fetchProductByBarcode(
  barcode: string,
  preferredRegion: MarketRegion = 'de'
): Promise<FoodItem | null> {
  const cleanCode = barcode.trim().replace(/\D/g, '');
  if (!cleanCode) return null;

  // Check cache first
  const cacheKey = `${preferredRegion}_${cleanCode}`;
  if (memoryProductCache.has(cacheKey)) {
    return memoryProductCache.get(cacheKey)!;
  }
  if (memoryProductCache.has(cleanCode)) {
    return memoryProductCache.get(cleanCode)!;
  }

  // Construct tiered endpoints: if German barcode or region is 'de', check de.openfoodfacts.org first, then fallback to world
  const endpoints: string[] = [];
  const isGerman = isGermanBarcode(cleanCode) || preferredRegion === 'de';

  if (isGerman) {
    endpoints.push(
      `https://de.openfoodfacts.org/api/v2/product/${encodeURIComponent(cleanCode)}.json?fields=product_name,product_name_de,product_name_en,brands,nutriments,image_front_url,serving_size,serving_quantity,nutrition_grades,nova_group,code`
    );
  }

  // Always append global world endpoint as universal fallback
  endpoints.push(
    `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(cleanCode)}.json?fields=product_name,product_name_de,product_name_en,brands,nutriments,image_front_url,serving_size,serving_quantity,nutrition_grades,nova_group,code`
  );

  for (const url of endpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'MacroPulse - CalorieTracker/1.0 (web-app; https://macropulse.app)',
        },
      });
      clearTimeout(timeoutId);

      if (!response.ok) continue;

      const data = await response.json();
      if (data.status === 1 && data.product) {
        const product = data.product;
        const localizedName =
          product.product_name_de ||
          product.product_name ||
          product.product_name_en ||
          'Scanned Product';

        const foodItem = parseNutriments(
          product.nutriments || {},
          localizedName,
          product.brands || '',
          product.code || cleanCode,
          product.image_front_url
        );

        memoryProductCache.set(cleanCode, foodItem);
        memoryProductCache.set(cacheKey, foodItem);
        return foodItem;
      }
    } catch (error) {
      console.warn(`OpenFoodFacts barcode lookup attempt failed for ${url}:`, error);
    }
  }

  return null;
}

/**
 * Real Open Food Facts Search with German taxonomy & World fallback
 */
export async function searchOpenFoodFacts(
  query: string,
  region: MarketRegion = 'de',
  page = 1
): Promise<FoodItem[]> {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) return [];

  const domain = region === 'de' ? 'de.openfoodfacts.org' : 'world.openfoodfacts.org';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const url = `https://${domain}/cgi/search.pl?search_terms=${encodeURIComponent(
      trimmed
    )}&search_simple=1&action=process&json=1&page_size=24&page=${page}&fields=product_name,product_name_de,product_name_en,brands,nutriments,image_front_url,serving_size,serving_quantity,nutrition_grades,nova_group,code`;

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'MacroPulse - CalorieTracker/1.0 (web-app)',
      },
    });
    clearTimeout(timeoutId);

    if (!response.ok) return [];

    const data = await response.json();
    if (data.products && Array.isArray(data.products)) {
      const items: FoodItem[] = data.products
        .filter((p: any) => (p.product_name || p.product_name_de) && p.nutriments)
        .map((p: any) =>
          parseNutriments(
            p.nutriments,
            p.product_name_de || p.product_name || p.product_name_en,
            p.brands,
            p.code,
            p.image_front_url
          )
        );

      return items;
    }
  } catch (error) {
    console.warn('OpenFoodFacts search error:', error);
  }

  return [];
}

/**
 * Check Open Source API Availability & Latency
 */
export async function checkOpenSourceApiHealth(): Promise<ApiStatusReport[]> {
  const endpoints: { region: MarketRegion; name: string; url: string }[] = [
    {
      region: 'de',
      name: 'Open Food Facts (Germany / DE)',
      url: 'https://de.openfoodfacts.org/api/v2/product/4008400401027.json?fields=code', // Ferrero Nutella DE
    },
    {
      region: 'world',
      name: 'Open Food Facts (Global / World)',
      url: 'https://world.openfoodfacts.org/api/v2/product/737628064502.json?fields=code', // Oatly
    },
  ];

  const results: ApiStatusReport[] = [];

  for (const item of endpoints) {
    const startTime = performance.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const resp = await fetch(item.url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'MacroPulse - HealthCheck/1.0' },
      });
      clearTimeout(timeoutId);
      const latency = Math.round(performance.now() - startTime);

      results.push({
        region: item.region,
        name: item.name,
        endpoint: item.url.split('/api')[0],
        status: resp.ok ? 'operational' : 'degraded',
        latencyMs: latency,
        lastChecked: Date.now(),
      });
    } catch {
      results.push({
        region: item.region,
        name: item.name,
        endpoint: item.url.split('/api')[0],
        status: 'offline',
        latencyMs: Math.round(performance.now() - startTime),
        lastChecked: Date.now(),
      });
    }
  }

  return results;
}
