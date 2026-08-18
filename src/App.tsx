import React, { useEffect, useState } from 'react';
import {
  DailySummary,
  FoodItem,
  LoggedFood,
  MealType,
  ServingUnit,
  UserProfile,
} from './types/nutrition';
import { syncEngine } from './services/syncEngine';
import { SidebarRail } from './components/SidebarRail';
import { Header } from './components/Header';
import { MacroDashboard } from './components/MacroDashboard';
import { MealSection } from './components/MealSection';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { AiFoodScannerModal } from './components/AiFoodScannerModal';
import { FoodSearchModal } from './components/FoodSearchModal';
import { FoodDetailModal } from './components/FoodDetailModal';
import { QuickAddModal } from './components/QuickAddModal';
import { RecipeBuilderModal } from './components/RecipeBuilderModal';
import { GoalsAndTdeeModal } from './components/GoalsAndTdeeModal';
import { WeightObjectiveModal } from './components/WeightObjectiveModal';
import { DatabaseSchemaModal } from './components/DatabaseSchemaModal';
import { AiNutritionAdvisorModal } from './components/AiNutritionAdvisorModal';
import { DataManagementModal } from './components/DataManagementModal';
import { ProfileManagementModal } from './components/ProfileManagementModal';
import { ThemeSettingsModal } from './components/ThemeSettingsModal';
import { AnalyticsView } from './components/AnalyticsView';
import { LayoutRenderer } from './components/layouts/LayoutRenderer';
import { layoutService, LayoutMode } from './services/layoutService';
import { triggerHaptic } from './services/audioFeedback';

export default function App() {
  const [currentDate, setCurrentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [dailySummary, setDailySummary] = useState<DailySummary>(() =>
    syncEngine.getDailySummary(currentDate)
  );
  const [userProfile, setUserProfile] = useState<UserProfile>(() =>
    syncEngine.getUserProfile()
  );
  const [allProfiles, setAllProfiles] = useState<UserProfile[]>(() =>
    syncEngine.getAllProfiles()
  );
  const [currentLayout, setCurrentLayout] = useState<LayoutMode>(() =>
    layoutService.getLayout()
  );
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'tracker' | 'analytics'>('tracker');

  // Modal States
  const [activeMealType, setActiveMealType] = useState<MealType>('breakfast');
  const [isBarcodeOpen, setIsBarcodeOpen] = useState(false);
  const [isAiScanOpen, setIsAiScanOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isRecipeBuilderOpen, setIsRecipeBuilderOpen] = useState(false);
  const [isGoalsOpen, setIsGoalsOpen] = useState(false);
  const [isWeightObjectiveOpen, setIsWeightObjectiveOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileModalInitialTab, setProfileModalInitialTab] = useState<'list' | 'edit' | 'create'>('list');
  const [isSchemaOpen, setIsSchemaOpen] = useState(false);
  const [isAiAdvisorOpen, setIsAiAdvisorOpen] = useState(false);
  const [isDataManagementOpen, setIsDataManagementOpen] = useState(false);

  // Selected food item for portion detail logger / editor
  const [selectedFoodItem, setSelectedFoodItem] = useState<FoodItem | null>(null);
  const [editingLogItem, setEditingLogItem] = useState<LoggedFood | null>(null);

  // Subscribe to sync engine status & layout service
  useEffect(() => {
    const unsubSync = syncEngine.subscribe((online, count) => {
      setIsOnline(online);
      setPendingSyncCount(count);
    });
    const unsubLayout = layoutService.subscribe((l) => {
      setCurrentLayout(l);
    });
    return () => {
      unsubSync();
      unsubLayout();
    };
  }, []);

  // Reload daily summary whenever date changes
  useEffect(() => {
    refreshDailyData();
  }, [currentDate]);

  const refreshDailyData = () => {
    setDailySummary(syncEngine.getDailySummary(currentDate));
    setUserProfile(syncEngine.getUserProfile());
    setAllProfiles(syncEngine.getAllProfiles());
  };

  const handleOpenProfileModal = (tab: 'list' | 'edit' | 'create' = 'list') => {
    setProfileModalInitialTab(tab);
    setIsProfileModalOpen(true);
    triggerHaptic('light');
  };

  const handleSwitchProfile = (newProfile: UserProfile) => {
    setUserProfile(newProfile);
    if (newProfile.layoutMode) {
      layoutService.setLayout(newProfile.layoutMode);
    }
    setAllProfiles(syncEngine.getAllProfiles());
    setDailySummary(syncEngine.getDailySummary(currentDate));
  };

  const handleProfileUpdated = (updated: UserProfile) => {
    setUserProfile(updated);
    if (updated.layoutMode) {
      layoutService.setLayout(updated.layoutMode);
    }
    setAllProfiles(syncEngine.getAllProfiles());
    setDailySummary(syncEngine.getDailySummary(currentDate));
  };

  // Handlers for logging
  const handleOpenSearch = (meal: MealType = 'breakfast') => {
    setActiveMealType(meal);
    setIsSearchOpen(true);
    triggerHaptic('light');
  };

  const handleOpenBarcode = (meal: MealType = 'breakfast') => {
    setActiveMealType(meal);
    setIsBarcodeOpen(true);
    triggerHaptic('light');
  };

  const handleOpenAiScan = (meal: MealType = 'breakfast') => {
    setActiveMealType(meal);
    setIsAiScanOpen(true);
    triggerHaptic('light');
  };

  const handleOpenQuickAdd = (meal: MealType = 'breakfast') => {
    setActiveMealType(meal);
    setIsQuickAddOpen(true);
    triggerHaptic('light');
  };

  const handleOpenDataManagement = () => {
    setIsDataManagementOpen(true);
    triggerHaptic('light');
  };

  const handleSelectFoodItem = (food: FoodItem) => {
    setSelectedFoodItem(food);
    setEditingLogItem(null);
    setIsSearchOpen(false);
    setIsDetailOpen(true);
    triggerHaptic('light');
  };

  const handleProductFoundFromBarcode = (food: FoodItem) => {
    setSelectedFoodItem(food);
    setEditingLogItem(null);
    setIsDetailOpen(true);
    triggerHaptic('success');
  };

  const handleEditLoggedItem = (item: LoggedFood) => {
    const foodItem: FoodItem = {
      id: item.foodId,
      name: item.foodName,
      brand: item.brand,
      barcode: item.barcode,
      source: (item.source as any) || 'custom',
      caloriesPer100g: Math.round((item.calories / (item.servingGramWeight || 100)) * 100) || 100,
      proteinPer100g: Math.round(((item.protein / (item.servingGramWeight || 100)) * 100) * 10) / 10 || 0,
      carbsPer100g: Math.round(((item.carbs / (item.servingGramWeight || 100)) * 100) * 10) / 10 || 0,
      fatPer100g: Math.round(((item.fat / (item.servingGramWeight || 100)) * 100) * 10) / 10 || 0,
      fiberPer100g: Math.round(((item.fiber / (item.servingGramWeight || 100)) * 100) * 10) / 10 || 0,
      defaultServingSize: item.servingAmount,
      defaultServingUnit: item.servingUnit,
      servingOptions: [
        { unit: item.servingUnit, label: `${item.servingUnit}`, gramWeight: item.servingGramWeight / item.servingAmount },
        { unit: 'g', label: 'grams (g)', gramWeight: 1 },
      ],
      micros: item.micros,
    };

    setSelectedFoodItem(foodItem);
    setEditingLogItem(item);
    setActiveMealType(item.mealType);
    setIsDetailOpen(true);
  };

  const handleSaveFoodLog = (logData: {
    foodItem: FoodItem;
    mealType: MealType;
    servingAmount: number;
    servingUnit: ServingUnit;
    servingGramWeight: number;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    editingLogId?: string;
  }) => {
    if (logData.editingLogId) {
      syncEngine.updateMealLog(logData.editingLogId, {
        mealType: logData.mealType,
        servingAmount: logData.servingAmount,
        servingUnit: logData.servingUnit,
        servingGramWeight: logData.servingGramWeight,
        calories: logData.calories,
        protein: logData.protein,
        carbs: logData.carbs,
        fat: logData.fat,
        fiber: logData.fiber,
      });
    } else {
      syncEngine.addMealLog({
        userId: userProfile.id,
        foodId: logData.foodItem.id,
        foodName: logData.foodItem.name,
        brand: logData.foodItem.brand,
        barcode: logData.foodItem.barcode,
        mealType: logData.mealType,
        date: currentDate,
        timestamp: Date.now(),
        servingAmount: logData.servingAmount,
        servingUnit: logData.servingUnit,
        servingGramWeight: logData.servingGramWeight,
        calories: logData.calories,
        protein: logData.protein,
        carbs: logData.carbs,
        fat: logData.fat,
        fiber: logData.fiber,
        micros: logData.foodItem.micros,
        source: logData.foodItem.source,
      });
    }
    refreshDailyData();
  };

  const handleDeleteMealLog = (logId: string) => {
    syncEngine.deleteMealLog(logId);
    refreshDailyData();
  };

  const handleBatchLogDetectedFoods = (
    items: Array<{
      foodItem: FoodItem;
      amount: number;
      unit: string;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      fiber: number;
    }>
  ) => {
    items.forEach((it) => {
      syncEngine.addMealLog({
        userId: userProfile.id,
        foodId: it.foodItem.id,
        foodName: it.foodItem.name,
        mealType: activeMealType,
        date: currentDate,
        timestamp: Date.now(),
        servingAmount: it.amount,
        servingUnit: it.unit as any,
        servingGramWeight: it.amount,
        calories: it.calories,
        protein: it.protein,
        carbs: it.carbs,
        fat: it.fat,
        fiber: it.fiber,
        source: 'ai_detected',
      });
    });
    refreshDailyData();
  };

  const handleQuickAdd = (entry: {
    name: string;
    mealType: MealType;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  }) => {
    syncEngine.addMealLog({
      userId: userProfile.id,
      foodId: `custom_${Date.now()}`,
      foodName: entry.name,
      mealType: entry.mealType,
      date: currentDate,
      timestamp: Date.now(),
      servingAmount: 1,
      servingUnit: 'serving',
      servingGramWeight: 100,
      calories: entry.calories,
      protein: entry.protein,
      carbs: entry.carbs,
      fat: entry.fat,
      fiber: entry.fiber,
      source: 'manual',
    });
    refreshDailyData();
  };

  const handleAddWater = (amountMl: number) => {
    syncEngine.addWater(currentDate, amountMl);
    refreshDailyData();
  };

  const handleResetWater = () => {
    syncEngine.resetWater(currentDate);
    refreshDailyData();
  };

  const handleSaveProfile = (updates: Partial<UserProfile>) => {
    const updated = syncEngine.updateUserProfile(updates);
    setUserProfile(updated);
    refreshDailyData();
  };

  return (
    <div className="flex h-screen w-full bg-[#0b0b0c] text-white font-geist overflow-hidden relative select-none">
      {/* Dynamic Structural Layout Renderer */}
      <LayoutRenderer
        layoutMode={currentLayout}
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        userProfile={userProfile}
        dailySummary={dailySummary}
        allProfiles={allProfiles}
        onSwitchProfile={handleSwitchProfile}
        isOnline={isOnline}
        pendingSyncCount={pendingSyncCount}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSearch={handleOpenSearch}
        onOpenBarcode={handleOpenBarcode}
        onOpenAiScan={handleOpenAiScan}
        onOpenQuickAdd={handleOpenQuickAdd}
        onEditItem={handleEditLoggedItem}
        onDeleteItem={handleDeleteMealLog}
        onOpenProfileModal={() => handleOpenProfileModal('list')}
        onOpenWeightObjectiveModal={() => setIsWeightObjectiveOpen(true)}
        onOpenGoalsModal={() => setIsGoalsOpen(true)}
        onOpenThemeModal={() => setIsThemeOpen(true)}
        onOpenAiAdvisor={() => setIsAiAdvisorOpen(true)}
        onOpenRecipeBuilder={() => setIsRecipeBuilderOpen(true)}
        onOpenDataManagement={handleOpenDataManagement}
        onOpenSchemaModal={() => setIsSchemaOpen(true)}
        onAddWater={handleAddWater}
        onResetWater={handleResetWater}
      />

      {/* Modals & Overlays */}
      <ProfileManagementModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        userProfile={userProfile}
        onProfileSwitched={handleSwitchProfile}
        onProfileUpdated={handleProfileUpdated}
        initialTab={profileModalInitialTab}
        onOpenWeightObjectiveModal={() => {
          setIsProfileModalOpen(false);
          setIsWeightObjectiveOpen(true);
        }}
      />

      <DataManagementModal
        isOpen={isDataManagementOpen}
        onClose={() => setIsDataManagementOpen(false)}
        onDataChanged={refreshDailyData}
      />

      <BarcodeScannerModal
        isOpen={isBarcodeOpen}
        onClose={() => setIsBarcodeOpen(false)}
        mealType={activeMealType}
        onProductFound={handleProductFoundFromBarcode}
        onProfileUpdated={refreshDailyData}
      />

      <AiFoodScannerModal
        isOpen={isAiScanOpen}
        onClose={() => setIsAiScanOpen(false)}
        mealType={activeMealType}
        onBatchLogDetectedFoods={handleBatchLogDetectedFoods}
      />

      <FoodSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        mealType={activeMealType}
        onSelectFood={handleSelectFoodItem}
        onOpenBarcode={() => setIsBarcodeOpen(true)}
        onOpenAiScan={() => setIsAiScanOpen(true)}
        onOpenQuickAdd={() => setIsQuickAddOpen(true)}
        onOpenRecipeBuilder={() => setIsRecipeBuilderOpen(true)}
      />

      <FoodDetailModal
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedFoodItem(null);
          setEditingLogItem(null);
        }}
        foodItem={selectedFoodItem}
        initialMealType={activeMealType}
        editingLog={editingLogItem}
        onSaveLog={handleSaveFoodLog}
        onDeleteLog={handleDeleteMealLog}
      />

      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        mealType={activeMealType}
        onQuickAdd={handleQuickAdd}
      />

      <RecipeBuilderModal
        isOpen={isRecipeBuilderOpen}
        onClose={() => setIsRecipeBuilderOpen(false)}
        onRecipeSaved={() => refreshDailyData()}
      />

      <GoalsAndTdeeModal
        isOpen={isGoalsOpen}
        onClose={() => setIsGoalsOpen(false)}
        userProfile={userProfile}
        onSaveProfile={handleSaveProfile}
        onOpenProfileManager={() => handleOpenProfileModal('list')}
        onOpenWeightObjective={() => {
          setIsGoalsOpen(false);
          setIsWeightObjectiveOpen(true);
        }}
        onOpenThemeModal={() => {
          setIsGoalsOpen(false);
          setIsThemeOpen(true);
        }}
      />

      <ThemeSettingsModal
        isOpen={isThemeOpen}
        onClose={() => setIsThemeOpen(false)}
        userProfile={userProfile}
        onUpdateProfile={handleSaveProfile}
      />

      <WeightObjectiveModal
        isOpen={isWeightObjectiveOpen}
        onClose={() => setIsWeightObjectiveOpen(false)}
        userProfile={userProfile}
        onSaveObjective={handleSaveProfile}
      />

      <DatabaseSchemaModal
        isOpen={isSchemaOpen}
        onClose={() => setIsSchemaOpen(false)}
      />

      <AiNutritionAdvisorModal
        isOpen={isAiAdvisorOpen}
        onClose={() => setIsAiAdvisorOpen(false)}
        dailySummary={dailySummary}
        userProfile={userProfile}
      />
    </div>
  );
}
