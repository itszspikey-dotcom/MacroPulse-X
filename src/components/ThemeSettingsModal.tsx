import React, { useState, useEffect } from 'react';
import {
  X,
  Palette,
  Check,
  Sparkles,
  Sun,
  Moon,
  Flame,
  Zap,
  Layers,
  Sliders,
  Cpu,
  Layout,
  Columns,
  Maximize2,
  Grid,
  Compass,
  Table,
} from 'lucide-react';
import {
  AppTheme,
  APP_THEMES,
  ThemeCategory,
  STRUCTURAL_STYLES,
  themeService,
} from '../services/themeService';
import {
  LayoutMode,
  APP_LAYOUTS,
  layoutService,
  LayoutConfig,
} from '../services/layoutService';
import { UserProfile } from '../types/nutrition';
import { playSuccessChime, triggerHaptic } from '../services/audioFeedback';

interface ThemeSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onUpdateProfile?: (updated: Partial<UserProfile>) => void;
}

export const ThemeSettingsModal: React.FC<ThemeSettingsModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onUpdateProfile,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'layouts' | 'themes'>('layouts');
  const [activeTheme, setActiveTheme] = useState<AppTheme>(() => themeService.getActiveTheme());
  const [previewTheme, setPreviewTheme] = useState<AppTheme>(() => themeService.getActiveTheme());
  const [activeLayout, setActiveLayout] = useState<LayoutMode>(() => layoutService.getLayout());
  const [selectedCategory, setSelectedCategory] = useState<ThemeCategory>('all');
  const [saveToProfile, setSaveToProfile] = useState<boolean>(true);

  useEffect(() => {
    const unsubTheme = themeService.subscribe((t) => {
      setActiveTheme(t);
      setPreviewTheme(t);
    });
    const unsubLayout = layoutService.subscribe((l) => {
      setActiveLayout(l);
    });
    return () => {
      unsubTheme();
      unsubLayout();
    };
  }, []);

  const handleSelectTheme = (theme: AppTheme) => {
    setPreviewTheme(theme);
    themeService.setTheme(theme.id);
    setActiveTheme(theme);
    playSuccessChime();
    triggerHaptic('light');

    if (saveToProfile && onUpdateProfile) {
      onUpdateProfile({ themeId: theme.id });
    }
  };

  const handleSelectLayout = (layoutId: LayoutMode) => {
    layoutService.setLayout(layoutId);
    setActiveLayout(layoutId);
    playSuccessChime();
    triggerHaptic('light');

    if (saveToProfile && onUpdateProfile) {
      onUpdateProfile({ layoutMode: layoutId });
    }
  };

  const categories: { id: ThemeCategory; label: string; icon: any }[] = [
    { id: 'all', label: 'All Themes', icon: Layers },
    { id: 'structural', label: '6 Structural Styles', icon: Cpu },
    { id: 'dark', label: 'Dark & Stealth', icon: Moon },
    { id: 'vibrant', label: 'Vibrant & Neon', icon: Zap },
    { id: 'minimal', label: 'Minimal & Zen', icon: Sparkles },
    { id: 'performance', label: 'High Intensity', icon: Flame },
    { id: 'light', label: 'Light Mode', icon: Sun },
  ];

  const filteredThemes = APP_THEMES.filter((t) => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'structural') return t.category === 'structural';
    return t.category === selectedCategory;
  });

  const currentStructuralStyle = STRUCTURAL_STYLES[previewTheme.structuralStyle] || STRUCTURAL_STYLES['athletic-dark'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#141416] border border-white/15 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-[#141416]/90 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg shadow-lg border"
              style={{
                backgroundColor: `${previewTheme.colors.accent}20`,
                borderColor: previewTheme.colors.borderAccent,
                color: previewTheme.colors.accent,
              }}
            >
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold font-oswald tracking-wide text-white uppercase">
                  Studio Customizer
                </h3>
                <span
                  className="text-[10px] font-mono-meta font-bold px-2 py-0.5 rounded-md uppercase tracking-wider"
                  style={{
                    backgroundColor: `${previewTheme.colors.accent}25`,
                    color: previewTheme.colors.accent,
                    border: `1px solid ${previewTheme.colors.borderAccent}`,
                  }}
                >
                  {activeLayout} • {activeTheme.name}
                </span>
              </div>
              <p className="text-xs text-white/50">
                5 distinct structural layouts & 10 architectural UI themes
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Tab Switcher */}
        <div className="px-4 sm:px-6 pt-3 pb-1 border-b border-white/10 flex items-center gap-2 bg-[#121214]">
          <button
            onClick={() => setActiveTab('layouts')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold font-oswald uppercase tracking-wider transition cursor-pointer ${
              activeTab === 'layouts'
                ? 'bg-white/15 text-white border border-white/20 shadow-sm'
                : 'text-white/40 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layout className="w-4 h-4 text-[#facc15]" />
            <span>5 Structural Layouts</span>
          </button>

          <button
            onClick={() => setActiveTab('themes')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold font-oswald uppercase tracking-wider transition cursor-pointer ${
              activeTab === 'themes'
                ? 'bg-white/15 text-white border border-white/20 shadow-sm'
                : 'text-white/40 hover:text-white hover:bg-white/5'
            }`}
          >
            <Palette className="w-4 h-4 text-sky-400" />
            <span>10 Themes & Visual Styles</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto ios-scroll p-4 sm:p-6 space-y-6">
          {activeTab === 'layouts' ? (
            /* =========================================================================
               TAB 1: 5 STRUCTURAL UI LAYOUTS
               ========================================================================= */
            <div className="space-y-6">
              <div className="space-y-1">
                <h4 className="font-oswald text-base text-white uppercase tracking-wide">
                  Choose UI Component Architecture & Navigation
                </h4>
                <p className="text-xs text-white/60">
                  Completely reconfigures widget placement, side rails vs top bars, split workspaces, focus dials, and telemetry density.
                </p>
              </div>

              {/* Layouts Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {APP_LAYOUTS.map((layout) => {
                  const isCurrent = activeLayout === layout.id;

                  return (
                    <div
                      key={layout.id}
                      onClick={() => handleSelectLayout(layout.id)}
                      className={`cinematic-card p-5 cursor-pointer transition-all duration-200 flex flex-col justify-between space-y-4 ${
                        isCurrent
                          ? 'border-yellow-400 ring-1 ring-yellow-400 shadow-xl'
                          : 'hover:border-white/30 hover:scale-[1.01]'
                      }`}
                    >
                      <div>
                        {/* Header & Wireframe */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{layout.icon}</span>
                            <div>
                              <div className="font-oswald text-base font-bold text-white uppercase flex items-center gap-2">
                                <span>{layout.name}</span>
                                {isCurrent && (
                                  <span className="text-[10px] font-mono-meta bg-yellow-400/20 text-yellow-300 border border-yellow-400/40 px-1.5 py-0.5 rounded">
                                    ACTIVE
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] font-mono-meta text-white/40">
                                {layout.subtitle}
                              </div>
                            </div>
                          </div>

                          {isCurrent ? (
                            <div className="w-6 h-6 rounded-full bg-[#facc15] text-black flex items-center justify-center font-bold">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          ) : (
                            <span className="text-[10px] font-mono-meta text-white/30 uppercase">
                              Switch
                            </span>
                          )}
                        </div>

                        {/* Miniature Wireframe Visualization */}
                        <div className="p-2.5 rounded-xl bg-black/50 border border-white/10 mb-3 h-24 flex items-center justify-center">
                          {layout.previewWireframe === 'dock' && (
                            /* Command Dock Wireframe */
                            <div className="w-full h-full flex gap-1.5 p-1">
                              <div className="w-4 h-full bg-[#facc15]/30 border border-[#facc15]/50 rounded-sm flex flex-col items-center gap-1 py-1">
                                <div className="w-2 h-2 rounded-full bg-[#facc15]" />
                                <div className="w-2 h-1 bg-white/40 rounded-xs" />
                                <div className="w-2 h-1 bg-white/40 rounded-xs" />
                              </div>
                              <div className="flex-1 flex flex-col gap-1">
                                <div className="h-3.5 w-full bg-white/10 rounded-sm flex items-center px-1 gap-1">
                                  <div className="h-1.5 w-6 bg-[#facc15]/50 rounded-xs" />
                                  <div className="h-1.5 w-6 bg-sky-400/50 rounded-xs" />
                                  <div className="h-1.5 w-6 bg-emerald-400/50 rounded-xs" />
                                </div>
                                <div className="flex-1 flex gap-1">
                                  <div className="w-7/12 h-full bg-white/5 border border-white/10 rounded-sm p-1 flex flex-col gap-0.5">
                                    <div className="h-2 w-full bg-white/10 rounded-xs" />
                                    <div className="h-2 w-full bg-white/10 rounded-xs" />
                                  </div>
                                  <div className="w-5/12 h-full bg-white/5 border border-white/10 rounded-sm flex items-center justify-center">
                                    <div className="w-6 h-6 rounded-full border border-[#facc15]" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {layout.previewWireframe === 'topbar' && (
                            /* Top Nav & Grid Wireframe */
                            <div className="w-full h-full flex flex-col gap-1 p-1">
                              <div className="h-4 w-full bg-white/15 border border-white/20 rounded-sm flex items-center justify-between px-1.5">
                                <div className="h-2 w-10 bg-[#facc15] rounded-xs" />
                                <div className="h-2 w-16 bg-white/30 rounded-xs" />
                              </div>
                              <div className="grid grid-cols-3 gap-1 h-8">
                                <div className="bg-white/5 border border-white/10 rounded-sm flex items-center justify-center">
                                  <div className="w-4 h-4 rounded-full border border-[#facc15]" />
                                </div>
                                <div className="bg-white/5 border border-white/10 rounded-sm p-1 flex flex-col justify-center gap-0.5">
                                  <div className="h-1 w-full bg-[#facc15] rounded-xs" />
                                  <div className="h-1 w-full bg-sky-400 rounded-xs" />
                                </div>
                                <div className="bg-white/5 border border-white/10 rounded-sm p-1 flex flex-col justify-center gap-0.5">
                                  <div className="h-1.5 w-full bg-cyan-400/50 rounded-xs" />
                                </div>
                              </div>
                              <div className="flex-1 bg-white/5 border border-white/10 rounded-sm" />
                            </div>
                          )}

                          {layout.previewWireframe === 'dial' && (
                            /* Focus Dial Wireframe */
                            <div className="w-full h-full flex flex-col items-center justify-center gap-1 p-1">
                              <div className="w-10 h-10 rounded-full border-2 border-[#facc15] flex items-center justify-center">
                                <div className="w-2 h-2 bg-[#facc15] rounded-full" />
                              </div>
                              <div className="h-2 w-28 bg-white/10 rounded-sm" />
                              <div className="h-2.5 w-36 bg-[#facc15]/30 rounded-full border border-[#facc15]/50" />
                            </div>
                          )}

                          {layout.previewWireframe === 'split' && (
                            /* Split Workspace Wireframe */
                            <div className="w-full h-full flex gap-1.5 p-1">
                              <div className="w-1/2 h-full bg-[#facc15]/10 border border-[#facc15]/30 rounded-sm p-1 flex flex-col items-center justify-center gap-1">
                                <div className="w-6 h-6 rounded-full border border-[#facc15]" />
                                <div className="h-1.5 w-full bg-white/20 rounded-xs" />
                              </div>
                              <div className="w-1/2 h-full bg-white/5 border border-white/10 rounded-sm p-1 flex flex-col gap-1">
                                <div className="h-3 w-full bg-white/10 rounded-xs" />
                                <div className="h-3 w-full bg-white/10 rounded-xs" />
                                <div className="h-3 w-full bg-white/10 rounded-xs" />
                              </div>
                            </div>
                          )}

                          {layout.previewWireframe === 'dense' && (
                            /* Dense HUD Wireframe */
                            <div className="w-full h-full flex flex-col gap-1 p-1">
                              <div className="grid grid-cols-4 gap-1 h-4">
                                <div className="bg-white/10 rounded-xs" />
                                <div className="bg-white/10 rounded-xs" />
                                <div className="bg-white/10 rounded-xs" />
                                <div className="bg-white/10 rounded-xs" />
                              </div>
                              <div className="flex-1 bg-black/70 border border-white/20 rounded-sm p-1 flex flex-col gap-0.5">
                                <div className="h-1.5 w-full bg-white/15 rounded-xs" />
                                <div className="h-1.5 w-full bg-white/15 rounded-xs" />
                                <div className="h-1.5 w-full bg-white/15 rounded-xs" />
                                <div className="h-1.5 w-full bg-white/15 rounded-xs" />
                              </div>
                            </div>
                          )}
                        </div>

                        <p className="text-xs text-white/70 mb-3 leading-relaxed">
                          {layout.tagline}
                        </p>

                        <div className="space-y-1">
                          {layout.highlights.slice(0, 2).map((h, i) => (
                            <div
                              key={i}
                              className="text-[11px] font-mono-meta text-white/50 flex items-center gap-1.5"
                            >
                              <span className="text-[#facc15]">•</span>
                              <span>{h}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                        <span className="text-[10px] font-mono-meta text-white/40 truncate max-w-[180px]">
                          {layout.recommendedFor}
                        </span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectLayout(layout.id);
                          }}
                          className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition cursor-pointer font-oswald ${
                            isCurrent
                              ? 'bg-yellow-400 text-black shadow-md'
                              : 'bg-white/10 text-white hover:bg-white/20'
                          }`}
                        >
                          {isCurrent ? 'Active Layout' : 'Apply Layout'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* =========================================================================
               TAB 2: 10 THEMES & VISUAL STYLES
               ========================================================================= */
            <div className="space-y-6">
              {/* Category Filters */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 ios-scroll">
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategory(cat.id);
                        triggerHaptic('light');
                      }}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                        isSelected
                          ? 'bg-white/15 text-white border border-white/20 shadow-sm'
                          : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10 border border-transparent'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Themes Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredThemes.map((theme) => {
                  const isCurrent = activeTheme.id === theme.id;
                  const themeStruct = STRUCTURAL_STYLES[theme.structuralStyle] || STRUCTURAL_STYLES['athletic-dark'];

                  return (
                    <div
                      key={theme.id}
                      onClick={() => handleSelectTheme(theme)}
                      onMouseEnter={() => setPreviewTheme(theme)}
                      className={`p-4 border transition-all duration-200 cursor-pointer relative group flex flex-col justify-between ${
                        isCurrent
                          ? 'ring-2 shadow-xl'
                          : 'hover:border-white/30 hover:scale-[1.01]'
                      }`}
                      style={{
                        backgroundColor: theme.colors.cardBg,
                        borderColor: isCurrent ? theme.colors.accent : theme.colors.border,
                        borderRadius: themeStruct.cardRadius,
                        clipPath: themeStruct.cardClipPath || 'none',
                        borderWidth: themeStruct.cardBorderWidth,
                        borderStyle: themeStruct.cardBorderStyle,
                        boxShadow: isCurrent ? `0 8px 24px ${theme.colors.accentGlow}` : themeStruct.cardShadow,
                      }}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2.5">
                            <span className="text-2xl">{theme.icon}</span>
                            <div>
                              <div
                                className="text-base font-bold text-white uppercase tracking-wide group-hover:text-yellow-200 transition flex items-center gap-1.5"
                                style={{ fontFamily: themeStruct.fontDisplay }}
                              >
                                <span>{theme.name}</span>
                                {theme.category === 'structural' && (
                                  <span className="text-[9px] font-mono-meta bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1 py-0.2 rounded">
                                    STYLE
                                  </span>
                                )}
                              </div>
                              <div
                                className="text-[10px] text-white/40 uppercase"
                                style={{ fontFamily: themeStruct.fontMono }}
                              >
                                {themeStruct.name} • {themeStruct.subtitle}
                              </div>
                            </div>
                          </div>

                          {isCurrent && (
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center shadow-lg shrink-0"
                              style={{
                                backgroundColor: theme.colors.accent,
                                color: theme.colors.accentText,
                              }}
                            >
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          )}
                        </div>

                        <p className="text-xs text-white/65 line-clamp-2 mb-3 leading-relaxed">
                          {theme.tagline}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-white/10">
                        <div className="flex items-center gap-1.5">
                          {theme.previewPalette.map((col, cIdx) => (
                            <div
                              key={cIdx}
                              className="w-4 h-4 border border-white/20 shadow-xs"
                              style={{
                                backgroundColor: col,
                                borderRadius: themeStruct.cardRadius === '0px' ? '0px' : '9999px',
                              }}
                              title={col}
                            />
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectTheme(theme);
                          }}
                          className="px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider transition cursor-pointer"
                          style={{
                            backgroundColor: isCurrent ? `${theme.colors.accent}30` : theme.colors.accent,
                            color: isCurrent ? theme.colors.accent : theme.colors.accentText,
                            border: isCurrent ? `1px solid ${theme.colors.accent}` : 'none',
                            borderRadius: themeStruct.btnRadius,
                            clipPath: themeStruct.btnClipPath || 'none',
                            fontFamily: themeStruct.fontDisplay,
                          }}
                        >
                          {isCurrent ? 'Active' : 'Apply Theme'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sync / Profile Persistence */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-white">Save with Athlete Profile</div>
                <div className="text-xs text-white/40">
                  Save {activeLayout} layout & {activeTheme.name} theme automatically with profile: {userProfile.name}
                </div>
              </div>
              <input
                type="checkbox"
                checked={saveToProfile}
                onChange={(e) => setSaveToProfile(e.target.checked)}
                className="w-4 h-4 accent-[#facc15] cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-[#141416]/95 flex items-center justify-between">
          <div className="text-xs font-mono-meta text-white/40">
            Active: <span className="text-yellow-400 font-bold uppercase">{activeLayout}</span> • {activeTheme.name}
          </div>

          <button
            onClick={onClose}
            className="px-6 py-2 text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-lg pill-btn-accent"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
