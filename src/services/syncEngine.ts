import {
  DailySummary,
  FoodItem,
  LoggedFood,
  MacroGoals,
  Recipe,
  SyncQueueItem,
  UserProfile,
  WaterLog,
} from '../types/nutrition';
import {
  aggregateLoggedFoods,
  calculateBMR,
  calculateRecommendedMacros,
  calculateTDEE,
} from './nutritionMath';
import { getCustomFoods } from './foodDatabase';

const STORAGE_LOGS_KEY = 'macropulse_meal_logs_v1';
const STORAGE_WATER_KEY = 'macropulse_water_logs_v1';
const STORAGE_PROFILE_KEY = 'macropulse_user_profile_v1';
const STORAGE_PROFILES_LIST_KEY = 'macropulse_profiles_list_v1';
const STORAGE_ACTIVE_PROFILE_ID_KEY = 'macropulse_active_profile_id_v1';
const STORAGE_QUEUE_KEY = 'macropulse_sync_queue_v1';
const STORAGE_RECIPES_KEY = 'macropulse_recipes_v1';
const STORAGE_CUSTOM_FOODS_KEY = 'macropulse_custom_foods_v1';

export interface ImportPreview {
  isValid: boolean;
  version?: string;
  exportedAt?: string;
  mealLogsCount: number;
  uniqueDatesCount: number;
  recipesCount: number;
  customFoodsCount: number;
  waterLogsCount: number;
  hasProfile: boolean;
  profileName?: string;
  error?: string;
}

export const DEFAULT_USER_PROFILE: UserProfile = {
  id: 'usr_local_athlete_01',
  name: 'Alex Rivera',
  email: 'athlete@macropulse.app',
  avatarColor: '#facc15',
  avatarInitials: 'AR',
  notes: 'Primary Athlete Profile',
  isDefault: true,
  age: 26,
  gender: 'male',
  heightCm: 178,
  weightKg: 78,
  activityLevel: 'moderate',
  goalType: 'cut',
  weightObjective: {
    targetWeightKg: 73,
    paceKgPerWeek: 0.5,
    mode: 'pace',
    deficitStrategy: 'standard',
    preserveMuscleHighProtein: true,
  },
  bmr: 1775,
  tdee: 2750,
  targetCalories: 2200,
  targetProteinG: 165,
  targetCarbsG: 220,
  targetFatG: 70,
  targetFiberG: 32,
  targetWaterMl: 3200,
  useHaptics: true,
  useSound: true,
  streakDays: 6,
  lastLoggedDate: new Date().toISOString().split('T')[0],
};

const INITIAL_SEED_LOGS: LoggedFood[] = [
  {
    id: 'log_seed_1',
    userId: 'usr_local_athlete_01',
    foodId: 'db_oats_rolled',
    foodName: 'Rolled Old Fashioned Oats',
    brand: 'Quaker Oats',
    barcode: '030000010204',
    mealType: 'breakfast',
    date: new Date().toISOString().split('T')[0],
    timestamp: Date.now() - 3600000 * 4,
    servingAmount: 60,
    servingUnit: 'g',
    servingGramWeight: 60,
    calories: 233,
    protein: 10.1,
    carbs: 39.8,
    fat: 4.1,
    fiber: 6.4,
    source: 'verified_db',
    syncStatus: 'synced',
    localCreatedAt: Date.now() - 3600000 * 4,
  },
  {
    id: 'log_seed_2',
    userId: 'usr_local_athlete_01',
    foodId: 'db_whey_protein_isolate',
    foodName: '100% Gold Standard Whey Isolate',
    brand: 'Optimum Nutrition',
    barcode: '748927028669',
    mealType: 'breakfast',
    date: new Date().toISOString().split('T')[0],
    timestamp: Date.now() - 3600000 * 4,
    servingAmount: 1,
    servingUnit: 'serving',
    servingGramWeight: 30.4,
    calories: 120,
    protein: 24.0,
    carbs: 3.0,
    fat: 1.0,
    fiber: 0.4,
    source: 'verified_db',
    syncStatus: 'synced',
    localCreatedAt: Date.now() - 3600000 * 4,
  },
  {
    id: 'log_seed_3',
    userId: 'usr_local_athlete_01',
    foodId: 'db_chicken_breast_cooked',
    foodName: 'Chicken Breast, Boneless & Skinless (Grilled)',
    brand: 'USDA Whole Foods',
    barcode: '000000000002',
    mealType: 'lunch',
    date: new Date().toISOString().split('T')[0],
    timestamp: Date.now() - 3600000 * 1.5,
    servingAmount: 200,
    servingUnit: 'g',
    servingGramWeight: 200,
    calories: 330,
    protein: 62.0,
    carbs: 0.0,
    fat: 7.2,
    fiber: 0.0,
    source: 'verified_db',
    syncStatus: 'synced',
    localCreatedAt: Date.now() - 3600000 * 1.5,
  },
  {
    id: 'log_seed_4',
    userId: 'usr_local_athlete_01',
    foodId: 'db_brown_rice_cooked',
    foodName: 'Brown Rice, Long-Grain (Cooked)',
    brand: 'USDA Whole Foods',
    barcode: '000000000004',
    mealType: 'lunch',
    date: new Date().toISOString().split('T')[0],
    timestamp: Date.now() - 3600000 * 1.5,
    servingAmount: 180,
    servingUnit: 'g',
    servingGramWeight: 180,
    calories: 221,
    protein: 4.9,
    carbs: 46.1,
    fat: 1.8,
    fiber: 3.2,
    source: 'verified_db',
    syncStatus: 'synced',
    localCreatedAt: Date.now() - 3600000 * 1.5,
  },
  {
    id: 'log_seed_5',
    userId: 'usr_local_athlete_01',
    foodId: 'db_avocado',
    foodName: 'Hass Avocado (Fresh)',
    brand: 'USDA Whole Foods',
    barcode: '000000000006',
    mealType: 'lunch',
    date: new Date().toISOString().split('T')[0],
    timestamp: Date.now() - 3600000 * 1.5,
    servingAmount: 60,
    servingUnit: 'g',
    servingGramWeight: 60,
    calories: 96,
    protein: 1.2,
    carbs: 5.1,
    fat: 8.8,
    fiber: 4.0,
    source: 'verified_db',
    syncStatus: 'synced',
    localCreatedAt: Date.now() - 3600000 * 1.5,
  },
];

class SyncEngine {
  private isOnlineStatus: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private listeners: Set<(online: boolean, pendingCount: number) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnlineStatus = true;
        this.flushSyncQueue();
        this.notifyListeners();
      });
      window.addEventListener('offline', () => {
        this.isOnlineStatus = false;
        this.notifyListeners();
      });
    }
  }

  public isOnline(): boolean {
    return this.isOnlineStatus;
  }

  public subscribe(fn: (online: boolean, pendingCount: number) => void): () => void {
    this.listeners.add(fn);
    fn(this.isOnlineStatus, this.getPendingQueueCount());
    return () => {
      this.listeners.delete(fn);
    };
  }

  private notifyListeners() {
    const count = this.getPendingQueueCount();
    this.listeners.forEach((fn) => fn(this.isOnlineStatus, count));
  }

  // --- SYNC QUEUE ---
  public getSyncQueue(): SyncQueueItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  public getPendingQueueCount(): number {
    return this.getSyncQueue().length;
  }

  public enqueueAction(action: SyncQueueItem['action'], table: SyncQueueItem['table'], payload: any) {
    const queue = this.getSyncQueue();
    const item: SyncQueueItem = {
      id: `queue_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      action,
      table,
      payload,
      timestamp: Date.now(),
      retryCount: 0,
    };
    queue.push(item);
    localStorage.setItem(STORAGE_QUEUE_KEY, JSON.stringify(queue));
    this.notifyListeners();

    if (this.isOnlineStatus) {
      setTimeout(() => this.flushSyncQueue(), 400);
    }
  }

  public async flushSyncQueue(): Promise<{ resolved: number; failed: number }> {
    const queue = this.getSyncQueue();
    if (queue.length === 0) return { resolved: 0, failed: 0 };

    let resolved = 0;
    let failed = 0;
    const remaining: SyncQueueItem[] = [];

    for (const item of queue) {
      try {
        await new Promise((r) => setTimeout(r, 60));
        resolved++;
      } catch (err: any) {
        item.retryCount++;
        item.lastError = err.message;
        if (item.retryCount < 5) {
          remaining.push(item);
        }
        failed++;
      }
    }

    localStorage.setItem(STORAGE_QUEUE_KEY, JSON.stringify(remaining));
    this.notifyListeners();
    return { resolved, failed };
  }

  // --- MEAL LOGS CRUD ---
  public getAllMealLogs(): LoggedFood[] {
    try {
      const raw = localStorage.getItem(STORAGE_LOGS_KEY);
      if (!raw) {
        localStorage.setItem(STORAGE_LOGS_KEY, JSON.stringify(INITIAL_SEED_LOGS));
        return INITIAL_SEED_LOGS;
      }
      return JSON.parse(raw);
    } catch {
      return INITIAL_SEED_LOGS;
    }
  }

  public getLogsForDate(dateStr: string): LoggedFood[] {
    const all = this.getAllMealLogs();
    return all.filter((item) => item.date === dateStr);
  }

  public addMealLog(log: Omit<LoggedFood, 'id' | 'localCreatedAt' | 'syncStatus'>): LoggedFood {
    const all = this.getAllMealLogs();
    const newEntry: LoggedFood = {
      ...log,
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      localCreatedAt: Date.now(),
      syncStatus: this.isOnlineStatus ? 'synced' : 'pending',
    };

    all.unshift(newEntry);
    localStorage.setItem(STORAGE_LOGS_KEY, JSON.stringify(all));
    this.enqueueAction('insert', 'meal_logs', newEntry);
    this.updateUserStreak(newEntry.date);
    return newEntry;
  }

  public updateMealLog(logId: string, updates: Partial<LoggedFood>): LoggedFood | null {
    const all = this.getAllMealLogs();
    const index = all.findIndex((l) => l.id === logId);
    if (index === -1) return null;

    const updated = {
      ...all[index],
      ...updates,
      syncStatus: (this.isOnlineStatus ? 'synced' : 'pending') as 'synced' | 'pending',
    };
    all[index] = updated;
    localStorage.setItem(STORAGE_LOGS_KEY, JSON.stringify(all));
    this.enqueueAction('update', 'meal_logs', updated);
    return updated;
  }

  public deleteMealLog(logId: string): boolean {
    const all = this.getAllMealLogs();
    const filtered = all.filter((l) => l.id !== logId);
    if (filtered.length !== all.length) {
      localStorage.setItem(STORAGE_LOGS_KEY, JSON.stringify(filtered));
      this.enqueueAction('delete', 'meal_logs', { id: logId });
      return true;
    }
    return false;
  }

  // --- WATER LOGS CRUD ---
  public getWaterLogs(dateStr?: string): WaterLog[] {
    try {
      const raw = localStorage.getItem(STORAGE_WATER_KEY);
      const all: WaterLog[] = raw ? JSON.parse(raw) : [];
      if (dateStr) {
        return all.filter((w) => w.date === dateStr);
      }
      return all;
    } catch {
      return [];
    }
  }

  public addWater(dateStr: string, amountMl: number): number {
    try {
      const raw = localStorage.getItem(STORAGE_WATER_KEY);
      const all: WaterLog[] = raw ? JSON.parse(raw) : [];
      const entry: WaterLog = {
        id: `water_${Date.now()}`,
        date: dateStr,
        amountMl,
        timestamp: Date.now(),
        syncStatus: this.isOnlineStatus ? 'synced' : 'pending',
      };
      all.push(entry);
      localStorage.setItem(STORAGE_WATER_KEY, JSON.stringify(all));
      this.enqueueAction('insert', 'water_logs', entry);

      return all.filter((w) => w.date === dateStr).reduce((acc, curr) => acc + curr.amountMl, 0);
    } catch {
      return amountMl;
    }
  }

  public resetWater(dateStr: string) {
    try {
      const raw = localStorage.getItem(STORAGE_WATER_KEY);
      const all: WaterLog[] = raw ? JSON.parse(raw) : [];
      const remaining = all.filter((w) => w.date !== dateStr);
      localStorage.setItem(STORAGE_WATER_KEY, JSON.stringify(remaining));
    } catch {
      //
    }
  }

  public getTotalWaterForDate(dateStr: string): number {
    return this.getWaterLogs(dateStr).reduce((sum, w) => sum + w.amountMl, 0);
  }

  // --- DAILY SUMMARY COMPILATION ---
  public getDailySummary(dateStr: string): DailySummary {
    const loggedItems = this.getLogsForDate(dateStr);
    const agg = aggregateLoggedFoods(loggedItems);
    const waterMl = this.getTotalWaterForDate(dateStr);

    return {
      date: dateStr,
      calories: agg.calories,
      protein: agg.protein,
      carbs: agg.carbs,
      fat: agg.fat,
      fiber: agg.fiber,
      waterMl,
      burnedCalories: 350,
      loggedItems,
    };
  }

  // --- USER PROFILES & MULTI-USER MANAGEMENT ---
  public getAllProfiles(): UserProfile[] {
    try {
      const rawList = localStorage.getItem(STORAGE_PROFILES_LIST_KEY);
      if (rawList) {
        const parsed = JSON.parse(rawList);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }

      // Migrate existing single profile if available
      const legacyRaw = localStorage.getItem(STORAGE_PROFILE_KEY);
      const initialProfile = legacyRaw ? { ...DEFAULT_USER_PROFILE, ...JSON.parse(legacyRaw) } : DEFAULT_USER_PROFILE;
      const initialList = [initialProfile];
      localStorage.setItem(STORAGE_PROFILES_LIST_KEY, JSON.stringify(initialList));
      localStorage.setItem(STORAGE_ACTIVE_PROFILE_ID_KEY, initialProfile.id);
      return initialList;
    } catch {
      return [DEFAULT_USER_PROFILE];
    }
  }

  public getActiveProfileId(): string {
    try {
      const activeId = localStorage.getItem(STORAGE_ACTIVE_PROFILE_ID_KEY);
      if (activeId) return activeId;
      const profiles = this.getAllProfiles();
      return profiles[0]?.id || DEFAULT_USER_PROFILE.id;
    } catch {
      return DEFAULT_USER_PROFILE.id;
    }
  }

  public getUserProfile(): UserProfile {
    try {
      const profiles = this.getAllProfiles();
      const activeId = this.getActiveProfileId();
      const match = profiles.find((p) => p.id === activeId);
      if (match) {
        // Sync single storage profile cache
        localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(match));
        return match;
      }
      if (profiles.length > 0) {
        this.setActiveProfile(profiles[0].id);
        return profiles[0];
      }
      return DEFAULT_USER_PROFILE;
    } catch {
      return DEFAULT_USER_PROFILE;
    }
  }

  public setActiveProfile(profileId: string): UserProfile {
    const profiles = this.getAllProfiles();
    const target = profiles.find((p) => p.id === profileId);
    if (!target) return this.getUserProfile();

    localStorage.setItem(STORAGE_ACTIVE_PROFILE_ID_KEY, target.id);
    localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(target));
    this.notifyListeners();
    return target;
  }

  public updateUserProfile(updates: Partial<UserProfile>): UserProfile {
    const current = this.getUserProfile();
    const updated = { ...current, ...updates };

    if (
      updates.weightKg ||
      updates.heightCm ||
      updates.age ||
      updates.gender ||
      updates.activityLevel ||
      updates.goalType
    ) {
      const bmr = calculateBMR(updated.gender, updated.weightKg, updated.heightCm, updated.age);
      const tdee = calculateTDEE(bmr, updated.activityLevel);
      const rec = calculateRecommendedMacros(
        tdee,
        updated.weightKg,
        updated.goalType,
        updated.customMacroDistribution
      );

      updated.bmr = bmr;
      updated.tdee = tdee;
      if (!updates.targetCalories) updated.targetCalories = rec.targetCalories;
      if (!updates.targetProteinG) updated.targetProteinG = rec.targetProteinG;
      if (!updates.targetCarbsG) updated.targetCarbsG = rec.targetCarbsG;
      if (!updates.targetFatG) updated.targetFatG = rec.targetFatG;
      if (!updates.targetFiberG) updated.targetFiberG = rec.targetFiberG;
      if (!updates.targetWaterMl) updated.targetWaterMl = rec.targetWaterMl;
    }

    // Auto-update initials if name changed and not explicitly provided
    if (updates.name && (!updates.avatarInitials || updates.avatarInitials.trim() === '')) {
      const initials = updates.name
        .split(' ')
        .filter(Boolean)
        .map((part) => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
      updated.avatarInitials = initials || 'MP';
    }

    // Save to list
    const profiles = this.getAllProfiles();
    const index = profiles.findIndex((p) => p.id === updated.id);
    if (index >= 0) {
      profiles[index] = updated;
    } else {
      profiles.push(updated);
    }

    localStorage.setItem(STORAGE_PROFILES_LIST_KEY, JSON.stringify(profiles));
    localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(updated));
    this.enqueueAction('update', 'user_goals', updated);
    this.notifyListeners();
    return updated;
  }

  public updateProfileById(profileId: string, updates: Partial<UserProfile>): UserProfile | null {
    const profiles = this.getAllProfiles();
    const index = profiles.findIndex((p) => p.id === profileId);
    if (index === -1) return null;

    const current = profiles[index];
    const updated = { ...current, ...updates };

    if (
      updates.weightKg ||
      updates.heightCm ||
      updates.age ||
      updates.gender ||
      updates.activityLevel ||
      updates.goalType
    ) {
      const bmr = calculateBMR(updated.gender, updated.weightKg, updated.heightCm, updated.age);
      const tdee = calculateTDEE(bmr, updated.activityLevel);
      const rec = calculateRecommendedMacros(
        tdee,
        updated.weightKg,
        updated.goalType,
        updated.customMacroDistribution
      );

      updated.bmr = bmr;
      updated.tdee = tdee;
      if (!updates.targetCalories) updated.targetCalories = rec.targetCalories;
      if (!updates.targetProteinG) updated.targetProteinG = rec.targetProteinG;
      if (!updates.targetCarbsG) updated.targetCarbsG = rec.targetCarbsG;
      if (!updates.targetFatG) updated.targetFatG = rec.targetFatG;
      if (!updates.targetFiberG) updated.targetFiberG = rec.targetFiberG;
      if (!updates.targetWaterMl) updated.targetWaterMl = rec.targetWaterMl;
    }

    if (updates.name && (!updates.avatarInitials || updates.avatarInitials.trim() === '')) {
      const initials = updates.name
        .split(' ')
        .filter(Boolean)
        .map((part) => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
      updated.avatarInitials = initials || 'MP';
    }

    profiles[index] = updated;
    localStorage.setItem(STORAGE_PROFILES_LIST_KEY, JSON.stringify(profiles));

    if (this.getActiveProfileId() === profileId) {
      localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(updated));
    }

    this.notifyListeners();
    return updated;
  }

  public createProfile(
    profileData: Partial<UserProfile> & { name: string },
    switchImmediately: boolean = true
  ): UserProfile {
    const profiles = this.getAllProfiles();
    const newId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const name = profileData.name.trim() || 'Athlete';
    const initials = name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'MP';

    const gender = profileData.gender || 'male';
    const age = profileData.age || 25;
    const heightCm = profileData.heightCm || 175;
    const weightKg = profileData.weightKg || 75;
    const activityLevel = profileData.activityLevel || 'moderate';
    const goalType = profileData.goalType || 'cut';

    const bmr = calculateBMR(gender, weightKg, heightCm, age);
    const tdee = calculateTDEE(bmr, activityLevel);
    const rec = calculateRecommendedMacros(tdee, weightKg, goalType);

    const palette = ['#facc15', '#10b981', '#38bdf8', '#a855f7', '#f43f5e', '#fb923c', '#818cf8'];
    const assignedColor = profileData.avatarColor || palette[profiles.length % palette.length];

    const newProfile: UserProfile = {
      id: newId,
      name,
      email: profileData.email || '',
      avatarColor: assignedColor,
      avatarInitials: profileData.avatarInitials || initials,
      notes: profileData.notes || '',
      isDefault: false,
      age,
      gender,
      heightCm,
      weightKg,
      activityLevel,
      goalType,
      bmr,
      tdee,
      targetCalories: profileData.targetCalories || rec.targetCalories,
      targetProteinG: profileData.targetProteinG || rec.targetProteinG,
      targetCarbsG: profileData.targetCarbsG || rec.targetCarbsG,
      targetFatG: profileData.targetFatG || rec.targetFatG,
      targetFiberG: profileData.targetFiberG || rec.targetFiberG,
      targetWaterMl: profileData.targetWaterMl || rec.targetWaterMl,
      useHaptics: profileData.useHaptics !== undefined ? profileData.useHaptics : true,
      useSound: profileData.useSound !== undefined ? profileData.useSound : true,
      streakDays: 1,
      lastLoggedDate: new Date().toISOString().split('T')[0],
    };

    profiles.push(newProfile);
    localStorage.setItem(STORAGE_PROFILES_LIST_KEY, JSON.stringify(profiles));

    if (switchImmediately) {
      this.setActiveProfile(newId);
    } else {
      this.notifyListeners();
    }

    return newProfile;
  }

  public duplicateProfile(profileId: string, customName?: string): UserProfile | null {
    const profiles = this.getAllProfiles();
    const original = profiles.find((p) => p.id === profileId);
    if (!original) return null;

    const newName = customName || `${original.name} (Copy)`;
    return this.createProfile(
      {
        ...original,
        name: newName,
        email: original.email,
        avatarColor: original.avatarColor,
        isDefault: false,
        streakDays: 0,
      },
      true
    );
  }

  public deleteProfile(profileId: string): boolean {
    const profiles = this.getAllProfiles();
    if (profiles.length <= 1) {
      return false; // Keep at least one profile
    }

    const filtered = profiles.filter((p) => p.id !== profileId);
    localStorage.setItem(STORAGE_PROFILES_LIST_KEY, JSON.stringify(filtered));

    if (this.getActiveProfileId() === profileId) {
      // Switch to first remaining
      this.setActiveProfile(filtered[0].id);
    } else {
      this.notifyListeners();
    }

    return true;
  }

  private updateUserStreak(loggedDate: string) {
    const profile = this.getUserProfile();
    const today = new Date().toISOString().split('T')[0];
    if (profile.lastLoggedDate === loggedDate) return;

    let newStreak = profile.streakDays;
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (profile.lastLoggedDate === yesterday) {
      newStreak += 1;
    } else if (profile.lastLoggedDate !== today) {
      newStreak = 1;
    }

    this.updateUserProfile({
      streakDays: newStreak,
      lastLoggedDate: loggedDate,
    });
  }

  // --- RECIPES CRUD ---
  public getRecipes(): Recipe[] {
    try {
      const raw = localStorage.getItem(STORAGE_RECIPES_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  public saveRecipe(recipe: Recipe): Recipe {
    const all = this.getRecipes();
    const index = all.findIndex((r) => r.id === recipe.id);
    if (index >= 0) {
      all[index] = recipe;
    } else {
      all.unshift(recipe);
    }
    localStorage.setItem(STORAGE_RECIPES_KEY, JSON.stringify(all));
    this.enqueueAction('insert', 'recipes', recipe);
    return recipe;
  }

  public deleteRecipe(recipeId: string): boolean {
    const all = this.getRecipes();
    const filtered = all.filter((r) => r.id !== recipeId);
    if (filtered.length !== all.length) {
      localStorage.setItem(STORAGE_RECIPES_KEY, JSON.stringify(filtered));
      this.enqueueAction('delete', 'recipes', { id: recipeId });
      return true;
    }
    return false;
  }

  // --- DATA EXPORT ENGINE ---

  /**
   * Generates a complete JSON backup payload of all user data
   */
  public exportFullBackupJSON(): string {
    const payload = {
      app: 'MacroPulse',
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      profile: this.getUserProfile(),
      profiles: this.getAllProfiles(),
      activeProfileId: this.getActiveProfileId(),
      mealLogs: this.getAllMealLogs(),
      waterLogs: this.getWaterLogs(),
      recipes: this.getRecipes(),
      customFoods: getCustomFoods(),
    };
    return JSON.stringify(payload, null, 2);
  }

  /**
   * Generates standard RFC 4180 CSV export of all logged foods
   */
  public exportCSV(): string {
    const logs = this.getAllMealLogs();
    const headers = [
      'Date',
      'Meal Type',
      'Food Name',
      'Brand',
      'Serving Amount',
      'Serving Unit',
      'Grams',
      'Calories (kcal)',
      'Protein (g)',
      'Carbs (g)',
      'Fat (g)',
      'Fiber (g)',
      'Barcode',
      'Source',
    ];

    const escapeCsv = (val: any) => {
      const str = String(val ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = logs.map((log) => [
      log.date,
      log.mealType,
      escapeCsv(log.foodName),
      escapeCsv(log.brand || ''),
      log.servingAmount,
      log.servingUnit,
      log.servingGramWeight,
      log.calories,
      log.protein,
      log.carbs,
      log.fat,
      log.fiber,
      log.barcode || '',
      log.source || 'user',
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  }

  // --- DATA IMPORT ENGINE ---

  /**
   * Inspects and validates a JSON string without committing changes
   */
  public validateImportData(jsonString: string): ImportPreview {
    try {
      const data = JSON.parse(jsonString);
      if (!data || typeof data !== 'object') {
        return { isValid: false, mealLogsCount: 0, uniqueDatesCount: 0, recipesCount: 0, customFoodsCount: 0, waterLogsCount: 0, hasProfile: false, error: 'Invalid JSON format: root is not an object.' };
      }

      const mealLogs = Array.isArray(data.mealLogs) ? data.mealLogs : [];
      const waterLogs = Array.isArray(data.waterLogs) ? data.waterLogs : [];
      const recipes = Array.isArray(data.recipes) ? data.recipes : [];
      const customFoods = Array.isArray(data.customFoods) ? data.customFoods : [];
      const hasProfile = Boolean(data.profile && typeof data.profile === 'object');

      const dates = new Set<string>();
      mealLogs.forEach((l: any) => {
        if (l.date) dates.add(l.date);
      });

      return {
        isValid: true,
        version: data.version || '1.0',
        exportedAt: data.exportedAt,
        mealLogsCount: mealLogs.length,
        uniqueDatesCount: dates.size,
        recipesCount: recipes.length,
        customFoodsCount: customFoods.length,
        waterLogsCount: waterLogs.length,
        hasProfile,
        profileName: data.profile?.name,
      };
    } catch (e: any) {
      return {
        isValid: false,
        mealLogsCount: 0,
        uniqueDatesCount: 0,
        recipesCount: 0,
        customFoodsCount: 0,
        waterLogsCount: 0,
        hasProfile: false,
        error: e.message || 'JSON parse error',
      };
    }
  }

  /**
   * Applies the imported data into localStorage with 'merge' or 'replace' mode
   */
  public applyImportData(
    jsonString: string,
    mode: 'merge' | 'replace' = 'merge'
  ): { success: boolean; message: string } {
    try {
      const data = JSON.parse(jsonString);

      if (mode === 'replace') {
        if (Array.isArray(data.profiles) && data.profiles.length > 0) {
          localStorage.setItem(STORAGE_PROFILES_LIST_KEY, JSON.stringify(data.profiles));
          if (data.activeProfileId) {
            localStorage.setItem(STORAGE_ACTIVE_PROFILE_ID_KEY, data.activeProfileId);
          }
        }
        if (data.profile) localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(data.profile));
        if (Array.isArray(data.mealLogs)) localStorage.setItem(STORAGE_LOGS_KEY, JSON.stringify(data.mealLogs));
        if (Array.isArray(data.waterLogs)) localStorage.setItem(STORAGE_WATER_KEY, JSON.stringify(data.waterLogs));
        if (Array.isArray(data.recipes)) localStorage.setItem(STORAGE_RECIPES_KEY, JSON.stringify(data.recipes));
        if (Array.isArray(data.customFoods)) localStorage.setItem(STORAGE_CUSTOM_FOODS_KEY, JSON.stringify(data.customFoods));
      } else {
        // Merge mode: append unique records by ID
        if (Array.isArray(data.profiles) && data.profiles.length > 0) {
          const currentProfiles = this.getAllProfiles();
          const existingProfIds = new Set(currentProfiles.map((p) => p.id));
          const newProfs = data.profiles.filter((p: any) => !existingProfIds.has(p.id));
          const mergedProfiles = [...currentProfiles, ...newProfs];
          localStorage.setItem(STORAGE_PROFILES_LIST_KEY, JSON.stringify(mergedProfiles));
        } else if (data.profile) {
          this.updateUserProfile(data.profile);
        }

        if (Array.isArray(data.mealLogs) && data.mealLogs.length > 0) {
          const currentLogs = this.getAllMealLogs();
          const existingIds = new Set(currentLogs.map((l) => l.id));
          const newEntries = data.mealLogs.filter((l: any) => !existingIds.has(l.id));
          const merged = [...newEntries, ...currentLogs];
          localStorage.setItem(STORAGE_LOGS_KEY, JSON.stringify(merged));
        }

        if (Array.isArray(data.waterLogs) && data.waterLogs.length > 0) {
          const currentWater = this.getWaterLogs();
          const existingWaterIds = new Set(currentWater.map((w) => w.id));
          const newWater = data.waterLogs.filter((w: any) => !existingWaterIds.has(w.id));
          const mergedWater = [...currentWater, ...newWater];
          localStorage.setItem(STORAGE_WATER_KEY, JSON.stringify(mergedWater));
        }

        if (Array.isArray(data.recipes) && data.recipes.length > 0) {
          const currentRecipes = this.getRecipes();
          const existingRecIds = new Set(currentRecipes.map((r) => r.id));
          const newRecs = data.recipes.filter((r: any) => !existingRecIds.has(r.id));
          const mergedRecipes = [...newRecs, ...currentRecipes];
          localStorage.setItem(STORAGE_RECIPES_KEY, JSON.stringify(mergedRecipes));
        }

        if (Array.isArray(data.customFoods) && data.customFoods.length > 0) {
          const currentCustom = getCustomFoods();
          const existingCustomIds = new Set(currentCustom.map((c) => c.id));
          const newCustom = data.customFoods.filter((c: any) => !existingCustomIds.has(c.id));
          const mergedCustom = [...newCustom, ...currentCustom];
          localStorage.setItem(STORAGE_CUSTOM_FOODS_KEY, JSON.stringify(mergedCustom));
        }
      }

      this.notifyListeners();
      return { success: true, message: `Successfully imported data in ${mode} mode.` };
    } catch (e: any) {
      return { success: false, message: e.message || 'Failed to import data' };
    }
  }
}

export const syncEngine = new SyncEngine();
