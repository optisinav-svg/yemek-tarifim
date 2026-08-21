import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export const MEAL_SLOTS = ["sabah", "ogle", "aksam", "ara1", "ara2"] as const;
export type MealSlot = (typeof MEAL_SLOTS)[number];

export const MEAL_SLOT_LABELS: Record<MealSlot, string> = {
  sabah: "Sabah",
  ogle: "Öğle",
  aksam: "Akşam",
  ara1: "Ara Öğün 1",
  ara2: "Ara Öğün 2",
};

// Google Takvim etkinliği oluştururken kullanılacak varsayılan saatler (yerel saat).
export const MEAL_SLOT_DEFAULT_TIME: Record<MealSlot, { hour: number; minute: number }> = {
  sabah: { hour: 8, minute: 0 },
  ogle: { hour: 12, minute: 30 },
  aksam: { hour: 19, minute: 0 },
  ara1: { hour: 10, minute: 30 },
  ara2: { hour: 16, minute: 30 },
};

export type MealPlanEntry = {
  /** `${date}:${slot}` */
  key: string;
  date: string; // YYYY-MM-DD
  slot: MealSlot;
  recipeId: string;
  recipeTitle: string;
  servings: number;
};

const STORAGE_KEY = "mealPlan.entries.v1";

function entryKey(date: string, slot: MealSlot) {
  return `${date}:${slot}`;
}

type MealPlanContextValue = {
  entries: Record<string, MealPlanEntry>;
  isReady: boolean;
  getEntry: (date: string, slot: MealSlot) => MealPlanEntry | undefined;
  setEntry: (date: string, slot: MealSlot, recipe: { id: string; title: string }, servings: number) => void;
  updateServings: (date: string, slot: MealSlot, servings: number) => void;
  removeEntry: (date: string, slot: MealSlot) => void;
  getWeekEntries: (weekDates: string[]) => MealPlanEntry[];
};

const MealPlanContext = createContext<MealPlanContextValue | null>(null);

export function MealPlanProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<Record<string, MealPlanEntry>>({});
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          try {
            setEntries(JSON.parse(raw));
          } catch {
            setEntries({});
          }
        }
      })
      .finally(() => setIsReady(true));
  }, []);

  const persist = useCallback((next: Record<string, MealPlanEntry>) => {
    setEntries(next);
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const getEntry = useCallback((date: string, slot: MealSlot) => entries[entryKey(date, slot)], [entries]);

  const setEntry = useCallback(
    (date: string, slot: MealSlot, recipe: { id: string; title: string }, servings: number) => {
      const key = entryKey(date, slot);
      persist({ ...entries, [key]: { key, date, slot, recipeId: recipe.id, recipeTitle: recipe.title, servings } });
    },
    [entries, persist],
  );

  const updateServings = useCallback(
    (date: string, slot: MealSlot, servings: number) => {
      const key = entryKey(date, slot);
      const current = entries[key];
      if (!current) return;
      persist({ ...entries, [key]: { ...current, servings: Math.max(1, servings) } });
    },
    [entries, persist],
  );

  const removeEntry = useCallback(
    (date: string, slot: MealSlot) => {
      const key = entryKey(date, slot);
      if (!entries[key]) return;
      const next = { ...entries };
      delete next[key];
      persist(next);
    },
    [entries, persist],
  );

  const getWeekEntries = useCallback(
    (weekDates: string[]) => {
      const dateSet = new Set(weekDates);
      return Object.values(entries).filter((entry) => dateSet.has(entry.date));
    },
    [entries],
  );

  const value = useMemo<MealPlanContextValue>(
    () => ({ entries, isReady, getEntry, setEntry, updateServings, removeEntry, getWeekEntries }),
    [entries, isReady, getEntry, setEntry, updateServings, removeEntry, getWeekEntries],
  );

  return <MealPlanContext.Provider value={value}>{children}</MealPlanContext.Provider>;
}

export function useMealPlan() {
  const ctx = useContext(MealPlanContext);
  if (!ctx) throw new Error("useMealPlan must be used within a MealPlanProvider");
  return ctx;
}
