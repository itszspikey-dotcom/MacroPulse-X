import React from 'react';
import {
  LayoutDashboard,
  BarChart3,
  Sparkles,
  BookOpen,
  Palette,
  Settings,
  Scale,
} from 'lucide-react';
import { UserProfile } from '../types/nutrition';

interface MobileBottomNavProps {
  activeTab: 'tracker' | 'analytics';
  setActiveTab: (tab: 'tracker' | 'analytics') => void;
  onOpenAiAdvisor: () => void;
  onOpenRecipeBuilder: () => void;
  onOpenThemeModal?: () => void;
  onOpenGoalsModal: () => void;
  onOpenWeightObjectiveModal?: () => void;
  userProfile?: UserProfile;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenAiAdvisor,
  onOpenRecipeBuilder,
  onOpenThemeModal,
  onOpenGoalsModal,
  onOpenWeightObjectiveModal,
}) => {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0b0b0c]/95 backdrop-blur-xl border-t border-white/10 px-2 pt-2 pb-[max(0.6rem,env(safe-area-inset-bottom,18px))] flex items-center justify-around select-none shadow-[0_-10px_30px_rgba(0,0,0,0.8)]"
      aria-label="Mobile Navigation Bar"
    >
      {/* 1. Daily Tracker Tab */}
      <button
        onClick={() => setActiveTab('tracker')}
        className={`flex flex-col items-center justify-center gap-1 py-1 px-2.5 rounded-xl cursor-pointer transition-all duration-200 active:scale-95 min-w-[50px] min-h-[44px] ${
          activeTab === 'tracker'
            ? 'text-[#facc15] font-bold'
            : 'text-white/40 hover:text-white'
        }`}
      >
        <div className="relative">
          <LayoutDashboard className="w-5 h-5 stroke-[2.2]" />
          {activeTab === 'tracker' && (
            <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#facc15] shadow-xs shadow-yellow-400" />
          )}
        </div>
        <span className="text-[10px] font-mono-meta tracking-wider uppercase">Tracker</span>
      </button>

      {/* 2. Trends / Analytics Tab */}
      <button
        onClick={() => setActiveTab('analytics')}
        className={`flex flex-col items-center justify-center gap-1 py-1 px-2.5 rounded-xl cursor-pointer transition-all duration-200 active:scale-95 min-w-[50px] min-h-[44px] ${
          activeTab === 'analytics'
            ? 'text-emerald-400 font-bold'
            : 'text-white/40 hover:text-white'
        }`}
      >
        <div className="relative">
          <BarChart3 className="w-5 h-5 stroke-[2.2]" />
          {activeTab === 'analytics' && (
            <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-xs shadow-emerald-400" />
          )}
        </div>
        <span className="text-[10px] font-mono-meta tracking-wider uppercase">Analytics</span>
      </button>

      {/* 3. AI Coach Tab */}
      <button
        onClick={onOpenAiAdvisor}
        className="flex flex-col items-center justify-center gap-1 py-1 px-2.5 rounded-xl cursor-pointer text-white/40 hover:text-amber-400 active:scale-95 transition min-w-[50px] min-h-[44px]"
      >
        <Sparkles className="w-5 h-5 text-amber-400/80 stroke-[2.2]" />
        <span className="text-[10px] font-mono-meta tracking-wider uppercase">Coach</span>
      </button>

      {/* 4. Recipe Studio Tab */}
      <button
        onClick={onOpenRecipeBuilder}
        className="flex flex-col items-center justify-center gap-1 py-1 px-2.5 rounded-xl cursor-pointer text-white/40 hover:text-sky-400 active:scale-95 transition min-w-[50px] min-h-[44px]"
      >
        <BookOpen className="w-5 h-5 text-sky-400/80 stroke-[2.2]" />
        <span className="text-[10px] font-mono-meta tracking-wider uppercase">Recipes</span>
      </button>

      {/* 5. Themes / Styles Studio Tab */}
      {onOpenThemeModal && (
        <button
          onClick={onOpenThemeModal}
          className="flex flex-col items-center justify-center gap-1 py-1 px-2.5 rounded-xl cursor-pointer text-white/40 hover:text-yellow-300 active:scale-95 transition min-w-[50px] min-h-[44px]"
        >
          <Palette className="w-5 h-5 text-[#facc15]/80 stroke-[2.2]" />
          <span className="text-[10px] font-mono-meta tracking-wider uppercase">Themes</span>
        </button>
      )}

      {/* 6. Settings / Goals Tab */}
      <button
        onClick={onOpenGoalsModal}
        className="flex flex-col items-center justify-center gap-1 py-1 px-2.5 rounded-xl cursor-pointer text-white/40 hover:text-white active:scale-95 transition min-w-[50px] min-h-[44px]"
      >
        <Settings className="w-5 h-5 text-slate-400 stroke-[2.2]" />
        <span className="text-[10px] font-mono-meta tracking-wider uppercase">Goals</span>
      </button>
    </nav>
  );
};
