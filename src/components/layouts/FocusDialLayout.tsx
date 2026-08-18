import React, { useState } from 'react';
import {
  BarChart3,
  Sparkles,
  Settings,
  Palette,
  Plus,
  QrCode,
  Zap,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Flame,
  Check,
  BookOpen,
} from 'lucide-react';
import { TrackerLayoutProps } from './CommandDockLayout';
import { MealSection } from '../MealSection';
import { MobileBottomNav } from '../MobileBottomNav';

export const FocusDialLayout: React.FC<TrackerLayoutProps> = (props) => {
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

  const [activeSubTab, setActiveSubTab] = useState<'macros' | 'hydration'>('macros');
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

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
  const pRatio = consumedCal > 0 ? Math.round(((pConsumed * 4) / consumedCal) * 100) : 0;

  const cTarget = userProfile.targetCarbsG || 220;
  const cConsumed = dailySummary.carbs || 0;
  const cPct = Math.min(100, Math.round((cConsumed / cTarget) * 100)) || 0;
  const cRatio = consumedCal > 0 ? Math.round(((cConsumed * 4) / consumedCal) * 100) : 0;

  const fTarget = userProfile.targetFatG || 65;
  const fConsumed = dailySummary.fat || 0;
  const fPct = Math.min(100, Math.round((fConsumed / fTarget) * 100)) || 0;
  const fRatio = consumedCal > 0 ? Math.round(((fConsumed * 9) / consumedCal) * 100) : 0;

  const wTarget = userProfile.targetWaterMl || 2500;
  const wConsumed = dailySummary.waterMl || 0;
  const wPct = Math.min(100, Math.round((wConsumed / wTarget) * 100)) || 0;

  const loggedItems = dailySummary.loggedItems || [];
  const breakfastItems = loggedItems.filter((f) => f.mealType === 'breakfast');
  const lunchItems = loggedItems.filter((f) => f.mealType === 'lunch');
  const dinnerItems = loggedItems.filter((f) => f.mealType === 'dinner');
  const snackItems = loggedItems.filter((f) => f.mealType === 'snack');

  const avatarColor = userProfile.avatarColor || '#facc15';
  const initials =
    userProfile.avatarInitials ||
    userProfile.name
      .split(' ')
      .filter(Boolean)
      .map((p) => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() ||
    'MP';

  return (
    <div className="flex flex-col h-screen w-full bg-[#0b0b0c] text-white font-geist overflow-hidden relative select-none">
      <div className="ambient-bg" />

      {/* TOP MINIMAL BAR */}
      <header className="border-b border-white/10 bg-[#0b0b0c]/90 backdrop-blur-xl px-3 sm:px-6 py-2.5 sm:py-3 pt-safe shrink-0 z-30 flex items-center justify-between gap-2 sm:gap-3 flex-wrap">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center font-oswald text-black font-extrabold text-sm">
            MP
          </div>
          <div>
            <span className="font-oswald text-sm sm:text-base font-bold tracking-widest text-[#facc15] block">
              FOCUS DIAL
            </span>
            <span className="text-[9px] font-mono-meta text-white/40 block">
              SINGLE-COLUMN HERO
            </span>
          </div>
        </div>

        {/* Date Navigator */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1 bg-[#141416] p-1 rounded-xl border border-white/10 shrink-0">
            <button
              onClick={handlePrevDay}
              className="p-1 text-white/60 hover:text-white rounded hover:bg-white/10 transition cursor-pointer active:scale-90"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-white text-xs sm:text-sm px-1.5 sm:px-2 font-mono-meta">
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
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {!isToday && (
            <button
              onClick={() => onDateChange(todayStr)}
              className="px-2 sm:px-2.5 py-1 text-[10px] sm:text-[11px] bg-[#facc15]/10 border border-[#facc15]/30 text-[#facc15] rounded-lg font-bold uppercase hover:bg-[#facc15]/20 transition cursor-pointer active:scale-95 shrink-0"
            >
              Today
            </button>
          )}
        </div>

        {/* Right Switchers */}
        <div className="flex items-center gap-2">
          {/* Profile Switcher */}
          <div className="relative">
            <button
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              className="w-8 h-8 rounded-lg flex items-center justify-center font-oswald text-xs font-bold shrink-0 border cursor-pointer active:scale-95"
              style={{
                backgroundColor: `${avatarColor}20`,
                borderColor: avatarColor,
                color: avatarColor,
              }}
              title={userProfile.name}
            >
              {initials}
            </button>

            {isProfileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-[#141416] border border-white/15 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl">
                <div className="px-3 py-1 font-mono-meta text-[10px] text-white/40 uppercase">
                  Active Athlete
                </div>
                {allProfiles.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onSwitchProfile(p);
                      setIsProfileDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition cursor-pointer text-left ${
                      p.id === userProfile.id ? 'bg-white/10 text-white font-bold' : 'text-white/60 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span className="truncate">{p.name}</span>
                    {p.id === userProfile.id && <Check className="w-3.5 h-3.5 text-[#facc15]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tab Switcher */}
          <button
            onClick={() => setActiveTab(activeTab === 'tracker' ? 'analytics' : 'tracker')}
            className={`p-2 rounded-xl border transition cursor-pointer active:scale-95 ${
              activeTab === 'analytics'
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                : 'bg-[#141416] border-white/10 text-white/60 hover:text-white'
            }`}
            title="Toggle Analytics View"
          >
            <BarChart3 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* SINGLE-COLUMN SCROLLABLE FEED */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 pb-32 ios-scroll">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* GIANT CENTRAL CALORIE HERO DIAL */}
          <div className="cinematic-card p-6 flex flex-col items-center justify-center relative overflow-hidden text-center">
            <div className="flex items-center justify-between w-full mb-2">
              <div className="flex items-center gap-1.5 font-mono-meta text-xs text-white/40 uppercase">
                <span>FOCUS ENERGY DIAL</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono-meta text-amber-400 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" />
                  {userProfile.streakDays || 1}d Streak
                </span>
              </div>
            </div>

            {/* Giant Radial Gauge */}
            <div className="relative w-56 h-56 my-2 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                <circle
                  cx="80"
                  cy="80"
                  r="66"
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="14"
                  fill="none"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="66"
                  stroke="var(--accent)"
                  strokeWidth="14"
                  strokeDasharray={2 * Math.PI * 66}
                  strokeDashoffset={2 * Math.PI * 66 * (1 - calPct / 100)}
                  strokeLinecap="round"
                  fill="none"
                  className="transition-all duration-700 ease-out"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[11px] font-mono-meta text-white/40 uppercase tracking-wider">
                  {remainingCal >= 0 ? 'Remaining Energy' : 'Energy Surplus'}
                </span>
                <div className="font-oswald text-4xl sm:text-5xl font-bold tracking-tight text-white my-1">
                  {remainingCal >= 0 ? remainingCal : `+${Math.abs(remainingCal)}`}
                </div>
                <span className="font-mono-meta text-xs text-yellow-400 font-semibold">
                  {consumedCal} / {targetCal} KCAL ({calPct}%)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono-meta text-white/60 mt-1">
              <span>Goal: {targetCal} kcal</span>
              <span>•</span>
              <button
                onClick={onOpenGoalsModal}
                className="text-[#facc15] hover:underline cursor-pointer font-bold"
              >
                Adjust Targets →
              </button>
            </div>
          </div>

          {/* TABBED MINI CARD FOR MACROS & HYDRATION */}
          <div className="cinematic-card p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveSubTab('macros')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono-meta font-bold transition cursor-pointer ${
                    activeSubTab === 'macros'
                      ? 'bg-white/15 text-white border border-white/20'
                      : 'text-white/40 hover:text-white'
                  }`}
                >
                  MACROS BREAKDOWN
                </button>
                <button
                  onClick={() => setActiveSubTab('hydration')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono-meta font-bold transition cursor-pointer ${
                    activeSubTab === 'hydration'
                      ? 'bg-white/15 text-white border border-white/20'
                      : 'text-white/40 hover:text-white'
                  }`}
                >
                  HYDRATION & WATER
                </button>
              </div>

              <span className="text-[10px] font-mono-meta text-white/40">
                {activeSubTab === 'macros' ? 'P / C / F RATIO' : `${wPct}% COMPLETED`}
              </span>
            </div>

            {activeSubTab === 'macros' ? (
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs font-mono-meta mb-1">
                    <span className="text-white/60">Protein ({pRatio}% kcal)</span>
                    <span className="text-[#facc15] font-bold">{pConsumed}g / {pTarget}g ({pPct}%)</span>
                  </div>
                  <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#facc15] transition-all duration-500"
                      style={{ width: `${pPct}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-mono-meta mb-1">
                    <span className="text-white/60">Carbs ({cRatio}% kcal)</span>
                    <span className="text-sky-400 font-bold">{cConsumed}g / {cTarget}g ({cPct}%)</span>
                  </div>
                  <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sky-400 transition-all duration-500"
                      style={{ width: `${cPct}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-mono-meta mb-1">
                    <span className="text-white/60">Fats ({fRatio}% kcal)</span>
                    <span className="text-emerald-400 font-bold">{fConsumed}g / {fTarget}g ({fPct}%)</span>
                  </div>
                  <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 transition-all duration-500"
                      style={{ width: `${fPct}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-oswald text-2xl font-bold text-cyan-300">
                      {(wConsumed / 1000).toFixed(2)} L
                    </div>
                    <div className="text-[10px] font-mono-meta text-white/40">
                      Target: {(wTarget / 1000).toFixed(1)} L
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onAddWater(250)}
                      className="px-3 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition cursor-pointer"
                    >
                      +250ml
                    </button>
                    <button
                      onClick={() => onAddWater(500)}
                      className="px-3 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition cursor-pointer"
                    >
                      +500ml
                    </button>
                    <button
                      onClick={onResetWater}
                      className="p-1.5 text-white/40 hover:text-white transition cursor-pointer"
                      title="Reset"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="h-2.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-400 transition-all duration-500"
                    style={{ width: `${wPct}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* MEAL TIMELINE FEED */}
          <div className="space-y-4 pt-2">
            <MealSection
              mealType="breakfast"
              items={breakfastItems}
              onOpenSearch={onOpenSearch}
              onOpenBarcode={onOpenBarcode}
              onOpenAiScan={onOpenAiScan}
              onOpenQuickAdd={onOpenQuickAdd}
              onEditItem={onEditItem}
              onDeleteItem={onDeleteItem}
            />

            <MealSection
              mealType="lunch"
              items={lunchItems}
              onOpenSearch={onOpenSearch}
              onOpenBarcode={onOpenBarcode}
              onOpenAiScan={onOpenAiScan}
              onOpenQuickAdd={onOpenQuickAdd}
              onEditItem={onEditItem}
              onDeleteItem={onDeleteItem}
            />

            <MealSection
              mealType="dinner"
              items={dinnerItems}
              onOpenSearch={onOpenSearch}
              onOpenBarcode={onOpenBarcode}
              onOpenAiScan={onOpenAiScan}
              onOpenQuickAdd={onOpenQuickAdd}
              onEditItem={onEditItem}
              onDeleteItem={onDeleteItem}
            />

            <MealSection
              mealType="snack"
              items={snackItems}
              onOpenSearch={onOpenSearch}
              onOpenBarcode={onOpenBarcode}
              onOpenAiScan={onOpenAiScan}
              onOpenQuickAdd={onOpenQuickAdd}
              onEditItem={onEditItem}
              onDeleteItem={onDeleteItem}
            />
          </div>
        </div>
      </main>

      {/* STICKY BOTTOM FLOATING ACTION DOCK PILL (DESKTOP) */}
      <div className="hidden md:flex fixed bottom-5 inset-x-0 items-center justify-center z-40 px-4 pointer-events-none">
        <div className="bg-[#141416]/95 backdrop-blur-2xl border border-white/20 p-2 rounded-full shadow-2xl flex items-center gap-2 pointer-events-auto max-w-lg">
          <button
            onClick={() => onOpenSearch('breakfast')}
            className="pill-btn-accent flex items-center gap-1.5 px-4 py-2 text-xs font-bold cursor-pointer rounded-full"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Meal</span>
          </button>

          <button
            onClick={() => onOpenBarcode('breakfast')}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            title="Scan Barcode"
          >
            <QrCode className="w-4 h-4 text-[#facc15]" />
          </button>

          <button
            onClick={() => onOpenAiScan('breakfast')}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            title="AI Snap"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
          </button>

          <button
            onClick={() => onOpenQuickAdd('breakfast')}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            title="Quick Add"
          >
            <Zap className="w-4 h-4 text-sky-400" />
          </button>

          <button
            onClick={onOpenThemeModal}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            title="Layouts & Themes"
          >
            <Palette className="w-4 h-4 text-emerald-400" />
          </button>

          <button
            onClick={onOpenGoalsModal}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            title="Goals & Targets"
          >
            <Settings className="w-4 h-4 text-slate-300" />
          </button>
        </div>
      </div>

      {/* MOBILE BOTTOM NAVIGATION TAB BAR (< 768px) */}
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
