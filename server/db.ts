import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
const { Pool } = pkg;
import { AuditLog, ContentReport, InsertContentReport, InsertRecipe, InsertRecipeAttempt, InsertRecipeComment, InsertRecipeGroup, InsertRecipeMedia, InsertSavedRecipe, InsertShoppingItem, InsertUser, RecipeGroup, auditLogs, contentReports, recipeAttempts, recipeComments, recipeGroups, recipeMedia, recipes, rateLimitBuckets, savedRecipes, shoppingItems, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;
let _pool: pkg.Pool | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized: false },
      });
      _db = drizzle(_pool);

      // Otomatik sütun eksikliklerini gider (Render üretim PostgreSQL veritabanı senkronizasyonu için)
      const alterations = [
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS surname TEXT",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(100)",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS \"passwordHash\" VARCHAR(255)",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS \"emailVerified\" BOOLEAN DEFAULT false NOT NULL",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS \"emailVerifyCode\" VARCHAR(12)",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS \"passwordResetToken\" VARCHAR(120)",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS \"passwordResetExpires\" TIMESTAMP",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS \"accountStatus\" VARCHAR(50) DEFAULT 'active'"
      ];
      for (const alt of alterations) {
        try {
          await _pool.query(alt);
        } catch (e) {
          // Zaten varsa yoksay
        }
      }
    } catch (error) {
      console.warn("[Database] Failed to connect to PostgreSQL:", error);
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
  try {
    const existing = await db.select().from(users).where(eq(users.openId, user.openId)).limit(1);
    if (existing.length > 0) {
      await db.update(users).set({
        name: user.name,
        surname: user.surname,
        username: user.username,
        imageUrl: user.imageUrl,
        email: user.email,
        lastSignedIn: new Date(),
      }).where(eq(users.openId, user.openId));
    } else {
      await db.insert(users).values({
        openId: user.openId,
        name: user.name,
        surname: user.surname,
        username: user.username,
        imageUrl: user.imageUrl,
        email: user.email,
        loginMethod: user.loginMethod,
        role: user.role || "user",
        accountStatus: user.accountStatus || "active",
      });
    }
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
  }
}
