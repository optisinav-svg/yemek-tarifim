import { drizzle } from "drizzle-orm/node-postgres";
import { and, desc, eq, like, or } from "drizzle-orm";
import { Pool } from "pg";
import { AuditLog, ContentReport, InsertContentReport, InsertRecipe, InsertRecipeAttempt, InsertRecipeComment, InsertRecipeGroup, InsertRecipeMedia, InsertSavedRecipe, InsertShoppingItem, InsertUser, RecipeGroup, auditLogs, contentReports, recipeAttempts, recipeComments, recipeGroups, recipeMedia, recipes, rateLimitBuckets, savedRecipes, shoppingItems, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: any = null;
let _pool: Pool | null = null;

// Lazily create the PostgreSQL pool and Drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000,
      });
      await _pool.query("SELECT 1");
      _db = drizzle(_pool);
      // Render veritabanında daha önce oluşturulmuş tabloları geriye dönük uyumlu tut.
      // Tablo yoksa tamamen oluştur, varsa eksik kolonları ekle
      await _pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          "openId" VARCHAR(64) NOT NULL UNIQUE,
          name TEXT,
          surname TEXT,
          username VARCHAR(100),
          "imageUrl" TEXT,
          email VARCHAR(320),
          "passwordHash" VARCHAR(255),
          "emailVerified" BOOLEAN DEFAULT FALSE NOT NULL,
          "emailVerifyCode" VARCHAR(12),
          "passwordResetToken" VARCHAR(120),
          "passwordResetExpires" TIMESTAMP,
          "loginMethod" VARCHAR(64),
          role VARCHAR(20) DEFAULT 'user' NOT NULL,
          "accountStatus" VARCHAR(50) DEFAULT 'active' NOT NULL,
          "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
          "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL,
          "lastSignedIn" TIMESTAMP DEFAULT NOW() NOT NULL
        );
      `);
      const alterations = [
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS surname TEXT",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(100)",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS \"passwordHash\" VARCHAR(255)",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS \"emailVerified\" BOOLEAN DEFAULT FALSE NOT NULL",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS \"emailVerifyCode\" VARCHAR(12)",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS \"passwordResetToken\" VARCHAR(120)",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS \"passwordResetExpires\" TIMESTAMP",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS \"accountStatus\" VARCHAR(50) DEFAULT 'active'",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS \"loginMethod\" VARCHAR(64)",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS \"openId\" VARCHAR(64)"
      ];
      for (const alt of alterations) {
        try {
          await _pool.query(alt);
        } catch {
          // Kolon zaten varsa veya eski tablo yapısı farklıysa sorguyu uygulamayı durdurmasın.
        }
      }

      // Diğer tablolar için de aynı güvenlik ağı: eksikse oluştur.
      // Eski göç (migration) dosyaları farklı bir veritabanı (MySQL) için
      // yazılmış olduğundan, bazı tablolar (özellikle az kullanılanlar:
      // audit_logs, content_reports, rate_limit_buckets) gerçek Postgres
      // veritabanında hiç oluşmamıştı; bu da "relation does not exist"
      // (42P01) hatalarına yol açıyordu.
      await _pool.query(`
        CREATE TABLE IF NOT EXISTS recipes (
          id SERIAL PRIMARY KEY,
          "authorId" INTEGER NOT NULL,
          "countryCode" VARCHAR(8) DEFAULT 'TR' NOT NULL,
          category VARCHAR(80) NOT NULL,
          title VARCHAR(160) NOT NULL,
          summary TEXT,
          tip TEXT,
          "imageUrl" TEXT,
          servings INTEGER DEFAULT 4 NOT NULL,
          "prepMinutes" INTEGER DEFAULT 0 NOT NULL,
          "cookMinutes" INTEGER DEFAULT 0 NOT NULL,
          "ingredientsJson" TEXT NOT NULL,
          "stepsJson" TEXT NOT NULL,
          status VARCHAR(50) DEFAULT 'published' NOT NULL,
          "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
          "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
        );
        CREATE TABLE IF NOT EXISTS recipe_groups (
          id SERIAL PRIMARY KEY,
          "countryCode" VARCHAR(8) NOT NULL,
          name VARCHAR(80) NOT NULL,
          "authorId" INTEGER NOT NULL,
          status VARCHAR(50) DEFAULT 'active' NOT NULL,
          "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL
        );
        CREATE TABLE IF NOT EXISTS recipe_media (
          id SERIAL PRIMARY KEY,
          "recipeId" INTEGER NOT NULL,
          "authorId" INTEGER NOT NULL,
          "mediaType" VARCHAR(20) NOT NULL,
          url TEXT NOT NULL,
          "mimeType" VARCHAR(100),
          "sortOrder" INTEGER DEFAULT 0 NOT NULL,
          "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL
        );
        CREATE TABLE IF NOT EXISTS recipe_comments (
          id SERIAL PRIMARY KEY,
          "recipeId" INTEGER NOT NULL,
          "authorId" INTEGER NOT NULL,
          body TEXT NOT NULL,
          "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL
        );
        CREATE TABLE IF NOT EXISTS recipe_attempts (
          id SERIAL PRIMARY KEY,
          "recipeId" INTEGER NOT NULL,
          "authorId" INTEGER NOT NULL,
          caption TEXT,
          "mediaUrl" TEXT,
          "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL
        );
        CREATE TABLE IF NOT EXISTS saved_recipes (
          id SERIAL PRIMARY KEY,
          "userId" INTEGER NOT NULL,
          "recipeId" VARCHAR(60) NOT NULL,
          "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL
        );
        CREATE TABLE IF NOT EXISTS shopping_items (
          id SERIAL PRIMARY KEY,
          "userId" INTEGER NOT NULL,
          name TEXT NOT NULL,
          amount TEXT,
          checked BOOLEAN DEFAULT FALSE NOT NULL,
          "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL
        );
        CREATE TABLE IF NOT EXISTS rate_limit_buckets (
          id SERIAL PRIMARY KEY,
          "bucketKey" VARCHAR(220) NOT NULL UNIQUE,
          count INTEGER DEFAULT 0 NOT NULL,
          "resetAt" TIMESTAMP NOT NULL,
          "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
        );
        CREATE TABLE IF NOT EXISTS audit_logs (
          id SERIAL PRIMARY KEY,
          "actorId" INTEGER,
          action VARCHAR(100) NOT NULL,
          "entityType" VARCHAR(60) NOT NULL,
          "entityId" VARCHAR(120),
          "metadataJson" TEXT,
          "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL
        );
        CREATE TABLE IF NOT EXISTS content_reports (
          id SERIAL PRIMARY KEY,
          "reporterId" INTEGER NOT NULL,
          "targetType" VARCHAR(60) NOT NULL,
          "targetId" INTEGER NOT NULL,
          reason VARCHAR(80) NOT NULL,
          details VARCHAR(800),
          status VARCHAR(50) DEFAULT 'pending' NOT NULL,
          "reviewedBy" INTEGER,
          "reviewedAt" TIMESTAMP,
          "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL
        );
      `);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
      await _pool?.end().catch(() => undefined);
      _pool = null;
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
  const result = await db.insert(recipes).values(data).returning({ id: recipes.id });
  return result[0]?.id;
}

export async function seedStarterRecipes() {
  const db = await getDb();
  if (!db) return;

  const SEED_AUTHOR_OPEN_ID = "system_seed_kitchen";
  let [seedAuthor] = await db.select().from(users).where(eq(users.openId, SEED_AUTHOR_OPEN_ID)).limit(1);
  if (!seedAuthor) {
    const inserted = await db
      .insert(users)
      .values({
        openId: SEED_AUTHOR_OPEN_ID,
        name: "Gastronotlar Mutfağı",
        emailVerified: true,
        loginMethod: "system",
        role: "user",
        accountStatus: "active",
      })
      .returning();
    seedAuthor = inserted[0];
  }
  if (!seedAuthor) {
    console.log("[Seed] Sistem yazar hesabı oluşturulamadı, başlangıç tarifleri eklenmedi.");
    return;
  }

  const { seedRecipes } = await import("./seed-recipes");
  let inserted = 0;

  for (const seed of seedRecipes) {
    const existing = await db
      .select({ id: recipes.id })
      .from(recipes)
      .where(and(eq(recipes.title, seed.title), eq(recipes.category, seed.category)))
      .limit(1);
    if (existing.length > 0) continue;

    await db.insert(recipes).values({
      authorId: seedAuthor.id,
      countryCode: "TR",
      category: seed.category,
      title: seed.title,
      summary: seed.summary,
      tip: seed.tip,
      servings: seed.servings,
      prepMinutes: seed.prepMinutes,
      cookMinutes: seed.cookMinutes,
      ingredientsJson: JSON.stringify(seed.ingredients),
      stepsJson: JSON.stringify(seed.steps),
      status: "published",
    });
    inserted++;
  }

  if (inserted > 0) {
    console.log(`[Seed] ${inserted} başlangıç tarifi eklendi.`);
  }
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
