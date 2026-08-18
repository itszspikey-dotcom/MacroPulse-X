import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  QrCode,
  Sparkles,
  Zap,
  ArrowUpDown,
  Users,
  ChevronDown,
  UserCheck,
  Edit2,
  Palette,
} from 'lucide-react';
import { DailySummary, UserProfile } from '../types/nutrition';

interface HeaderProps {
  currentDate: string;
  onDateChange: (date: string) => void;
  userProfile: UserProfile;
  dailySummary: DailySummary;
  activeTab: 'tracker' | 'analytics';
  setActiveTab: (tab: 'tracker' | 'analytics') => void;
  onOpenSearch: () => void;
  onOpenBarcode: () => void;
  onOpenAiScan: () => void;
  onOpenQuickAdd: () => void;
  onOpenDataManagement: () => void;
  onOpenProfileModal: () => void;
  onOpenWeightObjectiveModal?: () => void;
  onOpenThemeModal?: () => void;
  allProfiles?: UserProfile[];
  onSwitchProfile?: (profile: UserProfile) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentDate,
  onDateChange,
  userProfile,
  dailySummary,
  activeTab,
  setActiveTab,
  onOpenSearch,
  onOpenBarcode,
  onOpenAiScan,
  onOpenQuickAdd,
  onOpenDataManagement,
  onOpenProfileModal,
  onOpenWeightObjectiveModal,
  onOpenThemeModal,
  allProfiles = [],
  onSwitchProfile,
}) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const isToday = currentDate === todayStr;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePrevDay = () => {
    const d = new Date(currentDate + 'T12:00:00');
    d.setDate(d.getDate() - 1);
    onDateChange(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(currentDate + 'T12:00:00');
    d.setDate(d.getDate() + 1);
    onDateChange(d.toISOString().split('T')[0]);
  };

  const formattedDateTitle = () => {
    const d = new Date(currentDate + 'T12:00:00');
    const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
    const monthDay = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${dayName} • ${monthDay}`;
  };

  const targetCal = userProfile.targetCalories || 2000;
  const remainingCal = targetCal - dailySummary.calories;

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
    <header className="px-3 sm:px-6 md:px-12 pt-safe pb-3 md:pb-6 flex flex-col md:flex-row md:items-end justify-between gap-3 md:gap-6 shrink-0 select-none z-20 border-b border-white/5 bg-[#0b0b0c]/85 backdrop-blur-md">
      {/* Title and Date Strips */}
      <div className="pt-1 md:pt-4 min-w-0">
        <div className="flex items-center gap-2 sm:gap-3 font-mono-meta text-xs text-white/40 tracking-wider flex-wrap">
          {/* Active Profile Quick Switcher Pill */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-[#141416] hover:bg-[#1a1a1f] border border-white/10 hover:border-[#facc15]/40 rounded-lg text-white font-semibold transition cursor-pointer active:scale-95"
              title="Active Profile (Click to Switch or Edit)"
            >
              <div
                className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold"
                style={{
                  backgroundColor: `${avatarColor}25`,
                  color: avatarColor,
                  border: `1px solid ${avatarColor}`,
                }}
              >
                {initials}
              </div>
              <span className="text-[11px] sm:text-xs text-white/90 truncate max-w-[100px] sm:max-w-[140px]">
                {userProfile.name}
              </span>
              <ChevronDown className="w-3 h-3 text-white/40 shrink-0" />
            </button>

            {/* Profile Dropdown Menu */}
            {isProfileMenuOpen && (
              <div className="absolute left-0 mt-1.5 w-64 bg-[#141416] border border-white/15 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl">
                <div className="px-2.5 py-1.5 text-[10px] font-mono-meta text-white/40 uppercase tracking-wider flex items-center justify-between">
                  <span>Switch Profile</span>
                  <span>{allProfiles.length} Total</span>
                </div>

                <div className="space-y-1 my-1 max-h-48 overflow-y-auto ios-scroll">
                  {allProfiles.map((p) => {
                    const isSelected = p.id === userProfile.id;
                    const pColor = p.avatarColor || '#facc15';
                    const pInitials =
                      p.avatarInitials ||
                      p.name
                        .split(' ')
                        .filter(Boolean)
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase() ||
                      'MP';

                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          if (onSwitchProfile) onSwitchProfile(p);
                          setIsProfileMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition cursor-pointer ${
                          isSelected
                            ? 'bg-white/10 text-white font-bold'
                            : 'hover:bg-white/5 text-white/70 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0"
                            style={{
                              backgroundColor: `${pColor}20`,
                              borderColor: pColor,
                              borderWidth: '1px',
                              color: pColor,
                            }}
                          >
                            {pInitials}
                          </div>
                          <div className="min-w-0 truncate">
                            <div className="text-xs truncate">{p.name}</div>
                            <div className="text-[10px] text-white/40">
                              {p.goalType} • {p.targetCalories} kcal
                            </div>
                          </div>
                        </div>

                        {isSelected && <UserCheck className="w-3.5 h-3.5 text-[#facc15] shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-1.5 border-t border-white/10 mt-1 space-y-1">
                  {onOpenThemeModal && (
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onOpenThemeModal();
                      }}
                      className="w-full py-1.5 px-3 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 rounded-xl text-[11px] font-mono-meta font-bold flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <Palette className="w-3.5 h-3.5" />
                      <span>🎨 THEME & UI STYLES</span>
                    </button>
                  )}
                  {onOpenWeightObjectiveModal && (
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onOpenWeightObjectiveModal();
                      }}
                      className="w-full py-1.5 px-3 bg-[#facc15]/10 hover:bg-[#facc15]/20 text-[#facc15] rounded-xl text-[11px] font-mono-meta font-bold flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <span>🎯 WEIGHT OBJECTIVE & DEFICIT</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      onOpenProfileModal();
                    }}
                    className="w-full py-2 px-3 bg-white/5 hover:bg-white/10 text-white/90 rounded-xl text-xs font-mono-meta font-bold flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5 text-[#facc15]" />
                    <span>MANAGE & ADD PROFILES</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 bg-[#141416] p-0.5 rounded-lg border border-white/10 shrink-0">
            <button
              onClick={handlePrevDay}
              className="p-1 text-white/60 hover:text-white rounded hover:bg-white/5 transition cursor-pointer active:scale-90"
              title="Previous Day"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="font-semibold text-white/90 px-1 text-[11px] sm:text-xs font-mono-meta">
              {formattedDateTitle()}
            </span>
            <button
              onClick={handleNextDay}
              className="p-1 text-white/60 hover:text-white rounded hover:bg-white/5 transition cursor-pointer active:scale-90"
              title="Next Day"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {!isToday && (
            <button
              onClick={() => onDateChange(todayStr)}
              className="px-2 py-1 text-[10px] bg-[#facc15]/10 border border-[#facc15]/30 text-[#facc15] rounded-lg font-bold uppercase tracking-wider hover:bg-[#facc15]/20 transition cursor-pointer active:scale-95 shrink-0"
            >
              Today
            </button>
          )}

          <span className="hidden sm:inline text-white/20">•</span>
          <span className="hidden sm:inline text-white/40 font-mono-meta text-[11px]">
            {remainingCal >= 0
              ? `${remainingCal.toLocaleString()} KCAL REMAINING`
              : `${Math.abs(remainingCal).toLocaleString()} KCAL OVER`}
          </span>
        </div>

        <h1 className="font-oswald text-2xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-white uppercase mt-1">
          {activeTab === 'tracker' ? 'Daily Performance' : 'Performance Analytics'}
        </h1>
      </div>

      {/* Action Controls & Add Meal Button - Horizontally scrollable strip on mobile */}
      <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar pb-1 md:pb-0 ios-scroll shrink-0 max-w-full">
        {/* Barcode & QR Quick Trigger */}
        <button
          onClick={onOpenBarcode}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-[#141416] hover:bg-white/10 text-white/80 hover:text-white border border-white/10 rounded-lg font-mono-meta text-[11px] sm:text-xs transition cursor-pointer shrink-0 active:scale-95"
          title="Scan Barcode / QR"
        >
          <QrCode className="w-3.5 h-3.5 text-[#facc15]" />
          <span>SCAN</span>
        </button>

        {/* AI Snap Recognition */}
        <button
          onClick={onOpenAiScan}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-[#141416] hover:bg-white/10 text-white/80 hover:text-white border border-white/10 rounded-lg font-mono-meta text-[11px] sm:text-xs transition cursor-pointer shrink-0 active:scale-95"
          title="AI Photo Recognition"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>AI SNAP</span>
        </button>

        {/* Quick Add */}
        <button
          onClick={onOpenQuickAdd}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-[#141416] hover:bg-white/10 text-white/80 hover:text-white border border-white/10 rounded-lg font-mono-meta text-[11px] sm:text-xs transition cursor-pointer shrink-0 active:scale-95"
          title="Quick Add Food"
        >
          <Zap className="w-3.5 h-3.5 text-sky-400" />
          <span>QUICK</span>
        </button>

        {/* Theme Studio */}
        {onOpenThemeModal && (
          <button
            onClick={onOpenThemeModal}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-[#141416] hover:bg-white/10 text-white/80 hover:text-white border border-white/10 rounded-lg font-mono-meta text-[11px] sm:text-xs transition cursor-pointer shrink-0 active:scale-95"
            title="Switch Theme & UI Styles"
          >
            <Palette className="w-3.5 h-3.5 text-[#facc15]" />
            <span className="hidden sm:inline">THEMES</span>
          </button>
        )}

        {/* Primary Pill Button */}
        <button
          onClick={onOpenSearch}
          className="pill-btn-accent flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-1.5 sm:py-2.5 rounded-lg text-xs sm:text-sm font-bold shadow-lg shadow-yellow-400/10 cursor-pointer shrink-0 active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add Meal</span>
        </button>
      </div>
    </header>
  );
};

