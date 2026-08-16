import { index, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const recipes = mysqlTable("recipes", {
  id: int("id").autoincrement().primaryKey(),
  authorId: int("authorId").notNull(),
  countryCode: varchar("countryCode", { length: 8 }).default("TR").notNull(),
  category: varchar("category", { length: 80 }).notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  summary: text("summary"),
  imageUrl: text("imageUrl"),
  servings: int("servings").default(4).notNull(),
  prepMinutes: int("prepMinutes").default(0).notNull(),
  cookMinutes: int("cookMinutes").default(0).notNull(),
  ingredientsJson: text("ingredientsJson").notNull(),
  stepsJson: text("stepsJson").notNull(),
  status: mysqlEnum("status", ["published", "hidden"]).default("published").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  countryCategoryIdx: index("recipes_country_category_idx").on(table.countryCode, table.category),
  authorIdx: index("recipes_author_idx").on(table.authorId),
  statusCreatedIdx: index("recipes_status_created_idx").on(table.status, table.createdAt),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Recipe = typeof recipes.$inferSelect;
export type InsertRecipe = typeof recipes.$inferInsert;
