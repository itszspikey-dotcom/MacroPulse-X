import React, { useState } from 'react';
import {
  Sparkles,
  Settings,
  Palette,
  Plus,
  QrCode,
  Zap,
  ChevronLeft,
  ChevronRight,
  Check,
  ChevronDown,
  Trash2,
  Edit2,
  Search,
} from 'lucide-react';
import { TrackerLayoutProps } from './CommandDockLayout';
import { MealType } from '../../types/nutrition';
import { MobileBottomNav } from '../MobileBottomNav';

export const DenseHudLayout: React.FC<TrackerLayoutProps> = (props) => {
  const {
    currentDate,
    onDateChange,
    userProfile,
    dailySummary,
    allProfiles,
    onSwitchProfile,
    activeTab,
    setActiveTab,
    onOpenSearch,
    onOpenBarcode,
    onOpenAiScan,
    onOpenQuickAdd,
    onEditItem,
    onDeleteItem,
    onOpenGoalsModal,
    onOpenThemeModal,
    onOpenAiAdvisor,
    onOpenRecipeBuilder,
    onOpenWeightObjectiveModal,
    onAddWater,
    onResetWater,
  } = props;

  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [selectedMealFilter, setSelectedMealFilter] = useState<'all' | MealType>('all');

  const todayStr = new Date().toISOString().split('T')[0];
  const isToday = currentDate === todayStr;

  const handlePrevDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 1);
    onDateChange(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 1);
    onDateChange(d.toISOString().split('T')[0]);
  };

  // Metrics
  const targetCal = userProfile.targetCalories || 2000;
  const consumedCal = dailySummary.calories || 0;
  const remainingCal = targetCal - consumedCal;
  const calPct = Math.min(100, Math.round((consumedCal / targetCal) * 100)) || 0;

  const pTarget = userProfile.targetProteinG || 160;
  const pConsumed = dailySummary.protein || 0;
  const pPct = Math.min(100, Math.round((pConsumed / pTarget) * 100)) || 0;

  const cTarget = userProfile.targetCarbsG || 220;
  const cConsumed = dailySummary.carbs || 0;
  const cPct = Math.min(100, Math.round((cConsumed / cTarget) * 100)) || 0;

  const fTarget = userProfile.targetFatG || 65;
  const fConsumed = dailySummary.fat || 0;
  const fPct = Math.min(100, Math.round((fConsumed / fTarget) * 100)) || 0;

  const wTarget = userProfile.targetWaterMl || 2500;
  const wConsumed = dailySummary.waterMl || 0;
  const wPct = Math.min(100, Math.round((wConsumed / wTarget) * 100)) || 0;

  const loggedItems = dailySummary.loggedItems || [];
  const filteredLogs = selectedMealFilter === 'all'
    ? loggedItems
    : loggedItems.filter((f) => f.mealType === selectedMealFilter);

  return (
    <div className="flex flex-col h-screen w-full bg-[#070708] text-white font-geist overflow-hidden relative select-none">
      <div className="ambient-bg" />

      {/* 1. ULTRA-COMPACT TELEMETRY TOP BAR */}
      <header className="border-b border-white/10 bg-[#0b0b0c] px-3 sm:px-4 py-2.5 pt-safe shrink-0 z-30 flex items-center justify-between gap-2 sm:gap-3 flex-wrap">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center font-oswald text-black font-extrabold text-xs">
            MP
          </div>
          <div>
            <span className="font-oswald text-xs sm:text-sm font-bold tracking-widest text-[#facc15] block">
              DENSE HUD
            </span>
          </div>

          {/* Profile Switcher */}
          <div className="relative">
            <button
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono-meta cursor-pointer active:scale-95"
            >
              <span className="text-white font-bold max-w-[70px] sm:max-w-none truncate">{userProfile.name}</span>
              <ChevronDown className="w-3 h-3 text-white/40" />
            </button>

            {isProfileDropdownOpen && (
              <div className="absolute left-0 mt-2 w-52 rounded-xl bg-[#141416] border border-white/15 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl">
                <div className="px-3 py-1 font-mono-meta text-[10px] text-white/40 uppercase">
                  Select Athlete
                </div>
                {allProfiles.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onSwitchProfile(p);
                      setIsProfileDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-xs transition cursor-pointer text-left ${
                      p.id === userProfile.id ? 'bg-white/10 text-white font-bold' : 'text-white/60 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span className="truncate">{p.name}</span>
                    {p.id === userProfile.id && <Check className="w-3 h-3 text-[#facc15]" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Date Navigator & Fast Action Strip */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 max-w-full">
          <div className="flex items-center gap-1 bg-[#141416] px-1.5 py-0.5 rounded-lg border border-white/10 shrink-0">
            <button
              onClick={handlePrevDay}
              className="p-1 text-white/60 hover:text-white rounded hover:bg-white/10 transition cursor-pointer active:scale-90"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="font-semibold text-white text-xs px-1.5 font-mono-meta">
              {new Date(currentDate + 'T00:00:00').toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </span>
            <button
              onClick={handleNextDay}
              className="p-1 text-white/60 hover:text-white rounded hover:bg-white/10 transition cursor-pointer active:scale-90"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {!isToday && (
            <button
              onClick={() => onDateChange(todayStr)}
              className="px-2 py-0.5 text-[10px] bg-[#facc15]/10 border border-[#facc15]/30 text-[#facc15] rounded font-bold uppercase hover:bg-[#facc15]/20 transition cursor-pointer active:scale-95 shrink-0"
            >
              Today
            </button>
          )}

          {/* Fast Action Strip */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => onOpenBarcode('breakfast')}
              className="flex items-center gap-1 px-2.5 py-1 bg-[#141416] hover:bg-white/10 border border-white/10 rounded-lg text-xs font-mono-meta transition cursor-pointer active:scale-95"
            >
              <QrCode className="w-3.5 h-3.5 text-[#facc15]" />
              <span>SCAN</span>
            </button>
            <button
              onClick={() => onOpenAiScan('breakfast')}
              className="flex items-center gap-1 px-2.5 py-1 bg-[#141416] hover:bg-white/10 border border-white/10 rounded-lg text-xs font-mono-meta transition cursor-pointer active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>AI SNAP</span>
            </button>
            <button
              onClick={() => onOpenQuickAdd('breakfast')}
              className="flex items-center gap-1 px-2.5 py-1 bg-[#141416] hover:bg-white/10 border border-white/10 rounded-lg text-xs font-mono-meta transition cursor-pointer active:scale-95"
            >
              <Zap className="w-3.5 h-3.5 text-sky-400" />
              <span>QUICK</span>
            </button>
            <button
              onClick={onOpenThemeModal}
              className="p-1.5 rounded-lg bg-[#141416] hover:bg-white/10 border border-white/10 text-sky-400 transition cursor-pointer active:scale-95"
              title="Themes"
            >
              <Palette className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onOpenSearch('breakfast')}
              className="pill-btn-accent flex items-center gap-1 px-3 py-1 text-xs font-bold cursor-pointer active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>ADD</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. DENSE HORIZONTAL PROGRESS STRIP (Zero Scroll Top HUD) */}
      <div className="bg-[#0f0f12] border-b border-white/10 px-4 py-3 shrink-0 grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-2 rounded-lg bg-black/40 border border-white/10">
          <div className="flex items-center justify-between text-[10px] font-mono-meta text-white/50 mb-1">
            <span>ENERGY (KCAL)</span>
            <span className="text-[#facc15] font-bold">{calPct}%</span>
          </div>
          <div className="text-xs font-bold font-oswald text-white flex items-center justify-between">
            <span>{consumedCal} / {targetCal}</span>
            <span className="text-[10px] text-white/40 font-mono-meta">
              {remainingCal >= 0 ? `${remainingCal} left` : `+${Math.abs(remainingCal)}`}
            </span>
          </div>
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden mt-1.5">
            <div className="h-full bg-[#facc15]" style={{ width: `${calPct}%` }} />
          </div>
        </div>

        <div className="p-2 rounded-lg bg-black/40 border border-white/10">
          <div className="flex items-center justify-between text-[10px] font-mono-meta text-white/50 mb-1">
            <span>PROTEIN (P)</span>
            <span className="text-[#facc15] font-bold">{pPct}%</span>
          </div>
          <div className="text-xs font-bold font-oswald text-white flex items-center justify-between">
            <span>{pConsumed}g / {pTarget}g</span>
            <span className="text-[10px] text-white/40 font-mono-meta">{pTarget - pConsumed}g rem</span>
          </div>
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden mt-1.5">
            <div className="h-full bg-[#facc15]" style={{ width: `${pPct}%` }} />
          </div>
        </div>

        <div className="p-2 rounded-lg bg-black/40 border border-white/10">
          <div className="flex items-center justify-between text-[10px] font-mono-meta text-white/50 mb-1">
            <span>CARBS (C)</span>
            <span className="text-sky-400 font-bold">{cPct}%</span>
          </div>
          <div className="text-xs font-bold font-oswald text-white flex items-center justify-between">
            <span>{cConsumed}g / {cTarget}g</span>
            <span className="text-[10px] text-white/40 font-mono-meta">{cTarget - cConsumed}g rem</span>
          </div>
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden mt-1.5">
            <div className="h-full bg-sky-400" style={{ width: `${cPct}%` }} />
          </div>
        </div>

        <div className="p-2 rounded-lg bg-black/40 border border-white/10">
          <div className="flex items-center justify-between text-[10px] font-mono-meta text-white/50 mb-1">
            <span>FATS (F)</span>
            <span className="text-emerald-400 font-bold">{fPct}%</span>
          </div>
          <div className="text-xs font-bold font-oswald text-white flex items-center justify-between">
            <span>{fConsumed}g / {fTarget}g</span>
            <span className="text-[10px] text-white/40 font-mono-meta">{fTarget - fConsumed}g rem</span>
          </div>
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden mt-1.5">
            <div className="h-full bg-emerald-400" style={{ width: `${fPct}%` }} />
          </div>
        </div>

        <div className="p-2 rounded-lg bg-black/40 border border-white/10 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-[10px] font-mono-meta text-white/50 mb-1">
            <span>WATER (H2O)</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onAddWater(250)}
                className="text-[9px] text-cyan-300 hover:underline cursor-pointer"
              >
                +250ml
              </button>
              <span>•</span>
              <button
                onClick={onResetWater}
                className="text-[9px] text-white/40 hover:text-white cursor-pointer"
              >
                0
              </button>
            </div>
          </div>
          <div className="text-xs font-bold font-oswald text-cyan-300 flex items-center justify-between">
            <span>{(wConsumed / 1000).toFixed(2)}L / {(wTarget / 1000).toFixed(1)}L</span>
            <span className="text-[10px] text-cyan-400 font-mono-meta">{wPct}%</span>
          </div>
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden mt-1.5">
            <div className="h-full bg-cyan-400" style={{ width: `${wPct}%` }} />
          </div>
        </div>
      </div>

      {/* 3. DENSE MEAL TABLE VIEW */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-20 ios-scroll">
        <div className="max-w-7xl mx-auto space-y-4">
          {/* Filter Bar */}
          <div className="flex items-center justify-between gap-3 flex-wrap bg-[#141416] p-2.5 rounded-xl border border-white/10">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {(['all', 'breakfast', 'lunch', 'dinner', 'snack'] as const).map((meal) => (
                <button
                  key={meal}
                  onClick={() => setSelectedMealFilter(meal)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono-meta font-bold uppercase transition cursor-pointer ${
                    selectedMealFilter === meal
                      ? 'bg-white/20 text-white'
                      : 'text-white/40 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {meal}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono-meta text-white/40">
                {filteredLogs.length} Logged Items
              </span>
              <button
                onClick={() => onOpenQuickAdd('breakfast')}
                className="px-3 py-1 rounded-lg bg-[#facc15]/10 text-[#facc15] border border-[#facc15]/30 text-xs font-mono-meta font-bold hover:bg-[#facc15]/20 transition cursor-pointer"
              >
                + Inline Quick Entry
              </button>
            </div>
          </div>

          {/* ITEM TABLE */}
          {filteredLogs.length === 0 ? (
            <div className="cinematic-card p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 mx-auto flex items-center justify-center text-white/30">
                <Search className="w-6 h-6" />
              </div>
              <div className="font-oswald text-lg text-white font-bold uppercase">
                No items logged for this filter
              </div>
              <p className="text-xs text-white/40 max-w-sm mx-auto">
                Log a food item with barcode scan, AI photo estimation, database search, or quick macro entry.
              </p>
              <button
                onClick={() => onOpenSearch('breakfast')}
                className="pill-btn-accent px-4 py-2 text-xs font-bold uppercase cursor-pointer mt-2"
              >
                + Add First Food
              </button>
            </div>
          ) : (
            <div className="cinematic-card overflow-hidden border border-white/10">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/10 bg-black/40 font-mono-meta text-[11px] text-white/50 uppercase">
                      <th className="p-3">Meal</th>
                      <th className="p-3">Food Item & Brand</th>
                      <th className="p-3 text-right">Portion</th>
                      <th className="p-3 text-right">Calories</th>
                      <th className="p-3 text-right">Protein</th>
                      <th className="p-3 text-right">Carbs</th>
                      <th className="p-3 text-right">Fat</th>
                      <th className="p-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredLogs.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-white/[0.03] transition group"
                      >
                        <td className="p-3 font-mono-meta uppercase font-bold text-white/70">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] ${
                              item.mealType === 'breakfast'
                                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                : item.mealType === 'lunch'
                                ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                                : item.mealType === 'dinner'
                                ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                                : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            }`}
                          >
                            {item.mealType}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-white group-hover:text-yellow-200 transition">
                            {item.foodName}
                          </div>
                          {item.brand && (
                            <div className="text-[10px] text-white/40">
                              {item.brand}
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-right font-mono-meta text-white/70">
                          {item.servingAmount} {item.servingUnit} ({item.servingGramWeight}g)
                        </td>
                        <td className="p-3 text-right font-mono-meta font-bold text-[#facc15]">
                          {item.calories} kcal
                        </td>
                        <td className="p-3 text-right font-mono-meta text-white/80">
                          {item.protein}g
                        </td>
                        <td className="p-3 text-right font-mono-meta text-white/80">
                          {item.carbs}g
                        </td>
                        <td className="p-3 text-right font-mono-meta text-white/80">
                          {item.fat}g
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => onEditItem(item)}
                              className="p-1.5 rounded hover:bg-white/10 text-white/40 hover:text-white transition cursor-pointer"
                              title="Edit item"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteItem(item.id)}
                              className="p-1.5 rounded hover:bg-rose-500/20 text-white/40 hover:text-rose-400 transition cursor-pointer"
                              title="Delete item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-3 bg-black/40 border-t border-white/10 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono-meta text-white/40 uppercase">
                    Quick Log To:
                  </span>
                  {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => onOpenSearch(m)}
                      className="text-[11px] font-mono-meta uppercase px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition cursor-pointer"
                    >
                      + {m}
                    </button>
                  ))}
                </div>

                <button
                  onClick={onOpenRecipeBuilder}
                  className="text-xs font-mono-meta text-sky-400 hover:underline cursor-pointer"
                >
                  Recipe Builder Studio →
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAiAdvisor={onOpenAiAdvisor || (() => {})}
        onOpenRecipeBuilder={onOpenRecipeBuilder || (() => {})}
        onOpenThemeModal={onOpenThemeModal}
        onOpenGoalsModal={onOpenGoalsModal}
        onOpenWeightObjectiveModal={onOpenWeightObjectiveModal}
        userProfile={userProfile}
      />
    </div>
  );
};
