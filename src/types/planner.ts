import { MealType, UserProfile } from './nutrition';

export interface PlannedMealItem {
  id: string;
  name: string;
  brand?: string;
  portion: string; // e.g. "200g" or "1 serving"
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  recipeId?: string;
  foodId?: string;
  notes?: string;
}

export interface PlannedDay {
  date: string; // 'YYYY-MM-DD'
  dayOfWeek: string; // 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun'
  slots: Record<MealType, PlannedMealItem[]>;
  notes?: string;
}

export interface WeeklyMealPlan {
  id: string;
  weekStartDate: string; // Monday's date 'YYYY-MM-DD'
  profileId: string;
  name: string;
  days: Record<string, PlannedDay>; // Keyed by 'YYYY-MM-DD'
  updatedAt: number;
}

export interface MealSlotTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  itemCount: number;
}

export interface DayPlanTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  slotTotals: Record<MealType, MealSlotTotals>;
}
