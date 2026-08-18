import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Plus,
  Trash2,
  Check,
  Search,
  Scale,
} from 'lucide-react';
import { FoodItem, Recipe, RecipeIngredient, ServingUnit } from '../types/nutrition';
import {
  computeNutritionForPortion,
  roundCalories,
  roundMacro,
} from '../services/nutritionMath';
import { VERIFIED_OFFLINE_FOODS } from '../services/foodDatabase';
import { syncEngine } from '../services/syncEngine';
import { playSuccessChime, triggerHaptic } from '../services/audioFeedback';

interface RecipeBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecipeSaved: (recipe: Recipe) => void;
}

interface DraftIngredient {
  foodItem: FoodItem;
  amount: number | string;
  unit: ServingUnit;
  gramWeight: number;
}

export const RecipeBuilderModal: React.FC<RecipeBuilderModalProps> = ({
  isOpen,
  onClose,
  onRecipeSaved,
}) => {
  if (!isOpen) return null;

  const [recipeName, setRecipeName] = useState('');
  const [description, setDescription] = useState('');
  const [servings, setServings] = useState<number | string>(2);
  const [ingredients, setIngredients] = useState<DraftIngredient[]>([]);

  // Ingredient search state
  const [isSearchingIngredient, setIsSearchingIngredient] = useState(false);
  const [ingredientSearchQuery, setIngredientSearchQuery] = useState('');

  // Calculate totals across ingredients
  let totalWeightG = 0;
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;
  let totalFiber = 0;

  ingredients.forEach((ing) => {
    const numAmt = typeof ing.amount === 'number' ? ing.amount : parseFloat(ing.amount) || 0;
    const computed = computeNutritionForPortion(ing.foodItem, numAmt, ing.unit);
    totalWeightG += computed.servingGramWeight;
    totalCalories += computed.calories;
    totalProtein += computed.protein;
    totalCarbs += computed.carbs;
    totalFat += computed.fat;
    totalFiber += computed.fiber;
  });

  const parsedServings = typeof servings === 'number' ? servings : parseInt(servings, 10) || 1;
  const servCount = Math.max(1, parsedServings);
  const perServingCalories = roundCalories(totalCalories / servCount);
  const perServingProtein = roundMacro(totalProtein / servCount);
  const perServingCarbs = roundMacro(totalCarbs / servCount);
  const perServingFat = roundMacro(totalFat / servCount);
  const perServingFiber = roundMacro(totalFiber / servCount);

  const handleAddIngredient = (food: FoodItem) => {
    const defaultAmount = food.defaultServingSize || 100;
    const defaultUnit = food.defaultServingUnit || 'g';
    const computed = computeNutritionForPortion(food, defaultAmount, defaultUnit);

    setIngredients((prev) => [
      ...prev,
      {
        foodItem: food,
        amount: defaultAmount,
        unit: defaultUnit,
        gramWeight: computed.servingGramWeight,
      },
    ]);
    setIsSearchingIngredient(false);
    setIngredientSearchQuery('');
  };

  const handleUpdateIngredient = (
    index: number,
    amount: number | string,
    unit: ServingUnit
  ) => {
    setIngredients((prev) => {
      const copy = [...prev];
      const target = copy[index];
      const numAmt = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
      const computed = computeNutritionForPortion(target.foodItem, numAmt, unit);
      copy[index] = {
        ...target,
        amount,
        unit,
        gramWeight: computed.servingGramWeight,
      };
      return copy;
    });
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveRecipe = () => {
    if (!recipeName.trim() || ingredients.length === 0) return;

    const finalIngredients: RecipeIngredient[] = ingredients.map((ing) => ({
      foodItem: ing.foodItem,
      amount: typeof ing.amount === 'number' ? ing.amount : parseFloat(ing.amount) || 100,
      unit: ing.unit,
      gramWeight: ing.gramWeight,
    }));

    const newRecipe: Recipe = {
      id: `recipe_${Date.now()}`,
      name: recipeName.trim(),
      description: description.trim(),
      servings: servCount,
      ingredients: finalIngredients,
      totalWeightG: roundMacro(totalWeightG),
      totalCalories: roundCalories(totalCalories),
      totalProtein: roundMacro(totalProtein),
      totalCarbs: roundMacro(totalCarbs),
      totalFat: roundMacro(totalFat),
      totalFiber: roundMacro(totalFiber),
      perServingCalories,
      perServingProtein,
      perServingCarbs,
      perServingFat,
      perServingFiber,
      createdAt: Date.now(),
    };

    syncEngine.saveRecipe(newRecipe);
    onRecipeSaved(newRecipe);
    playSuccessChime();
    triggerHaptic('success');
    onClose();
  };

  const filteredCandidates = VERIFIED_OFFLINE_FOODS.filter((f) =>
    f.name.toLowerCase().includes(ingredientSearchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 text-white">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Recipe & Meal Creator</h3>
              <p className="text-[11px] text-slate-400">Combine ingredients with dynamic macro scaling</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto space-y-4 text-white flex-1">
          {/* Basic Info */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Recipe Name *</label>
              <input
                type="text"
                value={recipeName}
                onChange={(e) => setRecipeName(e.target.value)}
                placeholder="e.g. Protein Overnight Oats, High-Protein Chili"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Total Servings</label>
                <input
                  type="number"
                  min="1"
                  value={servings}
                  onChange={(e) => setServings(e.target.value)}
                  placeholder="2"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-white text-center focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Description (Optional)</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Post-workout meal"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Ingredient List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">
                Ingredients ({ingredients.length})
              </span>
              <button
                type="button"
                onClick={() => setIsSearchingIngredient(true)}
                className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Ingredient
              </button>
            </div>

            {/* Ingredient search drawer */}
            {isSearchingIngredient && (
              <div className="p-3 bg-slate-850 border border-indigo-500/30 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-indigo-300">Select Ingredient</span>
                  <button
                    onClick={() => setIsSearchingIngredient(false)}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
                <input
                  type="text"
                  value={ingredientSearchQuery}
                  onChange={(e) => setIngredientSearchQuery(e.target.value)}
                  placeholder="Filter foods..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-hidden focus:border-indigo-500"
                />
                <div className="max-h-40 overflow-y-auto divide-y divide-slate-800">
                  {filteredCandidates.map((food) => (
                    <button
                      key={food.id}
                      onClick={() => handleAddIngredient(food)}
                      className="w-full text-left py-2 px-2 hover:bg-slate-800 rounded-lg flex items-center justify-between text-xs transition cursor-pointer"
                    >
                      <span className="font-medium text-slate-200">{food.name}</span>
                      <span className="text-slate-400 text-[11px]">{food.caloriesPer100g} kcal/100g</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* List of active recipe ingredients */}
            {ingredients.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500 bg-slate-800/30 rounded-2xl border border-dashed border-slate-700">
                No ingredients added yet. Tap "+ Add Ingredient" above.
              </div>
            ) : (
              ingredients.map((ing, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-200 truncate">{ing.foodItem.name}</div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <input
                        type="number"
                        min="0.1"
                        step="any"
                        value={ing.amount}
                        onChange={(e) =>
                          handleUpdateIngredient(idx, e.target.value, ing.unit)
                        }
                        placeholder="100"
                        className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-0.5 text-xs text-white text-center"
                      />
                      <select
                        value={ing.unit}
                        onChange={(e) =>
                          handleUpdateIngredient(idx, ing.amount, e.target.value as ServingUnit)
                        }
                        className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-0.5 text-xs text-white cursor-pointer"
                      >
                        <option value="g">grams (g)</option>
                        <option value="oz">ounces (oz)</option>
                        <option value="ml">ml</option>
                        <option value="cup">cup</option>
                        <option value="tbsp">tbsp</option>
                        <option value="tsp">tsp</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemoveIngredient(idx)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Per-Serving Macro Summary */}
          <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                Per 1 Serving (1 of {servCount})
              </span>
              <span className="text-sm font-black text-white">{perServingCalories} kcal</span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="bg-slate-900/60 rounded-xl p-1.5 border border-slate-800">
                <div className="text-[10px] text-slate-400">Protein</div>
                <div className="font-bold text-indigo-400">{perServingProtein}g</div>
              </div>
              <div className="bg-slate-900/60 rounded-xl p-1.5 border border-slate-800">
                <div className="text-[10px] text-slate-400">Carbs</div>
                <div className="font-bold text-amber-400">{perServingCarbs}g</div>
              </div>
              <div className="bg-slate-900/60 rounded-xl p-1.5 border border-slate-800">
                <div className="text-[10px] text-slate-400">Fat</div>
                <div className="font-bold text-rose-400">{perServingFat}g</div>
              </div>
              <div className="bg-slate-900/60 rounded-xl p-1.5 border border-slate-800">
                <div className="text-[10px] text-slate-400">Fiber</div>
                <div className="font-bold text-teal-400">{perServingFiber}g</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90">
          <button
            onClick={handleSaveRecipe}
            disabled={!recipeName.trim() || ingredients.length === 0}
            className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white font-bold text-sm rounded-xl shadow-lg transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            Save Custom Recipe
          </button>
        </div>
      </div>
    </div>
  );
};
