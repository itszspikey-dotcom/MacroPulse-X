import React, { useEffect, useState } from 'react';
import {
  X,
  Plus,
  Check,
  Star,
  Scale,
  Sparkles,
  Info,
  ChevronDown,
  Trash2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { FoodItem, LoggedFood, MealType, ServingUnit } from '../types/nutrition';
import {
  computeNutritionForPortion,
  UNIT_TO_GRAM_MULTIPLIERS,
} from '../services/nutritionMath';
import { getFavoriteIds, toggleFavorite } from '../services/foodDatabase';
import { playSuccessChime, triggerHaptic } from '../services/audioFeedback';

interface FoodDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  foodItem: FoodItem | null;
  initialMealType: MealType;
  editingLog?: LoggedFood | null;
  onSaveLog: (logData: {
    foodItem: FoodItem;
    mealType: MealType;
    servingAmount: number;
    servingUnit: ServingUnit;
    servingGramWeight: number;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    editingLogId?: string;
  }) => void;
  onDeleteLog?: (logId: string) => void;
}

export const FoodDetailModal: React.FC<FoodDetailModalProps> = ({
  isOpen,
  onClose,
  foodItem,
  initialMealType,
  editingLog,
  onSaveLog,
  onDeleteLog,
}) => {
  if (!isOpen || !foodItem) return null;

  const [selectedMeal, setSelectedMeal] = useState<MealType>(initialMealType);
  const [amount, setAmount] = useState<number | string>(
    editingLog ? editingLog.servingAmount : foodItem.defaultServingSize || 100
  );
  const [unit, setUnit] = useState<ServingUnit>(
    editingLog ? editingLog.servingUnit : foodItem.defaultServingUnit || 'g'
  );
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (foodItem) {
      setIsFavorite(getFavoriteIds().includes(foodItem.id));
      if (editingLog) {
        setSelectedMeal(editingLog.mealType);
        setAmount(editingLog.servingAmount);
        setUnit(editingLog.servingUnit);
      } else {
        setSelectedMeal(initialMealType);
        setAmount(foodItem.defaultServingSize || 100);
        setUnit(foodItem.defaultServingUnit || 'g');
      }
    }
  }, [foodItem, editingLog, initialMealType]);

  // Strict dynamic portion calculations
  const parsedAmt = parseFloat(amount.toString()) || 0;
  const computed = computeNutritionForPortion(foodItem, parsedAmt, unit);

  // Macro Energy Percentages
  const pCal = computed.protein * 4;
  const cCal = computed.carbs * 4;
  const fCal = computed.fat * 9;
  const totalCal = pCal + cCal + fCal || 1;

  const pPct = Math.round((pCal / totalCal) * 100);
  const cPct = Math.round((cCal / totalCal) * 100);
  const fPct = Math.max(0, 100 - (pPct + cPct));

  // Available Serving Units for this food
  const availableUnits: { unit: ServingUnit; label: string }[] = [
    { unit: 'g', label: 'grams (g)' },
    { unit: 'oz', label: 'ounces (oz)' },
    { unit: 'serving', label: 'serving' },
    { unit: 'cup', label: 'cup' },
    { unit: 'tbsp', label: 'tablespoon (tbsp)' },
    { unit: 'tsp', label: 'teaspoon (tsp)' },
    { unit: 'ml', label: 'milliliters (ml)' },
    { unit: 'fl_oz', label: 'fluid ounce (fl oz)' },
    { unit: 'piece', label: 'piece / item' },
  ];

  const handleToggleFav = () => {
    const newState = toggleFavorite(foodItem.id);
    setIsFavorite(newState);
    triggerHaptic('light');
  };

  const handleSave = () => {
    if (parsedAmt <= 0) return;

    onSaveLog({
      foodItem,
      mealType: selectedMeal,
      servingAmount: parsedAmt,
      servingUnit: unit,
      servingGramWeight: computed.servingGramWeight,
      calories: computed.calories,
      protein: computed.protein,
      carbs: computed.carbs,
      fat: computed.fat,
      fiber: computed.fiber,
      editingLogId: editingLog?.id,
    });

    playSuccessChime();
    triggerHaptic('success');
    confetti({ particleCount: 35, spread: 50, origin: { y: 0.7 } });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 text-white">
          <div className="flex-1 min-w-0 pr-2">
            <h3 className="text-base font-bold text-white truncate">{foodItem.name}</h3>
            <p className="text-[11px] text-slate-400 truncate">
              {foodItem.brand || 'Reference food'} • Base: {foodItem.caloriesPer100g} kcal / 100g
            </p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={handleToggleFav}
              className={`p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition cursor-pointer ${
                isFavorite ? 'text-amber-400' : 'text-slate-400 hover:text-white'
              }`}
              title="Add to Favorites"
            >
              <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-4 text-white flex-1">
          {/* Meal Slot Selection Pills */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">
              Log To Meal Slot
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {(
                [
                  { id: 'breakfast', label: 'Breakfast' },
                  { id: 'lunch', label: 'Lunch' },
                  { id: 'dinner', label: 'Dinner' },
                  { id: 'snack', label: 'Snack' },
                ] as const
              ).map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMeal(m.id)}
                  className={`py-2 px-1 text-xs font-semibold rounded-xl text-center capitalize transition cursor-pointer ${
                    selectedMeal === m.id
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Portion Amount & Serving Unit Scaler */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-3.5">
            <div className="flex items-center justify-between text-xs text-slate-300 font-semibold mb-2">
              <span className="flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-emerald-400" />
                Portion Size
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                = {computed.servingGramWeight}g total
              </span>
            </div>

            <div className="flex gap-2">
              <div className="w-1/3">
                <input
                  type="number"
                  min="0.1"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="100"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-base font-bold text-white text-center focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="flex-1">
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as ServingUnit)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs font-semibold text-white focus:outline-hidden focus:border-emerald-500 cursor-pointer"
                >
                  {availableUnits.map((u) => (
                    <option key={u.unit} value={u.unit}>
                      {u.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick portion buttons */}
            <div className="flex items-center gap-1.5 mt-2.5">
              {[50, 100, 150, 200].map((quickGrams) => (
                <button
                  key={quickGrams}
                  onClick={() => {
                    setAmount(quickGrams);
                    setUnit('g');
                  }}
                  className="flex-1 py-1 text-[11px] bg-slate-900/60 hover:bg-slate-750 text-slate-300 rounded-lg border border-slate-700 transition cursor-pointer"
                >
                  {quickGrams}g
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Nutrients Display Cards */}
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
              <div className="text-[10px] uppercase font-bold text-emerald-400">Calories</div>
              <div className="text-lg font-black text-white">{computed.calories}</div>
              <div className="text-[9px] text-slate-400">kcal</div>
            </div>

            <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30">
              <div className="text-[10px] uppercase font-bold text-indigo-400">Protein</div>
              <div className="text-lg font-black text-white">{computed.protein}</div>
              <div className="text-[9px] text-slate-400">g ({pPct}%)</div>
            </div>

            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30">
              <div className="text-[10px] uppercase font-bold text-amber-400">Carbs</div>
              <div className="text-lg font-black text-white">{computed.carbs}</div>
              <div className="text-[9px] text-slate-400">g ({cPct}%)</div>
            </div>

            <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/30">
              <div className="text-[10px] uppercase font-bold text-rose-400">Fat</div>
              <div className="text-lg font-black text-white">{computed.fat}</div>
              <div className="text-[9px] text-slate-400">g ({fPct}%)</div>
            </div>
          </div>

          {/* Additional Nutrients & Fiber */}
          <div className="p-3 bg-slate-800/50 rounded-2xl border border-slate-700/60 text-xs space-y-1.5">
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400">Dietary Fiber:</span>
              <span className="font-bold text-teal-400">{computed.fiber} g</span>
            </div>
            {foodItem.micros?.sugar !== undefined && (
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">Total Sugars:</span>
                <span className="font-semibold text-slate-200">
                  {computed.micros?.sugar || 0} g
                </span>
              </div>
            )}
            {foodItem.micros?.sodium !== undefined && (
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">Sodium:</span>
                <span className="font-semibold text-slate-200">
                  {computed.micros?.sodium || 0} mg
                </span>
              </div>
            )}
            {foodItem.micros?.saturatedFat !== undefined && (
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">Saturated Fat:</span>
                <span className="font-semibold text-slate-200">
                  {computed.micros?.saturatedFat || 0} g
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex gap-2">
          {editingLog && onDeleteLog && (
            <button
              onClick={() => {
                onDeleteLog(editingLog.id);
                onClose();
              }}
              className="p-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30 transition cursor-pointer"
              title="Delete Log Entry"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}

          <button
            onClick={handleSave}
            disabled={amount <= 0}
            className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm rounded-xl shadow-lg transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            {editingLog ? 'Update Food Log' : `Log Food to ${selectedMeal.toUpperCase()}`}
          </button>
        </div>
      </div>
    </div>
  );
};
