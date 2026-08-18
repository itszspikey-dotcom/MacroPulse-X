import React, { useState, useMemo } from 'react';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Sparkles, 
  Flame, 
  Activity, 
  Target, 
  Zap, 
  Droplet, 
  ShieldCheck, 
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Scale,
  Utensils,
  Gauge,
  Dumbbell
} from 'lucide-react';
import { UserProfile } from '../types/nutrition';
import { triggerHaptic, playSuccessChime } from '../services/audioFeedback';

export type GoalType = 'lose_fat' | 'maintain' | 'build_muscle' | 'athletic_performance';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'very_active' | 'extra_active';

type GoalOption = GoalType;
type ActivityLevelOption = ActivityLevel;

interface OnboardingWizardModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onComplete: (profile: UserProfile) => void;
  currentProfile?: UserProfile;
  isFirstTime?: boolean;
}

export const OnboardingWizardModal: React.FC<OnboardingWizardModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  currentProfile,
  isFirstTime = false
}) => {
  const [step, setStep] = useState<number>(1);
  const totalSteps = 5;

  // Form State
  const [name, setName] = useState(currentProfile?.name || 'Tactical Operator');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>(currentProfile?.gender || 'male');
  const [age, setAge] = useState<number>(currentProfile?.age || 28);
  
  // Unit selections
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric');
  const [weightKg, setWeightKg] = useState<number>(currentProfile?.weightKg || 78);
  const [heightCm, setHeightCm] = useState<number>(currentProfile?.heightCm || 178);
  
  // Imperial helpers
  const [weightLbs, setWeightLbs] = useState<number>(Math.round((currentProfile?.weightKg || 78) * 2.20462));
  const [heightFt, setHeightFt] = useState<number>(Math.floor((currentProfile?.heightCm || 178) / 30.48));
  const [heightIn, setHeightIn] = useState<number>(Math.round(((currentProfile?.heightCm || 178) % 30.48) / 2.54));

  // Activity Level
  const [activityLevel, setActivityLevel] = useState<ActivityLevelOption>(currentProfile?.activityLevel || 'moderate');

  // Goal & Pacing
  const [goal, setGoal] = useState<GoalOption>(
    currentProfile?.goalType === 'cut' ? 'lose_fat' :
    currentProfile?.goalType === 'bulk' ? 'build_muscle' : 'maintain'
  );
  const [pacing, setPacing] = useState<'gentle' | 'moderate' | 'aggressive'>('moderate');

  // Dietary Preference
  const [dietaryPreference, setDietaryPreference] = useState<string>(
    currentProfile?.goalType === 'keto' ? 'keto' : 'high-protein'
  );

  // Sync metric <-> imperial
  const handleWeightLbsChange = (lbs: number) => {
    setWeightLbs(lbs);
    setWeightKg(Math.round((lbs / 2.20462) * 10) / 10);
  };

  const handleWeightKgChange = (kg: number) => {
    setWeightKg(kg);
    setWeightLbs(Math.round(kg * 2.20462));
  };

  const handleHeightImperialChange = (ft: number, inches: number) => {
    setHeightFt(ft);
    setHeightIn(inches);
    const totalInches = (ft * 12) + inches;
    setHeightCm(Math.round(totalInches * 2.54));
  };

  const handleHeightCmChange = (cm: number) => {
    setHeightCm(cm);
    const totalInches = cm / 2.54;
    setHeightFt(Math.floor(totalInches / 12));
    setHeightIn(Math.round(totalInches % 12));
  };

  // Mifflin-St Jeor Automated Calculations
  const calculations = useMemo(() => {
    // 1. Calculate BMR
    let bmr = 10 * weightKg + 6.25 * heightCm - 5 * age;
    if (gender === 'male') {
      bmr += 5;
    } else if (gender === 'female') {
      bmr -= 161;
    } else {
      bmr -= 78;
    }
    bmr = Math.round(bmr);

    // 2. Activity Multiplier
    const activityMultipliers: Record<ActivityLevel, number> = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      very_active: 1.725,
      extra_active: 1.9,
    };
    const multiplier = activityMultipliers[activityLevel] || 1.55;
    const tdee = Math.round(bmr * multiplier);

    // 3. Caloric Adjustment based on Goal & Pacing
    let calorieDelta = 0;
    if (goal === 'lose_fat') {
      if (pacing === 'gentle') calorieDelta = -250;
      else if (pacing === 'moderate') calorieDelta = -500;
      else calorieDelta = -750;
    } else if (goal === 'build_muscle') {
      if (pacing === 'gentle') calorieDelta = 200;
      else if (pacing === 'moderate') calorieDelta = 400;
      else calorieDelta = 600;
    } else if (goal === 'athletic_performance') {
      calorieDelta = 150;
    } else {
      calorieDelta = 0;
    }

    const calorieTarget = Math.max(1200, Math.round(tdee + calorieDelta));

    // 4. Macro Distribution
    let proteinTargetG = 0;
    let fatTargetG = 0;
    let carbsTargetG = 0;

    if (dietaryPreference === 'keto') {
      // 5% Carbs, 25% Protein, 70% Fat
      carbsTargetG = Math.max(20, Math.round((calorieTarget * 0.05) / 4));
      proteinTargetG = Math.round((calorieTarget * 0.25) / 4);
      fatTargetG = Math.round((calorieTarget * 0.70) / 9);
    } else if (dietaryPreference === 'high-protein') {
      // 2.2g per kg bodyweight or 35% Protein, 25% Fat, 40% Carbs
      proteinTargetG = Math.round(Math.max(weightKg * 2.2, (calorieTarget * 0.35) / 4));
      fatTargetG = Math.round((calorieTarget * 0.25) / 9);
      const remainingCals = Math.max(0, calorieTarget - (proteinTargetG * 4 + fatTargetG * 9));
      carbsTargetG = Math.round(remainingCals / 4);
    } else if (dietaryPreference === 'vegan' || dietaryPreference === 'plant-based') {
      // 25% Protein, 25% Fat, 50% Carbs
      proteinTargetG = Math.round((calorieTarget * 0.25) / 4);
      fatTargetG = Math.round((calorieTarget * 0.25) / 9);
      carbsTargetG = Math.round((calorieTarget * 0.50) / 4);
    } else {
      // Standard Balanced: 30% Protein, 30% Fat, 40% Carbs
      proteinTargetG = Math.round((calorieTarget * 0.30) / 4);
      fatTargetG = Math.round((calorieTarget * 0.30) / 9);
      carbsTargetG = Math.round((calorieTarget * 0.40) / 4);
    }

    // 5. Water Target: ~35ml per kg + activity buffer
    const waterTargetMl = Math.round(weightKg * 35 + (multiplier > 1.5 ? 600 : 300));

    return {
      bmr,
      tdee,
      calorieDelta,
      calorieTarget,
      proteinTargetG,
      carbsTargetG,
      fatTargetG,
      waterTargetMl
    };
  }, [gender, age, weightKg, heightCm, activityLevel, goal, pacing, dietaryPreference]);

  if (!isOpen) return null;

  const handleNext = () => {
    triggerHaptic('light');
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    triggerHaptic('light');
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleFinish = () => {
    const mappedGoalType: UserProfile['goalType'] = 
      dietaryPreference === 'keto' ? 'keto' :
      goal === 'lose_fat' ? 'cut' :
      goal === 'build_muscle' ? 'bulk' : 'maintain';

    const updatedProfile: UserProfile = {
      id: currentProfile?.id || `profile_${Date.now()}`,
      name: name.trim() || 'Tactical Operator',
      email: currentProfile?.email,
      avatarColor: currentProfile?.avatarColor || '#facc15',
      avatarInitials: currentProfile?.avatarInitials || (name.charAt(0) || 'TO').toUpperCase(),
      notes: currentProfile?.notes || 'Profile calibrated via Onboarding Wizard',
      isDefault: currentProfile?.isDefault ?? true,
      gender,
      age: Number(age),
      weightKg: Number(weightKg),
      heightCm: Number(heightCm),
      activityLevel,
      goalType: mappedGoalType,
      bmr: calculations.bmr,
      tdee: calculations.tdee,
      targetCalories: calculations.calorieTarget,
      targetProteinG: calculations.proteinTargetG,
      targetCarbsG: calculations.carbsTargetG,
      targetFatG: calculations.fatTargetG,
      targetFiberG: Math.round(calculations.calorieTarget * 0.014),
      targetWaterMl: calculations.waterTargetMl,
      useHaptics: currentProfile?.useHaptics ?? true,
      useSound: currentProfile?.useSound ?? true,
      streakDays: currentProfile?.streakDays ?? 1,
      lastLoggedDate: currentProfile?.lastLoggedDate || new Date().toISOString().split('T')[0],
      themeId: currentProfile?.themeId || 'cyberpunk',
      layoutMode: currentProfile?.layoutMode || 'command-dock',
    };

    localStorage.setItem('macropulse_onboarding_completed', 'true');
    playSuccessChime();
    triggerHaptic('success');
    onComplete(updatedProfile);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md animate-fade-in">
      <div className="bg-[#121214] border border-[#facc15]/30 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col relative text-white max-h-[92vh]">
        
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-[#0c0c0e] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#facc15]/10 border border-[#facc15]/40 flex items-center justify-center text-[#facc15]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-oswald text-lg sm:text-xl tracking-wider text-white">
                  {isFirstTime ? 'OPERATOR ONBOARDING & CALIBRATION' : 'RECALIBRATE BIOMETRIC PROFILE'}
                </h2>
              </div>
              <p className="text-xs text-white/50 font-mono-meta">
                Mifflin-St Jeor Metabolic Engine & Precision Macros
              </p>
            </div>
          </div>

          {!isFirstTime && onClose && (
            <button
              onClick={() => {
                triggerHaptic('light');
                onClose();
              }}
              className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Step Progress Indicator */}
        <div className="px-5 py-3 bg-[#18181c] border-b border-white/5 flex items-center justify-between gap-2 shrink-0">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex-1 flex items-center gap-2">
              <div
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  i < step
                    ? 'bg-[#facc15]'
                    : i === step
                    ? 'bg-[#facc15] shadow-sm shadow-yellow-500/50'
                    : 'bg-white/10'
                }`}
              />
            </div>
          ))}
          <span className="text-[11px] font-mono-meta text-[#facc15] pl-2 font-bold shrink-0">
            STEP {step}/{totalSteps}
          </span>
        </div>

        {/* Step Content Container */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          
          {/* STEP 1: IDENTITY & CORE BIOMETRICS */}
          {step === 1 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h3 className="font-oswald text-base text-white tracking-wide flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#facc15]" />
                  <span>1. IDENTITY & BIOMETRIC BASELINE</span>
                </h3>
                <p className="text-xs text-white/50 font-mono-meta">
                  Input your baseline biometrics to calculate accurate Basal Metabolic Rate (BMR).
                </p>
              </div>

              {/* Name */}
              <div>
                <label className="block text-[11px] font-mono-meta text-white/60 mb-1.5 uppercase">
                  Operator Name / Call-sign
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Hunter"
                  className="w-full bg-[#1c1c20] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-[#facc15] focus:outline-none font-mono-meta"
                />
              </div>

              {/* Biological Sex & Age */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono-meta text-white/60 mb-1.5 uppercase">
                    Biological Sex
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setGender('male');
                        triggerHaptic('light');
                      }}
                      className={`py-2 px-3 rounded-xl border text-xs font-mono-meta font-bold transition cursor-pointer ${
                        gender === 'male'
                          ? 'bg-[#facc15] text-black border-[#facc15]'
                          : 'bg-[#1c1c20] text-white/60 border-white/10 hover:border-white/30'
                      }`}
                    >
                      MALE
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setGender('female');
                        triggerHaptic('light');
                      }}
                      className={`py-2 px-3 rounded-xl border text-xs font-mono-meta font-bold transition cursor-pointer ${
                        gender === 'female'
                          ? 'bg-[#facc15] text-black border-[#facc15]'
                          : 'bg-[#1c1c20] text-white/60 border-white/10 hover:border-white/30'
                      }`}
                    >
                      FEMALE
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono-meta text-white/60 mb-1.5 uppercase">
                    Age (Years)
                  </label>
                  <input
                    type="number"
                    min={12}
                    max={100}
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-full bg-[#1c1c20] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:border-[#facc15] focus:outline-none font-mono-meta"
                  />
                </div>
              </div>

              {/* Unit Toggle */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-mono-meta text-white/50">Measurement System:</span>
                <div className="flex bg-[#1c1c20] p-0.5 rounded-lg border border-white/10 text-[11px] font-mono-meta">
                  <button
                    type="button"
                    onClick={() => {
                      setUnitSystem('metric');
                      triggerHaptic('light');
                    }}
                    className={`px-3 py-1 rounded-md transition cursor-pointer ${
                      unitSystem === 'metric' ? 'bg-[#facc15] text-black font-bold' : 'text-white/60'
                    }`}
                  >
                    METRIC (KG/CM)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUnitSystem('imperial');
                      triggerHaptic('light');
                    }}
                    className={`px-3 py-1 rounded-md transition cursor-pointer ${
                      unitSystem === 'imperial' ? 'bg-[#facc15] text-black font-bold' : 'text-white/60'
                    }`}
                  >
                    IMPERIAL (LBS/FT)
                  </button>
                </div>
              </div>

              {/* Height & Weight Inputs */}
              <div className="grid grid-cols-2 gap-3">
                {unitSystem === 'metric' ? (
                  <>
                    <div>
                      <label className="block text-[11px] font-mono-meta text-white/60 mb-1.5 uppercase">
                        Current Weight (kg)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        value={weightKg}
                        onChange={(e) => handleWeightKgChange(Number(e.target.value))}
                        className="w-full bg-[#1c1c20] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-[#facc15] focus:outline-none font-mono-meta"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono-meta text-white/60 mb-1.5 uppercase">
                        Height (cm)
                      </label>
                      <input
                        type="number"
                        value={heightCm}
                        onChange={(e) => handleHeightCmChange(Number(e.target.value))}
                        className="w-full bg-[#1c1c20] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-[#facc15] focus:outline-none font-mono-meta"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-[11px] font-mono-meta text-white/60 mb-1.5 uppercase">
                        Current Weight (lbs)
                      </label>
                      <input
                        type="number"
                        value={weightLbs}
                        onChange={(e) => handleWeightLbsChange(Number(e.target.value))}
                        className="w-full bg-[#1c1c20] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-[#facc15] focus:outline-none font-mono-meta"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono-meta text-white/60 mb-1.5 uppercase">
                        Height (ft / in)
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        <input
                          type="number"
                          placeholder="ft"
                          value={heightFt}
                          onChange={(e) => handleHeightImperialChange(Number(e.target.value), heightIn)}
                          className="w-full bg-[#1c1c20] border border-white/10 rounded-xl px-2.5 py-2.5 text-sm text-white focus:border-[#facc15] focus:outline-none font-mono-meta"
                        />
                        <input
                          type="number"
                          placeholder="in"
                          value={heightIn}
                          onChange={(e) => handleHeightImperialChange(heightFt, Number(e.target.value))}
                          className="w-full bg-[#1c1c20] border border-white/10 rounded-xl px-2.5 py-2.5 text-sm text-white focus:border-[#facc15] focus:outline-none font-mono-meta"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Instant BMR Feedback */}
              <div className="p-3.5 rounded-2xl bg-[#1c1c20]/60 border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-400" />
                  <span className="text-xs font-mono-meta text-white/60">Estimated Basal Metabolic Rate (BMR):</span>
                </div>
                <span className="text-sm font-mono-meta font-bold text-[#facc15]">
                  {calculations.bmr} kcal/day
                </span>
              </div>
            </div>
          )}

          {/* STEP 2: ACTIVITY LEVEL */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <h3 className="font-oswald text-base text-white tracking-wide flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#facc15]" />
                  <span>2. PHYSICAL ACTIVITY PROFILE</span>
                </h3>
                <p className="text-xs text-white/50 font-mono-meta">
                  How active are you on a typical week? This computes your Total Daily Energy Expenditure (TDEE).
                </p>
              </div>

              <div className="space-y-2.5">
                {[
                  {
                    id: 'sedentary' as ActivityLevel,
                    title: 'SEDENTARY (1.2x)',
                    desc: 'Desk job, minimal daily walking or deliberate exercise.',
                    badge: 'Rest / Inactive'
                  },
                  {
                    id: 'light' as ActivityLevel,
                    title: 'LIGHTLY ACTIVE (1.375x)',
                    desc: 'Light daily motion or 1–3 light workout sessions per week.',
                    badge: '1–3 Sessions'
                  },
                  {
                    id: 'moderate' as ActivityLevel,
                    title: 'MODERATELY ACTIVE (1.55x)',
                    desc: 'Moderate physical training or cardio 3–5 days per week.',
                    badge: '3–5 Sessions'
                  },
                  {
                    id: 'very_active' as ActivityLevel,
                    title: 'VERY ACTIVE (1.725x)',
                    desc: 'Heavy strength training or demanding sports 6–7 days per week.',
                    badge: '6–7 Sessions'
                  },
                  {
                    id: 'extra_active' as ActivityLevel,
                    title: 'EXTRA ACTIVE (1.9x)',
                    desc: 'Hard daily physical labor + high-intensity training or 2x/day athletics.',
                    badge: 'Elite / Labor'
                  },
                ].map((item) => {
                  const isSelected = activityLevel === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActivityLevel(item.id);
                        triggerHaptic('light');
                      }}
                      className={`w-full p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-[#facc15]/10 border-[#facc15] shadow-lg shadow-yellow-500/5'
                          : 'bg-[#1c1c20] border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-mono-meta font-bold ${isSelected ? 'text-[#facc15]' : 'text-white'}`}>
                            {item.title}
                          </span>
                          <span className="text-[10px] font-mono-meta px-2 py-0.5 rounded bg-white/5 text-white/50 border border-white/5">
                            {item.badge}
                          </span>
                        </div>
                        <p className="text-xs text-white/50">{item.desc}</p>
                      </div>

                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ml-3 ${
                        isSelected ? 'border-[#facc15] bg-[#facc15] text-black' : 'border-white/20'
                      }`}>
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="p-3.5 rounded-2xl bg-[#1c1c20]/60 border border-white/5 flex items-center justify-between">
                <span className="text-xs font-mono-meta text-white/60">Calculated Maintenance TDEE:</span>
                <span className="text-sm font-mono-meta font-bold text-emerald-400">
                  {calculations.tdee} kcal/day
                </span>
              </div>
            </div>
          )}

          {/* STEP 3: PRIMARY OBJECTIVE & PACING */}
          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <h3 className="font-oswald text-base text-white tracking-wide flex items-center gap-2">
                  <Target className="w-4 h-4 text-[#facc15]" />
                  <span>3. STRATEGIC GOAL & PACING</span>
                </h3>
                <p className="text-xs text-white/50 font-mono-meta">
                  Select your current physical target and aggressive energy pacing.
                </p>
              </div>

              {/* Goal Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  {
                    id: 'lose_fat' as GoalType,
                    title: 'FAT LOSS (DEFICIT)',
                    desc: 'Prioritize fat oxidation while preserving lean muscle mass.',
                    icon: TrendingDown,
                    color: 'text-red-400',
                  },
                  {
                    id: 'maintain' as GoalType,
                    title: 'MAINTENANCE (RECOMP)',
                    desc: 'Optimize metabolic rate, steady weight, and body recomp.',
                    icon: Scale,
                    color: 'text-emerald-400',
                  },
                  {
                    id: 'build_muscle' as GoalType,
                    title: 'MUSCLE GAIN (SURPLUS)',
                    desc: 'Hypertrophy caloric surplus for max size and strength.',
                    icon: Dumbbell,
                    color: 'text-[#facc15]',
                  },
                  {
                    id: 'athletic_performance' as GoalType,
                    title: 'ATHLETIC PERFORMANCE',
                    desc: 'Targeted fueling for high power output and endurance.',
                    icon: Zap,
                    color: 'text-blue-400',
                  },
                ].map((item) => {
                  const isSelected = goal === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setGoal(item.id);
                        triggerHaptic('light');
                      }}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                        isSelected
                          ? 'bg-[#facc15]/10 border-[#facc15] shadow-lg shadow-yellow-500/5'
                          : 'bg-[#1c1c20] border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Icon className={`w-5 h-5 ${item.color}`} />
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-[#facc15] bg-[#facc15] text-black' : 'border-white/20'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                      <div>
                        <div className={`text-xs font-mono-meta font-bold ${isSelected ? 'text-[#facc15]' : 'text-white'}`}>
                          {item.title}
                        </div>
                        <div className="text-[11px] text-white/50 mt-0.5">{item.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Pacing selection if Deficit or Surplus */}
              {(goal === 'lose_fat' || goal === 'build_muscle') && (
                <div className="pt-2 space-y-2">
                  <label className="block text-[11px] font-mono-meta text-white/60 uppercase">
                    Target Rate / Aggressiveness
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      {
                        id: 'gentle' as const,
                        title: 'GENTLE',
                        sub: goal === 'lose_fat' ? '-250 kcal (~0.25 kg/wk)' : '+200 kcal (Lean)'
                      },
                      {
                        id: 'moderate' as const,
                        title: 'MODERATE',
                        sub: goal === 'lose_fat' ? '-500 kcal (~0.5 kg/wk)' : '+400 kcal (Standard)'
                      },
                      {
                        id: 'aggressive' as const,
                        title: 'AGGRESSIVE',
                        sub: goal === 'lose_fat' ? '-750 kcal (~0.75 kg/wk)' : '+600 kcal (Power)'
                      },
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setPacing(p.id);
                          triggerHaptic('light');
                        }}
                        className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                          pacing === p.id
                            ? 'bg-[#facc15] text-black border-[#facc15] font-bold'
                            : 'bg-[#1c1c20] text-white/60 border-white/10'
                        }`}
                      >
                        <div className="text-xs font-mono-meta font-bold">{p.title}</div>
                        <div className={`text-[9px] font-mono-meta mt-0.5 ${pacing === p.id ? 'text-black/70' : 'text-white/40'}`}>
                          {p.sub}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: DIETARY PREFERENCE & MACRO ALLOCATION */}
          {step === 4 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <h3 className="font-oswald text-base text-white tracking-wide flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-[#facc15]" />
                  <span>4. DIETARY PROTOCOL & MACRONUTRIENTS</span>
                </h3>
                <p className="text-xs text-white/50 font-mono-meta">
                  Choose your nutritional style to set baseline macronutrient distribution.
                </p>
              </div>

              <div className="space-y-2">
                {[
                  {
                    id: 'high-protein',
                    name: 'HIGH PROTEIN / BODYBUILDING',
                    desc: '2.2g/kg protein, optimized for muscle protein synthesis and satiety.',
                    macros: '35% Protein · 40% Carbs · 25% Fats'
                  },
                  {
                    id: 'balanced',
                    name: 'STANDARD BALANCED',
                    desc: 'Balanced nutrient distribution for all-around metabolic function.',
                    macros: '30% Protein · 40% Carbs · 30% Fats'
                  },
                  {
                    id: 'keto',
                    name: 'KETOGENIC / LOW CARB',
                    desc: 'Ultra-low carbs to promote ketone body utilization.',
                    macros: '25% Protein · 5% Carbs · 70% Fats'
                  },
                  {
                    id: 'plant-based',
                    name: 'VEGETARIAN / PLANT-FOCUSED',
                    desc: 'Plant-forward whole foods with ample complex carbohydrates.',
                    macros: '25% Protein · 50% Carbs · 25% Fats'
                  },
                  {
                    id: 'vegan',
                    name: '100% VEGAN',
                    desc: 'Strict plant nutrition with high fiber and clean plant proteins.',
                    macros: '25% Protein · 55% Carbs · 20% Fats'
                  },
                ].map((d) => {
                  const isSelected = dietaryPreference === d.id;
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => {
                        setDietaryPreference(d.id);
                        triggerHaptic('light');
                      }}
                      className={`w-full p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-[#facc15]/10 border-[#facc15] shadow-lg shadow-yellow-500/5'
                          : 'bg-[#1c1c20] border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className={`text-xs font-mono-meta font-bold ${isSelected ? 'text-[#facc15]' : 'text-white'}`}>
                          {d.name}
                        </div>
                        <div className="text-xs text-white/50">{d.desc}</div>
                        <div className="text-[10px] font-mono-meta text-[#facc15]/70 pt-0.5">
                          {d.macros}
                        </div>
                      </div>

                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ml-3 ${
                        isSelected ? 'border-[#facc15] bg-[#facc15] text-black' : 'border-white/20'
                      }`}>
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 5: REVIEW & FINAL CALIBRATION TELEMETRY */}
          {step === 5 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <h3 className="font-oswald text-base text-white tracking-wide flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-[#facc15]" />
                  <span>5. TARGET TELEMETRY REVIEW</span>
                </h3>
                <p className="text-xs text-white/50 font-mono-meta">
                  Your personalized nutritional matrix has been calculated and is ready for deployment.
                </p>
              </div>

              {/* Main Daily Calorie Highlight Card */}
              <div className="p-4 rounded-3xl bg-gradient-to-br from-[#1c1c20] to-[#141416] border border-[#facc15]/40 relative overflow-hidden shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono-meta uppercase tracking-widest text-[#facc15] font-bold">
                      CALCULATED DAILY TARGET
                    </span>
                    <div className="font-oswald text-3xl sm:text-4xl text-white tracking-tight mt-1">
                      {calculations.calorieTarget.toLocaleString()} <span className="text-sm font-mono-meta text-white/50">kcal / day</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono-meta text-white/40 block">TDEE DELTA</span>
                    <span className={`text-xs font-mono-meta font-bold px-2 py-0.5 rounded ${
                      calculations.calorieDelta < 0 ? 'bg-red-500/20 text-red-400' :
                      calculations.calorieDelta > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/70'
                    }`}>
                      {calculations.calorieDelta > 0 ? `+${calculations.calorieDelta}` : calculations.calorieDelta} kcal
                    </span>
                  </div>
                </div>

                {/* Macro Distribution Cards */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/10">
                  <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
                    <span className="text-[10px] font-mono-meta text-blue-400 block font-bold">PROTEIN</span>
                    <span className="font-oswald text-xl text-white">{calculations.proteinTargetG}g</span>
                    <span className="text-[9px] font-mono-meta text-white/40 block mt-0.5">
                      {Math.round((calculations.proteinTargetG * 4 / calculations.calorieTarget) * 100)}%
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                    <span className="text-[10px] font-mono-meta text-amber-400 block font-bold">CARBS</span>
                    <span className="font-oswald text-xl text-white">{calculations.carbsTargetG}g</span>
                    <span className="text-[9px] font-mono-meta text-white/40 block mt-0.5">
                      {Math.round((calculations.carbsTargetG * 4 / calculations.calorieTarget) * 100)}%
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center">
                    <span className="text-[10px] font-mono-meta text-rose-400 block font-bold">FATS</span>
                    <span className="font-oswald text-xl text-white">{calculations.fatTargetG}g</span>
                    <span className="text-[9px] font-mono-meta text-white/40 block mt-0.5">
                      {Math.round((calculations.fatTargetG * 9 / calculations.calorieTarget) * 100)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Water & Details Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono-meta">
                <div className="p-3 rounded-2xl bg-[#1c1c20] border border-white/10 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                    <Droplet className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-white/40 block">TARGET HYDRATION</span>
                    <span className="font-bold text-white text-sm">{calculations.waterTargetMl.toLocaleString()} ml</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-[#1c1c20] border border-white/10 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-white/40 block">ESTIMATED BMR</span>
                    <span className="font-bold text-white text-sm">{calculations.bmr} kcal</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-[11px] font-mono-meta text-white/50 text-center">
                These goals can be manually tuned or recalibrated anytime in the Settings / Profiles hub.
              </div>
            </div>
          )}

        </div>

        {/* Footer Navigation Controls */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-[#0c0c0e] flex items-center justify-between shrink-0">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-mono-meta text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>PREVIOUS</span>
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={handleNext}
            className="py-2.5 px-5 rounded-xl bg-[#facc15] hover:bg-[#eab308] text-black font-mono-meta text-xs font-bold tracking-wider transition cursor-pointer flex items-center gap-2 shadow-lg shadow-yellow-500/10"
          >
            {step === totalSteps ? (
              <>
                <span>INITIALIZE PROFILE & LAUNCH HUD</span>
                <Check className="w-4 h-4 stroke-[3]" />
              </>
            ) : (
              <>
                <span>CONTINUE</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
