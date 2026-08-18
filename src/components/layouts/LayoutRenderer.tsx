import React from 'react';
import { LayoutMode } from '../../services/layoutService';
import { TrackerLayoutProps, CommandDockLayout } from './CommandDockLayout';
import { TopNavGridLayout } from './TopNavGridLayout';
import { FocusDialLayout } from './FocusDialLayout';
import { SplitWorkspaceLayout } from './SplitWorkspaceLayout';
import { DenseHudLayout } from './DenseHudLayout';
import { AnalyticsView } from '../AnalyticsView';
import { MobileBottomNav } from '../MobileBottomNav';

interface LayoutRendererProps extends TrackerLayoutProps {
  layoutMode: LayoutMode;
}

export const LayoutRenderer: React.FC<LayoutRendererProps> = (props) => {
  const { layoutMode, activeTab, userProfile, onOpenWeightObjectiveModal } = props;

  // If analytics tab is active, render AnalyticsView with full layout shell + MobileBottomNav
  if (activeTab === 'analytics') {
    return (
      <div className="flex flex-col h-screen w-full bg-[#0b0b0c] text-white font-geist overflow-hidden relative select-none">
        <div className="ambient-bg" />
        <header className="px-4 sm:px-6 py-3 pt-safe border-b border-white/10 flex items-center justify-between bg-[#0b0b0c]/90 backdrop-blur-xl z-20 shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-oswald text-xl sm:text-2xl font-bold text-white uppercase tracking-wide">
              Performance Analytics
            </span>
            <span className="text-[10px] font-mono-meta px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              BIOMETRIC & MACROS
            </span>
          </div>
          <button
            onClick={() => props.setActiveTab('tracker')}
            className="pill-btn-accent px-3.5 sm:px-5 py-1.5 sm:py-2 text-xs font-bold uppercase cursor-pointer shrink-0 active:scale-95 shadow-md shadow-yellow-400/10"
          >
            ← Back to Daily Tracker
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8 pb-28 md:pb-12 ios-scroll max-w-7xl mx-auto w-full">
          <AnalyticsView
            userProfile={userProfile}
            onOpenWeightObjectiveModal={onOpenWeightObjectiveModal}
          />
        </main>

        {/* Mobile bottom navigation bar for quick switching */}
        <MobileBottomNav
          activeTab={props.activeTab}
          setActiveTab={props.setActiveTab}
          onOpenAiAdvisor={props.onOpenAiAdvisor}
          onOpenRecipeBuilder={props.onOpenRecipeBuilder}
          onOpenThemeModal={props.onOpenThemeModal}
          onOpenGoalsModal={props.onOpenGoalsModal}
          onOpenWeightObjectiveModal={props.onOpenWeightObjectiveModal}
          userProfile={props.userProfile}
        />
      </div>
    );
  }

  // Render the selected active layout for the tracker
  switch (layoutMode) {
    case 'top-nav-grid':
      return <TopNavGridLayout {...props} />;
    case 'focus-dial':
      return <FocusDialLayout {...props} />;
    case 'split-workspace':
      return <SplitWorkspaceLayout {...props} />;
    case 'dense-hud':
      return <DenseHudLayout {...props} />;
    case 'command-dock':
    default:
      return <CommandDockLayout {...props} />;
  }
};

