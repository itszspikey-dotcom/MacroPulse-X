// Direct client-side Gemini calls for the native (Capacitor) build, where there is
// no bundled backend to keep the API key server-side. The key is embedded into the
// app bundle at build time via VITE_GEMINI_API_KEY — acceptable for a personal
// sideload, but note it is extractable by anyone who inspects the compiled app.

import type { ChatMessage } from './aiAdvisorService';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const GEMINI_MODEL = 'gemini-3.7-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

async function callGemini(contents: any[], opts?: { responseMimeType?: string; systemInstruction?: string }): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('Missing Gemini API key. Set VITE_GEMINI_API_KEY in .env.local before building.');
  }

  const body: any = { contents };
  const config: any = {};
  if (opts?.responseMimeType) config.responseMimeType = opts.responseMimeType;
  if (opts?.systemInstruction) config.systemInstruction = opts.systemInstruction;
  if (Object.keys(config).length > 0) body.generationConfig = config;

  const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText);
    throw new Error(`Gemini API error (${res.status}): ${errText}`);
  }

  const json = await res.json();
  const text =
    json?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('') || '';
  return text;
}

export async function scanFoodImage(
  imageBase64: string,
  mimeType: string,
  promptContext: string
): Promise<any> {
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

  const text = await callGemini(
    [
      {
        role: 'user',
        parts: [{ inlineData: { mimeType, data: base64Data } }, { text: prompt }],
      },
    ],
    { responseMimeType: 'application/json' }
  );

  const responseText = text || '{}';
  try {
    return JSON.parse(responseText);
  } catch {
    const cleaned = responseText.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(cleaned);
  }
}

export async function getNutritionAdvice(
  query: string,
  history: ChatMessage[],
  dailySummary: any,
  macroGoals: any,
  userProfile: any
): Promise<string> {
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

  // Mirrors the original server.ts contract exactly: `history` already ends with
  // the user's latest message (the modal sends `updatedMessages`), and the server
  // appended `query` again as a trailing user turn on top of that. Kept as-is for
  // behavioral parity rather than "fixing" possibly-intentional duplication.
  let contentsPayload: any[];
  if (Array.isArray(history) && history.length > 0) {
    contentsPayload = history.slice(-6).map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.text }],
    }));
    contentsPayload.push({ role: 'user', parts: [{ text: query }] });
  } else {
    contentsPayload = [{ role: 'user', parts: [{ text: query }] }];
  }

  return callGemini(contentsPayload, { systemInstruction });
}
