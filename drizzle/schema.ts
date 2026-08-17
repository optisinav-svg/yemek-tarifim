import { boolean, index, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

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
export const savedRecipes = mysqlTable("saved_recipes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  recipeKey: varchar("recipeKey", { length: 120 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userRecipeIdx: uniqueIndex("saved_recipes_user_recipe_idx").on(table.userId, table.recipeKey),
  userIdx: index("saved_recipes_user_idx").on(table.userId),
}));

export const shoppingItems = mysqlTable("shopping_items", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  itemKey: varchar("itemKey", { length: 160 }).notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  amount: varchar("amount", { length: 80 }).notNull(),
  checked: boolean("checked").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userItemIdx: uniqueIndex("shopping_items_user_item_idx").on(table.userId, table.itemKey),
  userIdx: index("shopping_items_user_idx").on(table.userId),
}));

export type Recipe = typeof recipes.$inferSelect;
export type InsertRecipe = typeof recipes.$inferInsert;
export type SavedRecipe = typeof savedRecipes.$inferSelect;
export type InsertSavedRecipe = typeof savedRecipes.$inferInsert;
export type ShoppingItem = typeof shoppingItems.$inferSelect;
export type InsertShoppingItem = typeof shoppingItems.$inferInsert;
