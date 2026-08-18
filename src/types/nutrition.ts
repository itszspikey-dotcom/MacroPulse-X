export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type ServingUnit = 'g' | 'oz' | 'ml' | 'fl_oz' | 'serving' | 'cup' | 'tbsp' | 'tsp' | 'piece' | 'slice' | 'pack';

export interface ServingOption {
  unit: ServingUnit;
  label: string;
  gramWeight: number; // equivalent weight in grams
}

export interface Micronutrients {
  saturatedFat?: number; // g
  transFat?: number; // g
  cholesterol?: number; // mg
  sodium?: number; // mg
  potassium?: number; // mg
  magnesium?: number; // mg
  sugar?: number; // g
  addedSugar?: number; // g
  calcium?: number; // mg
  iron?: number; // mg
  vitaminA?: number; // mcg
  vitaminC?: number; // mg
  vitaminD?: number; // mcg
}

export interface FoodItem {
  id: string;
  name: string;
  brand?: string;
  barcode?: string;
  source: 'open_food_facts' | 'usda' | 'custom' | 'verified_db' | 'ai_detected' | 'recipe';
  
  // Base Nutritional Values per 100g (or 100ml)
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g: number;
  
  // Default serving reference
  defaultServingSize: number;
  defaultServingUnit: ServingUnit;
  servingOptions: ServingOption[];
  
  micros?: Micronutrients;
  imageUrl?: string;
  categories?: string[];
  nutriScore?: 'A' | 'B' | 'C' | 'D' | 'E';
  novaGroup?: 1 | 2 | 3 | 4;
  ecoScore?: string;
  isFavorite?: boolean;
  notes?: string;
  isVerified?: boolean;
}

export interface LoggedFood {
  id: string; // unique log entry id
  userId: string;
  foodId: string;
  foodName: string;
  brand?: string;
  barcode?: string;
  mealType: MealType;
  date: string; // ISO format 'YYYY-MM-DD'
  timestamp: number; // epoch ms
  
  // Consumed serving amount & calculations
  servingAmount: number;
  servingUnit: ServingUnit;
  servingGramWeight: number; // actual total consumed weight in grams
  
  // Calculated Nutrients for this exact consumed portion:
  // Math: (servingGramWeight / 100) * per100g
  calories: number; // integer rounded
  protein: number;  // 1 decimal place
  carbs: number;    // 1 decimal place
  fat: number;      // 1 decimal place
  fiber: number;    // 1 decimal place
  
  micros?: Micronutrients;
  source: string;
  syncStatus: 'synced' | 'pending' | 'failed';
  localCreatedAt: number;
  notes?: string;
}

export interface MacroGoals {
  calories: number;
  protein: number; // g
  carbs: number;   // g
  fat: number;     // g
  fiber: number;   // g
  waterMl: number; // ml
  sugarMaxG?: number;
  sodiumMaxMg?: number;
}

export interface DailySummary {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  waterMl: number;
  burnedCalories: number;
  loggedItems: LoggedFood[];
}

export interface WeightObjective {
  targetWeightKg: number;
  paceKgPerWeek: number; // e.g. 0.25, 0.5, 0.75, 1.0 kg/week
  mode: 'pace' | 'target_date';
  targetDate?: string; // YYYY-MM-DD
  startDate?: string;
  startWeightKg?: number;
  deficitStrategy?: 'gentle' | 'standard' | 'aggressive' | 'custom';
  preserveMuscleHighProtein?: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  avatarColor?: string;
  avatarInitials?: string;
  notes?: string;
  isDefault?: boolean;
  age: number;
  gender: 'male' | 'female' | 'other';
  heightCm: number;
  weightKg: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'very_active' | 'extra_active';
  goalType: 'cut' | 'maintain' | 'bulk' | 'keto' | 'custom';
  weightObjective?: WeightObjective;
  themeId?: string;
  layoutMode?: 'command-dock' | 'top-nav-grid' | 'focus-dial' | 'split-workspace' | 'dense-hud';
  customMacroDistribution?: {
    proteinPct: number;
    carbsPct: number;
    fatPct: number;
  };
  bmr: number;
  tdee: number;
  targetCalories: number;
  targetProteinG: number;
  targetCarbsG: number;
  targetFatG: number;
  targetFiberG: number;
  targetWaterMl: number;
  useHaptics: boolean;
  useSound: boolean;
  streakDays: number;
  lastLoggedDate: string;
}

export interface RecipeIngredient {
  foodItem: FoodItem;
  amount: number;
  unit: ServingUnit;
  gramWeight: number;
}

export interface Recipe {
  id: string;
  name: string;
  description?: string;
  servings: number;
  ingredients: RecipeIngredient[];
  totalWeightG: number;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
  perServingCalories: number;
  perServingProtein: number;
  perServingCarbs: number;
  perServingFat: number;
  perServingFiber: number;
  instructions?: string[];
  createdAt: number;
}

export interface WaterLog {
  id: string;
  date: string;
  amountMl: number;
  timestamp: number;
  syncStatus: 'synced' | 'pending';
}

export interface SyncQueueItem {
  id: string;
  action: 'insert' | 'update' | 'delete';
  table: 'meal_logs' | 'water_logs' | 'custom_foods' | 'recipes' | 'user_goals';
  payload: any;
  timestamp: number;
  retryCount: number;
  lastError?: string;
}
