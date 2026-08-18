import React, { useState, useEffect } from 'react';
import {
  X,
  Users,
  UserCheck,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Check,
  Sparkles,
  Flame,
  Target,
  ArrowRight,
  Shield,
  Activity,
  Droplets,
  Scale,
  Award,
  Calendar,
  Sliders,
  Zap,
  Palette,
} from 'lucide-react';
import { UserProfile, WeightObjective } from '../types/nutrition';
import { syncEngine } from '../services/syncEngine';
import {
  calculateBMR,
  calculateRecommendedMacros,
  calculateTDEE,
  calculateWeightObjectivePlan,
} from '../services/nutritionMath';
import { playSuccessChime, triggerHaptic } from '../services/audioFeedback';
import { themeService, APP_THEMES } from '../services/themeService';

interface ProfileManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onProfileSwitched: (newProfile: UserProfile) => void;
  onProfileUpdated: (updated: UserProfile) => void;
  initialTab?: 'list' | 'edit' | 'create';
  onOpenWeightObjectiveModal?: () => void;
}

const PALETTE_COLORS = [
  { hex: '#facc15', label: 'Gold' },
  { hex: '#10b981', label: 'Emerald' },
  { hex: '#38bdf8', label: 'Sky' },
  { hex: '#818cf8', label: 'Indigo' },
  { hex: '#f43f5e', label: 'Rose' },
  { hex: '#fb923c', label: 'Orange' },
  { hex: '#a855f7', label: 'Purple' },
];

export const ProfileManagementModal: React.FC<ProfileManagementModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onProfileSwitched,
  onProfileUpdated,
  initialTab = 'list',
  onOpenWeightObjectiveModal,
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'edit' | 'create'>(initialTab);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [editingProfileId, setEditingProfileId] = useState<string>(userProfile.id);

  // Edit / Form State
  const [formName, setFormName] = useState<string>(userProfile.name);
  const [formEmail, setFormEmail] = useState<string>(userProfile.email || '');
  const [formNotes, setFormNotes] = useState<string>(userProfile.notes || '');
  const [formColor, setFormColor] = useState<string>(userProfile.avatarColor || '#facc15');
  const [formGender, setFormGender] = useState<UserProfile['gender']>(userProfile.gender);
  const [formAge, setFormAge] = useState<number | string>(userProfile.age);
  const [formHeightCm, setFormHeightCm] = useState<number | string>(userProfile.heightCm);
  const [formWeightKg, setFormWeightKg] = useState<number | string>(userProfile.weightKg);
  const [formActivityLevel, setFormActivityLevel] = useState<UserProfile['activityLevel']>(
    userProfile.activityLevel
  );
  const [formGoalType, setFormGoalType] = useState<UserProfile['goalType']>(userProfile.goalType);
  const [formThemeId, setFormThemeId] = useState<string>(userProfile.themeId || 'onyx-gold');

  // Weight Objective & Deficit Fields
  const [formTargetWeightKg, setFormTargetWeightKg] = useState<number | string>(
    userProfile.weightObjective?.targetWeightKg || Math.max(40, userProfile.weightKg - 5)
  );
  const [formPaceKgPerWeek, setFormPaceKgPerWeek] = useState<number>(
    userProfile.weightObjective?.paceKgPerWeek || 0.5
  );
  const [formObjectiveMode, setFormObjectiveMode] = useState<'pace' | 'target_date'>(
    userProfile.weightObjective?.mode || 'pace'
  );
  const [formTargetDate, setFormTargetDate] = useState<string>(
    userProfile.weightObjective?.targetDate ||
      new Date(Date.now() + 70 * 86400000).toISOString().split('T')[0]
  );
  const [formPreserveMuscle, setFormPreserveMuscle] = useState<boolean>(
    userProfile.weightObjective?.preserveMuscleHighProtein !== false
  );

  // Targets
  const [formCalories, setFormCalories] = useState<number | string>(userProfile.targetCalories);
  const [formProteinG, setFormProteinG] = useState<number | string>(userProfile.targetProteinG);
  const [formCarbsG, setFormCarbsG] = useState<number | string>(userProfile.targetCarbsG);
  const [formFatG, setFormFatG] = useState<number | string>(userProfile.targetFatG);
  const [formFiberG, setFormFiberG] = useState<number | string>(userProfile.targetFiberG);
  const [formWaterMl, setFormWaterMl] = useState<number | string>(userProfile.targetWaterMl);

  // Deletion confirmation state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Safe numerical conversions for mathematical calculations
  const numFormAge = typeof formAge === 'number' ? formAge : parseInt(formAge, 10) || 25;
  const numFormHeight = typeof formHeightCm === 'number' ? formHeightCm : parseFloat(formHeightCm) || 175;
  const numFormWeight = typeof formWeightKg === 'number' ? formWeightKg : parseFloat(formWeightKg) || 70;
  const numFormTargetWeight = typeof formTargetWeightKg === 'number' ? formTargetWeightKg : parseFloat(formTargetWeightKg) || 65;

  // Calculated BMR & TDEE
  const currentBmr = calculateBMR(formGender, numFormWeight, numFormHeight, numFormAge);
  const currentTdee = calculateTDEE(currentBmr, formActivityLevel);
  const recommended = calculateRecommendedMacros(currentTdee, numFormWeight, formGoalType);

  // Live Plan Calculation based on Target Weight
  const liveObjectivePlan = calculateWeightObjectivePlan({
    currentWeightKg: numFormWeight,
    targetWeightKg: numFormTargetWeight,
    tdee: currentTdee,
    gender: formGender,
    mode: formObjectiveMode,
    paceKgPerWeek: formPaceKgPerWeek,
    targetDate: formTargetDate,
    highProteinPreservation: formPreserveMuscle,
  });

  const loadProfiles = () => {
    const list = syncEngine.getAllProfiles();
    setProfiles(list);
  };

  useEffect(() => {
    if (isOpen) {
      loadProfiles();
      setActiveTab(initialTab);
      populateFormWithProfile(userProfile);
    }
  }, [isOpen, userProfile, initialTab]);

  const populateFormWithProfile = (p: UserProfile) => {
    setEditingProfileId(p.id);
    setFormName(p.name);
    setFormEmail(p.email || '');
    setFormNotes(p.notes || '');
    setFormColor(p.avatarColor || '#facc15');
    setFormGender(p.gender);
    setFormAge(p.age);
    setFormHeightCm(p.heightCm);
    setFormWeightKg(p.weightKg);
    setFormActivityLevel(p.activityLevel);
    setFormGoalType(p.goalType);
    setFormThemeId(p.themeId || 'onyx-gold');
    setFormCalories(p.targetCalories);
    setFormProteinG(p.targetProteinG);
    setFormCarbsG(p.targetCarbsG);
    setFormFatG(p.targetFatG);
    setFormFiberG(p.targetFiberG);
    setFormWaterMl(p.targetWaterMl);

    // Weight Objective
    setFormTargetWeightKg(p.weightObjective?.targetWeightKg || Math.max(40, p.weightKg - 5));
    setFormPaceKgPerWeek(p.weightObjective?.paceKgPerWeek || 0.5);
    setFormObjectiveMode(p.weightObjective?.mode || 'pace');
    setFormTargetDate(
      p.weightObjective?.targetDate ||
        new Date(Date.now() + 70 * 86400000).toISOString().split('T')[0]
    );
    setFormPreserveMuscle(p.weightObjective?.preserveMuscleHighProtein !== false);
  };

  const handleApplyObjectivePlan = () => {
    setFormCalories(liveObjectivePlan.targetCalories);
    setFormProteinG(liveObjectivePlan.macros.proteinG);
    setFormCarbsG(liveObjectivePlan.macros.carbsG);
    setFormFatG(liveObjectivePlan.macros.fatG);
    setFormFiberG(liveObjectivePlan.macros.fiberG);
    setFormWaterMl(liveObjectivePlan.macros.waterMl);
    if (liveObjectivePlan.direction === 'loss') setFormGoalType('cut');
    else if (liveObjectivePlan.direction === 'gain') setFormGoalType('bulk');
    else setFormGoalType('maintain');
    triggerHaptic('light');
  };

  const handleApplyRecommended = () => {
    setFormCalories(recommended.targetCalories);
    setFormProteinG(recommended.targetProteinG);
    setFormCarbsG(recommended.targetCarbsG);
    setFormFatG(recommended.targetFatG);
    setFormFiberG(recommended.targetFiberG);
    setFormWaterMl(recommended.targetWaterMl);
    triggerHaptic('light');
  };

  const handleSwitchProfile = (p: UserProfile) => {
    if (p.id === userProfile.id) return;
    const switched = syncEngine.setActiveProfile(p.id);
    if (switched.themeId) {
      themeService.setTheme(switched.themeId);
    }
    onProfileSwitched(switched);
    playSuccessChime();
    triggerHaptic('success');
    loadProfiles();
  };

  const handleStartEdit = (p: UserProfile) => {
    populateFormWithProfile(p);
    setActiveTab('edit');
    triggerHaptic('light');
  };

  const handleStartCreate = () => {
    // Fresh default values for new profile
    setEditingProfileId('');
    setFormName('');
    setFormEmail('');
    setFormNotes('');
    const palette = ['#10b981', '#38bdf8', '#818cf8', '#f43f5e', '#fb923c', '#a855f7', '#facc15'];
    setFormColor(palette[profiles.length % palette.length]);
    setFormGender('male');
    setFormAge(25);
    setFormHeightCm(175);
    setFormWeightKg(75);
    setFormActivityLevel('moderate');
    setFormGoalType('cut');
    setFormThemeId('onyx-gold');

    setFormTargetWeightKg(70);
    setFormPaceKgPerWeek(0.5);
    setFormObjectiveMode('pace');
    setFormTargetDate(new Date(Date.now() + 70 * 86400000).toISOString().split('T')[0]);
    setFormPreserveMuscle(true);

    const bmr = calculateBMR('male', 75, 175, 25);
    const tdee = calculateTDEE(bmr, 'moderate');
    const rec = calculateRecommendedMacros(tdee, 75, 'cut');

    setFormCalories(rec.targetCalories);
    setFormProteinG(rec.targetProteinG);
    setFormCarbsG(rec.targetCarbsG);
    setFormFatG(rec.targetFatG);
    setFormFiberG(rec.targetFiberG);
    setFormWaterMl(rec.targetWaterMl);

    setActiveTab('create');
    triggerHaptic('light');
  };

  const handleSaveEdit = () => {
    if (!formName.trim()) {
      alert('Please enter a profile name.');
      return;
    }

    const finalAge = typeof formAge === 'number' ? formAge : parseInt(formAge, 10) || 25;
    const finalHeight = typeof formHeightCm === 'number' ? formHeightCm : parseFloat(formHeightCm) || 175;
    const finalWeight = typeof formWeightKg === 'number' ? formWeightKg : parseFloat(formWeightKg) || 70;
    const finalTargetWeight = typeof formTargetWeightKg === 'number' ? formTargetWeightKg : parseFloat(formTargetWeightKg) || 65;
    const finalCalories = typeof formCalories === 'number' ? formCalories : parseInt(formCalories, 10) || recommended.targetCalories;
    const finalProtein = typeof formProteinG === 'number' ? formProteinG : parseFloat(formProteinG) || recommended.targetProteinG;
    const finalCarbs = typeof formCarbsG === 'number' ? formCarbsG : parseFloat(formCarbsG) || recommended.targetCarbsG;
    const finalFat = typeof formFatG === 'number' ? formFatG : parseFloat(formFatG) || recommended.targetFatG;
    const finalFiber = typeof formFiberG === 'number' ? formFiberG : parseFloat(formFiberG) || recommended.targetFiberG;
    const finalWater = typeof formWaterMl === 'number' ? formWaterMl : parseInt(formWaterMl, 10) || recommended.targetWaterMl;

    const weightObj: WeightObjective = {
      targetWeightKg: finalTargetWeight,
      paceKgPerWeek: formPaceKgPerWeek,
      mode: formObjectiveMode,
      targetDate: liveObjectivePlan.projectedDate,
      startDate: userProfile.weightObjective?.startDate || new Date().toISOString().split('T')[0],
      startWeightKg: userProfile.weightObjective?.startWeightKg || finalWeight,
      deficitStrategy:
        formPaceKgPerWeek <= 0.25
          ? 'gentle'
          : formPaceKgPerWeek <= 0.5
          ? 'standard'
          : 'aggressive',
      preserveMuscleHighProtein: formPreserveMuscle,
    };

    const updates: Partial<UserProfile> = {
      name: formName.trim(),
      email: formEmail.trim(),
      notes: formNotes.trim(),
      avatarColor: formColor,
      gender: formGender,
      age: finalAge,
      heightCm: finalHeight,
      weightKg: finalWeight,
      activityLevel: formActivityLevel,
      goalType: formGoalType,
      themeId: formThemeId,
      weightObjective: weightObj,
      targetCalories: finalCalories,
      targetProteinG: finalProtein,
      targetCarbsG: finalCarbs,
      targetFatG: finalFat,
      targetFiberG: finalFiber,
      targetWaterMl: finalWater,
    };

    const updated = syncEngine.updateProfileById(editingProfileId, updates);
    if (updated) {
      if (editingProfileId === userProfile.id) {
        onProfileUpdated(updated);
        if (formThemeId) {
          themeService.setTheme(formThemeId);
        }
      }
      playSuccessChime();
      triggerHaptic('success');
      loadProfiles();
      setActiveTab('list');
    }
  };

  const handleSaveCreate = () => {
    if (!formName.trim()) {
      alert('Please enter a profile name.');
      return;
    }

    const finalAge = typeof formAge === 'number' ? formAge : parseInt(formAge, 10) || 25;
    const finalHeight = typeof formHeightCm === 'number' ? formHeightCm : parseFloat(formHeightCm) || 175;
    const finalWeight = typeof formWeightKg === 'number' ? formWeightKg : parseFloat(formWeightKg) || 70;
    const finalTargetWeight = typeof formTargetWeightKg === 'number' ? formTargetWeightKg : parseFloat(formTargetWeightKg) || 65;
    const finalCalories = typeof formCalories === 'number' ? formCalories : parseInt(formCalories, 10) || recommended.targetCalories;
    const finalProtein = typeof formProteinG === 'number' ? formProteinG : parseFloat(formProteinG) || recommended.targetProteinG;
    const finalCarbs = typeof formCarbsG === 'number' ? formCarbsG : parseFloat(formCarbsG) || recommended.targetCarbsG;
    const finalFat = typeof formFatG === 'number' ? formFatG : parseFloat(formFatG) || recommended.targetFatG;
    const finalFiber = typeof formFiberG === 'number' ? formFiberG : parseFloat(formFiberG) || recommended.targetFiberG;
    const finalWater = typeof formWaterMl === 'number' ? formWaterMl : parseInt(formWaterMl, 10) || recommended.targetWaterMl;

    const weightObj: WeightObjective = {
      targetWeightKg: finalTargetWeight,
      paceKgPerWeek: formPaceKgPerWeek,
      mode: formObjectiveMode,
      targetDate: liveObjectivePlan.projectedDate,
      startDate: new Date().toISOString().split('T')[0],
      startWeightKg: finalWeight,
      deficitStrategy:
        formPaceKgPerWeek <= 0.25
          ? 'gentle'
          : formPaceKgPerWeek <= 0.5
          ? 'standard'
          : 'aggressive',
      preserveMuscleHighProtein: formPreserveMuscle,
    };

    const newProf = syncEngine.createProfile(
      {
        name: formName.trim(),
        email: formEmail.trim(),
        notes: formNotes.trim(),
        avatarColor: formColor,
        gender: formGender,
        age: finalAge,
        heightCm: finalHeight,
        weightKg: finalWeight,
        activityLevel: formActivityLevel,
        goalType: formGoalType,
        themeId: formThemeId,
        weightObjective: weightObj,
        targetCalories: finalCalories,
        targetProteinG: finalProtein,
        targetCarbsG: finalCarbs,
        targetFatG: finalFat,
        targetFiberG: finalFiber,
        targetWaterMl: finalWater,
      },
      true
    );

    if (formThemeId) {
      themeService.setTheme(formThemeId);
    }

    onProfileSwitched(newProf);
    playSuccessChime();
    triggerHaptic('success');
    loadProfiles();
    setActiveTab('list');
  };

  const handleDuplicate = (p: UserProfile) => {
    const copy = syncEngine.duplicateProfile(p.id, `${p.name} (Copy)`);
    if (copy) {
      onProfileSwitched(copy);
      playSuccessChime();
      triggerHaptic('success');
      loadProfiles();
    }
  };

  const handleDelete = (profileId: string) => {
    if (profiles.length <= 1) {
      alert('You cannot delete the only existing profile.');
      return;
    }

    const success = syncEngine.deleteProfile(profileId);
    if (success) {
      setConfirmDeleteId(null);
      const remaining = syncEngine.getUserProfile();
      onProfileSwitched(remaining);
      loadProfiles();
      triggerHaptic('light');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#141416] border border-white/10 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-[#0b0b0c] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#facc15]/10 border border-[#facc15]/20 text-[#facc15]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-oswald font-bold tracking-wide text-white uppercase flex items-center gap-2">
                Athlete Profiles & Personas
              </h2>
              <p className="text-xs text-white/50">
                Switch between athletes, customize goals, or edit profile names
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

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 bg-[#0e0e10] px-4 pt-2 gap-2 shrink-0">
          <button
            onClick={() => {
              setActiveTab('list');
              loadProfiles();
              triggerHaptic('light');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono-meta tracking-wider rounded-t-xl transition cursor-pointer border-b-2 ${
              activeTab === 'list'
                ? 'border-[#facc15] text-[#facc15] bg-[#141416]'
                : 'border-transparent text-white/40 hover:text-white/80'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>ALL PROFILES ({profiles.length})</span>
          </button>

          <button
            onClick={() => {
              populateFormWithProfile(userProfile);
              setActiveTab('edit');
              triggerHaptic('light');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono-meta tracking-wider rounded-t-xl transition cursor-pointer border-b-2 ${
              activeTab === 'edit'
                ? 'border-[#facc15] text-[#facc15] bg-[#141416]'
                : 'border-transparent text-white/40 hover:text-white/80'
            }`}
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>EDIT NAME & GOALS</span>
          </button>

          <button
            onClick={handleStartCreate}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono-meta tracking-wider rounded-t-xl transition cursor-pointer border-b-2 ${
              activeTab === 'create'
                ? 'border-[#facc15] text-[#facc15] bg-[#141416]'
                : 'border-transparent text-white/40 hover:text-white/80'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>ADD NEW PROFILE</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-white flex-1 ios-scroll">
          {/* ======================================================== */}
          {/* TAB 1: ALL PROFILES LIST                                  */}
          {/* ======================================================== */}
          {activeTab === 'list' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-oswald text-base uppercase text-white font-semibold">
                    Configured Personas & Athletes
                  </h3>
                  <p className="text-xs text-white/40">
                    Click "Switch" to instantly change the active tracker persona
                  </p>
                </div>
                <button
                  onClick={handleStartCreate}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#facc15] hover:bg-yellow-300 text-slate-950 rounded-lg text-xs font-bold font-mono-meta transition cursor-pointer shadow-md"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>NEW PROFILE</span>
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {profiles.map((p) => {
                  const isActive = p.id === userProfile.id;
                  const color = p.avatarColor || '#facc15';
                  const initials =
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
                    <div
                      key={p.id}
                      className={`relative p-4 rounded-2xl border transition ${
                        isActive
                          ? 'bg-gradient-to-r from-[#18181b] to-[#1a1a20] border-[#facc15]/50 shadow-lg shadow-yellow-500/5'
                          : 'bg-[#141416] border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        {/* Avatar and Name */}
                        <div className="flex items-center gap-3.5">
                          <div
                            className="w-12 h-12 rounded-2xl flex items-center justify-center font-oswald text-base font-bold uppercase shrink-0 shadow-inner"
                            style={{
                              backgroundColor: `${color}20`,
                              borderColor: color,
                              borderWidth: '2px',
                              color: color,
                            }}
                          >
                            {initials}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-oswald text-lg font-bold uppercase text-white tracking-wide">
                                {p.name}
                              </h4>
                              {isActive && (
                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#facc15]/20 text-[#facc15] border border-[#facc15]/40 text-[10px] font-mono-meta uppercase font-bold">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#facc15] animate-pulse" />
                                  ACTIVE
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-white/50">
                              <span className="capitalize font-medium text-white/70">
                                {p.goalType === 'cut'
                                  ? 'Fat Loss Cut'
                                  : p.goalType === 'bulk'
                                  ? 'Lean Bulk'
                                  : p.goalType === 'keto'
                                  ? 'Keto'
                                  : 'Maintenance'}
                              </span>
                              <span>•</span>
                              <span>{p.weightKg} kg</span>
                              <span>•</span>
                              <span>{p.targetCalories.toLocaleString()} kcal</span>
                              <span>•</span>
                              <span className="text-amber-400 flex items-center gap-0.5">
                                <Flame className="w-3 h-3" />
                                {p.streakDays || 1}d Streak
                              </span>
                            </div>

                            {p.notes && (
                              <p className="text-[11px] text-white/40 italic mt-1">{p.notes}</p>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          {!isActive && (
                            <button
                              onClick={() => handleSwitchProfile(p)}
                              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-mono-meta font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                              title="Switch to this profile"
                            >
                              <UserCheck className="w-3.5 h-3.5 text-[#facc15]" />
                              <span>SWITCH</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleStartEdit(p)}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition cursor-pointer"
                            title="Edit Name & Goals"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDuplicate(p)}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition cursor-pointer"
                            title="Duplicate Profile"
                          >
                            <Copy className="w-4 h-4" />
                          </button>

                          {profiles.length > 1 && (
                            confirmDeleteId === p.id ? (
                              <div className="flex items-center gap-1 bg-rose-950/80 border border-rose-600 rounded-xl p-1 animate-in fade-in">
                                <button
                                  onClick={() => handleDelete(p.id)}
                                  className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[10px] font-bold font-mono-meta cursor-pointer"
                                >
                                  CONFIRM
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="px-1.5 py-1 text-white/60 hover:text-white text-[10px] font-mono-meta cursor-pointer"
                                >
                                  NO
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmDeleteId(p.id)}
                                className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-white/40 hover:text-rose-400 border border-white/10 transition cursor-pointer"
                                title="Delete Profile"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2 & 3: EDIT OR CREATE PROFILE FORM                    */}
          {/* ======================================================== */}
          {(activeTab === 'edit' || activeTab === 'create') && (
            <div className="space-y-5">
              {/* Profile Identity & Name */}
              <div className="p-4 bg-[#0e0e10] border border-white/10 rounded-2xl space-y-4">
                <div className="flex items-center gap-2 text-xs font-mono-meta uppercase text-[#facc15] font-bold">
                  <Shield className="w-4 h-4" />
                  <span>Profile Identity & Personalization</span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-white/70 block mb-1.5">
                    Profile / Athlete Name <span className="text-[#facc15]">*</span>
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Alex Rivera, Competition Prep, Coach Mike"
                    className="w-full bg-[#141416] border border-white/15 focus:border-[#facc15] rounded-xl px-3.5 py-2.5 text-sm font-semibold text-white placeholder:text-white/20 transition outline-none"
                  />
                </div>

                {/* Avatar Color Picker */}
                <div>
                  <label className="text-xs font-semibold text-white/70 block mb-1.5">
                    Profile Accent Color
                  </label>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {PALETTE_COLORS.map((col) => (
                      <button
                        key={col.hex}
                        type="button"
                        onClick={() => setFormColor(col.hex)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition cursor-pointer border-2 ${
                          formColor === col.hex
                            ? 'border-white scale-110 shadow-lg'
                            : 'border-transparent hover:scale-105 opacity-70 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: col.hex }}
                        title={col.label}
                      >
                        {formColor === col.hex && (
                          <Check className="w-4 h-4 text-black stroke-[3]" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preferred Theme for Profile */}
                <div>
                  <label className="text-xs font-semibold text-white/70 block mb-1.5 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-sky-400" />
                    Preferred Theme & UI Style
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {APP_THEMES.map((theme) => {
                      const isSelected = formThemeId === theme.id;
                      return (
                        <button
                          key={theme.id}
                          type="button"
                          onClick={() => setFormThemeId(theme.id)}
                          className={`p-2 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'border-[#facc15] bg-white/10 shadow-md ring-1 ring-[#facc15]'
                              : 'border-white/10 bg-[#141416] hover:border-white/20'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-xs">{theme.icon}</span>
                            <div className="flex items-center gap-0.5">
                              {theme.previewPalette.slice(0, 3).map((c, i) => (
                                <div
                                  key={i}
                                  className="w-2 h-2 rounded-full border border-white/20"
                                  style={{ backgroundColor: c }}
                                />
                              ))}
                            </div>
                          </div>
                          <div className="text-[11px] font-bold text-white truncate">
                            {theme.name}
                          </div>
                          <div className="text-[9px] text-white/40 truncate">
                            {theme.category}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Subtitle / Notes */}
                <div>
                  <label className="text-xs font-semibold text-white/70 block mb-1.5">
                    Tag / Persona Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="e.g. Cutting phase for summer, Marathon training"
                    className="w-full bg-[#141416] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/20 outline-none"
                  />
                </div>
              </div>

              {/* Biometrics */}
              <div className="p-4 bg-[#0e0e10] border border-white/10 rounded-2xl space-y-4">
                <div className="flex items-center gap-2 text-xs font-mono-meta uppercase text-emerald-400 font-bold">
                  <Activity className="w-4 h-4" />
                  <span>Biometric Stats & Energy Expenditure</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="text-[11px] font-semibold text-white/50 block mb-1">Gender</label>
                    <select
                      value={formGender}
                      onChange={(e) => setFormGender(e.target.value as any)}
                      className="w-full bg-[#141416] border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-white/50 block mb-1">Age</label>
                    <input
                      type="number"
                      min="14"
                      max="100"
                      value={formAge}
                      onChange={(e) => setFormAge(e.target.value)}
                      placeholder="25"
                      className="w-full bg-[#141416] border border-white/10 rounded-xl px-2.5 py-2 text-xs font-bold text-white text-center"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-white/50 block mb-1">Height (cm)</label>
                    <input
                      type="number"
                      min="100"
                      max="250"
                      value={formHeightCm}
                      onChange={(e) => setFormHeightCm(e.target.value)}
                      placeholder="175"
                      className="w-full bg-[#141416] border border-white/10 rounded-xl px-2.5 py-2 text-xs font-bold text-white text-center"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-white/50 block mb-1">Weight (kg)</label>
                    <input
                      type="number"
                      min="30"
                      max="300"
                      step="0.5"
                      value={formWeightKg}
                      onChange={(e) => setFormWeightKg(e.target.value)}
                      placeholder="70"
                      className="w-full bg-[#141416] border border-white/10 rounded-xl px-2.5 py-2 text-xs font-bold text-white text-center"
                    />
                  </div>
                </div>

                {/* Activity & Strategy */}
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-semibold text-white/50 block mb-1">
                      Activity Level Multiplier
                    </label>
                    <select
                      value={formActivityLevel}
                      onChange={(e) => setFormActivityLevel(e.target.value as any)}
                      className="w-full bg-[#141416] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option value="sedentary">Sedentary (Desk Job, Little exercise - 1.2x)</option>
                      <option value="light">Light Activity (1-3 days/wk - 1.375x)</option>
                      <option value="moderate">Moderate Activity (3-5 days/wk - 1.55x)</option>
                      <option value="very_active">Very Active (Heavy training 6-7 days/wk - 1.725x)</option>
                      <option value="extra_active">Extra Active (Athlete / physical labor - 1.9x)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-white/50 block mb-1">
                      Fitness Strategy Goal
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {(
                        [
                          { id: 'cut', label: 'Fat Loss Cut (-20%)' },
                          { id: 'maintain', label: 'Maintain (0%)' },
                          { id: 'bulk', label: 'Lean Bulk (+12%)' },
                          { id: 'keto', label: 'Keto Strategy' },
                        ] as const
                      ).map((g) => (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => setFormGoalType(g.id)}
                          className={`py-2 px-1 text-[11px] font-bold rounded-xl text-center transition cursor-pointer ${
                            formGoalType === g.id
                              ? 'bg-[#facc15] text-slate-950 shadow-md font-bold'
                              : 'bg-[#141416] text-white/50 hover:text-white border border-white/10'
                          }`}
                        >
                          {g.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Energy Breakdown Banner */}
                <div className="p-3 bg-[#141416] border border-white/10 rounded-xl flex items-center justify-between">
                  <div className="text-xs text-white/50 space-y-0.5">
                    <div>BMR: <strong className="text-white">{currentBmr} kcal</strong></div>
                    <div>TDEE: <strong className="text-white">{currentTdee} kcal/day</strong></div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-[#facc15] font-mono-meta font-bold uppercase">
                      Recommended
                    </div>
                    <div className="text-base font-oswald font-bold text-white">
                      {recommended.targetCalories} KCAL
                    </div>
                  </div>
                </div>
              </div>

              {/* Weight Objective & Caloric Deficit Calculation Card */}
              <div className="p-4 bg-gradient-to-br from-[#1c1c1e] to-[#121214] border border-[#facc15]/30 rounded-2xl space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-[#facc15]" />
                    <span className="font-oswald text-sm font-bold uppercase text-white tracking-wide">
                      Weight Objective & Caloric Deficit Planner
                    </span>
                  </div>
                  <span className="text-[10px] font-mono-meta text-[#facc15] font-bold px-2 py-0.5 rounded-full bg-yellow-400/10 border border-yellow-400/30">
                    7,700 kcal/kg
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-white/70 block mb-1">
                      Target Weight (kg)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="35"
                      max="250"
                      value={formTargetWeightKg}
                      onChange={(e) => setFormTargetWeightKg(e.target.value)}
                      placeholder="70"
                      className="w-full bg-[#0b0b0c] border border-[#facc15]/40 focus:border-[#facc15] rounded-xl px-3 py-2 text-sm font-oswald font-bold text-yellow-300 outline-none text-center"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-white/70 block mb-1">
                      Weekly Pace (kg/week)
                    </label>
                    <select
                      value={formPaceKgPerWeek}
                      onChange={(e) => setFormPaceKgPerWeek(parseFloat(e.target.value))}
                      className="w-full bg-[#0b0b0c] border border-white/15 focus:border-[#facc15] rounded-xl px-3 py-2 text-xs font-bold text-white outline-none"
                    >
                      <option value="0.25">Gentle (-0.25 kg/wk | ~275 kcal/d deficit)</option>
                      <option value="0.50">Standard Optimal (-0.50 kg/wk | ~550 kcal/d deficit)</option>
                      <option value="0.75">Aggressive Cut (-0.75 kg/wk | ~825 kcal/d deficit)</option>
                      <option value="1.00">Rapid Cut (-1.00 kg/wk | ~1100 kcal/d deficit)</option>
                    </select>
                  </div>
                </div>

                {/* Live Deficit Result Box */}
                <div className="p-3 bg-[#0b0b0c] border border-white/10 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-white/40 font-mono-meta uppercase">
                      Calculated Deficit
                    </div>
                    <div className="font-oswald text-lg font-bold text-[#facc15]">
                      {liveObjectivePlan.dailyDeficitKcal > 0
                        ? `-${liveObjectivePlan.dailyDeficitKcal} kcal/day`
                        : `${liveObjectivePlan.dailyDeficitKcal} kcal/day`}
                    </div>
                    <div className="text-[10px] text-white/50">
                      Est. Goal Date: {new Date(liveObjectivePlan.projectedDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} (~{liveObjectivePlan.weeksNeeded} wks)
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleApplyObjectivePlan}
                    className="px-3 py-2 bg-[#facc15] hover:bg-yellow-300 text-slate-950 rounded-xl font-oswald text-xs font-bold tracking-wide uppercase transition cursor-pointer shadow flex items-center gap-1.5"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Apply to Targets</span>
                  </button>
                </div>
              </div>

              {/* Macro Targets */}
              <div className="p-4 bg-[#0e0e10] border border-white/10 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-mono-meta uppercase text-sky-400 font-bold">
                    <Target className="w-4 h-4" />
                    <span>Daily Macro & Nutrient Targets</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyRecommended}
                    className="flex items-center gap-1 text-[11px] text-[#facc15] hover:text-yellow-300 font-semibold cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    Apply Scientific Math
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#141416] border border-white/10 rounded-xl p-2.5">
                    <label className="text-[10px] uppercase font-bold text-emerald-400 block mb-1">
                      Daily Calories (kcal)
                    </label>
                    <input
                      type="number"
                      value={formCalories}
                      onChange={(e) => setFormCalories(e.target.value)}
                      placeholder="2000"
                      className="w-full bg-[#0b0b0c] border border-white/10 rounded-lg px-2.5 py-1.5 text-sm font-bold text-white text-center"
                    />
                  </div>

                  <div className="bg-[#141416] border border-white/10 rounded-xl p-2.5">
                    <label className="text-[10px] uppercase font-bold text-sky-400 block mb-1">
                      Water Target (ml)
                    </label>
                    <input
                      type="number"
                      value={formWaterMl}
                      onChange={(e) => setFormWaterMl(e.target.value)}
                      placeholder="2500"
                      className="w-full bg-[#0b0b0c] border border-white/10 rounded-lg px-2.5 py-1.5 text-sm font-bold text-white text-center"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <div className="bg-[#141416] border border-white/10 rounded-xl p-2 text-center">
                    <label className="text-[10px] font-bold text-indigo-400 block mb-1">Protein (g)</label>
                    <input
                      type="number"
                      value={formProteinG}
                      onChange={(e) => setFormProteinG(e.target.value)}
                      placeholder="150"
                      className="w-full bg-[#0b0b0c] border border-white/10 rounded-lg px-1.5 py-1 text-xs font-bold text-white text-center"
                    />
                  </div>

                  <div className="bg-[#141416] border border-white/10 rounded-xl p-2 text-center">
                    <label className="text-[10px] font-bold text-amber-400 block mb-1">Carbs (g)</label>
                    <input
                      type="number"
                      value={formCarbsG}
                      onChange={(e) => setFormCarbsG(e.target.value)}
                      placeholder="200"
                      className="w-full bg-[#0b0b0c] border border-white/10 rounded-lg px-1.5 py-1 text-xs font-bold text-white text-center"
                    />
                  </div>

                  <div className="bg-[#141416] border border-white/10 rounded-xl p-2 text-center">
                    <label className="text-[10px] font-bold text-rose-400 block mb-1">Fat (g)</label>
                    <input
                      type="number"
                      value={formFatG}
                      onChange={(e) => setFormFatG(e.target.value)}
                      placeholder="60"
                      className="w-full bg-[#0b0b0c] border border-white/10 rounded-lg px-1.5 py-1 text-xs font-bold text-white text-center"
                    />
                  </div>

                  <div className="bg-[#141416] border border-white/10 rounded-xl p-2 text-center">
                    <label className="text-[10px] font-bold text-teal-400 block mb-1">Fiber (g)</label>
                    <input
                      type="number"
                      value={formFiberG}
                      onChange={(e) => setFormFiberG(e.target.value)}
                      placeholder="30"
                      className="w-full bg-[#0b0b0c] border border-white/10 rounded-lg px-1.5 py-1 text-xs font-bold text-white text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-mono-meta font-bold transition cursor-pointer"
                >
                  CANCEL
                </button>

                <button
                  type="button"
                  onClick={activeTab === 'edit' ? handleSaveEdit : handleSaveCreate}
                  className="flex-1 py-3 bg-[#facc15] hover:bg-yellow-300 text-slate-950 font-oswald font-bold tracking-wider text-sm uppercase rounded-xl shadow-lg transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>
                    {activeTab === 'edit' ? 'Save Profile Changes' : 'Create & Activate Profile'}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
