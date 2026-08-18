import React, { useState, useEffect } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Plus,
  Trash2,
  Check,
  RotateCcw,
  BookOpen,
  ArrowRight,
  Utensils,
  Copy,
  Layers,
  Zap,
  CheckCircle2,
  Clock,
  Flame,
  AlertCircle,
  X,
  PlusCircle,
} from 'lucide-react';
import { MealType, Recipe, UserProfile } from '../types/nutrition';
import { PlannedDay, PlannedMealItem, WeeklyMealPlan, DayPlanTotals } from '../types/planner';
import { plannerService } from '../services/plannerService';
import { syncEngine } from '../services/syncEngine';
import { playSuccessChime, triggerHaptic } from '../services/audioFeedback';

interface MenuPlannerViewProps {
  userProfile: UserProfile;
  onOpenRecipeBuilder?: () => void;
  onOpenAiAdvisor?: () => void;
  onBackToTracker?: () => void;
}

export const MenuPlannerView: React.FC<MenuPlannerViewProps> = ({
  userProfile,
  onOpenRecipeBuilder,
  onOpenAiAdvisor,
  onBackToTracker,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const initialMonday = plannerService.getMondayOfWeek(todayStr);

  const [currentWeekMonday, setCurrentWeekMonday] = useState<string>(initialMonday);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [plan, setPlan] = useState<WeeklyMealPlan>(() =>
    plannerService.getWeeklyPlan(initialMonday, userProfile.id)
  );

  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>(() => syncEngine.getRecipes());
  const [feedbackToast, setFeedbackToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // Modals inside planner
  const [isAddCustomOpen, setIsAddCustomOpen] = useState(false);
  const [isRecipePickerOpen, setIsRecipePickerOpen] = useState(false);
  const [isCopyDayOpen, setIsCopyDayOpen] = useState(false);
  const [targetSlotForAdd, setTargetSlotForAdd] = useState<MealType>('breakfast');

  // Custom Item Form State
  const [customName, setCustomName] = useState('');
  const [customPortion, setCustomPortion] = useState('1 serving (200g)');
  const [customCal, setCustomCal] = useState<number | ''>(350);
  const [customP, setCustomP] = useState<number | ''>(30);
  const [customC, setCustomC] = useState<number | ''>(35);
  const [customF, setCustomF] = useState<number | ''>(10);
  const [customFiber, setCustomFiber] = useState<number | ''>(5);

  // Copy day state
  const [copyTargetDate, setCopyTargetDate] = useState<string>('');

  // Reload plan when week or user changes
  useEffect(() => {
    const loadedPlan = plannerService.getWeeklyPlan(currentWeekMonday, userProfile.id);
    setPlan(loadedPlan);
    setSavedRecipes(syncEngine.getRecipes());
  }, [currentWeekMonday, userProfile.id]);

  // Keep selectedDate valid for current week
  const weekDays = plannerService.getWeekDays(currentWeekMonday);
  useEffect(() => {
    const isSelectedInWeek = weekDays.some((w) => w.date === selectedDate);
    if (!isSelectedInWeek && weekDays.length > 0) {
      setSelectedDate(weekDays[0].date);
    }
  }, [currentWeekMonday]);

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setFeedbackToast({ message, type });
    setTimeout(() => {
      setFeedbackToast(null);
    }, 3500);
  };

  const handlePrevWeek = () => {
    const d = new Date(currentWeekMonday + 'T12:00:00');
    d.setDate(d.getDate() - 7);
    const newMonday = d.toISOString().split('T')[0];
    setCurrentWeekMonday(newMonday);
    triggerHaptic('light');
  };

  const handleNextWeek = () => {
    const d = new Date(currentWeekMonday + 'T12:00:00');
    d.setDate(d.getDate() + 7);
    const newMonday = d.toISOString().split('T')[0];
    setCurrentWeekMonday(newMonday);
    triggerHaptic('light');
  };

  const handleCurrentWeek = () => {
    setCurrentWeekMonday(initialMonday);
    setSelectedDate(todayStr);
    triggerHaptic('light');
  };

  // AI Auto-plan generation
  const handleAiAutoGenerate = async () => {
    setIsGeneratingAi(true);
    triggerHaptic('light');
    try {
      const generated = await plannerService.generateAiWeeklyPlan(
        currentWeekMonday,
        userProfile,
        savedRecipes
      );
      setPlan(generated);
      playSuccessChime();
      triggerHaptic('success');
      showToast('AI Coach successfully formulated 7-day tactical meal plan!');
    } catch (e: any) {
      console.error(e);
      showToast('Error generating AI plan. Fallback generated.', 'info');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Template Quick Generate
  const handleGenerateTemplate = (templateGoal: 'cut' | 'bulk' | 'keto' | 'maintain') => {
    const tempProfile = { ...userProfile, goalType: templateGoal };
    const generated = plannerService.generateMathematicalPlan(
      currentWeekMonday,
      tempProfile,
      savedRecipes
    );
    setPlan(generated);
    playSuccessChime();
    triggerHaptic('success');
    showToast(`Applied ${templateGoal.toUpperCase()} weekly preset!`);
  };

  // Add custom item submit
  const handleAddCustomItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const updatedPlan = plannerService.addItemToSlot(
      currentWeekMonday,
      userProfile.id,
      selectedDate,
      targetSlotForAdd,
      {
        name: customName.trim(),
        portion: customPortion || '1 serving',
        calories: Number(customCal) || 0,
        protein: Number(customP) || 0,
        carbs: Number(customC) || 0,
        fat: Number(customF) || 0,
        fiber: Number(customFiber) || 0,
      }
    );

    setPlan(updatedPlan);
    setIsAddCustomOpen(false);
    setCustomName('');
    playSuccessChime();
    triggerHaptic('light');
    showToast(`Added ${customName} to ${targetSlotForAdd.toUpperCase()}`);
  };

  // Add Recipe submit
  const handleSelectRecipe = (recipe: Recipe) => {
    const updatedPlan = plannerService.addRecipeToSlot(
      currentWeekMonday,
      userProfile.id,
      selectedDate,
      targetSlotForAdd,
      recipe
    );
    setPlan(updatedPlan);
    setIsRecipePickerOpen(false);
    playSuccessChime();
    triggerHaptic('light');
    showToast(`Scheduled recipe "${recipe.name}"`);
  };

  // Remove meal item
  const handleRemoveItem = (slot: MealType, itemId: string) => {
    const updated = plannerService.removeItemFromSlot(
      currentWeekMonday,
      userProfile.id,
      selectedDate,
      slot,
      itemId
    );
    setPlan(updated);
    triggerHaptic('light');
  };

  // Clear slot or day
  const handleClearDay = () => {
    if (window.confirm('Clear all planned meals for this selected day?')) {
      const updated = plannerService.clearSlot(
        currentWeekMonday,
        userProfile.id,
        selectedDate
      );
      setPlan(updated);
      triggerHaptic('light');
      showToast('Cleared planned day');
    }
  };

  // 1-Click apply day to tracker
  const handleApplyDayToTracker = () => {
    const res = plannerService.applyDayPlanToTracker(selectedDate, userProfile.id, plan);
    if (res.loggedCount === 0) {
      showToast('No planned items to log for this day.', 'info');
      return;
    }
    playSuccessChime();
    triggerHaptic('success');
    showToast(
      `✓ Logged ${res.loggedCount} meals (${res.totalCalories} kcal) into Daily Tracker for ${selectedDate}!`
    );
  };

  // 1-Click apply single item
  const handleApplySingleItem = (slot: MealType, item: PlannedMealItem) => {
    plannerService.applySingleMealItemToTracker(selectedDate, userProfile.id, slot, item);
    playSuccessChime();
    triggerHaptic('light');
    showToast(`Logged "${item.name}" into Tracker!`);
  };

  // Copy day plan
  const handleCopyDaySubmit = () => {
    if (!copyTargetDate || copyTargetDate === selectedDate) return;
    const sourceDay = plan.days[selectedDate];
    if (!sourceDay) return;

    const newPlan = { ...plan };
    newPlan.days[copyTargetDate] = {
      date: copyTargetDate,
      dayOfWeek: new Date(copyTargetDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' }),
      slots: JSON.parse(JSON.stringify(sourceDay.slots)),
    };
    newPlan.updatedAt = Date.now();
    plannerService.saveWeeklyPlan(newPlan);
    setPlan(newPlan);
    setIsCopyDayOpen(false);
    playSuccessChime();
    triggerHaptic('success');
    showToast(`Copied plan to ${copyTargetDate}`);
  };

  // Active selected day calculations
  const activeDay = plan.days[selectedDate] || {
    date: selectedDate,
    dayOfWeek: new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' }),
    slots: { breakfast: [], lunch: [], dinner: [], snack: [] },
  };

  const dayTotals: DayPlanTotals = plannerService.calculateDayTotals(activeDay);

  const targetCal = userProfile.targetCalories || 2000;
  const targetP = userProfile.targetProteinG || 160;
  const targetC = userProfile.targetCarbsG || 200;
  const targetF = userProfile.targetFatG || 65;

  const calDiff = dayTotals.calories - targetCal;
  const calPct = Math.min(150, Math.round((dayTotals.calories / targetCal) * 100)) || 0;
  const pPct = Math.min(150, Math.round((dayTotals.protein / targetP) * 100)) || 0;
  const cPct = Math.min(150, Math.round((dayTotals.carbs / targetC) * 100)) || 0;
  const fPct = Math.min(150, Math.round((dayTotals.fat / targetF) * 100)) || 0;

  const slotsMeta: Array<{ type: MealType; label: string; icon: string; defaultSplit: string }> = [
    { type: 'breakfast', label: 'Breakfast', icon: '🌅', defaultSplit: '25% of Daily Target' },
    { type: 'lunch', label: 'Lunch', icon: '☀️', defaultSplit: '35% of Daily Target' },
    { type: 'dinner', label: 'Dinner', icon: '🌙', defaultSplit: '30% of Daily Target' },
    { type: 'snack', label: 'Snacks & Supplements', icon: '⚡', defaultSplit: '10% of Daily Target' },
  ];

  return (
    <div className="flex flex-col h-full w-full bg-[#0b0b0c] text-white font-geist overflow-hidden relative">
      {/* Toast Notification */}
      {feedbackToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div
            className={`px-4 py-2.5 rounded-2xl border text-xs font-mono-meta font-bold flex items-center gap-2 shadow-2xl backdrop-blur-xl ${
              feedbackToast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-300'
                : 'bg-[#18181b]/95 border-white/20 text-white'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{feedbackToast.message}</span>
          </div>
        </div>
      )}

      {/* TOP HEADER */}
      <header className="px-3 sm:px-6 py-3 pt-safe border-b border-white/10 flex flex-col gap-3 bg-[#0b0b0c]/90 backdrop-blur-xl z-20 shrink-0">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {/* Brand & Week Title */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center font-oswald text-black font-extrabold text-base shrink-0 shadow-md shadow-yellow-500/20">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-oswald text-lg sm:text-xl font-bold text-white uppercase tracking-wide">
                  Tactical Menu Planner
                </span>
                <span className="text-[10px] font-mono-meta px-2 py-0.5 rounded bg-[#facc15]/10 text-[#facc15] border border-[#facc15]/20 font-bold">
                  7-DAY MACRO SCHEDULE
                </span>
              </div>
              <p className="text-[11px] font-mono-meta text-white/40">
                Pre-plan weekly meals, auto-balance macros, and sync 1-click to Daily Tracker.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {onBackToTracker && (
              <button
                onClick={onBackToTracker}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono-meta font-semibold text-white/80 hover:text-white transition cursor-pointer active:scale-95"
              >
                ← Daily Tracker
              </button>
            )}

            {/* AI Generator Button */}
            <button
              onClick={handleAiAutoGenerate}
              disabled={isGeneratingAi}
              className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-black font-oswald font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-yellow-500/20 hover:brightness-110 active:scale-95 transition cursor-pointer disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isGeneratingAi ? 'animate-spin' : ''}`} />
              <span>{isGeneratingAi ? 'Synthesizing...' : 'AI Auto-Plan Week'}</span>
            </button>
          </div>
        </div>

        {/* WEEK CONTROLS & PRESET BUTTONS */}
        <div className="flex items-center justify-between gap-2 flex-wrap pt-1 border-t border-white/5">
          {/* Week Navigation */}
          <div className="flex items-center gap-1.5 bg-[#141416] p-1 rounded-xl border border-white/10">
            <button
              onClick={handlePrevWeek}
              className="p-1.5 text-white/60 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer active:scale-90"
              title="Previous Week"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-white text-xs font-mono-meta px-2">
              Week of {new Date(currentWeekMonday + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
            <button
              onClick={handleNextWeek}
              className="p-1.5 text-white/60 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer active:scale-90"
              title="Next Week"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            {currentWeekMonday !== initialMonday && (
              <button
                onClick={handleCurrentWeek}
                className="px-2 py-0.5 text-[10px] bg-yellow-400/10 text-yellow-400 border border-yellow-400/30 rounded font-bold uppercase hover:bg-yellow-400/20 transition cursor-pointer ml-1"
              >
                Current Week
              </button>
            )}
          </div>

          {/* Quick Presets Strip */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-[10px] font-mono-meta text-white/40 uppercase mr-1 hidden sm:inline">
              Presets:
            </span>
            <button
              onClick={() => handleGenerateTemplate('cut')}
              className="px-2.5 py-1 text-[11px] font-mono-meta rounded-lg bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 transition cursor-pointer shrink-0"
            >
              🔥 Shred (Cut)
            </button>
            <button
              onClick={() => handleGenerateTemplate('bulk')}
              className="px-2.5 py-1 text-[11px] font-mono-meta rounded-lg bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 transition cursor-pointer shrink-0"
            >
              💪 Hypertrophy (Bulk)
            </button>
            <button
              onClick={() => handleGenerateTemplate('maintain')}
              className="px-2.5 py-1 text-[11px] font-mono-meta rounded-lg bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 transition cursor-pointer shrink-0"
            >
              ⚖️ Balanced
            </button>
            <button
              onClick={() => handleGenerateTemplate('keto')}
              className="px-2.5 py-1 text-[11px] font-mono-meta rounded-lg bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 transition cursor-pointer shrink-0"
            >
              🥑 Keto
            </button>
          </div>
        </div>
      </header>

      {/* MAIN PLANNER WORKSPACE */}
      <main className="flex-1 overflow-y-auto p-3 sm:p-6 pb-28 md:pb-12 ios-scroll">
        <div className="max-w-7xl mx-auto space-y-5">
          {/* 1. 7-DAY WEEKLY CALENDAR STRIP */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {weekDays.map((wd) => {
              const isSelected = wd.date === selectedDate;
              const dayData = plan.days[wd.date];
              const totals = dayData ? plannerService.calculateDayTotals(dayData) : null;
              const hasItems = totals && totals.calories > 0;
              const pct = totals ? Math.round((totals.calories / targetCal) * 100) : 0;

              return (
                <button
                  key={wd.date}
                  onClick={() => {
                    setSelectedDate(wd.date);
                    triggerHaptic('light');
                  }}
                  className={`p-2 sm:p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[#1c1c20] border-[#facc15] shadow-lg shadow-yellow-500/10 ring-1 ring-[#facc15]/50 scale-[1.02]'
                      : 'bg-[#141416]/80 hover:bg-[#18181c] border-white/10 text-white/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={`text-[10px] sm:text-xs font-mono-meta font-bold uppercase ${isSelected ? 'text-[#facc15]' : 'text-white/40'}`}>
                      {wd.shortDay}
                    </span>
                    {wd.isToday && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" title="Today" />
                    )}
                  </div>

                  <div className="my-1">
                    <span className={`font-oswald text-base sm:text-xl font-bold ${isSelected ? 'text-white' : 'text-white/80'}`}>
                      {wd.dayNumber}
                    </span>
                    <span className="text-[9px] font-mono-meta text-white/30 ml-1 hidden sm:inline">
                      {wd.monthName}
                    </span>
                  </div>

                  {/* Planned Day Macro Badge */}
                  <div className="w-full pt-1 border-t border-white/5">
                    {hasItems ? (
                      <div className="flex items-center justify-between text-[9px] sm:text-[10px] font-mono-meta">
                        <span className={`font-bold ${isSelected ? 'text-yellow-300' : 'text-white/70'}`}>
                          {totals?.calories}k
                        </span>
                        <span
                          className={`text-[8px] px-1 py-0.2 rounded font-bold ${
                            Math.abs(pct - 100) <= 8
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : pct < 100
                              ? 'bg-yellow-500/20 text-yellow-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {pct}%
                        </span>
                      </div>
                    ) : (
                      <div className="text-[9px] font-mono-meta text-white/20 italic">
                        Empty
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* 2. ACTIVE DAY MACRO TELEMETRY & SYNC HUB */}
          <div className="cinematic-card p-4 sm:p-5">
            <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#facc15]/10 border border-[#facc15]/30 text-[#facc15]">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-oswald text-xl font-bold text-white uppercase">
                      {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    {selectedDate === todayStr && (
                      <span className="px-2 py-0.5 text-[10px] font-mono-meta bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-bold uppercase">
                        Active Today
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-mono-meta text-white/50">
                    Planned Caloric Balance & Macro Compliance
                  </span>
                </div>
              </div>

              {/* Day Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => {
                    setCopyTargetDate('');
                    setIsCopyDayOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono-meta text-white/80 hover:text-white transition cursor-pointer"
                  title="Copy this plan to another day"
                >
                  <Copy className="w-3.5 h-3.5 text-sky-400" />
                  <span>Copy Day</span>
                </button>

                <button
                  onClick={handleClearDay}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/40 text-xs font-mono-meta text-white/60 hover:text-rose-300 transition cursor-pointer"
                  title="Clear day"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>

                {/* 1-Click Apply to Tracker Primary Button */}
                <button
                  onClick={handleApplyDayToTracker}
                  className="pill-btn-accent flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase cursor-pointer active:scale-95 shadow-lg shadow-yellow-500/20"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Apply Day to Tracker</span>
                </button>
              </div>
            </div>

            {/* Macro Telemetry Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
              {/* Energy */}
              <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col justify-between">
                <div className="flex items-center justify-between text-[10px] font-mono-meta text-white/50">
                  <span>ENERGY</span>
                  <span className="text-[#facc15] font-bold">{calPct}%</span>
                </div>
                <div className="text-xl font-bold font-oswald text-white mt-1">
                  {dayTotals.calories} / {targetCal}{' '}
                  <span className="text-[10px] font-normal text-white/40">KCAL</span>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden mt-2">
                  <div
                    className={`h-full transition-all duration-500 ${
                      Math.abs(calPct - 100) <= 5 ? 'bg-emerald-400' : 'bg-[#facc15]'
                    }`}
                    style={{ width: `${Math.min(100, calPct)}%` }}
                  />
                </div>
                <span className="text-[9px] font-mono-meta text-white/40 mt-1">
                  {calDiff > 0 ? `+${calDiff} surplus` : `${calDiff} remaining`}
                </span>
              </div>

              {/* Protein */}
              <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col justify-between">
                <div className="flex items-center justify-between text-[10px] font-mono-meta text-white/50">
                  <span>PROTEIN</span>
                  <span className="text-[#facc15] font-bold">{pPct}%</span>
                </div>
                <div className="text-xl font-bold font-oswald text-yellow-300 mt-1">
                  {dayTotals.protein}g / {targetP}g
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden mt-2">
                  <div
                    className="h-full bg-[#facc15] transition-all duration-500"
                    style={{ width: `${Math.min(100, pPct)}%` }}
                  />
                </div>
                <span className="text-[9px] font-mono-meta text-white/40 mt-1">
                  {userProfile.weightObjective?.preserveMuscleHighProtein !== false ? 'High Muscle Preservation' : 'Balanced'}
                </span>
              </div>

              {/* Carbs */}
              <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col justify-between">
                <div className="flex items-center justify-between text-[10px] font-mono-meta text-white/50">
                  <span>CARBS</span>
                  <span className="text-sky-400 font-bold">{cPct}%</span>
                </div>
                <div className="text-xl font-bold font-oswald text-sky-400 mt-1">
                  {dayTotals.carbs}g / {targetC}g
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden mt-2">
                  <div
                    className="h-full bg-sky-400 transition-all duration-500"
                    style={{ width: `${Math.min(100, cPct)}%` }}
                  />
                </div>
                <span className="text-[9px] font-mono-meta text-white/40 mt-1">
                  Fiber: {dayTotals.fiber}g / {userProfile.targetFiberG || 28}g
                </span>
              </div>

              {/* Fats */}
              <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col justify-between">
                <div className="flex items-center justify-between text-[10px] font-mono-meta text-white/50">
                  <span>FATS</span>
                  <span className="text-emerald-400 font-bold">{fPct}%</span>
                </div>
                <div className="text-xl font-bold font-oswald text-emerald-400 mt-1">
                  {dayTotals.fat}g / {targetF}g
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden mt-2">
                  <div
                    className="h-full bg-emerald-400 transition-all duration-500"
                    style={{ width: `${Math.min(100, fPct)}%` }}
                  />
                </div>
                <span className="text-[9px] font-mono-meta text-white/40 mt-1">
                  Essential lipids
                </span>
              </div>
            </div>
          </div>

          {/* 3. MEAL SLOTS SECTION (BREAKFAST, LUNCH, DINNER, SNACKS) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {slotsMeta.map((slotMeta) => {
              const slot = slotMeta.type;
              const items = activeDay.slots[slot] || [];
              const slotTotal = dayTotals.slotTotals[slot];

              return (
                <div
                  key={slot}
                  className="cinematic-card p-4 flex flex-col justify-between space-y-3 relative overflow-hidden"
                >
                  {/* Slot Header */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{slotMeta.icon}</span>
                      <div>
                        <span className="font-oswald text-base font-bold text-white uppercase tracking-wider">
                          {slotMeta.label}
                        </span>
                        <div className="text-[10px] font-mono-meta text-white/40">
                          {slotMeta.defaultSplit}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-oswald text-base font-bold text-[#facc15]">
                        {slotTotal.calories} <span className="text-[10px] text-white/50 font-normal">KCAL</span>
                      </div>
                      <div className="text-[9px] font-mono-meta text-white/40">
                        {slotTotal.protein}g P • {slotTotal.carbs}g C • {slotTotal.fat}g F
                      </div>
                    </div>
                  </div>

                  {/* Planned Items in this Slot */}
                  <div className="space-y-2 flex-1 min-h-[70px]">
                    {items.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center p-4 border border-dashed border-white/10 rounded-xl text-center text-white/30 text-xs font-mono-meta">
                        <span>No meals scheduled for this slot.</span>
                        <span className="text-[10px] text-white/20 mt-0.5">
                          Add custom dish or pick from saved recipes below.
                        </span>
                      </div>
                    ) : (
                      items.map((item) => (
                        <div
                          key={item.id}
                          className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 transition flex items-center justify-between gap-2 group"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-xs text-white truncate">
                              {item.name}
                            </div>
                            <div className="text-[10px] font-mono-meta text-white/40 flex items-center gap-2 flex-wrap">
                              <span className="text-white/60">{item.portion}</span>
                              <span>•</span>
                              <span className="text-yellow-300 font-bold">{item.calories} kcal</span>
                              <span>•</span>
                              <span>{item.protein}g P</span>
                              <span>•</span>
                              <span>{item.carbs}g C</span>
                              <span>•</span>
                              <span>{item.fat}g F</span>
                            </div>
                          </div>

                          {/* Item Actions */}
                          <div className="flex items-center gap-1 shrink-0">
                            {/* Single item log button */}
                            <button
                              onClick={() => handleApplySingleItem(slot, item)}
                              className="p-1.5 rounded-lg bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-300 text-[10px] font-mono-meta font-bold transition cursor-pointer"
                              title="Log this item to tracker"
                            >
                              <Zap className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete button */}
                            <button
                              onClick={() => handleRemoveItem(slot, item.id)}
                              className="p-1.5 rounded-lg text-white/30 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                              title="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Slot Action Triggers */}
                  <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                    <button
                      onClick={() => {
                        setTargetSlotForAdd(slot);
                        setCustomName('');
                        setIsAddCustomOpen(true);
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-mono-meta text-white/80 hover:text-white transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#facc15]" />
                      <span>+ Custom Dish</span>
                    </button>

                    <button
                      onClick={() => {
                        setTargetSlotForAdd(slot);
                        setIsRecipePickerOpen(true);
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-mono-meta text-white/80 hover:text-white transition cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                      <span>+ Saved Recipe</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* MODAL 1: ADD CUSTOM MEAL ITEM */}
      {isAddCustomOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#141416] border border-white/15 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#18181c]">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#facc15]/10 text-[#facc15] border border-[#facc15]/20">
                  <PlusCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-oswald text-base font-bold text-white uppercase">
                    Add Planned Meal
                  </h3>
                  <p className="text-[10px] font-mono-meta text-white/40">
                    Slot: {targetSlotForAdd.toUpperCase()} • {selectedDate}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddCustomOpen(false)}
                className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCustomItemSubmit} className="p-4 space-y-3.5">
              <div>
                <label className="text-[10px] font-mono-meta text-white/50 uppercase block mb-1">
                  Dish / Food Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lemon Rosemary Grilled Chicken Bowl"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full bg-[#0b0b0c] border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:border-[#facc15] outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono-meta text-white/50 uppercase block mb-1">
                  Portion / Serving Size Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. 200g chicken + 150g sweet potato"
                  value={customPortion}
                  onChange={(e) => setCustomPortion(e.target.value)}
                  className="w-full bg-[#0b0b0c] border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:border-[#facc15] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-mono-meta text-yellow-400 uppercase block mb-1">
                    Calories (kcal)
                  </label>
                  <input
                    type="number"
                    required
                    value={customCal}
                    onChange={(e) => setCustomCal(e.target.value ? Number(e.target.value) : '')}
                    className="w-full bg-[#0b0b0c] border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:border-[#facc15] outline-none text-center"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono-meta text-[#facc15] uppercase block mb-1">
                    Protein (g)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={customP}
                    onChange={(e) => setCustomP(e.target.value ? Number(e.target.value) : '')}
                    className="w-full bg-[#0b0b0c] border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:border-[#facc15] outline-none text-center"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-mono-meta text-sky-400 uppercase block mb-1">
                    Carbs (g)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={customC}
                    onChange={(e) => setCustomC(e.target.value ? Number(e.target.value) : '')}
                    className="w-full bg-[#0b0b0c] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs font-bold text-white focus:border-sky-400 outline-none text-center"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono-meta text-emerald-400 uppercase block mb-1">
                    Fat (g)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={customF}
                    onChange={(e) => setCustomF(e.target.value ? Number(e.target.value) : '')}
                    className="w-full bg-[#0b0b0c] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs font-bold text-white focus:border-emerald-400 outline-none text-center"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono-meta text-teal-400 uppercase block mb-1">
                    Fiber (g)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={customFiber}
                    onChange={(e) => setCustomFiber(e.target.value ? Number(e.target.value) : '')}
                    className="w-full bg-[#0b0b0c] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs font-bold text-white focus:border-teal-400 outline-none text-center"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full pill-btn-accent py-2.5 text-xs font-bold uppercase cursor-pointer"
                >
                  Confirm & Schedule Meal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: SELECT FROM SAVED RECIPES */}
      {isRecipePickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#141416] border border-white/15 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#18181c]">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-oswald text-base font-bold text-white uppercase">
                    Select From Saved Recipes
                  </h3>
                  <p className="text-[10px] font-mono-meta text-white/40">
                    Assign recipe to {targetSlotForAdd.toUpperCase()} on {selectedDate}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsRecipePickerOpen(false)}
                className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-2.5 flex-1">
              {savedRecipes.length === 0 ? (
                <div className="text-center py-8 space-y-3">
                  <BookOpen className="w-10 h-10 text-white/20 mx-auto" />
                  <p className="text-xs font-mono-meta text-white/40">
                    No custom recipes created yet in Recipe Studio.
                  </p>
                  {onOpenRecipeBuilder && (
                    <button
                      onClick={() => {
                        setIsRecipePickerOpen(false);
                        onOpenRecipeBuilder();
                      }}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-oswald text-xs uppercase font-bold transition cursor-pointer"
                    >
                      Open Recipe Builder
                    </button>
                  )}
                </div>
              ) : (
                savedRecipes.map((recipe) => (
                  <div
                    key={recipe.id}
                    onClick={() => handleSelectRecipe(recipe)}
                    className="p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-indigo-500/40 transition cursor-pointer flex items-center justify-between gap-3 group"
                  >
                    <div className="min-w-0 flex-1">
                      <h4 className="font-oswald text-sm font-bold text-white group-hover:text-indigo-300 transition">
                        {recipe.name}
                      </h4>
                      <p className="text-[10px] font-mono-meta text-white/40">
                        {recipe.servings} serving{recipe.servings > 1 ? 's' : ''} • {recipe.ingredients.length} ingredients
                      </p>
                      <div className="flex items-center gap-2 text-[10px] font-mono-meta text-white/60 mt-1">
                        <span className="text-yellow-300 font-bold">{recipe.perServingCalories} kcal</span>
                        <span>•</span>
                        <span>{recipe.perServingProtein}g P</span>
                        <span>•</span>
                        <span>{recipe.perServingCarbs}g C</span>
                        <span>•</span>
                        <span>{recipe.perServingFat}g F</span>
                      </div>
                    </div>

                    <button className="px-3 py-1.5 rounded-xl bg-indigo-500/20 group-hover:bg-indigo-500 group-hover:text-white text-indigo-300 text-xs font-mono-meta font-bold transition">
                      Select
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: COPY DAY TO ANOTHER DAY */}
      {isCopyDayOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#141416] border border-white/15 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#18181c]">
              <div className="flex items-center gap-2">
                <Copy className="w-4 h-4 text-sky-400" />
                <h3 className="font-oswald text-base font-bold text-white uppercase">
                  Copy Day Plan
                </h3>
              </div>
              <button
                onClick={() => setIsCopyDayOpen(false)}
                className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <p className="text-xs font-mono-meta text-white/60">
                Copy all scheduled meals from <strong>{selectedDate}</strong> to:
              </p>

              <div className="space-y-1.5">
                {weekDays
                  .filter((w) => w.date !== selectedDate)
                  .map((wd) => (
                    <button
                      key={wd.date}
                      onClick={() => setCopyTargetDate(wd.date)}
                      className={`w-full p-2.5 rounded-xl border text-xs font-mono-meta flex items-center justify-between transition cursor-pointer ${
                        copyTargetDate === wd.date
                          ? 'bg-sky-500/20 border-sky-500 text-white font-bold'
                          : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      <span>{wd.dayOfWeek} ({wd.date})</span>
                      {copyTargetDate === wd.date && <Check className="w-4 h-4 text-sky-400" />}
                    </button>
                  ))}
              </div>

              <div className="pt-2">
                <button
                  onClick={handleCopyDaySubmit}
                  disabled={!copyTargetDate}
                  className="w-full pill-btn-accent py-2.5 text-xs font-bold uppercase cursor-pointer disabled:opacity-40"
                >
                  Confirm & Copy Meals
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
