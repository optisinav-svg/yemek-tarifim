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

export const MAX_ENTRIES_PER_SLOT = 3;

export type MealPlanEntry = {
  id: string;
  date: string; // YYYY-MM-DD
  slot: MealSlot;
  recipeId: string;
  recipeTitle: string;
  servings: number;
};

const STORAGE_KEY = "mealPlan.entries.v2";

function slotKey(date: string, slot: MealSlot) {
  return `${date}:${slot}`;
}

type MealPlanContextValue = {
  entries: Record<string, MealPlanEntry[]>;
  isReady: boolean;
  getEntries: (date: string, slot: MealSlot) => MealPlanEntry[];
  addEntry: (date: string, slot: MealSlot, recipe: { id: string; title: string }, servings: number) => boolean;
  updateServings: (date: string, slot: MealSlot, entryId: string, servings: number) => void;
  removeEntry: (date: string, slot: MealSlot, entryId: string) => void;
  getWeekEntries: (weekDates: string[]) => MealPlanEntry[];
};

const MealPlanContext = createContext<MealPlanContextValue | null>(null);

export function MealPlanProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<Record<string, MealPlanEntry[]>>({});
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

  const persist = useCallback((next: Record<string, MealPlanEntry[]>) => {
    setEntries(next);
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const getEntries = useCallback((date: string, slot: MealSlot) => entries[slotKey(date, slot)] ?? [], [entries]);

  const addEntry = useCallback(
    (date: string, slot: MealSlot, recipe: { id: string; title: string }, servings: number) => {
      const key = slotKey(date, slot);
      const current = entries[key] ?? [];
      if (current.length >= MAX_ENTRIES_PER_SLOT) return false;
      const newEntry: MealPlanEntry = {
        id: `${key}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
        date,
        slot,
        recipeId: recipe.id,
        recipeTitle: recipe.title,
        servings,
      };
      persist({ ...entries, [key]: [...current, newEntry] });
      return true;
    },
    [entries, persist],
  );

  const updateServings = useCallback(
    (date: string, slot: MealSlot, entryId: string, servings: number) => {
      const key = slotKey(date, slot);
      const current = entries[key] ?? [];
      persist({ ...entries, [key]: current.map((e) => (e.id === entryId ? { ...e, servings: Math.max(1, servings) } : e)) });
    },
    [entries, persist],
  );

  const removeEntry = useCallback(
    (date: string, slot: MealSlot, entryId: string) => {
      const key = slotKey(date, slot);
      const current = entries[key] ?? [];
      persist({ ...entries, [key]: current.filter((e) => e.id !== entryId) });
    },
    [entries, persist],
  );

  const getWeekEntries = useCallback(
    (weekDates: string[]) => {
      const dateSet = new Set(weekDates);
      return Object.values(entries)
        .flat()
        .filter((entry) => dateSet.has(entry.date));
    },
    [entries],
  );

  const value = useMemo<MealPlanContextValue>(
    () => ({ entries, isReady, getEntries, addEntry, updateServings, removeEntry, getWeekEntries }),
    [entries, isReady, getEntries, addEntry, updateServings, removeEntry, getWeekEntries],
  );

  return <MealPlanContext.Provider value={value}>{children}</MealPlanContext.Provider>;
}

export function useMealPlan() {
  const ctx = useContext(MealPlanContext);
  if (!ctx) throw new Error("useMealPlan must be used within a MealPlanProvider");
  return ctx;
}
