import { z } from "zod";

import { getSessionCookieOptions } from "./_core/cookies";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { createRecipe, getRecipeById, getUserSyncState, hideRecipe, listPublishedRecipes, replaceUserSyncState, updateRecipe } from "./db";

const ingredientSchema = z.object({
  name: z.string().trim().min(1).max(120),
  amount: z.string().trim().max(40).optional(),
  unit: z.string().trim().max(30).optional(),
});

const recipeInputSchema = z.object({
  countryCode: z.string().trim().min(2).max(8).default("TR"),
  category: z.string().trim().min(1).max(80),
  title: z.string().trim().min(3).max(180),
  summary: z.string().trim().max(1000).optional(),
  imageUrl: z.string().url().max(2000).optional(),
  servings: z.number().int().min(1).max(100),
  prepMinutes: z.number().int().min(0).max(24 * 60),
  cookMinutes: z.number().int().min(0).max(24 * 60),
  ingredients: z.array(ingredientSchema).min(1).max(60),
  steps: z.array(z.string().trim().min(1).max(2000)).min(1).max(60),
});

const listInputSchema = z.object({
  countryCode: z.string().trim().max(8).optional(),
  category: z.string().trim().max(80).optional(),
  search: z.string().trim().max(120).optional(),
}).optional();

const syncStateSchema = z.object({
  savedRecipeIds: z.array(z.string().trim().min(1).max(120)).max(500),
  shoppingItems: z.array(z.object({
    id: z.string().trim().min(1).max(160),
    name: z.string().trim().min(1).max(160),
    amount: z.string().trim().max(80),
    checked: z.boolean(),
  })).max(500),
});

function decodeRecipe(row: Awaited<ReturnType<typeof getRecipeById>>) {
  if (!row) return null;
  let ingredients: unknown[] = [];
  let steps: string[] = [];
  try { ingredients = JSON.parse(row.ingredientsJson) as unknown[]; } catch { ingredients = []; }
  try { steps = JSON.parse(row.stepsJson) as string[]; } catch { steps = []; }
  return { ...row, ingredients, steps };
}

export const appRouter = router({
  system: router({
    health: publicProcedure.query(() => ({ status: "ok" as const })),
  }),
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie("session", { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  sync: router({
    get: protectedProcedure.query(async ({ ctx }) => getUserSyncState(ctx.user.id)),
    replace: protectedProcedure.input(syncStateSchema).mutation(async ({ ctx, input }) => {
      await replaceUserSyncState(ctx.user.id, input);
      return { success: true } as const;
    }),
  }),
  recipes: router({
    list: publicProcedure.input(listInputSchema).query(async ({ input }) => {
      const rows = await listPublishedRecipes(input);
      return rows.map((row) => decodeRecipe(row));
    }),
    byId: publicProcedure.input(z.object({ id: z.number().int().positive() })).query(async ({ input }) => {
      return decodeRecipe(await getRecipeById(input.id));
    }),
    create: protectedProcedure.input(recipeInputSchema).mutation(async ({ ctx, input }) => {
      const id = await createRecipe({
        authorId: ctx.user.id,
        countryCode: input.countryCode,
        category: input.category,
        title: input.title,
        summary: input.summary ?? null,
        imageUrl: input.imageUrl ?? null,
        servings: input.servings,
        prepMinutes: input.prepMinutes,
        cookMinutes: input.cookMinutes,
        ingredientsJson: JSON.stringify(input.ingredients),
        stepsJson: JSON.stringify(input.steps),
        status: "published",
      });
      return { id: Number(id) };
    }),
    update: protectedProcedure.input(recipeInputSchema.extend({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const { id, ingredients, steps, ...rest } = input;
      await updateRecipe(id, ctx.user.id, {
        ...rest,
        summary: rest.summary ?? null,
        imageUrl: rest.imageUrl ?? null,
        ingredientsJson: JSON.stringify(ingredients),
        stepsJson: JSON.stringify(steps),
      });
      return { success: true } as const;
    }),
    hide: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => {
      await hideRecipe(input.id);
      return { success: true } as const;
    }),
  }),
});

export type AppRouter = typeof appRouter;
