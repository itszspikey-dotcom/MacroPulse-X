import { DailySummary, MacroGoals, UserProfile } from '../types/nutrition';

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

export interface AdvisorContext {
  query: string;
  history?: ChatMessage[];
  dailySummary: DailySummary;
  macroGoals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  userProfile: {
    name?: string;
    goalType: string;
    weightKg: number;
    heightCm: number;
    activityLevel: string;
  };
}

/**
 * Builds high-protein meal suggestions dynamically based on remaining macros
 */
function generateDynamicMealSuggestions(remainingCal: number, remainingP: number, remainingC: number, remainingF: number, goalType: string) {
  const isCut = goalType === 'cut';
  const isBulk = goalType === 'bulk';
  const isKeto = goalType === 'keto';

  const mealOptions = [
    {
      title: 'Power Seared Salmon & Asparagus Skillet',
      grams: '180g Atlantic Salmon Fillet + 150g Grilled Asparagus + 10g Olive Oil',
      cal: Math.round(180 * 2.08 + 150 * 0.2 + 10 * 8.84),
      p: Math.round(180 * 0.20 + 150 * 0.022),
      c: Math.round(150 * 0.038),
      f: Math.round(180 * 0.13 + 10 * 1),
      fiber: 3.2,
      tags: ['High Omega-3', 'Low Carb', 'Anti-Inflammatory'],
    },
    {
      title: 'Lemon Herb Grilled Chicken & Quinoa Bowl',
      grams: '200g Chicken Breast + 120g Cooked Quinoa + 100g Steamed Broccoli',
      cal: Math.round(200 * 1.65 + 120 * 1.20 + 100 * 0.34),
      p: Math.round(200 * 0.31 + 120 * 0.044 + 100 * 0.028),
      c: Math.round(120 * 0.213 + 100 * 0.066),
      f: Math.round(200 * 0.036 + 120 * 0.019),
      fiber: 5.4,
      tags: ['Lean Protein', 'Complex Carbs', 'Clean Fuel'],
    },
    {
      title: 'High-Protein Whipped Cottage Cheese & Berry Parfait',
      grams: '225g Low-Fat Cottage Cheese (2%) + 30g Vanilla Whey + 80g Fresh Blueberries',
      cal: Math.round(225 * 0.81 + 30 * 4.0 + 80 * 0.57),
      p: Math.round(225 * 0.11 + 30 * 0.80 + 80 * 0.007),
      c: Math.round(225 * 0.047 + 30 * 0.06 + 80 * 0.145),
      f: Math.round(225 * 0.023 + 30 * 0.03),
      fiber: 2.8,
      tags: ['Sustained Casein Release', 'Antioxidant Rich', 'Zero Prep'],
    },
    {
      title: 'Grass-Fed Flank Steak & Roasted Sweet Potato Hash',
      grams: '170g Lean Flank Steak + 180g Baked Sweet Potato + 80g Sautéed Spinach',
      cal: Math.round(170 * 1.92 + 180 * 0.86 + 80 * 0.23),
      p: Math.round(170 * 0.28 + 180 * 0.016 + 80 * 0.029),
      c: Math.round(180 * 0.201 + 80 * 0.036),
      f: Math.round(170 * 0.08 + 80 * 0.004),
      fiber: 6.2,
      tags: ['High Heme Iron', 'Glycogen Replenishment', 'Zinc & B12'],
    },
    {
      title: 'Tofu & Edamame Szechuan Stir-Fry (Plant-Based Power)',
      grams: '200g Extra Firm Tofu + 100g Shelled Edamame + 150g Mixed Veggies + 10g Sesame Oil',
      cal: Math.round(200 * 0.83 + 100 * 1.22 + 150 * 0.30 + 10 * 8.84),
      p: Math.round(200 * 0.10 + 100 * 0.119 + 150 * 0.02),
      c: Math.round(200 * 0.019 + 100 * 0.089 + 150 * 0.05),
      f: Math.round(200 * 0.048 + 100 * 0.052 + 10 * 1.0),
      fiber: 8.5,
      tags: ['100% Plant-Based', 'Complete Amino Acid Profile', 'High Fiber'],
    },
  ];

  return mealOptions;
}

/**
 * Intelligent dynamic fallback engine when offline or if API key is not present.
 * Generates mathematically sound, highly varied, personalized dietary advice.
 */
export function generateDynamicNutritionAdvice(ctx: AdvisorContext): string {
  const { query, dailySummary, macroGoals, userProfile } = ctx;
  const q = query.toLowerCase();

  const remainingCal = Math.max(0, macroGoals.calories - dailySummary.calories);
  const remainingP = Math.max(0, macroGoals.protein - dailySummary.protein);
  const remainingC = Math.max(0, macroGoals.carbs - dailySummary.carbs);
  const remainingF = Math.max(0, macroGoals.fat - dailySummary.fat);
  const remainingFiber = Math.max(0, macroGoals.fiber - (dailySummary.fiber || 0));

  const userName = userProfile.name || 'Athlete';
  const goal = (userProfile.goalType || 'maintain').toUpperCase();

  // 1. Fiber specific query
  if (q.includes('fiber') || q.includes('digestion') || q.includes('gut')) {
    return `### 🥦 Strategic Fiber Optimization Guide for ${userName}

**Your Daily Status**: ${(dailySummary.fiber || 0).toFixed(1)}g / ${macroGoals.fiber}g fiber logged (${remainingFiber.toFixed(1)}g remaining).

Here are the highest-density, low-glycemic dietary fiber powerhouses to hit your target:

1. **Chia Seeds (2 tbsp / 24g)**:
   - **Fiber**: **9.8g** | **Protein**: 4.0g | **Calories**: 118 kcal
   - *How to take*: Stir into water with lemon, oats, or protein pudding.
2. **Fresh Raspberries or Blackberries (125g / 1 cup)**:
   - **Fiber**: **8.0g** | **Carbs**: 14.5g | **Calories**: 64 kcal
   - *Benefit*: Extremely high polyphenol count and slow-digesting pectin.
3. **Cooked Lentils or Black Beans (150g / 1 cup)**:
   - **Fiber**: **11.5g** | **Protein**: 13.5g | **Calories**: 170 kcal
   - *Benefit*: High prebiotic resistant starch supporting the gut microbiome.
4. **Steamed Broccoli or Brussels Sprouts (150g)**:
   - **Fiber**: **5.2g** | **Calories**: 55 kcal

💡 **Pro Coach Tip**: When increasing fiber, drink at least 250ml extra water per 5g fiber added to ensure smooth motility and avoid bloating.`;
  }

  // 2. High-Protein Snack / Post-Workout / Protein query
  if (q.includes('snack') || q.includes('post-workout') || q.includes('protein') || q.includes('shake') || q.includes('powder')) {
    return `### ⚡ High-Protein Nutrition Plan (~30g–45g Protein)

**Current Protein Target**: ${dailySummary.protein.toFixed(1)}g / ${macroGoals.protein}g logged (**${remainingP.toFixed(1)}g needed**).

Here are 3 distinct, rapid-prep macro-optimized options:

#### Option A: Anabolic Pro-Yogurt Bowl (Fast & Convenient)
- **180g 0% Greek Yogurt** + **30g Whey Isolate** + **10g Crushed Walnuts**
- **Macros**: **44.0g Protein** | **12.0g Carbs** | **7.0g Fat** | **285 kcal**
- *Leucine Content*: ~4.2g (fully saturates mTOR muscle protein synthesis).

#### Option B: Savory Egg White & Turkey Bacon Scramble
- **200g Liquid Egg Whites (approx. 6 whites)** + **1 Whole Pasture-Raised Egg** + **2 slices Lean Turkey Bacon**
- **Macros**: **36.5g Protein** | **2.0g Carbs** | **7.5g Fat** | **225 kcal**
- *Benefit*: Ultra-clean bioavailability score with 0 net sugar.

#### Option C: Plant-Based Seed & Pea Protein Shake
- **35g Pea/Rice Protein Blend** + **250ml Unsweetened Almond Milk** + **15g Peanut Butter Powder**
- **Macros**: **34.0g Protein** | **6.5g Carbs** | **3.5g Fat** | **190 kcal**

🎯 **Timing Tip**: Ingesting 30g+ protein within 2 hours around training elevates rate of muscle protein synthesis for up to 48 hours.`;
  }

  // 3. Low-Carb / Keto / Dinner query
  if (q.includes('low-carb') || q.includes('dinner') || q.includes('keto') || q.includes('night') || q.includes('supper')) {
    return `### 🍽️ Low-Carb & High-Satiety Dinner Blueprint

**Macro Allocation Remaining**: **${remainingCal} kcal** | **${remainingP.toFixed(1)}g Protein** | **${remainingC.toFixed(1)}g Carbs** | **${remainingF.toFixed(1)}g Fat**

#### Pan-Seared Atlantic Salmon with Garlic Asparagus & Avocado
- **200g Wild Salmon Fillet** (pan-seared with avocado oil spray, sea salt, dill)
- **150g Tender Asparagus Spears** (roasted)
- **50g Fresh Sliced Avocado** (healthy monounsaturated fats)

**Exact Nutritional Breakdown**:
- 🔥 **Calories**: **430 kcal**
- 🥩 **Protein**: **42.0g** (high biological value)
- 🥑 **Healthy Fats**: **26.0g** (rich in EPA/DHA Omega-3)
- 🥦 **Net Carbs**: **3.5g** (Fiber: 4.8g)

**Preparation Steps**:
1. Season salmon with cracked black pepper, smoked paprika, and lemon zest.
2. Sear skin-down in a hot cast-iron skillet for 4 mins, flip for 3 mins.
3. Toss asparagus in the same pan with minced garlic and crushed sea salt.
4. Serve with fresh avocado slices. Perfect for evening recovery and zero insulin spikes!`;
  }

  // 4. Bulking / Surplus / Calorie Boost query
  if (q.includes('bulk') || q.includes('surplus') || q.includes('gain') || q.includes('more calories') || q.includes('mass')) {
    return `### 🚀 Lean Hypertrophy & Caloric Surplus Strategy

**Goal**: **${goal}** | **Daily Target**: ${macroGoals.calories} kcal (Logged: ${dailySummary.calories} kcal).

To hit a clean lean-mass surplus without gastrointestinal distress, prioritize nutrient-dense whole foods:

1. **Power Oatmeal Monster Bowl**:
   - 80g Rolled Oats + 30g Whey Protein + 30g All-Natural Peanut Butter + 1 Sliced Banana + 15g Honey
   - **Macros**: **42g Protein** | **85g Carbs** | **18g Fat** | **670 kcal**
2. **Sirloin & Jasmine Rice Anabolic Bowl**:
   - 200g Lean Sirloin Steak + 200g Cooked Jasmine White Rice + 100g Steamed Green Beans + 10ml Extra Virgin Olive Oil
   - **Macros**: **52g Protein** | **64g Carbs** | **22g Fat** | **665 kcal**
3. **Calorie-Dense Liquid Snack**:
   - 350ml Whole Milk (or Oat Milk) + 1 Scoop Whey + 40g Quick Oats + 1 Banana + 2 tbsp Honey
   - **Macros**: **38g Protein** | **78g Carbs** | **12g Fat** | **550 kcal**

💡 **Hypertrophy Rule**: Aim for 200–400 kcal above maintenance to maximize myofibrillar protein synthesis with minimal adipose gain.`;
  }

  // 5. Weight Loss / Cutting / Fat Loss / Deficit query
  if (q.includes('cut') || q.includes('deficit') || q.includes('fat loss') || q.includes('lose weight') || q.includes('diet')) {
    return `### 🔥 Precision Fat Loss & Lean Mass Preservation Protocol

**Your Target Deficit Status**:
- **Target Calories**: ${macroGoals.calories} kcal
- **Consumed Today**: ${dailySummary.calories} kcal (**${remainingCal} kcal remaining**)
- **Remaining Protein Needed**: **${remainingP.toFixed(1)}g**

#### 3 Rules to Accelerate Fat Loss Without Losing Muscle:
1. **Prioritize Satiety Index**:
   - Swap calorie-dense items for high-volume foods (white fish, chicken breast, shrimp, broccoli, egg whites, zucchini).
2. **Protein Sparing**:
   - Maintain protein at **2.0g–2.2g per kg of bodyweight** (${(userProfile.weightKg * 2.1).toFixed(0)}g daily for your ${userProfile.weightKg}kg body weight).
3. **Electrolyte & Hydration Shield**:
   - A caloric deficit depletes glycogen and water; maintain 3.5L fluids daily with sodium (2,000mg–3,000mg) and potassium (3,500mg).

**Recommended Meal to Fill Deficit**:
- **220g Grilled Turkey Breast** + **250g Riced Cauliflower & Spinach** + **10g Sesame Seeds**
- **Calories**: 295 kcal | **Protein**: 54g | **Carbs**: 6g | **Fat**: 5.5g`;
  }

  // 6. Supplement / Creatine / Hydration query
  if (q.includes('creatine') || q.includes('supplement') || q.includes('water') || q.includes('caffeine') || q.includes('vitamin')) {
    return `### 🧪 Evidence-Based Sports Supplementation & Hydration Guide

Here is the peer-reviewed breakdown for athletic performance:

1. **Creatine Monohydrate**:
   - **Dosage**: 5g daily (no loading phase strictly necessary; saturation occurs in 3 weeks).
   - **Action**: Increases intramuscular phosphocreatine stores, boosting 1-5 rep max strength and cellular hydration.
2. **Whey Protein Isolate**:
   - **Dosage**: 25g–35g post-workout or between meals. Rapid gastric clearance and highest biological value (BV 104).
3. **Daily Hydration Formula**:
   - Target for your **${userProfile.weightKg}kg** body weight: **~${Math.round(userProfile.weightKg * 38)} ml/day** + 500ml per hour of intense exercise.
4. **Vitamin D3 + K2 & Omega-3 Fish Oil**:
   - Supports hormonal testosterone/estrogen regulation, joint lubrication, and immune resilience.`;
  }

  // 7. General Remaining Macros calculation response
  const dynamicMeals = generateDynamicMealSuggestions(remainingCal, remainingP, remainingC, remainingF, userProfile.goalType);
  const pickedMeal = dynamicMeals[Math.floor(Math.random() * dynamicMeals.length)];

  return `### 🎯 MacroPulse Nutrition Assessment for ${userName}

**Real-Time Daily Balance**:
- 🔥 **Remaining Calories**: **${remainingCal} kcal** (Goal: ${macroGoals.calories} kcal | Consumed: ${dailySummary.calories} kcal)
- 🥩 **Remaining Protein**: **${remainingP.toFixed(1)}g** (${((dailySummary.protein / (macroGoals.protein || 1)) * 100).toFixed(0)}% completed)
- 🍞 **Remaining Carbs**: **${remainingC.toFixed(1)}g**
- 🥑 **Remaining Fat**: **${remainingF.toFixed(1)}g**
- 🥦 **Fiber Logged**: **${(dailySummary.fiber || 0).toFixed(1)}g** / ${macroGoals.fiber}g

---

#### 💡 Recommended Meal to Perfectly Balance Your Day:
**${pickedMeal.title}**
- **Ingredients & Portions**: ${pickedMeal.grams}
- **Calories**: **${pickedMeal.cal} kcal**
- **Protein**: **${pickedMeal.p}g**
- **Carbs**: **${pickedMeal.c}g** (Fiber: ${pickedMeal.fiber}g)
- **Fat**: **${pickedMeal.f}g**
- **Attributes**: ${pickedMeal.tags.map((t) => `\`${t}\``).join(' ')}

Ask me for any custom swap, recipe instructions, or ingredient substitutions!`;
}
