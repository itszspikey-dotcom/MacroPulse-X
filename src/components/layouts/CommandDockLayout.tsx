import React, { useState } from 'react';
import {
  LayoutDashboard,
  BarChart3,
  Sparkles,
  BookOpen,
  Settings,
  Scale,
  Palette,
  ArrowUpDown,
  Users,
  Plus,
  QrCode,
  Zap,
  ChevronLeft,
  ChevronRight,
  Droplets,
  RotateCcw,
  Flame,
} from 'lucide-react';
import { DailySummary, LoggedFood, MealType, UserProfile } from '../../types/nutrition';
import { MealSection } from '../MealSection';
import { MobileBottomNav } from '../MobileBottomNav';

export interface TrackerLayoutProps {
  currentDate: string;
  onDateChange: (date: string) => void;
  userProfile: UserProfile;
  dailySummary: DailySummary;
  allProfiles: UserProfile[];
  onSwitchProfile: (profile: UserProfile) => void;
  isOnline: boolean;
  pendingSyncCount: number;
  activeTab: 'tracker' | 'analytics';
  setActiveTab: (tab: 'tracker' | 'analytics') => void;
  onOpenSearch: (mealType?: MealType) => void;
  onOpenBarcode: (mealType?: MealType) => void;
  onOpenAiScan: (mealType?: MealType) => void;
  onOpenQuickAdd: (mealType?: MealType) => void;
  onEditItem: (log: LoggedFood) => void;
  onDeleteItem: (logId: string) => void;
  onOpenProfileModal: () => void;
  onOpenWeightObjectiveModal: () => void;
  onOpenGoalsModal: () => void;
  onOpenThemeModal: () => void;
  onOpenAiAdvisor: () => void;
  onOpenRecipeBuilder: () => void;
  onOpenDataManagement: () => void;
  onOpenSchemaModal: () => void;
  onAddWater: (amountMl: number) => void;
  onResetWater: () => void;
}

export const CommandDockLayout: React.FC<TrackerLayoutProps> = (props) => {
  const {
    currentDate,
    onDateChange,
    userProfile,
    dailySummary,
    isOnline,
    activeTab,
    setActiveTab,
    onOpenSearch,
    onOpenBarcode,
    onOpenAiScan,
    onOpenQuickAdd,
    onEditItem,
    onDeleteItem,
    onOpenProfileModal,
    onOpenWeightObjectiveModal,
    onOpenGoalsModal,
    onOpenThemeModal,
    onOpenAiAdvisor,
    onOpenRecipeBuilder,
    onOpenDataManagement,
    onAddWater,
    onResetWater,
  } = props;

  const [isDockExpanded, setIsDockExpanded] = useState(false);

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

  // Calculations
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

  // Filter meal logs
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
    <div className="flex h-screen w-full bg-[#0b0b0c] text-white font-geist overflow-hidden relative select-none">
      {/* Ambient Glow */}
      <div className="ambient-bg" />

      {/* 1. COLLAPSIBLE ICON-ONLY COMMAND DOCK (LEFT) */}
      <aside
        onMouseEnter={() => setIsDockExpanded(true)}
        onMouseLeave={() => setIsDockExpanded(false)}
        className={`hidden md:flex flex-col bg-[#0b0b0c] border-r border-white/10 p-3 shrink-0 z-30 transition-all duration-300 select-none pt-safe pb-safe ${
          isDockExpanded ? 'w-56 shadow-2xl' : 'w-18'
        }`}
      >
        {/* Brand Icon */}
        <div
          onClick={() => setActiveTab('tracker')}
          className="mb-4 flex items-center gap-3 cursor-pointer group px-1 py-1"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center font-oswald text-black font-extrabold text-lg shrink-0 shadow-lg shadow-yellow-500/20 group-hover:scale-105 transition">
            MP
          </div>
          {isDockExpanded && (
            <div className="min-w-0 transition-opacity duration-300">
              <span className="font-oswald text-lg font-bold tracking-widest text-[#facc15] block truncate">
                MACROPULSE
              </span>
              <span className="text-[9px] font-mono-meta text-white/40 block">
                COMMAND DOCK
              </span>
            </div>
          )}
        </div>

        {/* Profile Avatar trigger */}
        <div
          onClick={onOpenProfileModal}
          className="mb-4 p-1.5 rounded-xl bg-[#141416] hover:bg-white/10 border border-white/10 transition cursor-pointer flex items-center gap-2.5 group"
          title={`Active Athlete: ${userProfile.name}`}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-oswald text-xs font-bold shrink-0 border"
            style={{
              backgroundColor: `${avatarColor}20`,
              borderColor: avatarColor,
              color: avatarColor,
            }}
          >
            {initials}
          </div>
          {isDockExpanded && (
            <div className="min-w-0 flex-1">
              <div className="font-oswald text-xs font-bold text-white truncate uppercase group-hover:text-[#facc15] transition">
                {userProfile.name}
              </div>
              <div className="text-[9px] font-mono-meta text-white/40 truncate">
                {userProfile.targetCalories} KCAL
              </div>
            </div>
          )}
        </div>

        {/* Dock Navigation Icons */}
        <nav className="flex flex-col space-y-1 flex-1">
          <button
            onClick={() => setActiveTab('tracker')}
            className={`flex items-center gap-3 p-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'tracker'
                ? 'bg-white/10 text-white border border-white/15'
                : 'text-white/40 hover:text-white hover:bg-white/5'
            }`}
            title="Dashboard"
          >
            <LayoutDashboard className="w-5 h-5 shrink-0 text-[#facc15]" />
            {isDockExpanded && <span>DASHBOARD</span>}
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-3 p-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-white/10 text-white border border-white/15'
                : 'text-white/40 hover:text-white hover:bg-white/5'
            }`}
            title="Analytics"
          >
            <BarChart3 className="w-5 h-5 shrink-0 text-emerald-400" />
            {isDockExpanded && <span>ANALYTICS</span>}
          </button>

          <button
            onClick={onOpenWeightObjectiveModal}
            className="flex items-center gap-3 p-2.5 rounded-xl text-xs font-semibold text-white/40 hover:text-yellow-300 hover:bg-white/5 transition cursor-pointer"
            title="Deficit Planner"
          >
            <Scale className="w-5 h-5 shrink-0 text-[#facc15]" />
            {isDockExpanded && <span>DEFICIT PLAN</span>}
          </button>

          <button
            onClick={onOpenProfileModal}
            className="flex items-center gap-3 p-2.5 rounded-xl text-xs font-semibold text-white/40 hover:text-white hover:bg-white/5 transition cursor-pointer"
            title="Athlete Profiles"
          >
            <Users className="w-5 h-5 shrink-0 text-sky-400" />
            {isDockExpanded && <span>PROFILES</span>}
          </button>

          <button
            onClick={onOpenAiAdvisor}
            className="flex items-center gap-3 p-2.5 rounded-xl text-xs font-semibold text-white/40 hover:text-amber-400 hover:bg-white/5 transition cursor-pointer"
            title="AI Nutrition Coach"
          >
            <Sparkles className="w-5 h-5 shrink-0 text-amber-400" />
            {isDockExpanded && <span>AI COACH</span>}
          </button>

          <button
            onClick={onOpenRecipeBuilder}
            className="flex items-center gap-3 p-2.5 rounded-xl text-xs font-semibold text-white/40 hover:text-white hover:bg-white/5 transition cursor-pointer"
            title="Recipe Builder"
          >
            <BookOpen className="w-5 h-5 shrink-0 text-indigo-400" />
            {isDockExpanded && <span>RECIPES</span>}
          </button>

          <button
            onClick={onOpenThemeModal}
            className="flex items-center gap-3 p-2.5 rounded-xl text-xs font-semibold text-white/40 hover:text-sky-300 hover:bg-white/5 transition cursor-pointer"
            title="UI Themes & Structural Layouts"
          >
            <Palette className="w-5 h-5 shrink-0 text-sky-400" />
            {isDockExpanded && <span>LAYOUTS / THEMES</span>}
          </button>

          <button
            onClick={onOpenDataManagement}
            className="flex items-center gap-3 p-2.5 rounded-xl text-xs font-semibold text-white/40 hover:text-white hover:bg-white/5 transition cursor-pointer"
            title="Data / QR / Backup"
          >
            <ArrowUpDown className="w-5 h-5 shrink-0 text-[#facc15]" />
            {isDockExpanded && <span>DATA / QR</span>}
          </button>

          <button
            onClick={onOpenGoalsModal}
            className="flex items-center gap-3 p-2.5 rounded-xl text-xs font-semibold text-white/40 hover:text-white hover:bg-white/5 transition cursor-pointer"
            title="Targets & TDEE Settings"
          >
            <Settings className="w-5 h-5 shrink-0 text-slate-400" />
            {isDockExpanded && <span>SETTINGS</span>}
          </button>
        </nav>

        {/* Dock Bottom Sync status */}
        <div className="mt-auto pt-3 border-t border-white/10 flex items-center justify-center">
          <div
            onClick={onOpenDataManagement}
            className="p-2 rounded-xl bg-white/5 text-white/50 hover:text-white transition cursor-pointer text-center"
            title={isOnline ? 'Local DB Synced' : 'Offline Mode'}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full inline-block ${
                isOnline ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-rose-500'
              }`}
            />
          </div>
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative z-10">
        {/* TOP COMMAND HEADER & TELEMETRY RIBBON */}
        <header className="border-b border-white/10 bg-[#0b0b0c]/90 backdrop-blur-xl px-3 sm:px-6 py-2.5 sm:py-3 pt-safe shrink-0 flex flex-col gap-2.5 sm:gap-3">
          {/* Top Row: Date, Actions, Athlete */}
          <div className="flex items-center justify-between gap-2 sm:gap-3 flex-wrap">
            {/* Date Navigation Strip */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <div className="flex items-center gap-1 bg-[#141416] p-1 rounded-xl border border-white/10">
                <button
                  onClick={handlePrevDay}
                  className="p-1 text-white/60 hover:text-white rounded hover:bg-white/10 transition cursor-pointer active:scale-90"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-semibold text-white text-xs sm:text-sm px-1 sm:px-2 font-mono-meta">
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
                  className="px-2 sm:px-2.5 py-1 text-[10px] sm:text-[11px] bg-[#facc15]/10 border border-[#facc15]/30 text-[#facc15] rounded-lg font-bold uppercase hover:bg-[#facc15]/20 transition cursor-pointer active:scale-95"
                >
                  Today
                </button>
              )}
            </div>

            {/* Quick Action Shortcuts (Scrollable strip on small mobile) */}
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5 max-w-full">
              <button
                onClick={() => onOpenBarcode('breakfast')}
                className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 bg-[#141416] hover:bg-white/10 text-white/80 hover:text-white border border-white/10 rounded-xl text-[11px] sm:text-xs font-mono-meta transition cursor-pointer shrink-0 active:scale-95"
              >
                <QrCode className="w-3.5 h-3.5 text-[#facc15]" />
                <span>SCAN</span>
              </button>

              <button
                onClick={() => onOpenAiScan('breakfast')}
                className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 bg-[#141416] hover:bg-white/10 text-white/80 hover:text-white border border-white/10 rounded-xl text-[11px] sm:text-xs font-mono-meta transition cursor-pointer shrink-0 active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>AI SNAP</span>
              </button>

              <button
                onClick={() => onOpenQuickAdd('breakfast')}
                className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 bg-[#141416] hover:bg-white/10 text-white/80 hover:text-white border border-white/10 rounded-xl text-[11px] sm:text-xs font-mono-meta transition cursor-pointer shrink-0 active:scale-95"
              >
                <Zap className="w-3.5 h-3.5 text-sky-400" />
                <span>QUICK</span>
              </button>

              <button
                onClick={() => onOpenSearch('breakfast')}
                className="pill-btn-accent flex items-center gap-1 sm:gap-1.5 px-3.5 sm:px-4 py-1.5 text-xs font-bold cursor-pointer shrink-0 active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Add Meal</span>
              </button>
            </div>
          </div>

          {/* TELEMETRY RIBBON */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 border-t border-white/5">
            {/* Energy Strip */}
            <div className="p-2 rounded-xl bg-white/[0.03] border border-white/10 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[10px] font-mono-meta text-white/50">
                <span>ENERGY</span>
                <span className="theme-accent-text font-bold">{calPct}%</span>
              </div>
              <div className="text-sm font-bold font-oswald text-white mt-0.5">
                {consumedCal} / {targetCal} <span className="text-[9px] text-white/40">KCAL</span>
              </div>
              <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden mt-1.5">
                <div
                  className="h-full theme-accent-bg"
                  style={{ width: `${calPct}%` }}
                />
              </div>
            </div>

            {/* Protein Strip */}
            <div className="p-2 rounded-xl bg-white/[0.03] border border-white/10 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[10px] font-mono-meta text-white/50">
                <span>PROTEIN</span>
                <span className="text-[#facc15] font-bold">{pPct}%</span>
              </div>
              <div className="text-sm font-bold font-oswald text-white mt-0.5">
                {pConsumed}g / {pTarget}g
              </div>
              <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden mt-1.5">
                <div
                  className="h-full bg-[#facc15]"
                  style={{ width: `${pPct}%` }}
                />
              </div>
            </div>

            {/* Carbs Strip */}
            <div className="p-2 rounded-xl bg-white/[0.03] border border-white/10 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[10px] font-mono-meta text-white/50">
                <span>CARBS</span>
                <span className="text-sky-400 font-bold">{cPct}%</span>
              </div>
              <div className="text-sm font-bold font-oswald text-white mt-0.5">
                {cConsumed}g / {cTarget}g
              </div>
              <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden mt-1.5">
                <div
                  className="h-full bg-sky-400"
                  style={{ width: `${cPct}%` }}
                />
              </div>
            </div>

            {/* Fats Strip */}
            <div className="p-2 rounded-xl bg-white/[0.03] border border-white/10 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[10px] font-mono-meta text-white/50">
                <span>FATS</span>
                <span className="text-emerald-400 font-bold">{fPct}%</span>
              </div>
              <div className="text-sm font-bold font-oswald text-white mt-0.5">
                {fConsumed}g / {fTarget}g
              </div>
              <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden mt-1.5">
                <div
                  className="h-full bg-emerald-400"
                  style={{ width: `${fPct}%` }}
                />
              </div>
            </div>

            {/* Hydration Strip */}
            <div className="p-2 rounded-xl bg-white/[0.03] border border-white/10 flex flex-col justify-between col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between text-[10px] font-mono-meta text-white/50">
                <span>WATER</span>
                <span className="text-cyan-400 font-bold">{wPct}%</span>
              </div>
              <div className="text-sm font-bold font-oswald text-cyan-300 mt-0.5">
                {(wConsumed / 1000).toFixed(2)}L / {(wTarget / 1000).toFixed(1)}L
              </div>
              <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden mt-1.5">
                <div
                  className="h-full bg-cyan-400"
                  style={{ width: `${wPct}%` }}
                />
              </div>
            </div>
          </div>
        </header>

        {/* 2-COLUMN SPLIT MAIN CONTENT */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 pb-24 md:pb-12 ios-scroll">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: MEAL LOGGER TIMELINE (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between font-mono-meta text-xs text-white/40 pb-1 border-b border-white/10">
                <span>TIMELINE & LOGGED MEALS</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onOpenQuickAdd('breakfast')}
                    className="text-[#facc15] hover:underline cursor-pointer"
                  >
                    + Quick Add
                  </button>
                  <span>•</span>
                  <button
                    onClick={onOpenRecipeBuilder}
                    className="text-white/60 hover:text-white cursor-pointer"
                  >
                    Recipe Builder
                  </button>
                </div>
              </div>

              <div className="space-y-4">
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

            {/* RIGHT COLUMN: CALORIC BALANCE & HYDRATION COMMAND HUB (5 cols) */}
            <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-0">
              {/* Caloric Gauge Card */}
              <div className="cinematic-card p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono-meta text-xs text-white/50 uppercase">
                    Caloric Balance
                  </span>
                  <button
                    onClick={onOpenGoalsModal}
                    className="text-[11px] font-mono-meta text-[#facc15] hover:underline cursor-pointer font-bold"
                  >
                    TDEE & GOALS →
                  </button>
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
                        className="transition-all duration-700 ease-out"
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

                  <div className="space-y-2 min-w-0">
                    <div>
                      <div className="text-[10px] font-mono-meta text-white/40 uppercase">
                        Daily Target
                      </div>
                      <div className="text-lg font-bold font-oswald text-white">
                        {targetCal} <span className="text-xs font-normal text-white/50">KCAL</span>
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-mono-meta text-white/40 uppercase">
                        Consumed
                      </div>
                      <div className="text-lg font-bold font-oswald text-yellow-300">
                        {consumedCal} <span className="text-xs font-normal text-white/50">KCAL</span>
                      </div>
                    </div>

                    {userProfile.weightObjective && (
                      <div className="p-2 rounded-lg bg-yellow-400/10 border border-yellow-400/20 text-[10px] font-mono-meta text-yellow-300">
                        DEFICIT: -{userProfile.weightObjective.dailyCaloricDeficit} KCAL/DAY
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Interactive Hydration Tracker */}
              <div className="cinematic-card p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-mono-meta text-xs text-white/50 uppercase">
                    <Droplets className="w-4 h-4 text-cyan-400" />
                    <span>Hydration Log</span>
                  </div>
                  <button
                    onClick={onResetWater}
                    className="p-1 rounded text-white/40 hover:text-white transition cursor-pointer"
                    title="Reset Water"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-oswald text-2xl font-bold text-cyan-300">
                      {(wConsumed / 1000).toFixed(2)}{' '}
                      <span className="text-sm font-normal text-white/50">
                        / {(wTarget / 1000).toFixed(1)} L
                      </span>
                    </div>
                    <div className="text-[10px] font-mono-meta text-white/40">
                      {wPct}% of daily hydration target
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onAddWater(250)}
                      className="px-2.5 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-bold transition cursor-pointer active:scale-95"
                    >
                      +250ml
                    </button>
                    <button
                      onClick={() => onAddWater(500)}
                      className="px-2.5 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-bold transition cursor-pointer active:scale-95"
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

              {/* Streak & Consistency Card */}
              <div className="cinematic-card p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Flame className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono-meta text-white/40 uppercase">
                      Logging Streak
                    </div>
                    <div className="font-oswald text-xl font-bold text-amber-300">
                      {String(userProfile.streakDays || 1).padStart(2, '0')} DAYS ON TRACK
                    </div>
                  </div>
                </div>

                <button
                  onClick={onOpenWeightObjectiveModal}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono-meta font-bold text-white transition cursor-pointer"
                >
                  GOALS
                </button>
              </div>
            </div>
          </div>
        </main>

        {/* Mobile Bottom Navigation Bar (< 768px) */}
        <MobileBottomNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenAiAdvisor={onOpenAiAdvisor}
          onOpenRecipeBuilder={onOpenRecipeBuilder}
          onOpenThemeModal={onOpenThemeModal}
          onOpenGoalsModal={onOpenGoalsModal}
          onOpenWeightObjectiveModal={onOpenWeightObjectiveModal}
          userProfile={userProfile}
        />
      </div>
    </div>
  );
};
