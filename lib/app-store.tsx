import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { CountryCode, Recipe } from "./recipe-data";
import { formatShoppingAmount } from "./recipe-utils";
import { createTRPCClient } from "./trpc";
import { useAuth } from "@/hooks/use-auth";

type ShoppingItem = {
  id: string;
  name: string;
  amount: string;
  checked: boolean;
};

type SyncStatus = "local" | "syncing" | "synced" | "error";

type AppStoreValue = {
  savedRecipeIds: string[];
  shoppingItems: ShoppingItem[];
  selectedCountry: CountryCode;
  isReady: boolean;
  syncStatus: SyncStatus;
  toggleSaved: (recipeId: string) => void;
  addRecipeToShopping: (recipe: Recipe, servings: number) => void;
  addShoppingItem: (item: Omit<ShoppingItem, "id" | "checked">) => void;
  toggleShoppingItem: (itemId: string) => void;
  clearCheckedShopping: () => void;
  setSelectedCountry: (country: CountryCode) => void;
  refreshSync: () => Promise<void>;
};

const STORAGE_KEYS = {
  saved: "yemek-tarifim.saved-recipes",
  shopping: "yemek-tarifim.shopping-list",
  country: "yemek-tarifim.country",
} as const;

const AppStoreContext = createContext<AppStoreValue | null>(null);

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values));
}

function mergeShoppingItems(remote: ShoppingItem[], local: ShoppingItem[]) {
  const merged = new Map<string, ShoppingItem>();
  [...remote, ...local].forEach((item) => merged.set(item.id, item));
  return Array.from(merged.values());
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const trpcClient = useMemo(() => createTRPCClient(), []);
  const [savedRecipeIds, setSavedRecipeIds] = useState<string[]>([]);
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [selectedCountry, setSelectedCountryState] = useState<CountryCode>("TR");
  const [isReady, setIsReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("local");
  const hasHydratedServer = useRef(false);

  useEffect(() => {
    let active = true;
    Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.saved),
      AsyncStorage.getItem(STORAGE_KEYS.shopping),
      AsyncStorage.getItem(STORAGE_KEYS.country),
    ]).then(([saved, shopping, country]) => {
      if (!active) return;
      if (saved) setSavedRecipeIds(JSON.parse(saved));
      if (shopping) setShoppingItems(JSON.parse(shopping));
      if (country === "TR" || country === "ALL") setSelectedCountryState(country);
      setIsReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const persistLocal = useCallback((nextSaved: string[], nextShopping: ShoppingItem[]) => {
    void AsyncStorage.setItem(STORAGE_KEYS.saved, JSON.stringify(nextSaved));
    void AsyncStorage.setItem(STORAGE_KEYS.shopping, JSON.stringify(nextShopping));
  }, []);

  const saveToServer = useCallback(async (nextSaved: string[], nextShopping: ShoppingItem[]) => {
    if (!isAuthenticated || !hasHydratedServer.current) return;
    setSyncStatus("syncing");
    try {
      await trpcClient.sync.replace.mutate({ savedRecipeIds: nextSaved, shoppingItems: nextShopping });
      setSyncStatus("synced");
    } catch (error) {
      console.warn("[AppStore] Server sync failed:", error);
      setSyncStatus("error");
    }
  }, [isAuthenticated, trpcClient]);

  const refreshSync = useCallback(async () => {
    if (!isAuthenticated || !isReady) return;
    setSyncStatus("syncing");
    try {
      const remote = await trpcClient.sync.get.query();
      const mergedSaved = uniqueStrings([...remote.savedRecipeIds, ...savedRecipeIds]);
      const remoteShopping: ShoppingItem[] = remote.shoppingItems.map((item) => ({
        id: item.id,
        name: item.name,
        amount: item.amount,
        checked: item.checked,
      }));
      const mergedShopping = mergeShoppingItems(remoteShopping, shoppingItems);
      hasHydratedServer.current = true;
      setSavedRecipeIds(mergedSaved);
      setShoppingItems(mergedShopping);
      persistLocal(mergedSaved, mergedShopping);
      await trpcClient.sync.replace.mutate({ savedRecipeIds: mergedSaved, shoppingItems: mergedShopping });
      setSyncStatus("synced");
    } catch (error) {
      console.warn("[AppStore] Server hydration failed:", error);
      setSyncStatus("error");
    }
  }, [isAuthenticated, isReady, persistLocal, savedRecipeIds, shoppingItems, trpcClient]);

  useEffect(() => {
    if (authLoading || !isReady) return;
    if (!isAuthenticated) {
      hasHydratedServer.current = false;
      setSyncStatus("local");
      return;
    }
    if (!hasHydratedServer.current) void refreshSync();
  }, [authLoading, isAuthenticated, isReady, refreshSync]);

  const toggleSaved = (recipeId: string) => {
    setSavedRecipeIds((current) => {
      const next = current.includes(recipeId) ? current.filter((id) => id !== recipeId) : [recipeId, ...current];
      persistLocal(next, shoppingItems);
      void saveToServer(next, shoppingItems);
      return next;
    });
  };

  const addRecipeToShopping = (recipe: Recipe, servings: number) => {
    setShoppingItems((current) => {
      const next = [...current];
      recipe.ingredients.forEach((ingredient, index) => {
        const scaledAmount = formatShoppingAmount(ingredient, servings, recipe.servings);
        const item = { name: ingredient.name, amount: scaledAmount };
        const existing = next.find((entry) => entry.name.toLocaleLowerCase("tr-TR") === item.name.toLocaleLowerCase("tr-TR"));
        if (existing) {
          existing.amount = existing.amount || item.amount;
        } else {
          next.push({ id: `${recipe.id}-${index}-${Date.now()}`, ...item, checked: false });
        }
      });
      persistLocal(savedRecipeIds, next);
      void saveToServer(savedRecipeIds, next);
      return next;
    });
  };

  const addShoppingItem = (item: Omit<ShoppingItem, "id" | "checked">) => {
    setShoppingItems((current) => {
      const next = [...current, { ...item, id: `manual-${Date.now()}`, checked: false }];
      persistLocal(savedRecipeIds, next);
      void saveToServer(savedRecipeIds, next);
      return next;
    });
  };

  const toggleShoppingItem = (itemId: string) => {
    setShoppingItems((current) => {
      const next = current.map((item) => (item.id === itemId ? { ...item, checked: !item.checked } : item));
      persistLocal(savedRecipeIds, next);
      void saveToServer(savedRecipeIds, next);
      return next;
    });
  };

  const clearCheckedShopping = () => {
    setShoppingItems((current) => {
      const next = current.filter((item) => !item.checked);
      persistLocal(savedRecipeIds, next);
      void saveToServer(savedRecipeIds, next);
      return next;
    });
  };

  const setSelectedCountry = (country: CountryCode) => {
    setSelectedCountryState(country);
    void AsyncStorage.setItem(STORAGE_KEYS.country, country);
  };

  const value = useMemo<AppStoreValue>(() => ({
    savedRecipeIds,
    shoppingItems,
    selectedCountry,
    isReady,
    syncStatus,
    toggleSaved,
    addRecipeToShopping,
    addShoppingItem,
    toggleShoppingItem,
    clearCheckedShopping,
    setSelectedCountry,
    refreshSync,
  }), [savedRecipeIds, shoppingItems, selectedCountry, isReady, syncStatus, refreshSync]);

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useAppStore() {
  const context = useContext(AppStoreContext);
  if (!context) throw new Error("useAppStore must be used inside AppStoreProvider");
  return context;
}

export type { ShoppingItem, SyncStatus };
