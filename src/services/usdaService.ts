import { FoodItem, ServingOption } from '../types/nutrition';
import { roundCalories, roundMacro } from './nutritionMath';

// Standard USDA nutrient IDs:
// Energy (kcal): 1008
// Protein (g): 1003
// Total lipid / fat (g): 1004
// Carbohydrate (g): 1005
// Fiber, total dietary (g): 1079
// Sugars (g): 2000
// Sodium (mg): 1093
// Potassium (mg): 1092
// Calcium (mg): 1087

export interface UsdaSearchItem {
  fdcId: number;
  description: string;
  brandOwner?: string;
  dataType: string;
  foodNutrients: Array<{
    nutrientId: number;
    nutrientName: string;
    value: number;
    unitName: string;
  }>;
  servingSize?: number;
  servingSizeUnit?: string;
}

/**
 * Searches USDA FoodData Central or returns curated reference items
 */
export async function searchUsdaFoods(query: string): Promise<FoodItem[]> {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed || trimmed.length < 2) return [];

  // USDA FoodData Central public API key / demo key fallback
  const USDA_API_KEY = 'DEMO_KEY';
  const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${USDA_API_KEY}&query=${encodeURIComponent(
    trimmed
  )}&pageSize=15&dataType=Foundation,SR%20Legacy,Survey%20(FNDDS)`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data.foods && Array.isArray(data.foods)) {
        return data.foods.map((food: UsdaSearchItem) => {
          let kcal = 0;
          let protein = 0;
          let fat = 0;
          let carbs = 0;
          let fiber = 0;
          let sugar = 0;
          let sodium = 0;

          (food.foodNutrients || []).forEach((n) => {
            const id = n.nutrientId;
            const name = (n.nutrientName || '').toLowerCase();
            const val = n.value || 0;

            if (id === 1008 || name.includes('energy') && (n.unitName === 'KCAL' || !name.includes('kj'))) {
              kcal = val;
            } else if (id === 1003 || name.includes('protein')) {
              protein = val;
            } else if (id === 1004 || name.includes('total lipid')) {
              fat = val;
            } else if (id === 1005 || name.includes('carbohydrate, by difference')) {
              carbs = val;
            } else if (id === 1079 || name.includes('fiber, total dietary')) {
              fiber = val;
            } else if (id === 2000 || name.includes('sugars, total')) {
              sugar = val;
            } else if (id === 1093 || name.includes('sodium')) {
              sodium = val;
            }
          });

          const servingOptions: ServingOption[] = [
            { unit: 'g', label: 'grams (g)', gramWeight: 1 },
            { unit: 'oz', label: 'ounces (oz)', gramWeight: 28.35 },
            { unit: 'cup', label: '1 cup reference (150g)', gramWeight: 150 },
          ];

          return {
            id: `usda_${food.fdcId}`,
            name: food.description,
            brand: food.brandOwner || 'USDA Reference',
            source: 'usda',
            caloriesPer100g: roundCalories(kcal),
            proteinPer100g: roundMacro(protein),
            carbsPer100g: roundMacro(carbs),
            fatPer100g: roundMacro(fat),
            fiberPer100g: roundMacro(fiber),
            defaultServingSize: 100,
            defaultServingUnit: 'g',
            servingOptions,
            micros: {
              sugar: roundMacro(sugar),
              sodium: roundCalories(sodium),
            },
            isVerified: true,
          };
        });
      }
    }
  } catch (error) {
    console.warn('USDA API query skipped/timed out:', error);
  }

  return [];
}
