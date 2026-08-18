import React from 'react';
import {
  LayoutDashboard,
  BarChart3,
  Sparkles,
  BookOpen,
  Database,
  Settings,
  Flame,
  ArrowUpDown,
  Users,
  ChevronRight,
  Scale,
  Palette,
} from 'lucide-react';
import { UserProfile } from '../types/nutrition';
import { MobileBottomNav } from './MobileBottomNav';

interface SidebarRailProps {
  activeTab: 'tracker' | 'analytics';
  setActiveTab: (tab: 'tracker' | 'analytics') => void;
  onOpenAiAdvisor: () => void;
  onOpenRecipeBuilder: () => void;
  onOpenSchemaModal: () => void;
  onOpenGoalsModal: () => void;
  onOpenProfileModal: () => void;
  onOpenDataManagement: () => void;
  onOpenWeightObjectiveModal?: () => void;
  onOpenThemeModal?: () => void;
  isOnline: boolean;
  pendingSyncCount: number;
  userProfile: UserProfile;
}

export const SidebarRail: React.FC<SidebarRailProps> = ({
  activeTab,
  setActiveTab,
  onOpenAiAdvisor,
  onOpenRecipeBuilder,
  onOpenSchemaModal,
  onOpenGoalsModal,
  onOpenProfileModal,
  onOpenDataManagement,
  onOpenWeightObjectiveModal,
  onOpenThemeModal,
  isOnline,
  pendingSyncCount,
  userProfile,
}) => {
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
    <>
      {/* DESKTOP / TABLET SIDEBAR RAIL */}
      <aside className="hidden md:flex w-60 bg-[#0b0b0c] border-r border-white/10 flex-col p-5 lg:p-6 shrink-0 z-30 select-none pt-safe pb-safe pl-safe">
        {/* Brand Logo */}
        <div
          className="mb-5 cursor-pointer flex items-center justify-between group"
          onClick={() => setActiveTab('tracker')}
        >
          <span className="font-oswald text-2xl font-bold tracking-[0.12em] text-[#facc15] group-hover:text-yellow-300 transition">
            MACROPULSE
          </span>
          <span className="text-[10px] font-mono-meta text-white/30 border border-white/10 px-1.5 py-0.5 rounded">
            v2.5
          </span>
        </div>

        {/* Active Athlete Profile Header Card */}
        <div
          onClick={onOpenProfileModal}
          className="mb-6 p-2.5 rounded-2xl bg-[#141416] hover:bg-[#18181b] border border-white/10 hover:border-[#facc15]/40 transition cursor-pointer group flex items-center justify-between"
          title="Click to Switch Athlete or Edit Profile"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center font-oswald text-xs font-bold uppercase shrink-0"
              style={{
                backgroundColor: `${avatarColor}20`,
                borderColor: avatarColor,
                borderWidth: '1.5px',
                color: avatarColor,
              }}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <div className="font-oswald text-xs font-bold uppercase text-white truncate tracking-wide group-hover:text-[#facc15] transition">
                {userProfile.name}
              </div>
              <div className="text-[10px] font-mono-meta text-white/40 truncate">
                {userProfile.goalType.toUpperCase()} • {userProfile.targetCalories} KCAL
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-[#facc15] group-hover:translate-x-0.5 transition shrink-0" />
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col space-y-1.5 flex-1">
          {/* Dashboard */}
          <button
            onClick={() => setActiveTab('tracker')}
            className={`flex items-center gap-3.5 px-3 py-2.5 rounded-lg text-sm font-medium transition cursor-pointer font-geist ${
              activeTab === 'tracker'
                ? 'text-white bg-white/5 border border-white/10'
                : 'text-white/40 hover:text-white hover:bg-white/[0.02]'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0 text-[#facc15]" />
            <span className="uppercase tracking-wider font-semibold">Dashboard</span>
          </button>

          {/* Analytics */}
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-3.5 px-3 py-2.5 rounded-lg text-sm font-medium transition cursor-pointer font-geist ${
              activeTab === 'analytics'
                ? 'text-white bg-white/5 border border-white/10'
                : 'text-white/40 hover:text-white hover:bg-white/[0.02]'
            }`}
          >
            <BarChart3 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span className="uppercase tracking-wider font-semibold">Analytics</span>
          </button>

          {/* Weight Objective & Deficit Planner */}
          {onOpenWeightObjectiveModal && (
            <button
              onClick={onOpenWeightObjectiveModal}
              className="flex items-center gap-3.5 px-3 py-2.5 rounded-lg text-sm font-medium text-white/40 hover:text-yellow-300 hover:bg-white/[0.02] transition cursor-pointer font-geist group"
              title="Calculate accurate caloric deficit based on target weight objective"
            >
              <Scale className="w-4 h-4 shrink-0 text-[#facc15] group-hover:scale-110 transition" />
              <span className="uppercase tracking-wider font-semibold">Deficit Plan</span>
            </button>
          )}

          {/* Profiles Manager */}
          <button
            onClick={onOpenProfileModal}
            className="flex items-center gap-3.5 px-3 py-2.5 rounded-lg text-sm font-medium text-white/40 hover:text-white hover:bg-white/[0.02] transition cursor-pointer font-geist"
          >
            <Users className="w-4 h-4 shrink-0 text-[#facc15]" />
            <span className="uppercase tracking-wider font-semibold">Profiles</span>
          </button>

          {/* AI Nutrition Coach */}
          <button
            onClick={onOpenAiAdvisor}
            className="flex items-center gap-3.5 px-3 py-2.5 rounded-lg text-sm font-medium text-white/40 hover:text-white hover:bg-white/[0.02] transition cursor-pointer font-geist"
          >
            <Sparkles className="w-4 h-4 shrink-0 text-amber-400" />
            <span className="uppercase tracking-wider font-semibold">AI Coach</span>
          </button>

          {/* Recipe Builder */}
          <button
            onClick={onOpenRecipeBuilder}
            className="flex items-center gap-3.5 px-3 py-2.5 rounded-lg text-sm font-medium text-white/40 hover:text-white hover:bg-white/[0.02] transition cursor-pointer font-geist"
          >
            <BookOpen className="w-4 h-4 shrink-0 text-sky-400" />
            <span className="uppercase tracking-wider font-semibold">Recipes</span>
          </button>

          {/* Export / Import & APIs */}
          <button
            onClick={onOpenDataManagement}
            className="flex items-center gap-3.5 px-3 py-2.5 rounded-lg text-sm font-medium text-white/40 hover:text-white hover:bg-white/[0.02] transition cursor-pointer font-geist"
          >
            <ArrowUpDown className="w-4 h-4 shrink-0 text-[#facc15]" />
            <span className="uppercase tracking-wider font-semibold">Data / QR</span>
          </button>

          {/* Supabase Schema */}
          <button
            onClick={onOpenSchemaModal}
            className="flex items-center gap-3.5 px-3 py-2.5 rounded-lg text-sm font-medium text-white/40 hover:text-white hover:bg-white/[0.02] transition cursor-pointer font-geist"
          >
            <Database className="w-4 h-4 shrink-0 text-indigo-400" />
            <span className="uppercase tracking-wider font-semibold">Database</span>
          </button>

          {/* Theme & UI Styles */}
          {onOpenThemeModal && (
            <button
              onClick={onOpenThemeModal}
              className="flex items-center gap-3.5 px-3 py-2.5 rounded-lg text-sm font-medium text-white/40 hover:text-sky-300 hover:bg-white/[0.02] transition cursor-pointer font-geist group"
              title="Customize App Theme & UI Style"
            >
              <Palette className="w-4 h-4 shrink-0 text-sky-400 group-hover:rotate-12 transition-transform" />
              <span className="uppercase tracking-wider font-semibold">Themes</span>
            </button>
          )}

          {/* Goals & Settings */}
          <button
            onClick={onOpenGoalsModal}
            className="flex items-center gap-3.5 px-3 py-2.5 rounded-lg text-sm font-medium text-white/40 hover:text-white hover:bg-white/[0.02] transition cursor-pointer font-geist"
          >
            <Settings className="w-4 h-4 shrink-0 text-slate-400" />
            <span className="uppercase tracking-wider font-semibold">Target & TDEE</span>
          </button>
        </nav>

        {/* Bottom Footer with Streak and Sync Status */}
        <div className="mt-auto pt-5 border-t border-white/10 space-y-3.5">
          <div
            onClick={onOpenGoalsModal}
            className="cursor-pointer group"
            title="Daily Tracking Streak"
          >
            <div className="font-mono-meta text-[10px] text-white/40 uppercase mb-1">
              Daily Streak
            </div>
            <div className="font-oswald text-2xl lg:text-3xl text-[#facc15] font-semibold tracking-wider group-hover:text-yellow-300 transition">
              {String(userProfile.streakDays || 1).padStart(2, '0')} DAYS
            </div>
          </div>

          <div
            onClick={onOpenDataManagement}
            className="flex items-center gap-2 pt-2 text-[11px] font-mono-meta text-white/40 cursor-pointer hover:text-white transition"
          >
            {isOnline ? (
              pendingSyncCount > 0 ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-[#facc15] animate-spin" />
                  <span>SYNCING ({pendingSyncCount})</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>LOCAL DB SYNCED</span>
                </>
              )
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>OFFLINE MODE</span>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* MOBILE / iOS BOTTOM NAVIGATION TAB BAR */}
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
    </>
  );
};


