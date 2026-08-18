import { 
  auth, 
  db, 
  onAuthStateChanged, 
  User, 
  logoutUser 
} from '../lib/firebase';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  getDocs, 
  serverTimestamp,
  writeBatch,
  query,
  limit
} from 'firebase/firestore';
import { UserProfile, DailySummary, Recipe } from '../types/nutrition';
import { WeeklyMealPlan } from '../types/planner';
import { syncEngine } from './syncEngine';
import { plannerService } from './plannerService';

export type CloudSyncStatus = 'guest' | 'syncing' | 'synced' | 'offline' | 'error';

class FirebaseSyncService {
  private currentUser: User | null = null;
  private statusListeners: ((status: CloudSyncStatus, user: User | null) => void)[] = [];
  private currentStatus: CloudSyncStatus = 'guest';
  private syncTimeout: NodeJS.Timeout | null = null;
  private isSyncing = false;

  constructor() {
    this.initAuthListener();
  }

  private initAuthListener() {
    onAuthStateChanged(auth, async (user) => {
      this.currentUser = user;
      if (user) {
        this.setStatus('syncing');
        try {
          await this.pullFromCloudAndMerge();
          this.setStatus('synced');
        } catch (err) {
          console.error('Initial cloud sync error:', err);
          this.setStatus('error');
        }
      } else {
        this.setStatus('guest');
      }
    });

    // Monitor online/offline status
    window.addEventListener('online', () => {
      if (this.currentUser) {
        this.syncAllToCloud();
      }
    });

    window.addEventListener('offline', () => {
      if (this.currentUser) {
        this.setStatus('offline');
      }
    });
  }

  public subscribeStatus(listener: (status: CloudSyncStatus, user: User | null) => void) {
    this.statusListeners.push(listener);
    listener(this.currentStatus, this.currentUser);
    return () => {
      this.statusListeners = this.statusListeners.filter(l => l !== listener);
    };
  }

  public getStatus(): { status: CloudSyncStatus; user: User | null } {
    return { status: this.currentStatus, user: this.currentUser };
  }

  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  private setStatus(status: CloudSyncStatus) {
    this.currentStatus = status;
    this.statusListeners.forEach(l => l(status, this.currentUser));
  }

  /**
   * Sync active profile, logs, and planner to Cloud Firestore
   */
  public async syncAllToCloud(): Promise<boolean> {
    if (!this.currentUser || !navigator.onLine) {
      return false;
    }

    if (this.isSyncing) return false;
    this.isSyncing = true;
    this.setStatus('syncing');

    try {
      const uid = this.currentUser.uid;
      const profile = syncEngine.getUserProfile();
      const allProfiles = syncEngine.getAllProfiles();
      const allLogs = syncEngine.getAllLogs();
      const allRecipes = syncEngine.getRecipes();

      // 1. User document & Active Profile
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, {
        email: this.currentUser.email || '',
        displayName: this.currentUser.displayName || profile.name,
        lastActiveAt: new Date().toISOString(),
        updatedAt: serverTimestamp(),
      }, { merge: true });

      // Save active profile & all profiles
      const profileRef = doc(db, 'users', uid, 'profile', 'active');
      await setDoc(profileRef, {
        ...profile,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // Batch save profiles
      const batch = writeBatch(db);
      for (const p of allProfiles) {
        const pRef = doc(db, 'users', uid, 'profiles', p.id);
        batch.set(pRef, { ...p, updatedAt: new Date().toISOString() }, { merge: true });
      }

      // Batch save recent daily logs (last 30 logs)
      const logsArray = Object.entries(allLogs).slice(0, 45);
      for (const [dateKey, log] of logsArray) {
        const logRef = doc(db, 'users', uid, 'logs', dateKey);
        batch.set(logRef, { ...log, updatedAt: new Date().toISOString() }, { merge: true });
      }

      // Batch save recipes
      for (const recipe of allRecipes) {
        const rRef = doc(db, 'users', uid, 'recipes', recipe.id);
        batch.set(rRef, { ...recipe, updatedAt: new Date().toISOString() }, { merge: true });
      }

      await batch.commit();

      // Sync active weekly meal plan
      const currentMonday = plannerService.getMondayOfWeek(new Date().toISOString().split('T')[0]);
      const activePlan = plannerService.getWeeklyPlan(currentMonday, profile.id);
      if (activePlan) {
        const planRef = doc(db, 'users', uid, 'planner', `${profile.id}_${currentMonday}`);
        await setDoc(planRef, {
          ...activePlan,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }

      this.setStatus('synced');
      this.isSyncing = false;
      return true;
    } catch (error) {
      console.error('Error syncing to Firestore:', error);
      this.setStatus('error');
      this.isSyncing = false;
      return false;
    }
  }

  /**
   * Debounced sync to avoid excessive writes
   */
  public triggerDebouncedSync() {
    if (!this.currentUser) return;
    if (this.syncTimeout) clearTimeout(this.syncTimeout);
    this.syncTimeout = setTimeout(() => {
      this.syncAllToCloud();
    }, 1500);
  }

  /**
   * Pull user data from Cloud Firestore and merge with local storage
   */
  public async pullFromCloudAndMerge(): Promise<void> {
    if (!this.currentUser) return;
    const uid = this.currentUser.uid;

    try {
      // 1. Fetch active profile
      const activeProfileDoc = await getDoc(doc(db, 'users', uid, 'profile', 'active'));
      if (activeProfileDoc.exists()) {
        const cloudProfile = activeProfileDoc.data() as UserProfile;
        // If cloud profile is newer or exists, update local
        if (cloudProfile && cloudProfile.name) {
          syncEngine.saveUserProfile(cloudProfile);
        }
      } else {
        // First cloud sync for this user: push local profile to cloud
        const localProfile = syncEngine.getUserProfile();
        await setDoc(doc(db, 'users', uid, 'profile', 'active'), {
          ...localProfile,
          updatedAt: new Date().toISOString()
        });
      }

      // 2. Fetch profiles collection
      const profilesSnap = await getDocs(collection(db, 'users', uid, 'profiles'));
      profilesSnap.forEach((docSnap) => {
        const p = docSnap.data() as UserProfile;
        if (p && p.id) {
          syncEngine.saveUserProfile(p);
        }
      });

      // 3. Fetch logs collection
      const logsSnap = await getDocs(collection(db, 'users', uid, 'logs'));
      logsSnap.forEach((docSnap) => {
        const log = docSnap.data() as DailySummary;
        if (log && log.date) {
          syncEngine.saveDailyLog(log);
        }
      });

      // 4. Fetch recipes collection
      const recipesSnap = await getDocs(collection(db, 'users', uid, 'recipes'));
      recipesSnap.forEach((docSnap) => {
        const recipe = docSnap.data() as Recipe;
        if (recipe && recipe.id) {
          syncEngine.saveRecipe(recipe);
        }
      });

      // 5. Fetch planner plans
      const plannerSnap = await getDocs(collection(db, 'users', uid, 'planner'));
      plannerSnap.forEach((docSnap) => {
        const plan = docSnap.data() as WeeklyMealPlan;
        if (plan && plan.weekStartDate && plan.profileId) {
          plannerService.saveWeeklyPlan(plan);
        }
      });

    } catch (err) {
      console.error('Error pulling data from cloud:', err);
      throw err;
    }
  }

  /**
   * Save a single daily log to cloud
   */
  public async syncLog(log: DailySummary) {
    if (!this.currentUser) return;
    try {
      const uid = this.currentUser.uid;
      const logRef = doc(db, 'users', uid, 'logs', log.date);
      await setDoc(logRef, { ...log, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (err) {
      console.warn('Failed to sync individual log:', err);
    }
  }

  /**
   * Save a weekly planner plan to cloud
   */
  public async syncPlan(plan: WeeklyMealPlan) {
    if (!this.currentUser) return;
    try {
      const uid = this.currentUser.uid;
      const planRef = doc(db, 'users', uid, 'planner', `${plan.profileId}_${plan.weekStartDate}`);
      await setDoc(planRef, { ...plan, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (err) {
      console.warn('Failed to sync planner plan:', err);
    }
  }
}

export const firebaseSyncService = new FirebaseSyncService();
