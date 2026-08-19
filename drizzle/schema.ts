import { pgTable, serial, varchar, text, integer, boolean, timestamp, uniqueIndex, index, pgEnum } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["user", "admin"]);
export const accountStatusEnum = pgEnum("accountStatus", ["active", "suspended", "deleted"]);
export const recipeStatusEnum = pgEnum("recipeStatus", ["published", "hidden"]);
export const groupStatusEnum = pgEnum("groupStatus", ["active", "hidden"]);
export const mediaTypeEnum = pgEnum("mediaType", ["image", "video"]);
export const commentStatusEnum = pgEnum("commentStatus", ["visible", "hidden"]);
export const attemptStatusEnum = pgEnum("attemptStatus", ["visible", "hidden"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  surname: text("surname"),
  username: varchar("username", { length: 100 }),
  imageUrl: text("imageUrl"),
  email: varchar("email", { length: 320 }),
  passwordHash: varchar("passwordHash", { length: 255 }),
  emailVerified: boolean("emailVerified").default(false).notNull(),
  emailVerifyCode: varchar("emailVerifyCode", { length: 12 }),
  passwordResetToken: varchar("passwordResetToken", { length: 120 }),
  passwordResetExpires: timestamp("passwordResetExpires"),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  accountStatus: accountStatusEnum("accountStatus").default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const recipes = pgTable("recipes", {
  id: serial("id").primaryKey(),
  authorId: integer("authorId").notNull(),
  countryCode: varchar("countryCode", { length: 8 }).default("TR").notNull(),
  category: varchar("category", { length: 80 }).notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  summary: text("summary"),
  tip: text("tip"),
  imageUrl: text("imageUrl"),
  servings: integer("servings").default(4).notNull(),
  prepMinutes: integer("prepMinutes").default(0).notNull(),
  cookMinutes: integer("cookMinutes").default(0).notNull(),
  ingredientsJson: text("ingredientsJson").notNull(),
  stepsJson: text("stepsJson").notNull(),
  status: recipeStatusEnum("status").default("published").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => ({
  countryCategoryIdx: index("recipes_country_category_idx").on(table.countryCode, table.category),
  authorIdx: index("recipes_author_idx").on(table.authorId),
  statusCreatedIdx: index("recipes_status_created_idx").on(table.status, table.createdAt),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Recipe = typeof recipes.$inferSelect;
export type InsertRecipe = typeof recipes.$inferInsert;

export const recipeGroups = pgTable("recipe_groups", {
  id: serial("id").primaryKey(),
  countryCode: varchar("countryCode", { length: 8 }).notNull(),
  name: varchar("name", { length: 80 }).notNull(),
  authorId: integer("authorId").notNull(),
  status: groupStatusEnum("status").default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => ({
  countryNameIdx: uniqueIndex("recipe_groups_country_name_idx").on(table.countryCode, table.name),
  countryCreatedIdx: index("recipe_groups_country_created_idx").on(table.countryCode, table.createdAt),
  authorIdx: index("recipe_groups_author_idx").on(table.authorId),
}));

export type RecipeGroup = typeof recipeGroups.$inferSelect;
export type InsertRecipeGroup = typeof recipeGroups.$inferInsert;

export const recipeMedia = pgTable("recipe_media", {
  id: serial("id").primaryKey(),
  recipeId: integer("recipeId").notNull(),
  authorId: integer("authorId").notNull(),
  mediaType: mediaTypeEnum("mediaType").notNull(),
  url: text("url").notNull(),
  mimeType: varchar("mimeType", { length: 120 }).notNull(),
  sortOrder: integer("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  recipeIdx: index("recipe_media_recipe_idx").on(table.recipeId, table.sortOrder),
  authorIdx: index("recipe_media_author_idx").on(table.authorId),
}));

export type RecipeMedia = typeof recipeMedia.$inferSelect;
export type InsertRecipeMedia = typeof recipeMedia.$inferInsert;

export const recipeComments = pgTable("recipe_comments", {
  id: serial("id").primaryKey(),
  recipeId: integer("recipeId").notNull(),
  authorId: integer("authorId").notNull(),
  body: varchar("body", { length: 1200 }).notNull(),
  status: commentStatusEnum("status").default("visible").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => ({
  recipeCreatedIdx: index("recipe_comments_recipe_created_idx").on(table.recipeId, table.createdAt),
  authorIdx: index("recipe_comments_author_idx").on(table.authorId),
}));

export const recipeAttempts = pgTable("recipe_attempts", {
  id: serial("id").primaryKey(),
  recipeId: integer("recipeId").notNull(),
  authorId: integer("authorId").notNull(),
  caption: varchar("caption", { length: 600 }),
  imageUrl: text("imageUrl").notNull(),
  imageMimeType: varchar("imageMimeType", { length: 120 }).notNull(),
  status: attemptStatusEnum("status").default("visible").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  recipeCreatedIdx: index("recipe_attempts_recipe_created_idx").on(table.recipeId, table.createdAt),
  authorIdx: index("recipe_attempts_author_idx").on(table.authorId),
}));

export type RecipeComment = typeof recipeComments.$inferSelect;
export type InsertRecipeComment = typeof recipeComments.$inferInsert;
export type RecipeAttempt = typeof recipeAttempts.$inferSelect;
export type InsertRecipeAttempt = typeof recipeAttempts.$inferInsert;

export const savedRecipes = pgTable("saved_recipes", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  recipeKey: varchar("recipeKey", { length: 120 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userRecipeIdx: uniqueIndex("saved_recipes_user_recipe_idx").on(table.userId, table.recipeKey),
  userIdx: index("saved_recipes_user_idx").on(table.userId),
}));

export type SavedRecipe = typeof savedRecipes.$inferSelect;
export type InsertSavedRecipe = typeof savedRecipes.$inferInsert;

export const shoppingItems = pgTable("shopping_items", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  itemKey: varchar("itemKey", { length: 160 }).notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  amount: varchar("amount", { length: 80 }).notNull(),
  checked: boolean("checked").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => ({
  userItemIdx: uniqueIndex("shopping_items_user_item_idx").on(table.userId, table.itemKey),
  userIdx: index("shopping_items_user_idx").on(table.userId),
}));

export type ShoppingItem = typeof shoppingItems.$inferSelect;
export type InsertShoppingItem = typeof shoppingItems.$inferInsert;

export const rateLimitBuckets = pgTable("rate_limit_buckets", {
  id: serial("id").primaryKey(),
  bucketKey: varchar("bucketKey", { length: 220 }).notNull().unique(),
  count: integer("count").default(0).notNull(),
  resetAt: timestamp("resetAt").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  actorId: integer("actorId"),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entityType", { length: 60 }).notNull(),
  entityId: varchar("entityId", { length: 120 }),
  metadataJson: text("metadataJson"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  actorIdx: index("audit_logs_actor_idx").on(table.actorId, table.createdAt),
  entityIdx: index("audit_logs_entity_idx").on(table.entityType, table.entityId, table.createdAt),
}));

export const contentReports = pgTable("content_reports", {
  id: serial("id").primaryKey(),
  reporterId: integer("reporterId").notNull(),
  targetType: varchar("targetType", { length: 60 }).notNull(),
  targetId: integer("targetId").notNull(),
  reason: varchar("reason", { length: 80 }).notNull(),
  details: varchar("details", { length: 800 }),
  status: varchar("status", { length: 50 }).default("pending").notNull(),
  reviewedBy: integer("reviewedBy"),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  statusIdx: index("content_reports_status_idx").on(table.status, table.createdAt),
  targetIdx: index("content_reports_target_idx").on(table.targetType, table.targetId),
}));

export type RateLimitBucket = typeof rateLimitBuckets.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type ContentReport = typeof contentReports.$inferSelect;
export type InsertContentReport = typeof contentReports.$inferInsert;
