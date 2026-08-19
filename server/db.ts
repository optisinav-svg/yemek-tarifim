import { and, desc, eq, like, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { AuditLog, ContentReport, InsertContentReport, InsertRecipe, InsertRecipeAttempt, InsertRecipeComment, InsertRecipeGroup, InsertRecipeMedia, InsertSavedRecipe, InsertShoppingItem, InsertUser, RecipeGroup, auditLogs, contentReports, recipeAttempts, recipeComments, recipeGroups, recipeMedia, recipes, rateLimitBuckets, savedRecipes, shoppingItems, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: any = null;
let _pool: Pool | null = null;

// Lazily create the PostgreSQL pool and Drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
        let dbUrl = process.env.DATABASE_URL || "";
        // Render Internal URL'ler (dpg- ile başlayanlar) iç ağda plaintext/plain TCP kullanır.
        // Eğer dış Render URL (.render.com) değilse SSL ayarını tamamen kapatıyoruz.
        const isExternal = dbUrl.includes(".render.com") || dbUrl.includes("sslmode=");
        
        _pool = new Pool({
          connectionString: dbUrl,
          ssl: isExternal ? { rejectUnauthorized: false } : false,
          connectionTimeoutMillis: 20000,
          idleTimeoutMillis: 30000,
        });
      await _pool.query("SELECT 1");
      _db = drizzle(_pool);
      // Render veritabanında daha önce oluşturulmuş tabloları geriye dönük uyumlu tut.
      const alterations = [
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS surname TEXT",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(100)",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS \"passwordHash\" VARCHAR(255)",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS \"emailVerified\" BOOLEAN DEFAULT FALSE NOT NULL",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS \"emailVerifyCode\" VARCHAR(12)",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS \"passwordResetToken\" VARCHAR(120)",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS \"passwordResetExpires\" TIMESTAMP",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS \"accountStatus\" VARCHAR(50) DEFAULT 'active'"
      ];
      for (const alt of alterations) {
        try {
          await _pool.query(alt);
        } catch {
          // Kolon zaten varsa veya eski tablo yapısı farklıysa sorguyu uygulamayı durdurmasın.
        }
      }
    } catch (error) {
      console.error("[Database] Failed to connect:", error);
      _db = null;
      await _pool?.end().catch(() => undefined);
      _pool = null;
      throw new Error("Veritabanı bağlantısı kurulamadı: " + (error instanceof Error ? error.message : String(error)));
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
  const textFields = ["name", "imageUrl", "email", "loginMethod"] as const;
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
  await db.insert(users).values(values).onConflictDoUpdate({ target: users.openId, set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function consumeRateLimit(bucketKey: string, limit: number, windowMs: number) {
  const db = await getDb();
  const resetAt = new Date(Date.now() + windowMs);
  if (!db) return { allowed: true, remaining: limit, resetAt };

  const existing = await db.select().from(rateLimitBuckets).where(eq(rateLimitBuckets.bucketKey, bucketKey)).limit(1);
  const bucket = existing[0];
  if (!bucket || bucket.resetAt.getTime() <= Date.now()) {
    if (bucket) {
      await db.update(rateLimitBuckets).set({ count: 1, resetAt }).where(eq(rateLimitBuckets.id, bucket.id));
    } else {
      await db.insert(rateLimitBuckets).values({ bucketKey, count: 1, resetAt });
    }
    return { allowed: true, remaining: Math.max(0, limit - 1), resetAt };
  }

  if (bucket.count >= limit) return { allowed: false, remaining: 0, resetAt: bucket.resetAt };
  await db.update(rateLimitBuckets).set({ count: bucket.count + 1 }).where(eq(rateLimitBuckets.id, bucket.id));
  return { allowed: true, remaining: Math.max(0, limit - bucket.count - 1), resetAt: bucket.resetAt };
}

export async function createAuditLog(data: Omit<typeof auditLogs.$inferInsert, "id" | "createdAt">): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(auditLogs).values(data);
}

export async function listRecipeGroups(countryCode?: string): Promise<RecipeGroup[]> {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(recipeGroups.status, "active")] as Parameters<typeof and>[0][];
  if (countryCode && countryCode !== "ALL") conditions.push(eq(recipeGroups.countryCode, countryCode));
  return db.select().from(recipeGroups).where(and(...conditions)).orderBy(desc(recipeGroups.createdAt));
}

export async function findRecipeGroup(countryCode: string, name: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(recipeGroups).where(and(eq(recipeGroups.countryCode, countryCode), eq(recipeGroups.name, name))).limit(1);
  return result[0];
}

export async function createRecipeGroup(data: InsertRecipeGroup) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(recipeGroups).values(data);
  return (result as unknown as { insertId: number }).insertId;
}

export async function createContentReport(data: InsertContentReport) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(contentReports).values(data);
  return (result as unknown as { insertId: number }).insertId;
}

export async function listPendingContentReports(): Promise<ContentReport[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(contentReports).where(eq(contentReports.status, "pending")).orderBy(desc(contentReports.createdAt));
}

export async function resolveContentReport(id: number, reviewerId: number, status: "resolved" | "dismissed") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(contentReports).set({ status, reviewedBy: reviewerId, reviewedAt: new Date() }).where(eq(contentReports.id, id));
}

export async function deleteAccount(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.transaction(async (tx: any) => {
    await tx.delete(savedRecipes).where(eq(savedRecipes.userId, userId));
    await tx.delete(shoppingItems).where(eq(shoppingItems.userId, userId));
    await tx.delete(recipeComments).where(eq(recipeComments.authorId, userId));
    await tx.delete(recipeAttempts).where(eq(recipeAttempts.authorId, userId));
    await tx.delete(recipeMedia).where(eq(recipeMedia.authorId, userId));
    await tx.update(recipes).set({ status: "hidden" }).where(eq(recipes.authorId, userId));
    await tx.update(users).set({
      name: "Silinmiş kullanıcı",
      email: null,
      imageUrl: null,
      role: "user",
      accountStatus: "deleted",
    }).where(eq(users.id, userId));
  });
}

export async function updateUserProfile(openId: string, data: { name?: string; surname?: string; imageUrl?: string; passwordHash?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateSet: Record<string, unknown> = {};
  if (data.name !== undefined) updateSet.name = data.name;
  if (data.surname !== undefined) updateSet.surname = data.surname;
  if (data.imageUrl !== undefined) updateSet.imageUrl = data.imageUrl;
  if (data.passwordHash !== undefined) updateSet.passwordHash = data.passwordHash;
  if (Object.keys(updateSet).length === 0) return;
  await db.update(users).set(updateSet).where(eq(users.openId, openId));
}

export async function adminHideRecipe(recipeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(recipes).set({ status: "hidden" }).where(eq(recipes.id, recipeId));
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

export async function createRecipeMedia(data: InsertRecipeMedia) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(recipeMedia).values(data);
  return (result as unknown as { insertId: number }).insertId;
}

export async function listRecipeMedia(recipeId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(recipeMedia).where(eq(recipeMedia.recipeId, recipeId)).orderBy(recipeMedia.sortOrder, recipeMedia.createdAt);
}

export async function listRecipeComments(recipeId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: recipeComments.id,
    recipeId: recipeComments.recipeId,
    body: recipeComments.body,
    createdAt: recipeComments.createdAt,
    authorId: recipeComments.authorId,
    authorName: users.name,
  }).from(recipeComments)
    .leftJoin(users, eq(recipeComments.authorId, users.id))
    .where(and(eq(recipeComments.recipeId, recipeId), eq(recipeComments.status, "visible")))
    .orderBy(desc(recipeComments.createdAt));
}

export async function createRecipeComment(data: InsertRecipeComment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(recipeComments).values(data);
  return (result as unknown as { insertId: number }).insertId;
}

export async function listRecipeAttempts(recipeId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: recipeAttempts.id,
    recipeId: recipeAttempts.recipeId,
    caption: recipeAttempts.caption,
    imageUrl: recipeAttempts.imageUrl,
    imageMimeType: recipeAttempts.imageMimeType,
    createdAt: recipeAttempts.createdAt,
    authorId: recipeAttempts.authorId,
    authorName: users.name,
  }).from(recipeAttempts)
    .leftJoin(users, eq(recipeAttempts.authorId, users.id))
    .where(and(eq(recipeAttempts.recipeId, recipeId), eq(recipeAttempts.status, "visible")))
    .orderBy(desc(recipeAttempts.createdAt));
}

export async function createRecipeAttempt(data: InsertRecipeAttempt) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(recipeAttempts).values(data);
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
    savedRecipeIds: saved.map((item: { recipeKey: string }) => item.recipeKey),
    shoppingItems: shopping.map((item: { itemKey: string; name: string; amount: string; checked: boolean }) => ({ itemKey: item.itemKey, name: item.name, amount: item.amount, checked: item.checked })),
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

  await db.transaction(async (tx: any) => {
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
