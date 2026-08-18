import { FoodItem } from '../types/nutrition';

/**
 * Built-in verified offline reference foods based on USDA & German BLS standards (per 100g base).
 */
export const VERIFIED_OFFLINE_FOODS: FoodItem[] = [
  // --- GERMAN FITNESS STAPLES (BLS / DE Market) ---
  {
    id: 'db_de_magerquark',
    name: 'Magerquark / Speisequark (Magerstufe <0.2% Fett)',
    brand: 'Milbona / Ja! / Gut & Günstig',
    barcode: '4056489123456', // German EAN-13
    source: 'verified_db',
    caloriesPer100g: 68,
    proteinPer100g: 12.2,
    carbsPer100g: 4.1,
    fatPer100g: 0.2,
    fiberPer100g: 0.0,
    defaultServingSize: 250,
    defaultServingUnit: 'g',
    servingOptions: [
      { unit: 'serving', label: '1/2 Becher (250g)', gramWeight: 250 },
      { unit: 'pack', label: '1 Becher (500g)', gramWeight: 500 },
      { unit: 'g', label: 'grams (g)', gramWeight: 1 },
      { unit: 'tbsp', label: '1 Esslöffel (30g)', gramWeight: 30 },
    ],
    micros: { calcium: 95, sodium: 30, potassium: 120, sugar: 4.1 },
    categories: ['Dairy & Eggs', 'German Staples', 'High Protein', 'Low Fat'],
    isVerified: true,
  },
  {
    id: 'db_de_skyr_natur',
    name: 'Skyr Natur (Traditionell Isländisch)',
    brand: 'Arla / Milbona / Rewe Beste Wahl',
    barcode: '5711953049102', // Skyr EAN
    source: 'verified_db',
    caloriesPer100g: 63,
    proteinPer100g: 11.0,
    carbsPer100g: 4.0,
    fatPer100g: 0.2,
    fiberPer100g: 0.0,
    defaultServingSize: 200,
    defaultServingUnit: 'g',
    servingOptions: [
      { unit: 'serving', label: '1 Portion (200g)', gramWeight: 200 },
      { unit: 'pack', label: '1 Becher (450g)', gramWeight: 450 },
      { unit: 'g', label: 'grams (g)', gramWeight: 1 },
    ],
    micros: { calcium: 110, sodium: 40, sugar: 4.0 },
    categories: ['Dairy & Eggs', 'German Staples', 'High Protein'],
    isVerified: true,
  },
  {
    id: 'db_de_haferflocken_zart',
    name: 'Haferflocken Zart / Vollkorn',
    brand: 'Kölln / Alnatura / Ja!',
    barcode: '4000521005030', // Kölln EAN
    source: 'verified_db',
    caloriesPer100g: 372,
    proteinPer100g: 13.5,
    carbsPer100g: 58.7,
    fatPer100g: 7.0,
    fiberPer100g: 10.0,
    defaultServingSize: 50,
    defaultServingUnit: 'g',
    servingOptions: [
      { unit: 'serving', label: '1 Schüssel (50g)', gramWeight: 50 },
      { unit: 'cup', label: '1 Tasse (80g)', gramWeight: 80 },
      { unit: 'g', label: 'grams (g)', gramWeight: 1 },
    ],
    micros: { iron: 4.5, magnesium: 130, potassium: 380, sugar: 1.1 },
    categories: ['Grains & Cereals', 'German Staples', 'High Fiber'],
    isVerified: true,
  },
  {
    id: 'db_de_harzer_kaese',
    name: 'Harzer Käse / Handkäse (Edelschimmel)',
    brand: 'Loose / Ja! / Sachsenmilch',
    barcode: '4008400001029',
    source: 'verified_db',
    caloriesPer100g: 125,
    proteinPer100g: 30.0,
    carbsPer100g: 0.1,
    fatPer100g: 0.5,
    fiberPer100g: 0.0,
    defaultServingSize: 100,
    defaultServingUnit: 'g',
    servingOptions: [
      { unit: 'piece', label: '1 Rolle (100g)', gramWeight: 100 },
      { unit: 'serving', label: '1 Taler (25g)', gramWeight: 25 },
      { unit: 'g', label: 'grams (g)', gramWeight: 1 },
    ],
    micros: { calcium: 200, sodium: 800 },
    categories: ['Dairy & Eggs', 'German Staples', 'High Protein', 'Keto / Low Carb'],
    isVerified: true,
  },
  {
    id: 'db_de_vollkornbrot',
    name: 'Deutsches Vollkornbrot / Roggenvollkorn',
    brand: 'Lieken Urkorn / Harry Brot',
    barcode: '4008300000016',
    source: 'verified_db',
    caloriesPer100g: 198,
    proteinPer100g: 6.8,
    carbsPer100g: 38.0,
    fatPer100g: 1.2,
    fiberPer100g: 8.5,
    defaultServingSize: 50,
    defaultServingUnit: 'g',
    servingOptions: [
      { unit: 'slice', label: '1 Scheibe (50g)', gramWeight: 50 },
      { unit: 'g', label: 'grams (g)', gramWeight: 1 },
    ],
    micros: { sodium: 380, magnesium: 55, iron: 2.1 },
    categories: ['Bakery', 'German Staples', 'High Fiber'],
    isVerified: true,
  },

  // --- GLOBAL STANDARD REFERENCE FOODS (USDA FDC) ---
  {
    id: 'db_egg_large',
    name: 'Whole Large Egg',
    brand: 'USDA Standard Reference',
    barcode: '000000000001',
    source: 'verified_db',
    caloriesPer100g: 143,
    proteinPer100g: 12.6,
    carbsPer100g: 0.7,
    fatPer100g: 9.5,
    fiberPer100g: 0.0,
    defaultServingSize: 50,
    defaultServingUnit: 'g',
    servingOptions: [
      { unit: 'piece', label: '1 large egg (50g)', gramWeight: 50 },
      { unit: 'g', label: 'grams (g)', gramWeight: 1 },
      { unit: 'oz', label: 'ounces (oz)', gramWeight: 28.35 },
    ],
    micros: { sodium: 142, potassium: 138, cholesterol: 372, saturatedFat: 3.1 },
    categories: ['Dairy & Eggs', 'Whole Foods', 'High Protein'],
    isVerified: true,
  },
  {
    id: 'db_chicken_breast_cooked',
    name: 'Chicken Breast, Boneless & Skinless (Grilled)',
    brand: 'USDA Whole Foods',
    barcode: '000000000002',
    source: 'verified_db',
    caloriesPer100g: 165,
    proteinPer100g: 31.0,
    carbsPer100g: 0.0,
    fatPer100g: 3.6,
    fiberPer100g: 0.0,
    defaultServingSize: 150,
    defaultServingUnit: 'g',
    servingOptions: [
      { unit: 'g', label: 'grams (g)', gramWeight: 1 },
      { unit: 'oz', label: 'ounces (oz)', gramWeight: 28.35 },
      { unit: 'serving', label: '1 breast fillet (174g)', gramWeight: 174 },
    ],
    micros: { sodium: 74, potassium: 256, cholesterol: 85, saturatedFat: 1.0 },
    categories: ['Meat & Poultry', 'Whole Foods', 'High Protein'],
    isVerified: true,
  },
  {
    id: 'db_salmon_atlantic',
    name: 'Atlantic Salmon (Pan-Seared / Baked)',
    brand: 'USDA Whole Foods',
    barcode: '000000000003',
    source: 'verified_db',
    caloriesPer100g: 206,
    proteinPer100g: 22.1,
    carbsPer100g: 0.0,
    fatPer100g: 12.3,
    fiberPer100g: 0.0,
    defaultServingSize: 150,
    defaultServingUnit: 'g',
    servingOptions: [
      { unit: 'g', label: 'grams (g)', gramWeight: 1 },
      { unit: 'oz', label: 'ounces (oz)', gramWeight: 28.35 },
      { unit: 'serving', label: '1 fillet (198g)', gramWeight: 198 },
    ],
    micros: { sodium: 61, potassium: 384, cholesterol: 63, saturatedFat: 2.5 },
    categories: ['Fish & Seafood', 'Whole Foods', 'High Protein', 'Healthy Fats'],
    isVerified: true,
  },
  {
    id: 'db_greek_yogurt_0pct',
    name: 'Nonfat Plain Greek Yogurt (0% Fat)',
    brand: 'Chobani / Fage',
    barcode: '052159700063',
    source: 'verified_db',
    caloriesPer100g: 59,
    proteinPer100g: 10.3,
    carbsPer100g: 3.6,
    fatPer100g: 0.4,
    fiberPer100g: 0.0,
    defaultServingSize: 170,
    defaultServingUnit: 'g',
    servingOptions: [
      { unit: 'cup', label: '1 cup (200g)', gramWeight: 200 },
      { unit: 'serving', label: '1 container (170g)', gramWeight: 170 },
      { unit: 'g', label: 'grams (g)', gramWeight: 1 },
      { unit: 'tbsp', label: '1 tablespoon (20g)', gramWeight: 20 },
    ],
    micros: { calcium: 110, sodium: 36, potassium: 141, sugar: 3.2 },
    categories: ['Dairy & Eggs', 'High Protein', 'Low Carb'],
    isVerified: true,
  },
  {
    id: 'db_oat_milk_barista',
    name: 'Oat Milk Barista Edition',
    brand: 'Oatly',
    barcode: '737628064502',
    source: 'open_food_facts',
    caloriesPer100g: 59,
    proteinPer100g: 1.0,
    carbsPer100g: 6.6,
    fatPer100g: 3.0,
    fiberPer100g: 0.8,
    defaultServingSize: 240,
    defaultServingUnit: 'ml',
    servingOptions: [
      { unit: 'cup', label: '1 cup (240ml)', gramWeight: 240 },
      { unit: 'ml', label: 'milliliters (ml)', gramWeight: 1 },
      { unit: 'fl_oz', label: 'fl oz (29.5ml)', gramWeight: 29.57 },
    ],
    micros: { calcium: 120, sugar: 4.0, sodium: 40 },
    categories: ['Plant-based Dairy', 'Beverages'],
    isVerified: true,
  },
  {
    id: 'db_oats_rolled',
    name: 'Rolled Old Fashioned Oats (Dry)',
    brand: 'Quaker Oats',
    barcode: '030000010204',
    source: 'verified_db',
    caloriesPer100g: 389,
    proteinPer100g: 16.9,
    carbsPer100g: 66.3,
    fatPer100g: 6.9,
    fiberPer100g: 10.6,
    defaultServingSize: 40,
    defaultServingUnit: 'g',
    servingOptions: [
      { unit: 'serving', label: '1/2 cup dry (40g)', gramWeight: 40 },
      { unit: 'cup', label: '1 cup dry (80g)', gramWeight: 80 },
      { unit: 'g', label: 'grams (g)', gramWeight: 1 },
      { unit: 'oz', label: 'ounces (oz)', gramWeight: 28.35 },
    ],
    micros: { iron: 4.7, potassium: 429, magnesium: 177, sugar: 0.9 },
    categories: ['Grains & Cereals', 'Whole Foods', 'High Fiber'],
    isVerified: true,
  },
  {
    id: 'db_brown_rice_cooked',
    name: 'Brown Rice, Long-Grain (Cooked)',
    brand: 'USDA Whole Foods',
    barcode: '000000000004',
    source: 'verified_db',
    caloriesPer100g: 123,
    proteinPer100g: 2.7,
    carbsPer100g: 25.6,
    fatPer100g: 1.0,
    fiberPer100g: 1.8,
    defaultServingSize: 150,
    defaultServingUnit: 'g',
    servingOptions: [
      { unit: 'cup', label: '1 cup cooked (195g)', gramWeight: 195 },
      { unit: 'g', label: 'grams (g)', gramWeight: 1 },
      { unit: 'oz', label: 'ounces (oz)', gramWeight: 28.35 },
    ],
    micros: { potassium: 86, magnesium: 43, sodium: 5 },
    categories: ['Grains & Cereals', 'Whole Foods'],
    isVerified: true,
  },
  {
    id: 'db_banana',
    name: 'Fresh Banana (Medium)',
    brand: 'USDA Whole Foods',
    barcode: '000000000005',
    source: 'verified_db',
    caloriesPer100g: 89,
    proteinPer100g: 1.1,
    carbsPer100g: 22.8,
    fatPer100g: 0.3,
    fiberPer100g: 2.6,
    defaultServingSize: 118,
    defaultServingUnit: 'g',
    servingOptions: [
      { unit: 'piece', label: '1 medium banana (118g)', gramWeight: 118 },
      { unit: 'g', label: 'grams (g)', gramWeight: 1 },
      { unit: 'oz', label: 'ounces (oz)', gramWeight: 28.35 },
    ],
    micros: { potassium: 358, vitaminC: 8.7, sugar: 12.2 },
    categories: ['Fruits', 'Whole Foods'],
    isVerified: true,
  },
  {
    id: 'db_avocado',
    name: 'Hass Avocado (Fresh)',
    brand: 'USDA Whole Foods',
    barcode: '000000000006',
    source: 'verified_db',
    caloriesPer100g: 160,
    proteinPer100g: 2.0,
    carbsPer100g: 8.5,
    fatPer100g: 14.7,
    fiberPer100g: 6.7,
    defaultServingSize: 100,
    defaultServingUnit: 'g',
    servingOptions: [
      { unit: 'piece', label: '1 whole avocado (150g edible)', gramWeight: 150 },
      { unit: 'serving', label: '1/2 avocado (75g)', gramWeight: 75 },
      { unit: 'g', label: 'grams (g)', gramWeight: 1 },
      { unit: 'tbsp', label: '1 tbsp mashed (15g)', gramWeight: 15 },
    ],
    micros: { potassium: 485, sodium: 7, vitaminC: 10 },
    categories: ['Fruits & Veggies', 'Whole Foods', 'Healthy Fats', 'High Fiber'],
    isVerified: true,
  },
  {
    id: 'db_peanut_butter_natural',
    name: 'Natural Creamy Peanut Butter',
    brand: 'Jif / Smucker’s Natural',
    barcode: '051500255162',
    source: 'verified_db',
    caloriesPer100g: 588,
    proteinPer100g: 25.1,
    carbsPer100g: 20.0,
    fatPer100g: 50.4,
    fiberPer100g: 8.0,
    defaultServingSize: 32,
    defaultServingUnit: 'g',
    servingOptions: [
      { unit: 'tbsp', label: '2 tablespoons (32g)', gramWeight: 32 },
      { unit: 'serving', label: '1 tbsp (16g)', gramWeight: 16 },
      { unit: 'g', label: 'grams (g)', gramWeight: 1 },
      { unit: 'oz', label: 'ounces (oz)', gramWeight: 28.35 },
    ],
    micros: { potassium: 649, sodium: 17, saturatedFat: 10.3, sugar: 3.1 },
    categories: ['Nuts & Spreads', 'Healthy Fats', 'High Protein'],
    isVerified: true,
  },
  {
    id: 'db_whey_protein_isolate',
    name: '100% Gold Standard Whey Isolate (Double Rich Chocolate)',
    brand: 'Optimum Nutrition',
    barcode: '748927028669',
    source: 'verified_db',
    caloriesPer100g: 395,
    proteinPer100g: 78.9,
    carbsPer100g: 9.8,
    fatPer100g: 3.3,
    fiberPer100g: 1.3,
    defaultServingSize: 30.4,
    defaultServingUnit: 'g',
    servingOptions: [
      { unit: 'serving', label: '1 scoop (30.4g)', gramWeight: 30.4 },
      { unit: 'g', label: 'grams (g)', gramWeight: 1 },
    ],
    micros: { calcium: 130, sodium: 130, potassium: 200, cholesterol: 35 },
    categories: ['Supplements', 'High Protein'],
    isVerified: true,
  },
  {
    id: 'db_quest_protein_bar',
    name: 'Quest Protein Bar (Chocolate Chip Cookie Dough)',
    brand: 'Quest Nutrition',
    barcode: '888849000010',
    source: 'verified_db',
    caloriesPer100g: 333,
    proteinPer100g: 35.0,
    carbsPer100g: 36.7,
    fatPer100g: 15.0,
    fiberPer100g: 23.3,
    defaultServingSize: 60,
    defaultServingUnit: 'g',
    servingOptions: [
      { unit: 'piece', label: '1 bar (60g)', gramWeight: 60 },
      { unit: 'g', label: 'grams (g)', gramWeight: 1 },
    ],
    micros: { sodium: 220, potassium: 110, calcium: 150, sugar: 1.0 },
    categories: ['Snacks', 'High Protein', 'High Fiber'],
    isVerified: true,
  },
];

/**
 * Sample popular barcodes for simulation, testing, and camera scanner quick triggers
 * Structured by region (Germany 🇩🇪 vs Global 🌍)
 */
export const SAMPLE_BARCODES = [
  // Germany (DE) Market Staples
  { code: '4056489123456', name: '🇩🇪 Milbona Magerquark 500g', brand: 'Milbona / Lidl', market: 'de' },
  { code: '5711953049102', name: '🇩🇪 Arla Skyr Natur 450g', brand: 'Arla / Edeka', market: 'de' },
  { code: '4000521005030', name: '🇩🇪 Kölln Haferflocken Zart', brand: 'Peter Kölln', market: 'de' },
  { code: '4008400001029', name: '🇩🇪 Harzer Käse 100g', brand: 'Loose', market: 'de' },
  { code: '4008400401027', name: '🇩🇪 Nutella Haselnusscreme', brand: 'Ferrero Deutschland', market: 'de' },
  { code: '4001738012015', name: '🇩🇪 Ritter Sport Marzipan', brand: 'Ritter Sport', market: 'de' },
  
  // Global Market Staples
  { code: '052159700063', name: '🌍 FAGE 0% Greek Yogurt', brand: 'Fage', market: 'world' },
  { code: '737628064502', name: '🌍 Oatly Barista Oat Milk', brand: 'Oatly', market: 'world' },
  { code: '030000010204', name: '🌍 Quaker Rolled Oats', brand: 'Quaker', market: 'world' },
  { code: '748927028669', name: '🌍 Gold Standard Whey', brand: 'Optimum Nutrition', market: 'world' },
  { code: '888849000010', name: '🌍 Quest Protein Bar', brand: 'Quest', market: 'world' },
  { code: '051500255162', name: '🌍 Jif Natural Peanut Butter', brand: 'Jif', market: 'world' },
];

const LOCAL_CUSTOM_FOODS_KEY = 'macropulse_custom_foods_v1';
const LOCAL_FAVORITES_KEY = 'macropulse_favorites_v1';

export function getCustomFoods(): FoodItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_CUSTOM_FOODS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCustomFood(food: FoodItem): void {
  const current = getCustomFoods();
  const index = current.findIndex((f) => f.id === food.id);
  if (index >= 0) {
    current[index] = food;
  } else {
    current.unshift(food);
  }
  localStorage.setItem(LOCAL_CUSTOM_FOODS_KEY, JSON.stringify(current));
}

export function getFavoriteIds(): string[] {
  try {
    const raw = localStorage.getItem(LOCAL_FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function toggleFavorite(foodId: string): boolean {
  const favs = new Set(getFavoriteIds());
  let isNowFavorite = false;
  if (favs.has(foodId)) {
    favs.delete(foodId);
  } else {
    favs.add(foodId);
    isNowFavorite = true;
  }
  localStorage.setItem(LOCAL_FAVORITES_KEY, JSON.stringify(Array.from(favs)));
  return isNowFavorite;
}
