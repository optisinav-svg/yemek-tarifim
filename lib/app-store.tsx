import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { CountryCode, Recipe } from "./recipe-data";
import { formatShoppingAmount } from "./recipe-utils";

type ShoppingItem = {
  id: string;
  name: string;
  amount: string;
  checked: boolean;
};

type AppStoreValue = {
  savedRecipeIds: string[];
  shoppingItems: ShoppingItem[];
  selectedCountry: CountryCode;
  isReady: boolean;
  toggleSaved: (recipeId: string) => void;
  addRecipeToShopping: (recipe: Recipe, servings: number) => void;
  addShoppingItem: (item: Omit<ShoppingItem, "id" | "checked">) => void;
  toggleShoppingItem: (itemId: string) => void;
  clearCheckedShopping: () => void;
  setSelectedCountry: (country: CountryCode) => void;
};

const STORAGE_KEYS = {
  saved: "yemek-tarifim.saved-recipes",
  shopping: "yemek-tarifim.shopping-list",
  country: "yemek-tarifim.country",
} as const;

const AppStoreContext = createContext<AppStoreValue | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [savedRecipeIds, setSavedRecipeIds] = useState<string[]>([]);
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [selectedCountry, setSelectedCountryState] = useState<CountryCode>("TR");
  const [isReady, setIsReady] = useState(false);

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

  const toggleSaved = (recipeId: string) => {
    setSavedRecipeIds((current) => {
      const next = current.includes(recipeId) ? current.filter((id) => id !== recipeId) : [recipeId, ...current];
      void AsyncStorage.setItem(STORAGE_KEYS.saved, JSON.stringify(next));
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
      void AsyncStorage.setItem(STORAGE_KEYS.shopping, JSON.stringify(next));
      return next;
    });
  };

  const addShoppingItem = (item: Omit<ShoppingItem, "id" | "checked">) => {
    setShoppingItems((current) => {
      const next = [...current, { ...item, id: `manual-${Date.now()}`, checked: false }];
      void AsyncStorage.setItem(STORAGE_KEYS.shopping, JSON.stringify(next));
      return next;
    });
  };

  const toggleShoppingItem = (itemId: string) => {
    setShoppingItems((current) => {
      const next = current.map((item) => (item.id === itemId ? { ...item, checked: !item.checked } : item));
      void AsyncStorage.setItem(STORAGE_KEYS.shopping, JSON.stringify(next));
      return next;
    });
  };

  const clearCheckedShopping = () => {
    setShoppingItems((current) => {
      const next = current.filter((item) => !item.checked);
      void AsyncStorage.setItem(STORAGE_KEYS.shopping, JSON.stringify(next));
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
    toggleSaved,
    addRecipeToShopping,
    addShoppingItem,
    toggleShoppingItem,
    clearCheckedShopping,
    setSelectedCountry,
  }), [savedRecipeIds, shoppingItems, selectedCountry, isReady]);

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useAppStore() {
  const context = useContext(AppStoreContext);
  if (!context) throw new Error("useAppStore must be used inside AppStoreProvider");
  return context;
}

export type { ShoppingItem };
