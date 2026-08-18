import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json({ limit: '25mb' }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Dynamic nutrition reasoning function for server
function generateFallbackAdvisorResponse(query: string, dailySummary: any, macroGoals: any, userProfile: any): string {
  const q = (query || '').toLowerCase();
  const userName = userProfile?.name || 'Athlete';
  const goal = (userProfile?.goalType || 'maintain').toUpperCase();
  
  const targetCal = macroGoals?.calories || 2000;
  const consumedCal = dailySummary?.calories || 0;
  const remainingCal = Math.max(0, targetCal - consumedCal);
  
  const targetP = macroGoals?.protein || 150;
  const consumedP = dailySummary?.protein || 0;
  const remainingP = Math.max(0, targetP - consumedP);

  const targetC = macroGoals?.carbs || 200;
  const consumedC = dailySummary?.carbs || 0;
  const remainingC = Math.max(0, targetC - consumedC);

  const targetF = macroGoals?.fat || 60;
  const consumedF = dailySummary?.fat || 0;
  const remainingF = Math.max(0, targetF - consumedF);

  const targetFiber = macroGoals?.fiber || 28;
  const consumedFiber = dailySummary?.fiber || 0;
  const remainingFiber = Math.max(0, targetFiber - consumedFiber);

  if (q.includes('fiber') || q.includes('digestion') || q.includes('gut')) {
    return `### 🥦 Strategic Fiber Optimization for ${userName}

**Your Fiber Status**: ${consumedFiber.toFixed(1)}g / ${targetFiber}g logged (**${remainingFiber.toFixed(1)}g needed**).

Here are 4 high-density, low-glycemic sources to hit your remaining target:

1. **Chia Seeds (2 tbsp / 24g)**:
   - **Fiber**: **9.8g** | **Protein**: 4.0g | **Calories**: 118 kcal
   - *Tip*: Stir into water with lemon, overnight oats, or yogurt.
2. **Fresh Raspberries or Blackberries (125g / 1 cup)**:
   - **Fiber**: **8.0g** | **Carbs**: 14.5g | **Calories**: 64 kcal
   - *Benefit*: Extremely high polyphenol count and slow-digesting pectin.
3. **Cooked Lentils or Black Beans (150g / 1 cup)**:
   - **Fiber**: **11.5g** | **Protein**: 13.5g | **Calories**: 170 kcal
   - *Benefit*: High prebiotic resistant starch supporting gut microbiome.
4. **Steamed Broccoli or Brussels Sprouts (150g)**:
   - **Fiber**: **5.2g** | **Calories**: 55 kcal

💡 **Pro Coach Tip**: Drink at least 250ml extra water per 5g fiber added to ensure smooth motility and avoid bloating.`;
  }

  if (q.includes('snack') || q.includes('post-workout') || q.includes('protein') || q.includes('shake') || q.includes('powder')) {
    return `### ⚡ High-Protein Nutrition Options (~30g–45g Protein)

**Current Protein Target**: ${consumedP.toFixed(1)}g / ${targetP}g logged (**${remainingP.toFixed(1)}g remaining**).

Here are 3 distinct, rapid-prep macro-optimized choices:

#### Option 1: Anabolic Greek Yogurt & Berry Bowl (Fast & Convenient)
- **180g 0% Greek Yogurt** + **30g Whey Isolate** + **10g Crushed Walnuts**
- **Macros**: **44.0g Protein** | **12.0g Carbs** | **7.0g Fat** | **285 kcal**
- *Leucine Content*: ~4.2g (fully activates mTOR muscle protein synthesis).

#### Option 2: Savory Egg White & Turkey Bacon Scramble
- **200g Liquid Egg Whites** + **1 Whole Pasture-Raised Egg** + **2 slices Lean Turkey Bacon**
- **Macros**: **36.5g Protein** | **2.0g Carbs** | **7.5g Fat** | **225 kcal**
- *Benefit*: Ultra-clean bioavailability score with zero sugar.

#### Option 3: Plant-Based Seed & Pea Protein Shake
- **35g Pea/Rice Protein Blend** + **250ml Unsweetened Almond Milk** + **15g Peanut Butter Powder**
- **Macros**: **34.0g Protein** | **6.5g Carbs** | **3.5g Fat** | **190 kcal**`;
  }

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
4. Serve with fresh avocado slices. Perfect for evening recovery without insulin spikes!`;
  }

  if (q.includes('bulk') || q.includes('surplus') || q.includes('gain') || q.includes('more calories') || q.includes('mass')) {
    return `### 🚀 Lean Hypertrophy & Caloric Surplus Strategy

**Goal**: **${goal}** | **Daily Target**: ${targetCal} kcal (Logged: ${consumedCal} kcal).

To hit a clean lean-mass surplus without gastrointestinal distress, prioritize nutrient-dense whole foods:

1. **Power Oatmeal Monster Bowl**:
   - 80g Rolled Oats + 30g Whey Protein + 30g All-Natural Peanut Butter + 1 Sliced Banana + 15g Honey
   - **Macros**: **42g Protein** | **85g Carbs** | **18g Fat** | **670 kcal**
2. **Sirloin & Jasmine Rice Anabolic Bowl**:
   - 200g Lean Sirloin Steak + 200g Cooked Jasmine White Rice + 100g Steamed Green Beans + 10ml Extra Virgin Olive Oil
   - **Macros**: **52g Protein** | **64g Carbs** | **22g Fat** | **665 kcal**
3. **Calorie-Dense Liquid Snack**:
   - 350ml Whole Milk (or Oat Milk) + 1 Scoop Whey + 40g Quick Oats + 1 Banana + 2 tbsp Honey
   - **Macros**: **38g Protein** | **78g Carbs** | **12g Fat** | **550 kcal**`;
  }

  if (q.includes('creatine') || q.includes('supplement') || q.includes('water') || q.includes('caffeine') || q.includes('vitamin')) {
    return `### 🧪 Evidence-Based Sports Supplementation & Hydration Guide

Here is the scientific breakdown for athletic performance:

1. **Creatine Monohydrate**:
   - **Dosage**: 5g daily (no loading phase strictly necessary; saturation occurs in 3 weeks).
   - **Action**: Increases intramuscular phosphocreatine stores, boosting 1-5 rep max strength and cellular hydration.
2. **Whey Protein Isolate**:
   - **Dosage**: 25g–35g post-workout or between meals. Rapid gastric clearance and highest biological value (BV 104).
3. **Daily Hydration Formula**:
   - Target for your **${userProfile?.weightKg || 75}kg** body weight: **~${Math.round((userProfile?.weightKg || 75) * 38)} ml/day** + 500ml per hour of intense exercise.
4. **Vitamin D3 + K2 & Omega-3 Fish Oil**:
   - Supports hormonal testosterone/estrogen regulation, joint lubrication, and immune resilience.`;
  }

  return `### 🎯 MacroPulse Personalized Nutrition Plan for ${userName}

**Your Daily Status & Remaining Targets**:
- 🔥 **Remaining Calories**: **${remainingCal} kcal** (Goal: ${targetCal} kcal | Consumed: ${consumedCal} kcal)
- 🥩 **Remaining Protein**: **${remainingP.toFixed(1)}g** (Goal: ${targetP}g)
- 🍞 **Remaining Carbs**: **${remainingC.toFixed(1)}g** (Goal: ${targetC}g)
- 🥑 **Remaining Fat**: **${remainingF.toFixed(1)}g** (Goal: ${targetF}g)
- 🥦 **Fiber Logged**: **${consumedFiber.toFixed(1)}g** / ${targetFiber}g

---

#### 💡 Recommended Meal to Perfectly Balance Your Day:
**Lemon Herb Grilled Chicken Breast & Quinoa Power Bowl**
- **Portions**: 200g Grilled Chicken Breast + 120g Cooked Quinoa + 120g Steamed Broccoli + 1 tsp Extra Virgin Olive Oil
- **Calories**: **~445 kcal**
- **Protein**: **48.5g**
- **Carbs**: **32.0g** (Fiber: 5.5g)
- **Fat**: **12.0g**

Ask me for any custom substitutions, recipe instructions, or ingredient swaps!`;
}

// Endpoint: AI Food Image Recognition & Macro Breakdown
app.post('/api/ai/scan-food', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', promptContext } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Missing imageBase64 data' });
    }

    // Clean base64 string if data URL prefix was sent
    const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

    const prompt = `You are an expert nutritional biochemist and food vision AI.
Analyze this meal/food image thoroughly and identify all distinct food items, dishes, ingredients, and portion sizes.
Estimate the realistic weight in grams (g) for each detected item, along with precise nutritional values scaled to that weight.

Important Guidelines:
1. Always calculate calories & macros mathematically: 
   Calories = (weight_in_grams / 100) * calories_per_100g
   Protein = (weight_in_grams / 100) * protein_per_100g
   Carbs = (weight_in_grams / 100) * carbs_per_100g
   Fat = (weight_in_grams / 100) * fat_per_100g
2. Round total calories to whole integers, and macros (protein, carbs, fat, fiber) to 1 decimal place.
3. Provide confidence score (0.0 to 1.0) and helpful nutritional notes.
4. If contextual notes are provided: "${promptContext || 'None'}", take them into account.

Return STRICT JSON in the following exact schema:
{
  "meal_title": "String summary of the dish (e.g., Grilled Chicken Bowl with Brown Rice & Avocado)",
  "overall_description": "Brief description of the plate composition",
  "total_weight_g": 450,
  "total_calories": 580,
  "total_protein_g": 42.5,
  "total_carbs_g": 54.0,
  "total_fat_g": 18.2,
  "total_fiber_g": 7.5,
  "detected_items": [
    {
      "name": "Grilled Chicken Breast",
      "estimated_weight_g": 150,
      "serving_unit": "g",
      "calories": 248,
      "protein_g": 46.5,
      "carbs_g": 0.0,
      "fat_g": 5.4,
      "fiber_g": 0.0,
      "calories_per_100g": 165,
      "protein_per_100g": 31.0,
      "carbs_per_100g": 0.0,
      "fat_per_100g": 3.6,
      "fiber_per_100g": 0.0,
      "confidence": 0.95
    }
  ],
  "health_insights": ["High in lean protein", "Good complex carbohydrates source"],
  "allergens_or_notes": ["Gluten-Free", "Dairy-Free"]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType,
                data: base64Data,
              },
            },
            {
              text: prompt,
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text || '{}';
    let parsedData;
    try {
      parsedData = JSON.parse(responseText);
    } catch {
      // In case json wrapping has markdown ticks
      const cleaned = responseText.replace(/```json\n?|\n?```/g, '').trim();
      parsedData = JSON.parse(cleaned);
    }

    res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error('Error in /api/ai/scan-food:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze food image with Gemini AI',
    });
  }
});

// Endpoint: AI Smart Meal Assistant & Recipe Formulation
app.post('/api/ai/nutrition-advisor', async (req, res) => {
  const { query, history = [], dailySummary, macroGoals, userProfile } = req.body;

  try {
    const systemInstruction = `You are MacroPulse AI, an elite sports nutritionist, registered dietitian, and athletic performance coach.
Your mission is to provide personalized, mathematically accurate, evidence-based nutritional guidance.

Current User Profile & Goal:
- User: ${userProfile?.name || 'Athlete'}
- Goal: ${(userProfile?.goalType || 'maintain').toUpperCase()} (Weight: ${userProfile?.weightKg || 70}kg, Height: ${userProfile?.heightCm || 175}cm, Activity: ${userProfile?.activityLevel || 'moderate'})
- Daily Calorie Target: ${macroGoals?.calories || 2000} kcal (Consumed: ${dailySummary?.calories || 0} kcal | Remaining: ${Math.max(0, (macroGoals?.calories || 2000) - (dailySummary?.calories || 0))} kcal)
- Daily Protein Target: ${macroGoals?.protein || 150}g (Consumed: ${dailySummary?.protein || 0}g | Remaining: ${Math.max(0, (macroGoals?.protein || 150) - (dailySummary?.protein || 0))}g)
- Daily Carbs Target: ${macroGoals?.carbs || 200}g (Consumed: ${dailySummary?.carbs || 0}g | Remaining: ${Math.max(0, (macroGoals?.carbs || 200) - (dailySummary?.carbs || 0))}g)
- Daily Fat Target: ${macroGoals?.fat || 60}g (Consumed: ${dailySummary?.fat || 0}g | Remaining: ${Math.max(0, (macroGoals?.fat || 60) - (dailySummary?.fat || 0))}g)
- Daily Fiber Target: ${macroGoals?.fiber || 28}g (Consumed: ${dailySummary?.fiber || 0}g)

Guidelines:
1. Always address the user's specific question directly with varied, actionable food options, realistic portion weights in grams, and exact calculated macros.
2. Structure answers with clean markdown headings (###, ####), bullet points, and highlight calories & macros in bold.
3. Be conversational, motivating, and dynamic across multiple questions without repeating identical canned responses.`;

    // Construct multi-turn contents if history is provided
    let contentsPayload: any = [];
    if (Array.isArray(history) && history.length > 0) {
      contentsPayload = history.slice(-6).map((msg: any) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.text }],
      }));
      contentsPayload.push({
        role: 'user',
        parts: [{ text: query }],
      });
    } else {
      contentsPayload = `User Question: "${query}"`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: contentsPayload,
      config: {
        systemInstruction,
      },
    });

    const answer = response.text;
    if (answer && answer.trim().length > 0) {
      return res.json({ success: true, answer });
    }

    throw new Error('Empty response from model');
  } catch (error: any) {
    console.warn('Gemini API call fallback triggered:', error.message);
    const fallbackAnswer = generateFallbackAdvisorResponse(query, dailySummary, macroGoals, userProfile);
    res.json({ success: true, answer: fallbackAnswer, isFallback: true });
  }
});

// Endpoint: AI Coach Weekly Meal Plan Generator
app.post('/api/ai/generate-meal-plan', async (req, res) => {
  const { weekStartDate, userProfile, savedRecipes = [] } = req.body;
  try {
    const targetCalories = userProfile?.targetCalories || 2000;
    const targetProtein = userProfile?.targetProteinG || 160;
    const targetCarbs = userProfile?.targetCarbsG || 200;
    const targetFat = userProfile?.targetFatG || 65;
    const goalType = userProfile?.goalType || 'maintain';

    const prompt = `You are MacroPulse AI, an elite sports dietitian and meal planning algorithm.
Generate a structured 7-day meal plan for the week starting on Monday: ${weekStartDate}.

Athlete Profile:
- Name: ${userProfile?.name || 'Athlete'}
- Goal Strategy: ${goalType.toUpperCase()}
- Daily Targets: ${targetCalories} KCAL | ${targetProtein}g Protein | ${targetCarbs}g Carbs | ${targetFat}g Fat | ${userProfile?.targetFiberG || 28}g Fiber
- User Saved Recipes: ${JSON.stringify(savedRecipes.slice(0, 8))}

Guidelines:
1. For each day (Monday to Sunday, 7 dates starting from ${weekStartDate}), create 4 distinct meal slots: "breakfast", "lunch", "dinner", "snack".
2. The sum of all 4 meals per day MUST closely match the target: ~${targetCalories} kcal (±50 kcal) and ~${targetProtein}g protein.
3. Every meal item MUST have:
   - "name": Descriptive delicious dish name (e.g. "Anabolic Greek Yogurt Power Bowl with Honey & Chia")
   - "portion": Human-readable portion (e.g. "200g yogurt + 25g seeds")
   - "calories": integer
   - "protein": number (g)
   - "carbs": number (g)
   - "fat": number (g)
   - "fiber": number (g)

Return STRICT JSON matching this schema:
{
  "days": {
    "YYYY-MM-DD": {
      "date": "YYYY-MM-DD",
      "dayOfWeek": "Mon",
      "slots": {
        "breakfast": [{ "name": "...", "portion": "...", "calories": 450, "protein": 38.0, "carbs": 42.0, "fat": 12.0, "fiber": 6.0 }],
        "lunch": [{ "name": "...", "portion": "...", "calories": 650, "protein": 52.0, "carbs": 65.0, "fat": 18.0, "fiber": 8.0 }],
        "dinner": [{ "name": "...", "portion": "...", "calories": 600, "protein": 48.0, "carbs": 50.0, "fat": 20.0, "fiber": 7.0 }],
        "snack": [{ "name": "...", "portion": "...", "calories": 300, "protein": 22.0, "carbs": 33.0, "fat": 8.0, "fiber": 4.0 }]
      }
    }
  }
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text || '{}';
    let parsedData;
    try {
      parsedData = JSON.parse(responseText);
    } catch {
      const cleaned = responseText.replace(/```json\n?|\n?```/g, '').trim();
      parsedData = JSON.parse(cleaned);
    }

    res.json({ success: true, plan: parsedData });
  } catch (error: any) {
    console.error('Error in /api/ai/generate-meal-plan:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate meal plan with Gemini AI',
    });
  }
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Serve static frontend files in production if dist exists
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) {
      next();
    }
  });
});

app.listen(PORT, () => {
  console.log(`MacroPulse server running on port ${PORT}`);
});
