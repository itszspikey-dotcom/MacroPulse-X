import React, { useState, useEffect } from 'react';
import {
  X,
  Target,
  Flame,
  Calendar,
  Sparkles,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Scale,
  Zap,
  ArrowRight,
  ShieldAlert,
  Info,
  Sliders,
} from 'lucide-react';
import { UserProfile, WeightObjective } from '../types/nutrition';
import {
  calculateBMR,
  calculateTDEE,
  calculateWeightObjectivePlan,
  WeightObjectivePlan,
} from '../services/nutritionMath';
import { playSuccessChime, triggerHaptic } from '../services/audioFeedback';

interface WeightObjectiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onSaveObjective: (updatedProfile: Partial<UserProfile>) => void;
}

export const WeightObjectiveModal: React.FC<WeightObjectiveModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onSaveObjective,
}) => {
  if (!isOpen) return null;

  const [unitSystem, setUnitSystem] = useState<'kg' | 'lbs'>('kg');
  const [currentWeightInput, setCurrentWeightInput] = useState<string>(userProfile.weightKg.toString());
  const initialTgt =
    userProfile.weightObjective?.targetWeightKg ||
    (userProfile.goalType === 'cut'
      ? Math.round((userProfile.weightKg - 5) * 10) / 10
      : userProfile.goalType === 'bulk'
      ? Math.round((userProfile.weightKg + 4) * 10) / 10
      : userProfile.weightKg);
  const [targetWeightInput, setTargetWeightInput] = useState<string>(initialTgt.toString());

  const [mode, setMode] = useState<'pace' | 'target_date'>(
    userProfile.weightObjective?.mode || 'pace'
  );
  const [paceKgPerWeek, setPaceKgPerWeek] = useState<number>(
    userProfile.weightObjective?.paceKgPerWeek || 0.5
  );

  // Conversion helpers
  const toLbs = (kg: number) => Math.round(kg * 2.20462 * 10) / 10;
  const fromLbs = (lbs: number) => Math.round((lbs / 2.20462) * 10) / 10;

  // Safe numerical parsing
  const parsedCurrent = parseFloat(currentWeightInput) || userProfile.weightKg || 70;
  const parsedTarget = parseFloat(targetWeightInput) || initialTgt || 65;

  const currentWeightKg = unitSystem === 'kg' ? parsedCurrent : fromLbs(parsedCurrent);
  const targetWeightKg = unitSystem === 'kg' ? parsedTarget : fromLbs(parsedTarget);

  const handleToggleUnit = (newUnit: 'kg' | 'lbs') => {
    if (newUnit === unitSystem) return;
    if (newUnit === 'lbs') {
      const curNum = parseFloat(currentWeightInput);
      const tgtNum = parseFloat(targetWeightInput);
      if (!isNaN(curNum)) setCurrentWeightInput(toLbs(curNum).toString());
      if (!isNaN(tgtNum)) setTargetWeightInput(toLbs(tgtNum).toString());
    } else {
      const curNum = parseFloat(currentWeightInput);
      const tgtNum = parseFloat(targetWeightInput);
      if (!isNaN(curNum)) setCurrentWeightInput(fromLbs(curNum).toString());
      if (!isNaN(tgtNum)) setTargetWeightInput(fromLbs(tgtNum).toString());
    }
    setUnitSystem(newUnit);
  };

  // Default target date 10 weeks in future
  const defaultFutureDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 70);
    return d.toISOString().split('T')[0];
  };

  const [targetDate, setTargetDate] = useState<string>(
    userProfile.weightObjective?.targetDate || defaultFutureDate()
  );
  const [preserveMuscle, setPreserveMuscle] = useState<boolean>(
    userProfile.weightObjective?.preserveMuscleHighProtein !== false
  );

  // Compute live plan
  const bmr = calculateBMR(
    userProfile.gender,
    currentWeightKg,
    userProfile.heightCm,
    userProfile.age
  );
  const tdee = calculateTDEE(bmr, userProfile.activityLevel);

  const plan: WeightObjectivePlan = calculateWeightObjectivePlan({
    currentWeightKg,
    targetWeightKg,
    tdee,
    gender: userProfile.gender,
    mode,
    paceKgPerWeek,
    targetDate,
    highProteinPreservation: preserveMuscle,
  });

  const displayDelta = unitSystem === 'kg' ? plan.deltaKg : toLbs(plan.deltaKg);

  const handleApply = () => {
    const finalWeightKg = currentWeightKg;
    const finalTargetKg = targetWeightKg;

    const weightObj: WeightObjective = {
      targetWeightKg: finalTargetKg,
      paceKgPerWeek: plan.paceKgPerWeek,
      mode,
      targetDate: plan.projectedDate,
      startDate: userProfile.weightObjective?.startDate || new Date().toISOString().split('T')[0],
      startWeightKg: userProfile.weightObjective?.startWeightKg || finalWeightKg,
      deficitStrategy:
        paceKgPerWeek <= 0.25
          ? 'gentle'
          : paceKgPerWeek <= 0.5
          ? 'standard'
          : 'aggressive',
      preserveMuscleHighProtein: preserveMuscle,
    };

    const newGoalType =
      plan.direction === 'loss' ? 'cut' : plan.direction === 'gain' ? 'bulk' : 'maintain';

    onSaveObjective({
      weightKg: finalWeightKg,
      goalType: newGoalType,
      targetCalories: plan.targetCalories,
      targetProteinG: plan.macros.proteinG,
      targetCarbsG: plan.macros.carbsG,
      targetFatG: plan.macros.fatG,
      targetFiberG: plan.macros.fiberG,
      targetWaterMl: plan.macros.waterMl,
      weightObjective: weightObj,
    });

    playSuccessChime();
    triggerHaptic('success');
    onClose();
  };

  const PACE_PRESETS = [
    {
      pace: 0.25,
      label: 'Gentle',
      desc: '-0.25 kg/wk (~275 kcal/d deficit)',
      badge: 'Easy to sustain',
      badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      pace: 0.5,
      label: 'Optimal Standard',
      desc: '-0.50 kg/wk (~550 kcal/d deficit)',
      badge: 'Gold Standard',
      badgeColor: 'text-[#facc15] bg-yellow-500/10 border-yellow-500/20',
    },
    {
      pace: 0.75,
      label: 'Aggressive Cut',
      desc: '-0.75 kg/wk (~825 kcal/d deficit)',
      badge: 'High Discipline',
      badgeColor: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    },
    {
      pace: 1.0,
      label: 'Rapid Cut',
      desc: '-1.00 kg/wk (~1100 kcal/d deficit)',
      badge: 'Short-term only',
      badgeColor: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#141416] border border-white/15 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-[#0b0b0c] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#facc15]/10 border border-[#facc15]/20 text-[#facc15]">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-oswald font-bold tracking-wide text-white uppercase">
                  Weight Objective & Caloric Deficit Planner
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-yellow-400/10 border border-yellow-400/30 text-[10px] font-mono-meta text-[#facc15] font-bold">
                  Scientific 7,700 kcal/kg
                </span>
              </div>
              <p className="text-xs text-white/50">
                Precision caloric deficit calculation based on your target weight and timeline
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-white flex-1 ios-scroll">
          {/* Unit Toggle & Weight Inputs */}
          <div className="p-4 bg-[#0e0e10] border border-white/10 rounded-2xl space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono-meta uppercase tracking-wider text-white/70 font-semibold flex items-center gap-2">
                <Scale className="w-4 h-4 text-[#facc15]" />
                Target Weight Objective
              </span>
              <div className="flex items-center bg-[#141416] p-0.5 rounded-lg border border-white/10">
                <button
                  type="button"
                  onClick={() => handleToggleUnit('kg')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                    unitSystem === 'kg'
                      ? 'bg-[#facc15] text-slate-950 shadow'
                      : 'text-white/40 hover:text-white'
                  }`}
                >
                  KG
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleUnit('lbs')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                    unitSystem === 'lbs'
                      ? 'bg-[#facc15] text-slate-950 shadow'
                      : 'text-white/40 hover:text-white'
                  }`}
                >
                  LBS
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Current Weight */}
              <div className="bg-[#141416] border border-white/10 rounded-xl p-3">
                <div className="text-[11px] font-medium text-white/50 mb-1 flex items-center justify-between">
                  <span>Current Weight</span>
                  <span className="font-mono-meta text-[10px] text-white/30">From Profile</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    min="30"
                    max="300"
                    value={currentWeightInput}
                    onChange={(e) => setCurrentWeightInput(e.target.value)}
                    placeholder={unitSystem === 'kg' ? '70' : '154'}
                    className="w-full bg-[#0b0b0c] border border-white/10 focus:border-[#facc15] rounded-lg px-3 py-2 text-lg font-oswald font-bold text-white outline-none text-center"
                  />
                  <span className="font-mono-meta text-xs text-white/40 uppercase font-bold">
                    {unitSystem}
                  </span>
                </div>
              </div>

              {/* Target Weight */}
              <div className="bg-[#141416] border border-[#facc15]/30 rounded-xl p-3 shadow-inner shadow-yellow-500/5">
                <div className="text-[11px] font-bold text-[#facc15] mb-1 flex items-center justify-between">
                  <span>Target Weight Objective</span>
                  <span className="font-mono-meta text-[10px] text-[#facc15]/70 uppercase">
                    {plan.direction === 'loss'
                      ? `Loss: -${displayDelta} ${unitSystem}`
                      : plan.direction === 'gain'
                      ? `Gain: +${displayDelta} ${unitSystem}`
                      : 'Maintain'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    min="30"
                    max="300"
                    value={targetWeightInput}
                    onChange={(e) => setTargetWeightInput(e.target.value)}
                    placeholder={unitSystem === 'kg' ? '65' : '143'}
                    className="w-full bg-[#0b0b0c] border border-[#facc15]/50 focus:border-[#facc15] rounded-lg px-3 py-2 text-lg font-oswald font-bold text-yellow-300 outline-none text-center"
                  />
                  <span className="font-mono-meta text-xs text-white/40 uppercase font-bold">
                    {unitSystem}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Delta Sliders/Buttons */}
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <span className="text-[11px] text-white/40 font-mono-meta">Quick Targets:</span>
              {[-2, -5, -8, -10, +3, +5].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    const nextKg = Math.max(35, Math.round((currentWeightKg + d) * 10) / 10);
                    const nextVal = unitSystem === 'kg' ? nextKg : toLbs(nextKg);
                    setTargetWeightInput(nextVal.toString());
                    triggerHaptic('light');
                  }}
                  className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-lg text-xs font-mono-meta font-semibold transition cursor-pointer"
                >
                  {d > 0 ? `+${d}` : d} kg
                </button>
              ))}
            </div>
          </div>

          {/* Planning Mode: Weekly Pace vs. Target Date */}
          <div className="p-4 bg-[#0e0e10] border border-white/10 rounded-2xl space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono-meta uppercase tracking-wider text-white/70 font-semibold flex items-center gap-2">
                <Sliders className="w-4 h-4 text-sky-400" />
                Deficit Calculation Strategy
              </span>
              <div className="flex items-center bg-[#141416] p-0.5 rounded-lg border border-white/10">
                <button
                  type="button"
                  onClick={() => setMode('pace')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                    mode === 'pace'
                      ? 'bg-sky-500 text-slate-950 shadow'
                      : 'text-white/40 hover:text-white'
                  }`}
                >
                  Weekly Pace
                </button>
                <button
                  type="button"
                  onClick={() => setMode('target_date')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                    mode === 'target_date'
                      ? 'bg-sky-500 text-slate-950 shadow'
                      : 'text-white/40 hover:text-white'
                  }`}
                >
                  Target Date / Deadline
                </button>
              </div>
            </div>

            {/* Mode 1: Weekly Pace Presets */}
            {mode === 'pace' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {PACE_PRESETS.map((item) => {
                    const isSelected = Math.abs(paceKgPerWeek - item.pace) < 0.05;
                    return (
                      <button
                        key={item.pace}
                        type="button"
                        onClick={() => {
                          setPaceKgPerWeek(item.pace);
                          triggerHaptic('light');
                        }}
                        className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-sky-500/10 border-sky-400/60 shadow-lg shadow-sky-500/5'
                            : 'bg-[#141416] border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <span className="font-oswald text-sm font-bold uppercase text-white tracking-wide">
                            {item.label}
                          </span>
                          <span
                            className={`text-[10px] font-mono-meta font-bold px-1.5 py-0.5 rounded-full border ${item.badgeColor}`}
                          >
                            {item.badge}
                          </span>
                        </div>
                        <div className="text-xs text-white/60 font-medium">{item.desc}</div>
                      </button>
                    );
                  })}
                </div>

                {/* Fine-tune pace slider */}
                <div className="bg-[#141416] border border-white/10 rounded-xl p-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/50">Custom Weekly Pace:</span>
                    <span className="font-mono-meta font-bold text-[#facc15]">
                      {paceKgPerWeek} kg/week (
                      {Math.round(paceKgPerWeek * 2.20462 * 10) / 10} lbs/wk)
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1.2"
                    step="0.05"
                    value={paceKgPerWeek}
                    onChange={(e) => setPaceKgPerWeek(parseFloat(e.target.value))}
                    className="w-full accent-[#facc15] cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* Mode 2: Target Date / Deadline */}
            {mode === 'target_date' && (
              <div className="bg-[#141416] border border-white/10 rounded-xl p-3.5 space-y-2.5">
                <label className="text-xs font-semibold text-white/70 block flex items-center justify-between">
                  <span>Select Target Goal Date</span>
                  <span className="text-xs font-mono-meta text-sky-400 font-bold">
                    {plan.daysNeeded} days ({plan.weeksNeeded} weeks) remaining
                  </span>
                </label>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#0b0b0c] border border-white/10 rounded-lg text-sky-400">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <input
                    type="date"
                    value={targetDate}
                    min={new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="bg-[#0b0b0c] border border-white/15 focus:border-sky-400 rounded-lg px-3 py-2 text-sm font-semibold text-white outline-none flex-1"
                  />
                </div>
                <p className="text-[11px] text-white/40">
                  The algorithm calculates the required daily caloric deficit to hit exactly{' '}
                  {unitSystem === 'kg' ? targetWeightKg : toLbs(targetWeightKg)} {unitSystem} by {targetDate}.
                </p>
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* LIVE DEFICIT & TIMELINE PROJECTION RESULTS               */}
          {/* ======================================================== */}
          <div className="p-4 sm:p-5 bg-gradient-to-br from-[#18181b] to-[#121214] border border-[#facc15]/30 rounded-2xl space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-[#facc15]" />
                <h3 className="font-oswald text-base font-bold uppercase text-white tracking-wide">
                  Caloric Deficit & Projection Breakdown
                </h3>
              </div>
              <span
                className={`text-[10px] font-mono-meta font-bold uppercase px-2 py-0.5 rounded-full border ${
                  plan.safetyLevel === 'optimal'
                    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                    : plan.safetyLevel === 'moderate'
                    ? 'text-[#facc15] bg-yellow-500/10 border-yellow-500/30'
                    : plan.safetyLevel === 'aggressive'
                    ? 'text-orange-400 bg-orange-500/10 border-orange-500/30'
                    : 'text-rose-400 bg-rose-500/10 border-rose-500/30'
                }`}
              >
                {plan.safetyLevel.replace('_', ' ')}
              </span>
            </div>

            {/* Key 3 Stat Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
              {/* Daily Deficit */}
              <div className="bg-[#0e0e10] border border-white/10 rounded-xl p-3">
                <div className="text-[10px] font-mono-meta uppercase text-white/40 mb-0.5">
                  Daily Energy Deficit
                </div>
                <div className="font-oswald text-2xl font-bold text-[#facc15]">
                  {plan.dailyDeficitKcal > 0
                    ? `-${plan.dailyDeficitKcal}`
                    : plan.dailyDeficitKcal < 0
                    ? `+${Math.abs(plan.dailyDeficitKcal)}`
                    : '0'}{' '}
                  <span className="text-xs text-white/50">kcal/d</span>
                </div>
                <div className="text-[10px] text-white/40 mt-0.5">
                  TDEE ({tdee}) → Target ({plan.targetCalories})
                </div>
              </div>

              {/* Estimated Completion Date */}
              <div className="bg-[#0e0e10] border border-white/10 rounded-xl p-3">
                <div className="text-[10px] font-mono-meta uppercase text-white/40 mb-0.5">
                  Goal Completion Date
                </div>
                <div className="font-oswald text-xl font-bold text-white">
                  {new Date(plan.projectedDate + 'T12:00:00').toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>
                <div className="text-[10px] text-white/40 mt-0.5">
                  ~{plan.weeksNeeded} Weeks ({plan.daysNeeded} Days)
                </div>
              </div>

              {/* Rate of Body Weight */}
              <div className="bg-[#0e0e10] border border-white/10 rounded-xl p-3">
                <div className="text-[10px] font-mono-meta uppercase text-white/40 mb-0.5">
                  Weekly Rate of Change
                </div>
                <div className="font-oswald text-xl font-bold text-sky-400">
                  {plan.ratePctBodyWeightPerWeek}% <span className="text-xs text-white/50">BW/wk</span>
                </div>
                <div className="text-[10px] text-white/40 mt-0.5">
                  ~{plan.paceKgPerWeek} kg/week pace
                </div>
              </div>
            </div>

            {/* Safety & Metabolic Advisory Note */}
            <div className="p-3 bg-[#0e0e10] border border-white/10 rounded-xl flex items-start gap-2.5 text-xs text-white/70">
              <Info className="w-4 h-4 text-[#facc15] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white">Advisory: </span>
                {plan.safetyNote}
              </div>
            </div>

            {/* Muscle Preservation High Protein Toggle */}
            <div className="p-3 bg-[#0e0e10] border border-white/10 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                <div>
                  <div className="text-xs font-bold text-white">
                    Muscle-Preserving High Protein Strategy
                  </div>
                  <div className="text-[10px] text-white/40">
                    Sets 2.2g/kg protein intake to prevent lean tissue loss during deficit
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={preserveMuscle}
                onChange={(e) => setPreserveMuscle(e.target.checked)}
                className="w-4 h-4 accent-emerald-400 rounded cursor-pointer"
              />
            </div>

            {/* Calculated Macros Preview */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-mono-meta uppercase text-white/40 tracking-wider">
                Optimized Daily Nutrition Targets
              </div>
              <div className="grid grid-cols-4 gap-2">
                <div className="bg-[#0e0e10] border border-white/10 rounded-lg p-2 text-center">
                  <div className="text-[10px] font-bold text-indigo-400">Protein</div>
                  <div className="font-oswald text-sm font-bold text-white">
                    {plan.macros.proteinG}g
                  </div>
                </div>
                <div className="bg-[#0e0e10] border border-white/10 rounded-lg p-2 text-center">
                  <div className="text-[10px] font-bold text-amber-400">Carbs</div>
                  <div className="font-oswald text-sm font-bold text-white">
                    {plan.macros.carbsG}g
                  </div>
                </div>
                <div className="bg-[#0e0e10] border border-white/10 rounded-lg p-2 text-center">
                  <div className="text-[10px] font-bold text-rose-400">Fat</div>
                  <div className="font-oswald text-sm font-bold text-white">
                    {plan.macros.fatG}g
                  </div>
                </div>
                <div className="bg-[#0e0e10] border border-white/10 rounded-lg p-2 text-center">
                  <div className="text-[10px] font-bold text-emerald-400">Calories</div>
                  <div className="font-oswald text-sm font-bold text-white">
                    {plan.targetCalories}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/10 bg-[#0b0b0c] flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-mono-meta font-bold transition cursor-pointer"
          >
            CANCEL
          </button>
          <button
            onClick={handleApply}
            className="flex-1 py-3 bg-[#facc15] hover:bg-yellow-300 text-slate-950 font-oswald font-bold tracking-wider text-sm uppercase rounded-xl shadow-lg transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
            <span>Apply Weight Objective ({plan.targetCalories} kcal)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
