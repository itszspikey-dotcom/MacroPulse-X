import React, { useEffect, useState } from 'react';
import {
  Search,
  X,
  QrCode,
  Sparkles,
  Zap,
  Star,
  BookOpen,
  Filter,
  CheckCircle2,
  ChevronRight,
  Plus,
  Loader2,
} from 'lucide-react';
import { FoodItem, MealType, Recipe } from '../types/nutrition';
import { searchOpenFoodFacts } from '../services/openFoodFactsService';
import { searchUsdaFoods } from '../services/usdaService';
import {
  getCustomFoods,
  getFavoriteIds,
  toggleFavorite,
  VERIFIED_OFFLINE_FOODS,
} from '../services/foodDatabase';
import { syncEngine } from '../services/syncEngine';

interface FoodSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  mealType: MealType;
  onSelectFood: (food: FoodItem) => void;
  onOpenBarcode: () => void;
  onOpenAiScan: () => void;
  onOpenQuickAdd: () => void;
  onOpenRecipeBuilder: () => void;
}

type FilterCategory = 'all' | 'high_protein' | 'low_carb' | 'whole_foods' | 'favorites' | 'recipes';

export const FoodSearchModal: React.FC<FoodSearchModalProps> = ({
  isOpen,
  onClose,
  mealType,
  onSelectFood,
  onOpenBarcode,
  onOpenAiScan,
  onOpenQuickAdd,
  onOpenRecipeBuilder,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterCategory>('all');
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [isLoadingApi, setIsLoadingApi] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  useEffect(() => {
    if (isOpen) {
      setFavoriteIds(getFavoriteIds());
      setRecipes(syncEngine.getRecipes());
    }
  }, [isOpen]);

  useEffect(() => {
    let isCancelled = false;

    const performSearch = async () => {
      const query = searchQuery.trim().toLowerCase();
      const customFoods = getCustomFoods();

      // 1. Gather all local candidates
      let combinedLocal = [...VERIFIED_OFFLINE_FOODS, ...customFoods];

      // Filter by text
      if (query) {
        combinedLocal = combinedLocal.filter(
          (f) =>
            f.name.toLowerCase().includes(query) ||
            f.brand?.toLowerCase().includes(query) ||
            f.categories?.some((c) => c.toLowerCase().includes(query))
        );
      }

      // Filter by category
      if (selectedFilter === 'high_protein') {
        combinedLocal = combinedLocal.filter((f) => f.proteinPer100g >= 12);
      } else if (selectedFilter === 'low_carb') {
        combinedLocal = combinedLocal.filter((f) => f.carbsPer100g <= 5);
      } else if (selectedFilter === 'whole_foods') {
        combinedLocal = combinedLocal.filter((f) => f.source === 'verified_db' || f.categories?.includes('Whole Foods'));
      } else if (selectedFilter === 'favorites') {
        const favSet = new Set(favoriteIds);
        combinedLocal = combinedLocal.filter((f) => favSet.has(f.id));
      }

      setSearchResults(combinedLocal);

      // 2. If user typed a search term (>= 2 characters) and we are online, trigger external API search
      if (query.length >= 2 && selectedFilter !== 'favorites' && selectedFilter !== 'recipes') {
        setIsLoadingApi(true);
        try {
          const [offResults, usdaResults] = await Promise.allSettled([
            searchOpenFoodFacts(query),
            searchUsdaFoods(query),
          ]);

          if (!isCancelled) {
            const apiItems: FoodItem[] = [];
            if (offResults.status === 'fulfilled') {
              apiItems.push(...offResults.value);
            }
            if (usdaResults.status === 'fulfilled') {
              apiItems.push(...usdaResults.value);
            }

            // Deduplicate by name and ID
            const seen = new Set(combinedLocal.map((i) => i.name.toLowerCase()));
            const uniqueApi = apiItems.filter((item) => {
              const lower = item.name.toLowerCase();
              if (seen.has(lower)) return false;
              seen.add(lower);
              return true;
            });

            setSearchResults([...combinedLocal, ...uniqueApi]);
          }
        } catch (e) {
          // ignore
        } finally {
          if (!isCancelled) setIsLoadingApi(false);
        }
      } else {
        setIsLoadingApi(false);
      }
    };

    const timer = setTimeout(performSearch, 250);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery, selectedFilter, favoriteIds]);

  const handleToggleFav = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    toggleFavorite(id);
    setFavoriteIds(getFavoriteIds());
  };

  const handleSelectRecipe = (recipe: Recipe) => {
    // Convert recipe into a selectable FoodItem with 1 serving default
    const foodItem: FoodItem = {
      id: `recipe_${recipe.id}`,
      name: recipe.name,
      brand: 'Custom Recipe',
      source: 'recipe',
      caloriesPer100g: Math.round((recipe.perServingCalories / (recipe.totalWeightG / recipe.servings)) * 100),
      proteinPer100g: Math.round((recipe.perServingProtein / (recipe.totalWeightG / recipe.servings)) * 100 * 10) / 10,
      carbsPer100g: Math.round((recipe.perServingCarbs / (recipe.totalWeightG / recipe.servings)) * 100 * 10) / 10,
      fatPer100g: Math.round((recipe.perServingFat / (recipe.totalWeightG / recipe.servings)) * 100 * 10) / 10,
      fiberPer100g: Math.round((recipe.perServingFiber / (recipe.totalWeightG / recipe.servings)) * 100 * 10) / 10,
      defaultServingSize: 1,
      defaultServingUnit: 'serving',
      servingOptions: [
        { unit: 'serving', label: `1 serving (${Math.round(recipe.totalWeightG / recipe.servings)}g)`, gramWeight: Math.round(recipe.totalWeightG / recipe.servings) },
        { unit: 'g', label: 'grams (g)', gramWeight: 1 },
      ],
      isVerified: true,
    };
    onSelectFood(foodItem);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#141416] border border-white/10 rounded-sm w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#141416] text-white">
          <div>
            <h3 className="font-oswald text-lg font-semibold tracking-wider flex items-center gap-2 uppercase">
              Log Food to <span className="text-[#facc15]">{mealType}</span>
            </h3>
            <p className="font-mono-meta text-[11px] text-white/40">Search verified foods, USDA, Open Food Facts or scan</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition cursor-pointer border border-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Action Bar (Barcode, AI Scan, Quick Add, Recipe) */}
        <div className="px-5 py-3 bg-[#0b0b0c] border-b border-white/10 flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => {
              onClose();
              onOpenBarcode();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 font-mono-meta text-xs transition shrink-0 cursor-pointer"
          >
            <QrCode className="w-3.5 h-3.5 text-[#facc15]" />
            Barcode Scan
          </button>

          <button
            onClick={() => {
              onClose();
              onOpenAiScan();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 font-mono-meta text-xs transition shrink-0 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            AI Photo Scan
          </button>

          <button
            onClick={() => {
              onClose();
              onOpenQuickAdd();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 font-mono-meta text-xs transition shrink-0 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-sky-400" />
            Quick Add
          </button>

          <button
            onClick={() => {
              onClose();
              onOpenRecipeBuilder();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 font-mono-meta text-xs transition shrink-0 cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            New Recipe
          </button>
        </div>

        {/* Search Input */}
        <div className="p-5 pb-2">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search foods (e.g. Greek Yogurt, Oats, Salmon, Rice)..."
              className="w-full bg-[#0b0b0c] border border-white/10 rounded-sm pl-10 pr-10 py-2.5 text-sm text-white placeholder-white/30 focus:outline-hidden focus:border-[#facc15] transition font-geist"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1 font-mono-meta text-xs">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'high_protein', label: 'High Protein' },
                { id: 'low_carb', label: 'Low Carb' },
                { id: 'whole_foods', label: 'Whole Foods' },
                { id: 'favorites', label: 'Favorites' },
                { id: 'recipes', label: `Recipes (${recipes.length})` },
              ] as const
            ).map((filter) => (
              <button
                key={filter.id}
                onClick={() => setSelectedFilter(filter.id)}
                className={`px-3 py-1 rounded-sm whitespace-nowrap transition cursor-pointer ${
                  selectedFilter === filter.id
                    ? 'bg-[#facc15] text-black font-semibold'
                    : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/10'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto px-5 pb-5 divide-y divide-white/5">
          {isLoadingApi && (
            <div className="py-3 flex items-center justify-center gap-2 font-mono-meta text-xs text-[#facc15]">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>SEARCHING OPEN FOOD FACTS & USDA DATABASE...</span>
            </div>
          )}

          {/* Recipes View */}
          {selectedFilter === 'recipes' && (
            <div className="py-2 space-y-2">
              {recipes.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No recipes created yet. Tap "New Recipe" above to combine multiple ingredients.
                </div>
              ) : (
                recipes.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => handleSelectRecipe(r)}
                    className="p-3 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 flex items-center justify-between cursor-pointer transition"
                  >
                    <div>
                      <h4 className="text-sm font-bold text-white">{r.name}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {r.servings} serving(s) • {r.ingredients.length} ingredients
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-black text-emerald-400">
                        {r.perServingCalories} <span className="text-[10px] text-slate-400">kcal/serv</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {r.perServingProtein}g P • {r.perServingCarbs}g C • {r.perServingFat}g F
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Food Items */}
          {selectedFilter !== 'recipes' && (
            searchResults.length === 0 ? (
              <div className="py-12 text-center font-mono-meta text-xs text-white/30">
                No matching foods found. Try typing a different keyword or create a custom food item.
              </div>
            ) : (
              searchResults.map((item) => {
                const isFav = favoriteIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => onSelectFood(item)}
                    className="py-3 flex items-center justify-between gap-3 group hover:bg-white/5 rounded px-2 transition cursor-pointer"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-white group-hover:text-[#facc15] transition truncate font-geist">
                          {item.name}
                        </h4>
                        {item.isVerified && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        )}
                        {item.nutriScore && (
                          <span
                            className={`text-[9px] px-1 font-bold rounded ${
                              item.nutriScore === 'A'
                                ? 'bg-emerald-600 text-white'
                                : item.nutriScore === 'B'
                                ? 'bg-teal-600 text-white'
                                : 'bg-amber-600 text-white'
                            }`}
                          >
                            {item.nutriScore}
                          </span>
                        )}
                      </div>
                      <div className="font-mono-meta text-[11px] text-white/40 mt-0.5 truncate">
                        {item.brand || 'Reference portion'} • per 100g: {item.caloriesPer100g} kcal
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="font-oswald text-base font-semibold text-white">
                          {item.caloriesPer100g} <span className="font-mono-meta text-[10px] text-white/40 font-normal">KCAL</span>
                        </div>
                        <div className="font-mono-meta text-[10px] text-white/40">
                          <span>{item.proteinPer100g}P</span> /{' '}
                          <span>{item.carbsPer100g}C</span> /{' '}
                          <span>{item.fatPer100g}F</span>
                        </div>
                      </div>

                      {/* Favorite Star */}
                      <button
                        onClick={(e) => handleToggleFav(e, item.id)}
                        className={`p-1.5 rounded transition cursor-pointer ${
                          isFav
                            ? 'text-amber-400 hover:text-amber-300'
                            : 'text-slate-600 hover:text-slate-400 opacity-60 group-hover:opacity-100'
                        }`}
                      >
                        <Star className={`w-4 h-4 ${isFav ? 'fill-amber-400' : ''}`} />
                      </button>
                    </div>
                  </div>
                );
              })
            )
          )}
        </div>
      </div>
    </div>
  );
};
