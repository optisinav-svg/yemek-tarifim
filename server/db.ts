import { and, desc, eq, like, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertRecipe, InsertSavedRecipe, InsertShoppingItem, InsertUser, recipes, savedRecipes, shoppingItems, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  type TextField = (typeof textFields)[number];
  const assignNullable = (field: TextField) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  };
  textFields.forEach(assignNullable);
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function listPublishedRecipes(filters?: { countryCode?: string; category?: string; search?: string }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(recipes.status, "published")] as Parameters<typeof and>[0][];
  if (filters?.countryCode && filters.countryCode !== "ALL") conditions.push(eq(recipes.countryCode, filters.countryCode));
  if (filters?.category) conditions.push(eq(recipes.category, filters.category));
  if (filters?.search) {
    const search = `%${filters.search}%`;
    conditions.push(or(like(recipes.title, search), like(recipes.summary, search))!);
  }
  const result = await db.select().from(recipes).where(and(...conditions)).orderBy(desc(recipes.createdAt));
  return result;
}

export async function getRecipeById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(recipes).where(and(eq(recipes.id, id), eq(recipes.status, "published"))).limit(1);
  return result[0];
}

export async function createRecipe(data: InsertRecipe) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(recipes).values(data);
  return (result as unknown as { insertId: number }).insertId;
}

export async function updateRecipe(id: number, authorId: number, data: Partial<InsertRecipe>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(recipes).set(data).where(and(eq(recipes.id, id), eq(recipes.authorId, authorId)));
}

export async function hideRecipe(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(recipes).set({ status: "hidden" }).where(eq(recipes.id, id));
}

export async function getUserSyncState(userId: number) {
  const db = await getDb();
  if (!db) return { savedRecipeIds: [] as string[], shoppingItems: [] as Array<{ id: string; name: string; amount: string; checked: boolean }> };

  const [saved, shopping] = await Promise.all([
    db.select({ recipeKey: savedRecipes.recipeKey }).from(savedRecipes).where(eq(savedRecipes.userId, userId)),
    db.select({ itemKey: shoppingItems.itemKey, name: shoppingItems.name, amount: shoppingItems.amount, checked: shoppingItems.checked })
      .from(shoppingItems)
      .where(eq(shoppingItems.userId, userId)),
  ]);

  return {
    savedRecipeIds: saved.map((item) => item.recipeKey),
    shoppingItems: shopping.map((item) => ({ id: item.itemKey, name: item.name, amount: item.amount, checked: item.checked })),
  };
}

export async function replaceUserSyncState(
  userId: number,
  data: {
    savedRecipeIds: string[];
    shoppingItems: Array<{ id: string; name: string; amount: string; checked: boolean }>;
  },
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.transaction(async (tx) => {
    await tx.delete(savedRecipes).where(eq(savedRecipes.userId, userId));
    await tx.delete(shoppingItems).where(eq(shoppingItems.userId, userId));

    if (data.savedRecipeIds.length > 0) {
      const savedRows: InsertSavedRecipe[] = data.savedRecipeIds.map((recipeKey) => ({ userId, recipeKey }));
      await tx.insert(savedRecipes).values(savedRows);
    }

    if (data.shoppingItems.length > 0) {
      const shoppingRows: InsertShoppingItem[] = data.shoppingItems.map((item) => ({
        userId,
        itemKey: item.id,
        name: item.name,
        amount: item.amount,
        checked: item.checked,
      }));
      await tx.insert(shoppingItems).values(shoppingRows);
    }
  });
}
