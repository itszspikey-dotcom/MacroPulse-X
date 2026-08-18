import { MealType, Recipe, UserProfile } from '../types/nutrition';
import { PlannedDay, PlannedMealItem, WeeklyMealPlan, DayPlanTotals } from '../types/planner';
import { syncEngine } from './syncEngine';

const STORAGE_KEY_PREFIX = 'macropulse_meal_plan_';

export const plannerService = {
  /**
   * Get ISO date string for Monday of the given date's week
   */
  getMondayOfWeek(dateStr: string): string {
    const d = new Date(dateStr + 'T12:00:00');
    const day = d.getDay(); // 0 is Sunday, 1 is Monday...
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const monday = new Date(d.setDate(diff));
    return monday.toISOString().split('T')[0];
  },

  /**
   * Get 7 days array for the week starting from mondayDateStr
   */
  getWeekDays(mondayDateStr: string): Array<{
    date: string;
    dayOfWeek: string;
    shortDay: string;
    dayNumber: number;
    monthName: string;
    isToday: boolean;
  }> {
    const days = [];
    const todayStr = new Date().toISOString().split('T')[0];
    const mon = new Date(mondayDateStr + 'T12:00:00');

    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const shortNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    for (let i = 0; i < 7; i++) {
      const current = new Date(mon);
      current.setDate(mon.getDate() + i);
      const dateStr = current.toISOString().split('T')[0];

      days.push({
        date: dateStr,
        dayOfWeek: dayNames[i],
        shortDay: shortNames[i],
        dayNumber: current.getDate(),
        monthName: current.toLocaleDateString('en-US', { month: 'short' }),
        isToday: dateStr === todayStr,
      });
    }

    return days;
  },

  /**
   * Load weekly plan from localStorage, or initialize empty structure
   */
  getWeeklyPlan(weekStartDate: string, profileId: string): WeeklyMealPlan {
    const key = `${STORAGE_KEY_PREFIX}${profileId}_${weekStartDate}`;
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load meal plan from storage:', e);
    }

    // Default empty plan initialized for all 7 days
    const weekDays = this.getWeekDays(weekStartDate);
    const days: Record<string, PlannedDay> = {};

    weekDays.forEach((wd) => {
      days[wd.date] = {
        date: wd.date,
        dayOfWeek: wd.shortDay,
        slots: {
          breakfast: [],
          lunch: [],
          dinner: [],
          snack: [],
        },
      };
    });

    const newPlan: WeeklyMealPlan = {
      id: `plan_${profileId}_${weekStartDate}`,
      weekStartDate,
      profileId,
      name: `Week of ${weekStartDate}`,
      days,
      updatedAt: Date.now(),
    };

    this.saveWeeklyPlan(newPlan);
    return newPlan;
  },

  /**
   * Save plan to localStorage
   */
  saveWeeklyPlan(plan: WeeklyMealPlan): void {
    const key = `${STORAGE_KEY_PREFIX}${plan.profileId}_${plan.weekStartDate}`;
    try {
      localStorage.setItem(key, JSON.stringify(plan));
    } catch (e) {
      console.warn('Failed to save meal plan:', e);
    }
  },

  /**
   * Calculate totals for a planned day
   */
  calculateDayTotals(day: PlannedDay): DayPlanTotals {
    let totalCal = 0;
    let totalP = 0;
    let totalC = 0;
    let totalF = 0;
    let totalFiber = 0;

    const slotTotals: Record<MealType, { calories: number; protein: number; carbs: number; fat: number; fiber: number; itemCount: number }> = {
      breakfast: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, itemCount: 0 },
      lunch: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, itemCount: 0 },
      dinner: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, itemCount: 0 },
      snack: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, itemCount: 0 },
    };

    const slots: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
    slots.forEach((slot) => {
      const items = day?.slots?.[slot] || [];
      items.forEach((it) => {
        const cal = Number(it.calories) || 0;
        const p = Number(it.protein) || 0;
        const c = Number(it.carbs) || 0;
        const f = Number(it.fat) || 0;
        const fib = Number(it.fiber) || 0;

        totalCal += cal;
        totalP += p;
        totalC += c;
        totalF += f;
        totalFiber += fib;

        slotTotals[slot].calories += cal;
        slotTotals[slot].protein += p;
        slotTotals[slot].carbs += c;
        slotTotals[slot].fat += f;
        slotTotals[slot].fiber += fib;
        slotTotals[slot].itemCount += 1;
      });
    });

    return {
      calories: Math.round(totalCal),
      protein: Math.round(totalP * 10) / 10,
      carbs: Math.round(totalC * 10) / 10,
      fat: Math.round(totalF * 10) / 10,
      fiber: Math.round(totalFiber * 10) / 10,
      slotTotals,
    };
  },

  /**
   * Add a meal item to a day slot
   */
  addItemToSlot(
    weekStartDate: string,
    profileId: string,
    date: string,
    slot: MealType,
    item: Omit<PlannedMealItem, 'id'>
  ): WeeklyMealPlan {
    const plan = this.getWeeklyPlan(weekStartDate, profileId);
    if (!plan.days[date]) {
      plan.days[date] = {
        date,
        dayOfWeek: new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' }),
        slots: { breakfast: [], lunch: [], dinner: [], snack: [] },
      };
    }
    if (!plan.days[date].slots[slot]) {
      plan.days[date].slots[slot] = [];
    }

    const newItem: PlannedMealItem = {
      ...item,
      id: `meal_item_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      calories: Math.round(item.calories),
      protein: Math.round(item.protein * 10) / 10,
      carbs: Math.round(item.carbs * 10) / 10,
      fat: Math.round(item.fat * 10) / 10,
      fiber: Math.round((item.fiber || 0) * 10) / 10,
    };

    plan.days[date].slots[slot].push(newItem);
    plan.updatedAt = Date.now();
    this.saveWeeklyPlan(plan);
    return plan;
  },

  /**
   * Remove item from slot
   */
  removeItemFromSlot(
    weekStartDate: string,
    profileId: string,
    date: string,
    slot: MealType,
    itemId: string
  ): WeeklyMealPlan {
    const plan = this.getWeeklyPlan(weekStartDate, profileId);
    if (plan.days[date]?.slots?.[slot]) {
      plan.days[date].slots[slot] = plan.days[date].slots[slot].filter((it) => it.id !== itemId);
      plan.updatedAt = Date.now();
      this.saveWeeklyPlan(plan);
    }
    return plan;
  },

  /**
   * Clear all items from a slot or entire day
   */
  clearSlot(
    weekStartDate: string,
    profileId: string,
    date: string,
    slot?: MealType
  ): WeeklyMealPlan {
    const plan = this.getWeeklyPlan(weekStartDate, profileId);
    if (plan.days[date]) {
      if (slot) {
        plan.days[date].slots[slot] = [];
      } else {
        plan.days[date].slots = { breakfast: [], lunch: [], dinner: [], snack: [] };
      }
      plan.updatedAt = Date.now();
      this.saveWeeklyPlan(plan);
    }
    return plan;
  },

  /**
   * Add a saved recipe to a slot
   */
  addRecipeToSlot(
    weekStartDate: string,
    profileId: string,
    date: string,
    slot: MealType,
    recipe: Recipe
  ): WeeklyMealPlan {
    return this.addItemToSlot(weekStartDate, profileId, date, slot, {
      name: recipe.name,
      brand: 'Recipe Studio',
      portion: `1 serving (${recipe.perServingCalories} kcal)`,
      calories: recipe.perServingCalories,
      protein: recipe.perServingProtein,
      carbs: recipe.perServingCarbs,
      fat: recipe.perServingFat,
      fiber: recipe.perServingFiber,
      recipeId: recipe.id,
    });
  },

  /**
   * Apply all planned meals for a day directly to the Daily Tracker log
   */
  applyDayPlanToTracker(
    date: string,
    profileId: string,
    plan: WeeklyMealPlan
  ): { loggedCount: number; totalCalories: number } {
    const day = plan.days[date];
    if (!day) return { loggedCount: 0, totalCalories: 0 };

    let count = 0;
    let calories = 0;
    const slots: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

    slots.forEach((slot) => {
      const items = day.slots[slot] || [];
      items.forEach((it) => {
        syncEngine.addMealLog({
          userId: profileId,
          foodId: it.foodId || it.recipeId || `plan_${Date.now()}_${count}`,
          foodName: it.name,
          brand: it.brand || 'Menu Planner',
          mealType: slot,
          date,
          timestamp: Date.now() + count * 1000,
          servingAmount: 1,
          servingUnit: 'serving',
          servingGramWeight: 150,
          calories: it.calories,
          protein: it.protein,
          carbs: it.carbs,
          fat: it.fat,
          fiber: it.fiber,
          source: it.recipeId ? 'recipe' : 'menu_planner',
          notes: it.notes || `Scheduled via Menu Planner`,
        });
        count++;
        calories += it.calories;
      });
    });

    return { loggedCount: count, totalCalories: calories };
  },

  /**
   * Apply a single planned meal item to the Daily Tracker log
   */
  applySingleMealItemToTracker(
    date: string,
    profileId: string,
    mealType: MealType,
    item: PlannedMealItem
  ): void {
    syncEngine.addMealLog({
      userId: profileId,
      foodId: item.foodId || item.recipeId || `plan_single_${Date.now()}`,
      foodName: item.name,
      brand: item.brand || 'Menu Planner',
      mealType,
      date,
      timestamp: Date.now(),
      servingAmount: 1,
      servingUnit: 'serving',
      servingGramWeight: 150,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
      fiber: item.fiber,
      source: item.recipeId ? 'recipe' : 'menu_planner',
      notes: `Single slot scheduled via Menu Planner`,
    });
  },

  /**
   * Generate balanced 7-day meal plan based on target calories and dietary goal
   */
  async generateAiWeeklyPlan(
    weekStartDate: string,
    profile: UserProfile,
    recipes: Recipe[] = []
  ): Promise<WeeklyMealPlan> {
    try {
      const res = await fetch('/api/ai/generate-meal-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weekStartDate,
          userProfile: profile,
          savedRecipes: recipes.map((r) => ({
            name: r.name,
            calories: r.perServingCalories,
            protein: r.perServingProtein,
            carbs: r.perServingCarbs,
            fat: r.perServingFat,
            fiber: r.perServingFiber,
          })),
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.plan) {
          const plan: WeeklyMealPlan = {
            id: `plan_${profile.id}_${weekStartDate}`,
            weekStartDate,
            profileId: profile.id,
            name: `AI Coach Plan (${profile.goalType.toUpperCase()})`,
            days: json.plan.days || {},
            updatedAt: Date.now(),
          };
          this.saveWeeklyPlan(plan);
          return plan;
        }
      }
    } catch (e) {
      console.warn('AI Meal Plan endpoint error, falling back to dynamic formula:', e);
    }

    // Dynamic mathematical fallback tailored to exact profile macros
    return this.generateMathematicalPlan(weekStartDate, profile, recipes);
  },

  /**
   * Deterministic dynamic fallback generator matching target calories & macros
   */
  generateMathematicalPlan(
    weekStartDate: string,
    profile: UserProfile,
    savedRecipes: Recipe[] = []
  ): WeeklyMealPlan {
    const weekDays = this.getWeekDays(weekStartDate);
    const targetCal = profile.targetCalories || 2000;
    const targetP = profile.targetProteinG || 160;
    const targetC = profile.targetCarbsG || 200;
    const targetF = profile.targetFatG || 65;
    const targetFib = profile.targetFiberG || 28;
    const goal = profile.goalType || 'maintain';

    // Target split across 4 slots: Breakfast (25%), Lunch (35%), Dinner (30%), Snack (10%)
    const slotSplits = {
      breakfast: 0.25,
      lunch: 0.35,
      dinner: 0.30,
      snack: 0.10,
    };

    const mealPools: Record<MealType, Array<{ name: string; calFactor: number; pFactor: number; cFactor: number; fFactor: number; fib: number; portion: string }>> = {
      breakfast: [
        { name: 'Oatmeal Power Bowl with Whey & Berries', calFactor: 1.0, pFactor: 1.1, cFactor: 1.2, fFactor: 0.7, fib: 8, portion: '1 large bowl (350g)' },
        { name: 'Whole Egg & Turkey Bacon Scramble + Sourdough', calFactor: 0.95, pFactor: 1.2, cFactor: 0.8, fFactor: 1.1, fib: 4, portion: '3 eggs + 2 slices bread' },
        { name: 'Greek Yogurt Parfait with Chia Seeds & Honey', calFactor: 0.9, pFactor: 1.15, cFactor: 0.9, fFactor: 0.8, fib: 7, portion: '250g yogurt + 30g nuts' },
        { name: 'Protein Pancakes with Pure Maple Syrup', calFactor: 1.05, pFactor: 1.0, cFactor: 1.3, fFactor: 0.8, fib: 5, portion: '3 medium pancakes (280g)' },
      ],
      lunch: [
        { name: 'Grilled Chicken Breast with Jasmine Rice & Broccoli', calFactor: 1.0, pFactor: 1.2, cFactor: 1.1, fFactor: 0.6, fib: 6, portion: '200g chicken + 180g rice' },
        { name: 'Lean Sirloin Steak & Roasted Sweet Potato Hash', calFactor: 1.05, pFactor: 1.15, cFactor: 1.0, fFactor: 1.0, fib: 7, portion: '180g steak + 200g sweet potato' },
        { name: 'Wild Salmon Bowl with Quinoa & Steamed Asparagus', calFactor: 1.0, pFactor: 1.1, cFactor: 0.9, fFactor: 1.2, fib: 6, portion: '180g salmon + 150g quinoa' },
        { name: 'Turkey Breast Avocado Wrap with Mixed Greens', calFactor: 0.95, pFactor: 1.1, cFactor: 1.0, fFactor: 0.9, fib: 8, portion: '1 large wrap (320g)' },
      ],
      dinner: [
        { name: 'Pan-Seared Salmon Fillet with Garlic Asparagus', calFactor: 1.0, pFactor: 1.15, cFactor: 0.7, fFactor: 1.3, fib: 5, portion: '200g salmon + veggies' },
        { name: 'Extra Lean Ground Turkey with Brown Rice & Zucchini', calFactor: 0.95, pFactor: 1.2, cFactor: 1.1, fFactor: 0.7, fib: 7, portion: '200g turkey + 160g rice' },
        { name: 'Flank Steak with Roasted Fingerling Potatoes & Green Beans', calFactor: 1.05, pFactor: 1.1, cFactor: 1.0, fFactor: 1.1, fib: 6, portion: '180g steak + 180g potatoes' },
        { name: 'Grilled Herb Chicken with Mediterranean Salad & Feta', calFactor: 0.95, pFactor: 1.2, cFactor: 0.6, fFactor: 1.1, fib: 6, portion: '220g chicken + large salad' },
      ],
      snack: [
        { name: 'Whey Protein Isolate Shake with Almond Milk', calFactor: 0.9, pFactor: 1.5, cFactor: 0.4, fFactor: 0.5, fib: 2, portion: '1 shaker (350ml)' },
        { name: '0% Nonfat Greek Yogurt with Crushed Almonds', calFactor: 1.0, pFactor: 1.3, cFactor: 0.7, fFactor: 1.0, fib: 3, portion: '170g yogurt + 15g almonds' },
        { name: 'Apple Slices with Natural Crunchy Peanut Butter', calFactor: 1.1, pFactor: 0.6, cFactor: 1.2, fFactor: 1.2, fib: 5, portion: '1 apple + 25g peanut butter' },
        { name: 'Rice Cakes with Smoked Turkey Breast & Hummus', calFactor: 0.95, pFactor: 1.1, cFactor: 1.1, fFactor: 0.6, fib: 3, portion: '3 cakes + 60g turkey' },
      ],
    };

    const days: Record<string, PlannedDay> = {};

    weekDays.forEach((wd, dayIdx) => {
      const slots: Record<MealType, PlannedMealItem[]> = {
        breakfast: [],
        lunch: [],
        dinner: [],
        snack: [],
      };

      (['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).forEach((slot) => {
        const pool = mealPools[slot];
        const mealTemplate = pool[(dayIdx + (slot === 'lunch' ? 1 : slot === 'dinner' ? 2 : slot === 'snack' ? 3 : 0)) % pool.length];

        const slotCalTarget = targetCal * slotSplits[slot];
        const slotPTarget = targetP * slotSplits[slot];
        const slotCTarget = targetC * slotSplits[slot];
        const slotFTarget = targetF * slotSplits[slot];

        const cal = Math.round(slotCalTarget * mealTemplate.calFactor);
        const p = Math.round(slotPTarget * mealTemplate.pFactor * 10) / 10;
        const c = Math.round(slotCTarget * mealTemplate.cFactor * 10) / 10;
        const f = Math.round(slotFTarget * mealTemplate.fFactor * 10) / 10;
        const fib = mealTemplate.fib;

        slots[slot].push({
          id: `ai_item_${dayIdx}_${slot}_${Date.now()}`,
          name: mealTemplate.name,
          brand: 'AI Nutrition Coach',
          portion: mealTemplate.portion,
          calories: cal,
          protein: p,
          carbs: c,
          fat: f,
          fiber: fib,
          notes: `Optimized for ${goal.toUpperCase()} phase (~${cal} kcal)`,
        });
      });

      days[wd.date] = {
        date: wd.date,
        dayOfWeek: wd.shortDay,
        slots,
      };
    });

    const plan: WeeklyMealPlan = {
      id: `plan_${profile.id}_${weekStartDate}`,
      weekStartDate,
      profileId: profile.id,
      name: `AI Macro-Matched Plan (${goal.toUpperCase()})`,
      days,
      updatedAt: Date.now(),
    };

    this.saveWeeklyPlan(plan);
    return plan;
  },
};
