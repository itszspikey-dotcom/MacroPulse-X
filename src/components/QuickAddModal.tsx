import React, { useState } from 'react';
import { X, Zap, Check } from 'lucide-react';
import { MealType } from '../types/nutrition';
import { playSuccessChime, triggerHaptic } from '../services/audioFeedback';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  mealType: MealType;
  onQuickAdd: (entry: {
    name: string;
    mealType: MealType;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  }) => void;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  isOpen,
  onClose,
  mealType,
  onQuickAdd,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState('');
  const [selectedMeal, setSelectedMeal] = useState<MealType>(mealType);
  const [calories, setCalories] = useState<string>('');
  const [protein, setProtein] = useState<string>('');
  const [carbs, setCarbs] = useState<string>('');
  const [fat, setFat] = useState<string>('');
  const [fiber, setFiber] = useState<string>('');

  // Automatically estimate calories from macros if calories is empty
  const handleMacroChange = (p: string, c: string, f: string) => {
    const pNum = parseFloat(p) || 0;
    const cNum = parseFloat(c) || 0;
    const fNum = parseFloat(f) || 0;
    if (!calories || calories === '0') {
      const estimatedCal = Math.round(pNum * 4 + cNum * 4 + fNum * 9);
      if (estimatedCal > 0) {
        setCalories(estimatedCal.toString());
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const calNum = parseInt(calories, 10) || 0;
    const pNum = parseFloat(protein) || 0;
    const cNum = parseFloat(carbs) || 0;
    const fNum = parseFloat(fat) || 0;
    const fibNum = parseFloat(fiber) || 0;

    if (calNum <= 0 && pNum <= 0 && cNum <= 0 && fNum <= 0) return;

    onQuickAdd({
      name: name.trim() || 'Quick Food Log',
      mealType: selectedMeal,
      calories: calNum || Math.round(pNum * 4 + cNum * 4 + fNum * 9),
      protein: Math.round(pNum * 10) / 10,
      carbs: Math.round(cNum * 10) / 10,
      fat: Math.round(fNum * 10) / 10,
      fiber: Math.round(fibNum * 10) / 10,
    });

    playSuccessChime();
    triggerHaptic('success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 text-white">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Quick Manual Add</h3>
              <p className="text-[11px] text-slate-400">Log calories and macros directly</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 text-white">
          {/* Meal Slot */}
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
                type="button"
                onClick={() => setSelectedMeal(m.id)}
                className={`py-1.5 px-1 text-xs font-semibold rounded-xl text-center capitalize transition cursor-pointer ${
                  selectedMeal === m.id
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Food description */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Food or Meal Description (Optional)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Restaurant Burrito Bowl, Homemade Smoothie"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500"
            />
          </div>

          {/* Calories input */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-3">
            <label className="text-xs font-bold text-emerald-400 block mb-1">
              Total Calories (kcal) *
            </label>
            <input
              type="number"
              min="0"
              required
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              placeholder="e.g. 450"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xl font-black text-white focus:outline-hidden focus:border-emerald-500"
            />
          </div>

          {/* Macros Grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-2.5">
              <label className="text-[11px] font-bold text-indigo-400 block mb-1">Protein (g)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={protein}
                onChange={(e) => {
                  setProtein(e.target.value);
                  handleMacroChange(e.target.value, carbs, fat);
                }}
                placeholder="0"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm font-bold text-white focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-2.5">
              <label className="text-[11px] font-bold text-amber-400 block mb-1">Carbs (g)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={carbs}
                onChange={(e) => {
                  setCarbs(e.target.value);
                  handleMacroChange(protein, e.target.value, fat);
                }}
                placeholder="0"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm font-bold text-white focus:outline-hidden focus:border-amber-500"
              />
            </div>

            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-2.5">
              <label className="text-[11px] font-bold text-rose-400 block mb-1">Fat (g)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={fat}
                onChange={(e) => {
                  setFat(e.target.value);
                  handleMacroChange(protein, carbs, e.target.value);
                }}
                placeholder="0"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm font-bold text-white focus:outline-hidden focus:border-rose-500"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Fiber (g, optional)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={fiber}
              onChange={(e) => setFiber(e.target.value)}
              placeholder="0"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-hidden focus:border-teal-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl shadow-lg transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <Check className="w-4 h-4" />
            Save Quick Entry
          </button>
        </form>
      </div>
    </div>
  );
};
