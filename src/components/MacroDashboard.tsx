import React from 'react';
import { Droplets, Flame, Sparkles, Target, Scale, ArrowRight, Zap, TrendingDown } from 'lucide-react';
import { DailySummary, UserProfile } from '../types/nutrition';
import { playSuccessChime, triggerHaptic } from '../services/audioFeedback';
import { calculateWeightObjectivePlan } from '../services/nutritionMath';

interface MacroDashboardProps {
  summary: DailySummary;
  userProfile: UserProfile;
  onAddWater: (amountMl: number) => void;
  onResetWater: () => void;
  onOpenGoalsModal: () => void;
  onOpenWeightObjectiveModal?: () => void;
}

export const MacroDashboard: React.FC<MacroDashboardProps> = ({
  summary,
  userProfile,
  onAddWater,
  onResetWater,
  onOpenGoalsModal,
  onOpenWeightObjectiveModal,
}) => {
  const targetCal = userProfile.targetCalories || 2000;
  const consumedCal = summary.calories;
  const remainingCal = targetCal - consumedCal;
  const calPct = Math.min(100, Math.round((consumedCal / targetCal) * 100));

  // TDEE & Deficit Math
  const tdee = userProfile.tdee || 2500;
  const actualNetDeficitToday = tdee - consumedCal;
  const plannedDeficit = tdee - targetCal;

  // Weight objective calculations
  const weightObj = userProfile.weightObjective;
  const objectivePlan = weightObj
    ? calculateWeightObjectivePlan({
        currentWeightKg: userProfile.weightKg,
        targetWeightKg: weightObj.targetWeightKg,
        tdee,
        gender: userProfile.gender,
        mode: weightObj.mode,
        paceKgPerWeek: weightObj.paceKgPerWeek,
        targetDate: weightObj.targetDate,
        highProteinPreservation: weightObj.preserveMuscleHighProtein !== false,
      })
    : null;

  // Circular ring math (radius = 85, circumference = 2 * PI * 85 ≈ 534)
  const radius = 85;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, calPct) / 100) * circumference;

  // Macros progress calculation
  const pTarget = userProfile.targetProteinG || 150;
  const cTarget = userProfile.targetCarbsG || 200;
  const fTarget = userProfile.targetFatG || 65;
  const fibTarget = userProfile.targetFiberG || 30;

  const pPct = Math.round((summary.protein / pTarget) * 100);
  const cPct = Math.round((summary.carbs / cTarget) * 100);
  const fPct = Math.round((summary.fat / fTarget) * 100);
  const fibPct = Math.round((summary.fiber / fibTarget) * 100);

  // Macro calorie energy contribution (4 kcal/g P, 4 kcal/g C, 9 kcal/g F)
  const pCal = summary.protein * 4;
  const cCal = summary.carbs * 4;
  const fCal = summary.fat * 9;
  const macroTotalCal = pCal + cCal + fCal || 1;

  const pRatio = Math.round((pCal / macroTotalCal) * 100);
  const cRatio = Math.round((cCal / macroTotalCal) * 100);
  const fRatio = Math.max(0, 100 - (pRatio + cRatio));

  // Hydration
  const waterTarget = userProfile.targetWaterMl || 3000;
  const waterConsumed = summary.waterMl || 0;

  const handleWaterClick = (amount: number) => {
    onAddWater(amount);
    playSuccessChime();
    triggerHaptic('light');
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Dynamic Weight Objective & Caloric Deficit Live Banner */}
      <div className="bg-gradient-to-r from-[#18181b] via-[#141416] to-[#121214] border border-[#facc15]/30 p-4 sm:p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl relative overflow-hidden">
        <div className="flex items-start sm:items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#facc15]/15 border border-[#facc15]/30 flex items-center justify-center text-[#facc15] shrink-0">
            <Scale className="w-5 h-5" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-oswald text-base sm:text-lg font-bold text-white uppercase tracking-wide">
                {objectivePlan ? (
                  <>
                    Weight Objective:{' '}
                    <span className="text-[#facc15]">{weightObj?.targetWeightKg} kg</span>
                  </>
                ) : (
                  'Active Caloric Deficit Engine'
                )}
              </span>

              {objectivePlan && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono-meta font-bold">
                  {objectivePlan.direction === 'loss'
                    ? `-${objectivePlan.deltaKg} kg to goal`
                    : objectivePlan.direction === 'gain'
                    ? `+${objectivePlan.deltaKg} kg to goal`
                    : 'At Target'}
                </span>
              )}

              <span className="px-2 py-0.5 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-[#facc15] text-[10px] font-mono-meta font-bold">
                {plannedDeficit > 0 ? `Target: -${plannedDeficit} kcal/day` : `Surplus: +${Math.abs(plannedDeficit)} kcal/day`}
              </span>
            </div>

            <div className="text-xs text-white/60 mt-1 flex items-center gap-2 sm:gap-3 flex-wrap">
              <span>
                Today's Net: <strong className={actualNetDeficitToday >= plannedDeficit ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                  {actualNetDeficitToday > 0 ? `-${actualNetDeficitToday}` : `+${Math.abs(actualNetDeficitToday)}`} kcal
                </strong>
              </span>
              <span>•</span>
              <span>
                TDEE: <strong className="text-white">{tdee} kcal</strong>
              </span>
              {objectivePlan && (
                <>
                  <span>•</span>
                  <span>
                    Est. Goal Date:{' '}
                    <strong className="text-sky-400">
                      {new Date(objectivePlan.projectedDate + 'T12:00:00').toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </strong>{' '}
                    (~{objectivePlan.weeksNeeded} wks)
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              if (onOpenWeightObjectiveModal) onOpenWeightObjectiveModal();
              else onOpenGoalsModal();
              triggerHaptic('light');
            }}
            className="w-full sm:w-auto px-4 py-2.5 bg-[#facc15] hover:bg-yellow-300 text-slate-950 rounded-xl font-oswald text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-lg flex items-center justify-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5 fill-slate-950" />
            <span>{objectivePlan ? 'Caloric Deficit Planner' : 'Set Weight Objective'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Calorie Ring Box — Spans 2 cols on lg */}
        <div className="lg:col-span-2 bg-radial from-[#1c1c1e] to-[#141416] border border-white/10 p-6 sm:p-8 rounded-sm flex flex-col items-center justify-center relative overflow-hidden cinematic-card">
          <div className="w-full flex items-center justify-between font-mono-meta text-xs text-white/40 mb-2">
            <span>Calorie Balance</span>
            <button
              onClick={onOpenGoalsModal}
              className="text-[#facc15] hover:underline cursor-pointer transition font-mono-meta text-[11px]"
            >
              TARGET: {targetCal} KCAL
            </button>
          </div>

          {/* Circular SVG Ring */}
          <div className="relative my-4 flex items-center justify-center">
            <svg width="210" height="210" className="transform -rotate-90">
              {/* Track */}
              <circle
                cx="105"
                cy="105"
                r={radius}
                stroke="rgba(255, 255, 255, 0.05)"
                strokeWidth="12"
                fill="none"
              />
              {/* Animated Progress */}
              <circle
                cx="105"
                cy="105"
                r={radius}
                stroke="var(--accent)"
                strokeWidth="12"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="butt"
                fill="none"
                className="transition-all duration-700 ease-out"
              />
            </svg>

            {/* Centered Large Calorie Stats */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="font-oswald text-4xl sm:text-5xl font-semibold tracking-tight text-white leading-none">
                {Math.abs(remainingCal).toLocaleString()}
              </span>
              <span className="font-mono-meta text-xs text-white/40 uppercase tracking-widest mt-1">
                {remainingCal >= 0 ? 'Left' : 'Over Target'}
              </span>
            </div>
          </div>

          {/* Subtitle Meta */}
          <div className="font-mono-meta text-xs text-white/40 uppercase tracking-widest text-center mt-2">
            {consumedCal.toLocaleString()} / {targetCal.toLocaleString()} KCAL CONSUMED ({calPct}%)
          </div>
        </div>

        {/* Protein Card */}
        <div className="cinematic-card p-6 rounded-sm flex flex-col justify-between">
          <div>
            <div className="font-mono-meta text-xs text-white/40 flex items-center justify-between">
              <span>Protein ({pPct}%)</span>
              <span className="theme-accent-text">{pRatio}% kcal</span>
            </div>
            <div className="font-oswald text-3xl sm:text-4xl text-white font-semibold my-2 tracking-tight">
              {summary.protein}g
            </div>
            <div className="font-mono-meta text-xs text-white/40">
              Goal: {pTarget}g
            </div>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mt-4">
            <div
              className="h-full transition-all duration-500"
              style={{
                width: `${Math.min(100, pPct)}%`,
                backgroundColor: 'var(--accent)',
              }}
            />
          </div>
        </div>

        {/* Carbs Card */}
        <div className="cinematic-card p-6 rounded-sm flex flex-col justify-between">
          <div>
            <div className="font-mono-meta text-xs text-white/40 flex items-center justify-between">
              <span>Carbs ({cPct}%)</span>
              <span className="theme-accent-text">{cRatio}% kcal</span>
            </div>
            <div className="font-oswald text-3xl sm:text-4xl text-white font-semibold my-2 tracking-tight">
              {summary.carbs}g
            </div>
            <div className="font-mono-meta text-xs text-white/40">
              Goal: {cTarget}g
            </div>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mt-4">
            <div
              className="h-full transition-all duration-500"
              style={{
                width: `${Math.min(100, cPct)}%`,
                backgroundColor: 'var(--secondary-accent, var(--accent))',
              }}
            />
          </div>
        </div>

        {/* Fats Card */}
        <div className="cinematic-card p-6 rounded-sm flex flex-col justify-between">
          <div>
            <div className="font-mono-meta text-xs text-white/40 flex items-center justify-between">
              <span>Fats ({fPct}%)</span>
              <span className="theme-accent-text">{fRatio}% kcal</span>
            </div>
            <div className="font-oswald text-3xl sm:text-4xl text-white font-semibold my-2 tracking-tight">
              {summary.fat}g
            </div>
            <div className="font-mono-meta text-xs text-white/40">
              Goal: {fTarget}g
            </div>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mt-4">
            <div
              className="h-full transition-all duration-500"
              style={{
                width: `${Math.min(100, fPct)}%`,
                backgroundColor: 'var(--accent)',
              }}
            />
          </div>
        </div>

        {/* Hydration Card */}
        <div className="cinematic-card p-6 rounded-sm flex flex-col justify-between">
          <div>
            <div className="font-mono-meta text-xs text-white/40 flex items-center justify-between">
              <span>Hydration</span>
              <span>Target: {waterTarget}ml</span>
            </div>
            <div className="font-oswald text-3xl sm:text-4xl text-white font-semibold my-2 tracking-tight">
              {waterConsumed}ml
            </div>
            <div className="font-mono-meta text-xs text-white/40">
              {Math.round((waterConsumed / waterTarget) * 100)}% Reached
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={() => handleWaterClick(250)}
              className="control-btn-dark flex-1 py-1.5 rounded cursor-pointer text-center font-bold"
            >
              +250
            </button>
            <button
              onClick={() => handleWaterClick(500)}
              className="control-btn-dark flex-1 py-1.5 rounded cursor-pointer text-center font-bold"
            >
              +500
            </button>
            <button
              onClick={() => handleWaterClick(1000)}
              className="control-btn-dark flex-1 py-1.5 rounded cursor-pointer text-center font-bold"
            >
              +1L
            </button>
            {waterConsumed > 0 && (
              <button
                onClick={onResetWater}
                className="px-2 py-1.5 text-[10px] text-white/40 hover:text-rose-400 font-mono-meta cursor-pointer"
                title="Reset Water Log"
              >
                RESET
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

