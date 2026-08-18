import React, { useState, useEffect } from 'react';
import {
  X,
  Target,
  Calculator,
  Flame,
  Check,
  RotateCcw,
  Sparkles,
  Users,
  User,
  Scale,
  TrendingDown,
  ArrowRight,
  Zap,
  Palette,
  ArrowUpDown,
  FileJson,
  QrCode,
  AlertTriangle,
} from 'lucide-react';
import { UserProfile } from '../types/nutrition';
import {
  calculateBMR,
  calculateRecommendedMacros,
  calculateTDEE,
  calculateWeightObjectivePlan,
} from '../services/nutritionMath';
import { playSuccessChime, triggerHaptic } from '../services/audioFeedback';
import { themeService, APP_THEMES } from '../services/themeService';

interface GoalsAndTdeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onSaveProfile: (updated: Partial<UserProfile>) => void;
  onOpenProfileManager?: () => void;
  onOpenWeightObjective?: () => void;
  onOpenThemeModal?: () => void;
  onOpenDataManagement?: () => void;
  onOpenOnboardingWizard?: () => void;
  onOpenFirebaseAuth?: () => void;
}

export const GoalsAndTdeeModal: React.FC<GoalsAndTdeeModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onSaveProfile,
  onOpenProfileManager,
  onOpenWeightObjective,
  onOpenThemeModal,
  onOpenDataManagement,
  onOpenOnboardingWizard,
  onOpenFirebaseAuth,
}) => {
  const currentTheme = themeService.getActiveTheme();
  const [selectedThemeId, setSelectedThemeId] = useState<string>(userProfile.themeId || currentTheme.id);

  const [name, setName] = useState<string>(userProfile.name);
  const [gender, setGender] = useState<UserProfile['gender']>(userProfile.gender);
  const [age, setAge] = useState<number | string>(userProfile.age);
  const [heightCm, setHeightCm] = useState<number | string>(userProfile.heightCm);
  const [weightKg, setWeightKg] = useState<number | string>(userProfile.weightKg);
  const [activityLevel, setActivityLevel] = useState<UserProfile['activityLevel']>(
    userProfile.activityLevel
  );
  const [goalType, setGoalType] = useState<UserProfile['goalType']>(userProfile.goalType);

  // Safe numerical values for calculation
  const numAge = typeof age === 'number' ? age : parseInt(age, 10) || 25;
  const numHeight = typeof heightCm === 'number' ? heightCm : parseFloat(heightCm) || 175;
  const numWeight = typeof weightKg === 'number' ? weightKg : parseFloat(weightKg) || 70;

  // Computed BMR & TDEE
  const bmr = calculateBMR(gender, numWeight, numHeight, numAge);
  const tdee = calculateTDEE(bmr, activityLevel);
  const rec = calculateRecommendedMacros(tdee, numWeight, goalType);

  // Target overrides
  const [targetCalories, setTargetCalories] = useState<number | string>(userProfile.targetCalories);
  const [targetProteinG, setTargetProteinG] = useState<number | string>(userProfile.targetProteinG);
  const [targetCarbsG, setTargetCarbsG] = useState<number | string>(userProfile.targetCarbsG);
  const [targetFatG, setTargetFatG] = useState<number | string>(userProfile.targetFatG);
  const [targetFiberG, setTargetFiberG] = useState<number | string>(userProfile.targetFiberG);
  const [targetWaterMl, setTargetWaterMl] = useState<number | string>(userProfile.targetWaterMl);

  // Sync state whenever userProfile changes when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedThemeId(userProfile.themeId || currentTheme.id);
      setName(userProfile.name);
      setGender(userProfile.gender);
      setAge(userProfile.age);
      setHeightCm(userProfile.heightCm);
      setWeightKg(userProfile.weightKg);
      setActivityLevel(userProfile.activityLevel);
      setGoalType(userProfile.goalType);
      setTargetCalories(userProfile.targetCalories);
      setTargetProteinG(userProfile.targetProteinG);
      setTargetCarbsG(userProfile.targetCarbsG);
      setTargetFatG(userProfile.targetFatG);
      setTargetFiberG(userProfile.targetFiberG);
      setTargetWaterMl(userProfile.targetWaterMl);
    }
  }, [isOpen, userProfile]);

  if (!isOpen) return null;

  // Live weight objective plan if configured
  const weightObjective = userProfile.weightObjective;
  const objectivePlan = weightObjective
    ? calculateWeightObjectivePlan({
        currentWeightKg: numWeight,
        targetWeightKg: weightObjective.targetWeightKg,
        tdee,
        gender,
        mode: weightObjective.mode,
        paceKgPerWeek: weightObjective.paceKgPerWeek,
        targetDate: weightObjective.targetDate,
        highProteinPreservation: weightObjective.preserveMuscleHighProtein !== false,
      })
    : null;

  // Single unified recommended macro plan: driven by weightObjective if active, else rec
  const activeRecommended = objectivePlan
    ? {
        targetCalories: objectivePlan.targetCalories,
        targetProteinG: objectivePlan.macros.proteinG,
        targetCarbsG: objectivePlan.macros.carbsG,
        targetFatG: objectivePlan.macros.fatG,
        targetFiberG: objectivePlan.macros.fiberG,
        targetWaterMl: objectivePlan.macros.waterMl,
      }
    : rec;

  const handleApplyRecommended = () => {
    setTargetCalories(activeRecommended.targetCalories);
    setTargetProteinG(activeRecommended.targetProteinG);
    setTargetCarbsG(activeRecommended.targetCarbsG);
    setTargetFatG(activeRecommended.targetFatG);
    setTargetFiberG(activeRecommended.targetFiberG);
    setTargetWaterMl(activeRecommended.targetWaterMl);
    triggerHaptic('light');
  };

  const handleSave = () => {
    const finalAge = typeof age === 'number' ? age : parseInt(age, 10) || userProfile.age || 25;
    const finalHeight = typeof heightCm === 'number' ? heightCm : parseFloat(heightCm) || userProfile.heightCm || 175;
    const finalWeight = typeof weightKg === 'number' ? weightKg : parseFloat(weightKg) || userProfile.weightKg || 70;
    const finalCalories = typeof targetCalories === 'number' ? targetCalories : parseInt(targetCalories, 10) || activeRecommended.targetCalories;
    const finalProtein = typeof targetProteinG === 'number' ? targetProteinG : parseFloat(targetProteinG) || activeRecommended.targetProteinG;
    const finalCarbs = typeof targetCarbsG === 'number' ? targetCarbsG : parseFloat(targetCarbsG) || activeRecommended.targetCarbsG;
    const finalFat = typeof targetFatG === 'number' ? targetFatG : parseFloat(targetFatG) || activeRecommended.targetFatG;
    const finalFiber = typeof targetFiberG === 'number' ? targetFiberG : parseFloat(targetFiberG) || activeRecommended.targetFiberG;
    const finalWater = typeof targetWaterMl === 'number' ? targetWaterMl : parseInt(targetWaterMl, 10) || activeRecommended.targetWaterMl;

    onSaveProfile({
      name: name.trim() || userProfile.name,
      gender,
      age: finalAge,
      heightCm: finalHeight,
      weightKg: finalWeight,
      activityLevel,
      goalType,
      themeId: selectedThemeId,
      bmr,
      tdee,
      targetCalories: finalCalories,
      targetProteinG: finalProtein,
      targetCarbsG: finalCarbs,
      targetFatG: finalFat,
      targetFiberG: finalFiber,
      targetWaterMl: finalWater,
    });

    if (selectedThemeId !== currentTheme.id) {
      themeService.setTheme(selectedThemeId);
    }

    playSuccessChime();
    triggerHaptic('success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 text-white">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Goals & Settings</h3>
              <p className="text-[11px] text-slate-400">TDEE calculator & app appearance preferences</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {onOpenThemeModal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenThemeModal();
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-sky-400 font-semibold transition cursor-pointer"
                title="Open Theme Studio"
              >
                <Palette className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Themes</span>
              </button>
            )}
            {onOpenProfileManager && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenProfileManager();
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-[#facc15] font-semibold transition cursor-pointer"
                title="Manage All Profiles"
              >
                <Users className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Profiles</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-4 overflow-y-auto space-y-4 text-white flex-1">
          {/* THEME & APPEARANCE PICKER CARD */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-sky-400" />
                App Theme & Style
              </label>
              {onOpenThemeModal && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenThemeModal();
                  }}
                  className="text-[11px] text-sky-400 hover:underline font-semibold cursor-pointer"
                >
                  Structural Styles & Themes Studio →
                </button>
              )}
            </div>

            {/* Quick Theme Preview Selector Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {APP_THEMES.slice(0, 8).map((theme) => {
                const isSelected = selectedThemeId === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => {
                      setSelectedThemeId(theme.id);
                      themeService.setTheme(theme.id);
                      triggerHaptic('light');
                    }}
                    className={`p-2 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-white/50 bg-slate-700/80 shadow-md ring-1 ring-white/40'
                        : 'border-slate-700 bg-slate-900/60 hover:border-slate-600 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-xs">{theme.icon}</span>
                      <div className="flex items-center gap-0.5">
                        {theme.previewPalette.slice(0, 3).map((col, idx) => (
                          <div
                            key={idx}
                            className="w-2 h-2 rounded-full border border-white/20"
                            style={{ backgroundColor: col }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="text-[11px] font-bold truncate text-white">
                      {theme.name}
                    </div>
                    <div className="text-[9px] text-slate-400 truncate">
                      {theme.category}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Profile Name & Switch Bar */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#facc15]" />
                Athlete / Profile Name
              </label>
              {onOpenProfileManager && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenProfileManager();
                  }}
                  className="text-[11px] text-[#facc15] hover:underline font-semibold cursor-pointer"
                >
                  Switch / Add Profile →
                </button>
              )}
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Rivera"
              className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm font-bold text-white outline-none"
            />
          </div>

          {/* Quick Hub Actions for Mobile & Desktop */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {onOpenProfileManager && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenProfileManager();
                }}
                className="p-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-left transition cursor-pointer flex items-center gap-2 group"
              >
                <Users className="w-4 h-4 text-[#facc15] shrink-0 group-hover:scale-110 transition" />
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-white truncate">Profiles</div>
                  <div className="text-[9px] text-slate-400 truncate">Switch & add athletes</div>
                </div>
              </button>
            )}

            {onOpenOnboardingWizard && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenOnboardingWizard();
                }}
                className="p-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-amber-500/30 text-left transition cursor-pointer flex items-center gap-2 group"
              >
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0 group-hover:scale-110 transition" />
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-amber-300 truncate">Recalibrate</div>
                  <div className="text-[9px] text-slate-400 truncate">Onboarding wizard</div>
                </div>
              </button>
            )}

            {onOpenFirebaseAuth && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenFirebaseAuth();
                }}
                className="p-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-blue-500/30 text-left transition cursor-pointer flex items-center gap-2 group"
              >
                <Zap className="w-4 h-4 text-blue-400 shrink-0 group-hover:scale-110 transition" />
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-blue-300 truncate">Firebase Cloud</div>
                  <div className="text-[9px] text-slate-400 truncate">Auth & live cluster</div>
                </div>
              </button>
            )}

            {onOpenDataManagement && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenDataManagement();
                }}
                className="p-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-left transition cursor-pointer flex items-center gap-2 group"
              >
                <ArrowUpDown className="w-4 h-4 text-emerald-400 shrink-0 group-hover:scale-110 transition" />
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-white truncate">Data / QR</div>
                  <div className="text-[9px] text-slate-400 truncate">JSON backup & QR sync</div>
                </div>
              </button>
            )}
          </div>

          {/* Biometrics Input Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Age</label>
              <input
                type="number"
                min="14"
                max="100"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="25"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-xs font-bold text-white text-center"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Height (cm)</label>
              <input
                type="number"
                min="100"
                max="250"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                placeholder="175"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-xs font-bold text-white text-center"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Weight (kg)</label>
              <input
                type="number"
                min="30"
                max="300"
                step="0.5"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                placeholder="70"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-xs font-bold text-white text-center"
              />
            </div>
          </div>

          {/* Activity Level */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Daily Activity Multiplier
            </label>
            <select
              value={activityLevel}
              onChange={(e) => setActivityLevel(e.target.value as any)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
            >
              <option value="sedentary">Sedentary (Desk Job, Little to no exercise - 1.2x)</option>
              <option value="light">Light Activity (Exercise 1-3 days/wk - 1.375x)</option>
              <option value="moderate">Moderate Activity (Exercise 3-5 days/wk - 1.55x)</option>
              <option value="very_active">Very Active (Heavy training 6-7 days/wk - 1.725x)</option>
              <option value="extra_active">Extra Active (Athlete / physical labor - 1.9x)</option>
            </select>
          </div>

          {/* Weight Objective & Caloric Deficit Planner Section */}
          <div className="bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-500/5 border border-[#facc15]/30 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[#facc15]/20 text-[#facc15]">
                  <Scale className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>Weight Objective & Caloric Deficit</span>
                    <span className="px-1.5 py-0.2 rounded bg-yellow-400/20 text-[#facc15] text-[9px] font-mono-meta">
                      7,700 kcal/kg
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {objectivePlan
                      ? `Target: ${weightObjective?.targetWeightKg} kg • Deficit: -${objectivePlan.dailyDeficitKcal} kcal/day`
                      : 'Set a target weight to automatically calculate your exact caloric deficit'}
                  </div>
                </div>
              </div>

              {onOpenWeightObjective && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenWeightObjective();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#facc15] hover:bg-yellow-300 text-slate-950 text-xs font-bold font-oswald tracking-wide flex items-center gap-1 transition cursor-pointer shadow-md"
                >
                  <span>{objectivePlan ? 'ADJUST' : 'PLAN'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {objectivePlan && (
              <>
                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/10 text-center">
                  <div className="bg-slate-900/70 rounded-lg p-1.5">
                    <div className="text-[9px] text-slate-400 uppercase font-mono-meta">Delta</div>
                    <div className="text-xs font-bold text-white">
                      {objectivePlan.direction === 'loss'
                        ? `-${objectivePlan.deltaKg} kg`
                        : objectivePlan.direction === 'gain'
                        ? `+${objectivePlan.deltaKg} kg`
                        : '0 kg'}
                    </div>
                  </div>
                  <div className="bg-slate-900/70 rounded-lg p-1.5">
                    <div className="text-[9px] text-slate-400 uppercase font-mono-meta">Daily Deficit</div>
                    <div className="text-xs font-bold text-[#facc15]">
                      {objectivePlan.dailyDeficitKcal > 0
                        ? `-${objectivePlan.dailyDeficitKcal} kcal`
                        : objectivePlan.dailyDeficitKcal < 0
                        ? `+${Math.abs(objectivePlan.dailyDeficitKcal)} kcal`
                        : '0 kcal'}
                    </div>
                  </div>
                  <div className="bg-slate-900/70 rounded-lg p-1.5">
                    <div className="text-[9px] text-slate-400 uppercase font-mono-meta">Target Date</div>
                    <div className="text-xs font-bold text-sky-400">
                      {new Date(objectivePlan.projectedDate + 'T12:00:00').toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                  </div>
                </div>

                {objectivePlan.dateWasAdjusted && (
                  <div className="flex items-start gap-2 p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-[11px] text-amber-200/90 leading-tight">
                      Your target date was too soon — showing a realistic 7-day minimum plan instead.
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Goal Preset Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Fitness Strategy
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {(
                [
                  { id: 'cut', label: 'Fat Loss Cut (-20%)' },
                  { id: 'maintain', label: 'Maintenance (0%)' },
                  { id: 'bulk', label: 'Lean Bulk (+12%)' },
                  { id: 'keto', label: 'Ketogenic' },
                ] as const
              ).map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setGoalType(g.id)}
                  className={`py-2 px-1 text-[11px] font-bold rounded-xl text-center transition cursor-pointer ${
                    goalType === g.id
                      ? 'bg-emerald-500 text-slate-950 shadow-md'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Energy Breakdown Card */}
          <div className="p-3.5 bg-slate-800/80 border border-slate-700 rounded-2xl flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400">BMR: <strong className="text-white">{bmr} kcal</strong></div>
              <div className="text-xs text-slate-400">TDEE: <strong className="text-white">{tdee} kcal/day</strong></div>
            </div>
            <div className="text-right">
              <div className="text-xs text-emerald-400 font-bold">
                {objectivePlan ? 'Objective Target' : 'Recommended Target'}
              </div>
              <div className="text-lg font-black text-white">{activeRecommended.targetCalories} kcal</div>
            </div>
          </div>

          {/* Custom Targets Form with Recalculate Button */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">Custom Target Goals</span>
              <button
                type="button"
                onClick={handleApplyRecommended}
                className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                Apply Scientific Recommendation
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-2.5">
                <label className="text-[10px] uppercase font-bold text-emerald-400 block mb-1">
                  Daily Calories (kcal)
                </label>
                <input
                  type="number"
                  value={targetCalories}
                  onChange={(e) => setTargetCalories(e.target.value)}
                  placeholder="2000"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm font-bold text-white text-center"
                />
              </div>

              <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-2.5">
                <label className="text-[10px] uppercase font-bold text-sky-400 block mb-1">
                  Water Target (ml)
                </label>
                <input
                  type="number"
                  value={targetWaterMl}
                  onChange={(e) => setTargetWaterMl(e.target.value)}
                  placeholder="2500"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm font-bold text-white text-center"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-2 text-center">
                <label className="text-[10px] font-bold text-indigo-400 block mb-1">Protein (g)</label>
                <input
                  type="number"
                  value={targetProteinG}
                  onChange={(e) => setTargetProteinG(e.target.value)}
                  placeholder="150"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-1.5 py-1 text-xs font-bold text-white text-center"
                />
              </div>

              <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-2 text-center">
                <label className="text-[10px] font-bold text-amber-400 block mb-1">Carbs (g)</label>
                <input
                  type="number"
                  value={targetCarbsG}
                  onChange={(e) => setTargetCarbsG(e.target.value)}
                  placeholder="200"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-1.5 py-1 text-xs font-bold text-white text-center"
                />
              </div>

              <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-2 text-center">
                <label className="text-[10px] font-bold text-rose-400 block mb-1">Fat (g)</label>
                <input
                  type="number"
                  value={targetFatG}
                  onChange={(e) => setTargetFatG(e.target.value)}
                  placeholder="60"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-1.5 py-1 text-xs font-bold text-white text-center"
                />
              </div>

              <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-2 text-center">
                <label className="text-[10px] font-bold text-teal-400 block mb-1">Fiber (g)</label>
                <input
                  type="number"
                  value={targetFiberG}
                  onChange={(e) => setTargetFiberG(e.target.value)}
                  placeholder="30"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-1.5 py-1 text-xs font-bold text-white text-center"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90">
          <button
            onClick={handleSave}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm rounded-xl shadow-lg transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            Save Biometric Goals
          </button>
        </div>
      </div>
    </div>
  );
};
