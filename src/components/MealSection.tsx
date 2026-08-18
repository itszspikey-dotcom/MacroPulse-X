import React from 'react';
import {
  Plus,
  QrCode,
  Sparkles,
  Zap,
  Trash2,
  Clock,
  CheckCircle2,
  Utensils,
  Sun,
  Sunset,
  Moon,
  Cookie,
} from 'lucide-react';
import { LoggedFood, MealType } from '../types/nutrition';
import { aggregateLoggedFoods } from '../services/nutritionMath';
import { triggerHaptic } from '../services/audioFeedback';

interface MealSectionProps {
  mealType: MealType;
  items: LoggedFood[];
  onOpenSearch: (mealType: MealType) => void;
  onOpenBarcode: (mealType: MealType) => void;
  onOpenAiScan: (mealType: MealType) => void;
  onOpenQuickAdd: (mealType: MealType) => void;
  onEditItem: (item: LoggedFood) => void;
  onDeleteItem: (itemId: string) => void;
}

const MEAL_CONFIG: Record<
  MealType,
  { label: string; icon: React.ReactNode; color: string }
> = {
  breakfast: {
    label: 'BREAKFAST',
    icon: <Sun className="w-4 h-4 text-[#facc15]" />,
    color: 'text-[#facc15]',
  },
  lunch: {
    label: 'LUNCH',
    icon: <Sunset className="w-4 h-4 text-emerald-400" />,
    color: 'text-emerald-400',
  },
  dinner: {
    label: 'DINNER',
    icon: <Moon className="w-4 h-4 text-indigo-400" />,
    color: 'text-indigo-400',
  },
  snack: {
    label: 'SNACKS & FUEL',
    icon: <Cookie className="w-4 h-4 text-pink-400" />,
    color: 'text-pink-400',
  },
};

export const MealSection: React.FC<MealSectionProps> = ({
  mealType,
  items,
  onOpenSearch,
  onOpenBarcode,
  onOpenAiScan,
  onOpenQuickAdd,
  onEditItem,
  onDeleteItem,
}) => {
  const config = MEAL_CONFIG[mealType];
  const summary = aggregateLoggedFoods(items);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('warning');
    onDeleteItem(id);
  };

  return (
    <div className="cinematic-card rounded-sm overflow-hidden mb-4">
      {/* Section Header */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-white/10 bg-[#141416] flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="p-1.5 sm:p-2 rounded bg-white/5 border border-white/10 shrink-0">
            {config.icon}
          </div>
          <div>
            <div className="flex items-center gap-2 sm:gap-3">
              <h3 className="font-oswald text-sm sm:text-base tracking-wider text-white uppercase font-semibold">
                {config.label}
              </h3>
              <span className="font-oswald text-xs sm:text-sm px-2 sm:px-2.5 py-0.5 bg-[#facc15]/10 border border-[#facc15]/30 text-[#facc15] rounded">
                {summary.calories} KCAL
              </span>
            </div>
            <div className="font-mono-meta text-[10px] sm:text-[11px] text-white/40 mt-0.5 flex items-center gap-1.5 sm:gap-2">
              <span>{summary.protein}P</span>
              <span>/</span>
              <span>{summary.carbs}C</span>
              <span>/</span>
              <span>{summary.fat}F</span>
              {summary.fiber > 0 && (
                <>
                  <span>/</span>
                  <span>{summary.fiber} FIBER</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={() => onOpenBarcode(mealType)}
            className="p-1.5 sm:p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 transition cursor-pointer active:scale-90"
            title="Scan Barcode"
          >
            <QrCode className="w-3.5 h-3.5 text-[#facc15]" />
          </button>
          <button
            onClick={() => onOpenAiScan(mealType)}
            className="p-1.5 sm:p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 transition cursor-pointer active:scale-90"
            title="AI Meal Photo Scan"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          </button>
          <button
            onClick={() => onOpenSearch(mealType)}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg bg-white/10 hover:bg-[#facc15] text-white hover:text-black font-oswald text-xs uppercase tracking-wider transition cursor-pointer font-semibold active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* Logged Food Rows */}
      <div className="divide-y divide-white/5">
        {items.length === 0 ? (
          <div className="py-6 sm:py-8 px-4 sm:px-6 text-center text-white/30 flex flex-col items-center justify-center gap-2">
            <Utensils className="w-5 h-5 text-white/20 mb-1" />
            <div className="font-mono-meta text-xs">
              No entries logged for {config.label.toLowerCase()} yet.
            </div>
            <div className="flex items-center gap-2 sm:gap-3 font-mono-meta text-[10px] sm:text-[11px] mt-1 flex-wrap justify-center">
              <button
                onClick={() => onOpenSearch(mealType)}
                className="text-[#facc15] hover:underline cursor-pointer font-semibold"
              >
                + SEARCH DATABASE
              </button>
              <span className="text-white/20">•</span>
              <button
                onClick={() => onOpenBarcode(mealType)}
                className="text-white/60 hover:text-white cursor-pointer"
              >
                SCAN BARCODE
              </button>
              <span className="text-white/20">•</span>
              <button
                onClick={() => onOpenQuickAdd(mealType)}
                className="text-white/60 hover:text-white cursor-pointer"
              >
                QUICK ADD
              </button>
            </div>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              onClick={() => onEditItem(item)}
              className="px-4 sm:px-6 py-3 sm:py-3.5 flex items-center justify-between gap-3 hover:bg-white/[0.02] transition cursor-pointer group active:bg-white/[0.04]"
            >
              {/* Food Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-semibold text-white group-hover:text-[#facc15] transition truncate font-geist">
                    {item.foodName}
                  </span>
                  {item.syncStatus === 'synced' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" title="Synced" />
                  ) : (
                    <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" title="Pending Sync" />
                  )}
                </div>
                <div className="font-mono-meta text-[10px] sm:text-[11px] text-white/40 mt-0.5 truncate">
                  <span>
                    {item.servingAmount} {item.servingUnit}{' '}
                    {item.servingUnit !== 'g' && `(${item.servingGramWeight}g)`}
                  </span>
                  {item.brand && <span> • {item.brand}</span>}
                  {item.source && <span> • {item.source}</span>}
                </div>
              </div>

              {/* Macros Breakdown */}
              <div className="hidden sm:block font-mono-meta text-xs text-white/50 text-right">
                {item.protein}P / {item.carbs}C / {item.fat}F
              </div>

              {/* Energy Calories */}
              <div className="font-oswald text-base sm:text-xl font-semibold text-white tracking-tight text-right shrink-0">
                {item.calories} <span className="text-[10px] sm:text-xs text-white/40 font-normal">KCAL</span>
              </div>

              {/* Delete Button */}
              <button
                onClick={(e) => handleDelete(item.id, e)}
                className="p-1.5 text-white/20 hover:text-rose-400 hover:bg-rose-500/10 rounded transition opacity-60 sm:opacity-40 group-hover:opacity-100 cursor-pointer shrink-0 active:scale-90"
                title="Remove Entry"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
