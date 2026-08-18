import React, { useState } from 'react';
import {
  BarChart3,
  Settings,
  Palette,
  Plus,
  ChevronLeft,
  ChevronRight,
  Droplets,
  RotateCcw,
  Check,
  ChevronDown,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { TrackerLayoutProps } from './CommandDockLayout';
import { MealSection } from '../MealSection';
import { MobileBottomNav } from '../MobileBottomNav';

export const SplitWorkspaceLayout: React.FC<TrackerLayoutProps> = (props) => {
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

      {/* TOP COMPACT HEADER */}
      <header className="border-b border-white/10 bg-[#0b0b0c]/95 backdrop-blur-xl px-3 sm:px-6 py-2.5 sm:py-3 pt-safe shrink-0 z-30 flex items-center justify-between gap-2 sm:gap-3 flex-wrap">
        <div className="flex items-center gap-2.5 sm:gap-4">
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center font-oswald text-black font-extrabold text-sm">
              MP
            </div>
            <div className="hidden sm:block">
              <span className="font-oswald text-base font-bold tracking-widest text-[#facc15] block">
                SPLIT WORKSPACE
              </span>
              <span className="text-[9px] font-mono-meta text-white/40 block">
                50/50 DUAL STUDIO
              </span>
            </div>
          </div>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              className="flex items-center gap-1.5 sm:gap-2 p-1.5 pr-2.5 rounded-xl bg-[#141416] hover:bg-white/10 border border-white/10 transition cursor-pointer active:scale-95"
            >
              <div
                className="w-5 h-5 rounded flex items-center justify-center font-oswald text-[10px] font-bold shrink-0"
                style={{ backgroundColor: `${avatarColor}25`, color: avatarColor }}
              >
                {initials}
              </div>
              <span className="font-oswald text-xs font-bold text-white uppercase truncate max-w-[80px]">
                {userProfile.name}
              </span>
              <ChevronDown className="w-3 h-3 text-white/40" />
            </button>

            {isProfileDropdownOpen && (
              <div className="absolute left-0 mt-2 w-52 rounded-2xl bg-[#141416] border border-white/15 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl">
                <div className="px-3 py-1 font-mono-meta text-[10px] text-white/40 uppercase">
                  Athletes
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
        </div>

        {/* Date Navigator & Quick Toolbar */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 max-w-full">
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

          {/* Quick Toolbar */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={() => setActiveTab(activeTab === 'tracker' ? 'analytics' : 'tracker')}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold font-oswald uppercase transition cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                activeTab === 'analytics'
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                  : 'bg-[#141416] border-white/10 text-white/70 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{activeTab === 'tracker' ? 'Analytics' : 'Tracker'}</span>
            </button>

            <button
              onClick={onOpenThemeModal}
              className="p-2 rounded-xl bg-[#141416] hover:bg-white/10 border border-white/10 text-sky-400 transition cursor-pointer active:scale-95"
              title="Themes & Layouts"
            >
              <Palette className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenGoalsModal}
              className="p-2 rounded-xl bg-[#141416] hover:bg-white/10 border border-white/10 text-slate-300 transition cursor-pointer active:scale-95"
              title="Goals"
            >
              <Settings className="w-4 h-4" />
            </button>

            <button
              onClick={() => onOpenSearch('breakfast')}
              className="pill-btn-accent flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-1.5 text-xs font-bold cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Meal</span>
            </button>
          </div>
        </div>
      </header>

      {/* 50/50 FIXED SPLIT SCREEN WORKSPACE */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 p-4 sm:p-6 overflow-hidden">
        {/* LEFT 50%: FIXED BIOMETRIC COCKPIT */}
        <div className="h-full overflow-y-auto ios-scroll space-y-4 pr-0 lg:pr-2">
          {/* Caloric Hero Panel */}
          <div className="cinematic-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-mono-meta text-xs text-white/50 uppercase">
                CALORIC COCKPIT
              </span>
              <span className="theme-accent-badge text-[10px] font-mono-meta font-bold px-2 py-0.5 rounded">
                {calPct}% KCAL
              </span>
            </div>

            <div className="flex items-center justify-around gap-4 py-2">
              <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r="48"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth="10"
                    fill="none"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="48"
                    stroke="var(--accent)"
                    strokeWidth="10"
                    strokeDasharray={2 * Math.PI * 48}
                    strokeDashoffset={2 * Math.PI * 48 * (1 - calPct / 100)}
                    strokeLinecap="round"
                    fill="none"
                    className="transition-all duration-700"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="font-oswald text-2xl font-bold text-white">
                    {remainingCal >= 0 ? remainingCal : `+${Math.abs(remainingCal)}`}
                  </span>
                  <span className="text-[9px] font-mono-meta text-white/40 uppercase">
                    {remainingCal >= 0 ? 'Remaining' : 'Surplus'}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <div className="text-[10px] font-mono-meta text-white/40">CONSUMED ENERGY</div>
                  <div className="font-oswald text-xl font-bold text-yellow-300">{consumedCal} KCAL</div>
                </div>
                <div>
                  <div className="text-[10px] font-mono-meta text-white/40">DAILY TARGET</div>
                  <div className="font-oswald text-base font-bold text-white/70">{targetCal} KCAL</div>
                </div>
                {userProfile.weightObjective && (
                  <div className="text-[10px] font-mono-meta text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded border border-yellow-400/20">
                    Deficit: -{userProfile.weightObjective.dailyCaloricDeficit} kcal
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Macro Progress Gauges */}
          <div className="cinematic-card p-5 space-y-4">
            <div className="flex items-center justify-between font-mono-meta text-xs text-white/50 uppercase">
              <span>TARGET GAUGES</span>
              <button
                onClick={onOpenGoalsModal}
                className="text-[#facc15] hover:underline cursor-pointer font-bold"
              >
                EDIT GOALS →
              </button>
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono-meta mb-1">
                <span className="text-white/60">Protein ({pRatio}% kcal)</span>
                <span className="text-[#facc15] font-bold">{pConsumed}g / {pTarget}g</span>
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
                <span className="text-sky-400 font-bold">{cConsumed}g / {cTarget}g</span>
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
                <span className="text-emerald-400 font-bold">{fConsumed}g / {fTarget}g</span>
              </div>
              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400 transition-all duration-500"
                  style={{ width: `${fPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Interactive Hydration & Streak */}
          <div className="cinematic-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-mono-meta text-xs text-white/50 uppercase">
                <Droplets className="w-4 h-4 text-cyan-400" />
                <span>HYDRATION STATION</span>
              </div>
              <button
                onClick={onResetWater}
                className="p-1 text-white/40 hover:text-white transition cursor-pointer"
                title="Reset"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-oswald text-2xl font-bold text-cyan-300">
                  {(wConsumed / 1000).toFixed(2)} L
                </div>
                <div className="text-[10px] font-mono-meta text-white/40">
                  Target: {(wTarget / 1000).toFixed(1)} L ({wPct}%)
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onAddWater(250)}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition cursor-pointer"
                >
                  +250ml
                </button>
                <button
                  onClick={() => onAddWater(500)}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition cursor-pointer"
                >
                  +500ml
                </button>
              </div>
            </div>

            <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-400 transition-all duration-500"
                style={{ width: `${wPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* RIGHT 50%: DEDICATED SCROLLABLE MEAL LOGGER WORKSPACE */}
        <div className="h-full overflow-y-auto ios-scroll space-y-4 pl-0 lg:pl-2 pb-20">
          <div className="flex items-center justify-between font-mono-meta text-xs text-white/40 pb-2 border-b border-white/10 sticky top-0 bg-[#0b0b0c]/90 backdrop-blur-md z-10 py-1">
            <span>TIMELINE & FOOD LOGS</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenQuickAdd('breakfast')}
                className="text-[#facc15] hover:underline cursor-pointer"
              >
                + Quick Add
              </button>
              <span>•</span>
              <button
                onClick={() => onOpenBarcode('breakfast')}
                className="text-white/60 hover:text-white cursor-pointer"
              >
                Scan
              </button>
              <span>•</span>
              <button
                onClick={() => onOpenAiScan('breakfast')}
                className="text-white/60 hover:text-white cursor-pointer"
              >
                AI Snap
              </button>
            </div>
          </div>

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
