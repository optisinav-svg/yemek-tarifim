import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { invokeLLM } from "./_core/llm";
import { getSessionCookieOptions } from "./_core/cookies";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { createRecipe, createRecipeAttempt, createRecipeComment, createRecipeMedia, getRecipeById, getUserSyncState, hideRecipe, listPublishedRecipes, listRecipeAttempts, listRecipeComments, listRecipeMedia, replaceUserSyncState, updateRecipe } from "./db";
import { storagePut } from "./storage";

const ingredientSchema = z.object({
  name: z.string().trim().min(1).max(120),
  amount: z.string().trim().max(40).optional(),
  unit: z.string().trim().max(30).optional(),
});

const recipeAssetUrlSchema = z.string().trim().max(2000).refine((value) => value.startsWith("/manus-storage/") || /^https?:\/\//i.test(value), "Geçerli bir medya adresi girin.");
const mediaInputSchema = z.object({
  url: recipeAssetUrlSchema,
  mediaType: z.enum(["image", "video"]),
  mimeType: z.string().trim().max(120),
  sortOrder: z.number().int().min(0).max(2),
});

const recipeInputSchema = z.object({
  countryCode: z.string().trim().min(2).max(8).default("TR"),
  category: z.string().trim().min(1).max(80),
  title: z.string().trim().min(3).max(180),
  summary: z.string().trim().max(1000).optional(),
  imageUrl: recipeAssetUrlSchema.optional(),
  media: z.array(mediaInputSchema).max(3).optional(),
  servings: z.number().int().min(1).max(100),
  prepMinutes: z.number().int().min(0).max(24 * 60),
  cookMinutes: z.number().int().min(0).max(24 * 60),
  ingredients: z.array(ingredientSchema).min(1).max(60),
  steps: z.array(z.string().trim().min(1).max(2000)).min(1).max(60),
});

const uploadInputSchema = z.object({
  dataBase64: z.string().trim().min(16).max(36_000_000).regex(/^[A-Za-z0-9+/]+={0,2}$/, "Geçersiz dosya verisi."),
  fileName: z.string().trim().min(1).max(120),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp", "video/mp4", "video/quicktime"]),
  mediaType: z.enum(["image", "video"]),
});

const ocrInputSchema = z.object({
  dataBase64: z.string().trim().min(16).max(12_000_000).regex(/^[A-Za-z0-9+/]+={0,2}$/, "Geçersiz görsel verisi."),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
});

const ocrResultSchema = z.object({
  title: z.string().trim().min(1).max(180),
  summary: z.string().trim().max(1000),
  category: z.string().trim().min(1).max(80),
  countryCode: z.string().trim().min(2).max(8),
  servings: z.number().int().min(1).max(100),
  prepMinutes: z.number().int().min(0).max(24 * 60),
  cookMinutes: z.number().int().min(0).max(24 * 60),
  ingredients: z.array(ingredientSchema).max(60),
  steps: z.array(z.string().trim().min(1).max(2000)).max(60),
});

const listInputSchema = z.object({
  countryCode: z.string().trim().max(8).optional(),
  category: z.string().trim().max(80).optional(),
  search: z.string().trim().max(120).optional(),
}).optional();

const commentInputSchema = z.object({
  recipeId: z.number().int().positive(),
  body: z.string().trim().min(2, "Yorum en az 2 karakter olmalıdır.").max(1200),
});

const attemptInputSchema = z.object({
  recipeId: z.number().int().positive(),
  dataBase64: z.string().trim().min(16).max(12_000_000).regex(/^[A-Za-z0-9+/]+={0,2}$/, "Geçersiz görsel verisi."),
  fileName: z.string().trim().min(1).max(120),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  caption: z.string().trim().max(600).optional(),
});

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

function isOwnedRecipeAsset(url: string, userId: number) {
  return url.startsWith(`/manus-storage/recipes/${userId}/`) && !url.includes("..") && !url.includes("\\");
}

async function saveRecipeMedia(media: Array<z.infer<typeof mediaInputSchema>>, recipeId: number, authorId: number) {
  for (const item of media) {
    if (!isOwnedRecipeAsset(item.url, authorId)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Bu medya dosyası bu kullanıcıya ait değil." });
    }
    await createRecipeMedia({ recipeId, authorId, mediaType: item.mediaType, url: item.url, mimeType: item.mimeType, sortOrder: item.sortOrder });
  }
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
      const recipe = decodeRecipe(await getRecipeById(input.id));
      if (!recipe) return null;
      return { ...recipe, media: await listRecipeMedia(input.id) };
    }),
    media: router({
      upload: protectedProcedure.input(uploadInputSchema).mutation(async ({ ctx, input }) => {
        const bytes = Buffer.from(input.dataBase64, "base64");
        const maxBytes = input.mediaType === "image" ? 8 * 1024 * 1024 : 25 * 1024 * 1024;
        if (!bytes.byteLength || bytes.byteLength > maxBytes) {
          throw new TRPCError({ code: "BAD_REQUEST", message: input.mediaType === "image" ? "Fotoğraf 8 MB'dan küçük olmalıdır." : "Video 25 MB'dan küçük olmalıdır." });
        }
        if (input.mediaType === "image" && !input.mimeType.startsWith("image/")) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Fotoğraf dosyası bekleniyor." });
        }
        if (input.mediaType === "video" && !input.mimeType.startsWith("video/")) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Video dosyası bekleniyor." });
        }
        const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80) || `media.${input.mediaType === "image" ? "jpg" : "mp4"}`;
        const uploaded = await storagePut(`recipes/${ctx.user.id}/${Date.now()}-${safeName}`, bytes, input.mimeType);
        return { ...uploaded, mediaType: input.mediaType, mimeType: input.mimeType };
      }),
      byRecipe: publicProcedure.input(z.object({ recipeId: z.number().int().positive() })).query(async ({ input }) => {
        if (!await getRecipeById(input.recipeId)) return [];
        return listRecipeMedia(input.recipeId);
      }),
    }),
    community: router({
      comments: publicProcedure.input(z.object({ recipeId: z.number().int().positive() })).query(async ({ input }) => {
        if (!await getRecipeById(input.recipeId)) return [];
        return listRecipeComments(input.recipeId);
      }),
      addComment: protectedProcedure.input(commentInputSchema).mutation(async ({ ctx, input }) => {
        if (!await getRecipeById(input.recipeId)) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Tarif bulunamadı." });
        }
        const id = await createRecipeComment({ recipeId: input.recipeId, authorId: ctx.user.id, body: input.body, status: "visible" });
        return { id: Number(id) };
      }),
      attempts: publicProcedure.input(z.object({ recipeId: z.number().int().positive() })).query(async ({ input }) => {
        if (!await getRecipeById(input.recipeId)) return [];
        return listRecipeAttempts(input.recipeId);
      }),
      addAttempt: protectedProcedure.input(attemptInputSchema).mutation(async ({ ctx, input }) => {
        if (!await getRecipeById(input.recipeId)) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Tarif bulunamadı." });
        }
        const bytes = Buffer.from(input.dataBase64, "base64");
        if (!bytes.byteLength || bytes.byteLength > 8 * 1024 * 1024) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Deneme fotoğrafı 8 MB'dan küçük olmalıdır." });
        }
        const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80) || "attempt.jpg";
        const uploaded = await storagePut(`recipes/${ctx.user.id}/attempts/${Date.now()}-${safeName}`, bytes, input.mimeType);
        const id = await createRecipeAttempt({ recipeId: input.recipeId, authorId: ctx.user.id, caption: input.caption ?? null, imageUrl: uploaded.url, imageMimeType: input.mimeType, status: "visible" });
        return { id: Number(id), url: uploaded.url };
      }),
    }),
    ocr: protectedProcedure.input(ocrInputSchema).mutation(async ({ input }) => {
      const response = await invokeLLM({
        model: "gemini-3-flash-preview",
        max_tokens: 3000,
        messages: [
          {
            role: "system",
            content: "Sen Türkçe yemek tarifi metni çıkaran dikkatli bir OCR yardımcısısın. Görselde açıkça okunmayan bilgileri uydurma; bilinmiyorsa boş metin veya 0 kullan. Yalnızca istenen JSON nesnesini döndür.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Bu görseldeki yemek tarifini düzenlenebilir alanlara aktar. Başlık, kısa açıklama, kategori, ülke kodu (Türkiye için TR; emin değilsen TR), porsiyon, hazırlama ve pişirme dakikaları, malzemeler (miktar/birim/ad) ve yapılış adımlarını çıkar. JSON anahtarları tam olarak title, summary, category, countryCode, servings, prepMinutes, cookMinutes, ingredients, steps olsun. ingredients her biri name, amount ve unit alanlarına sahip dizi olsun.",
              },
              { type: "image_url", image_url: { url: `data:${input.mimeType};base64,${input.dataBase64}`, detail: "auto" } },
            ],
          },
        ],
        response_format: { type: "json_object" },
      });
      const content = response.choices[0]?.message.content;
      const jsonText = typeof content === "string" ? content : content.filter((part) => part.type === "text").map((part) => part.text).join("\\n");
      try {
        const parsed = ocrResultSchema.parse(JSON.parse(jsonText));
        return parsed;
      } catch {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Görselde düzenlenebilir bir tarif metni bulunamadı. Lütfen daha net bir fotoğraf deneyin." });
      }
    }),
    create: protectedProcedure.input(recipeInputSchema).mutation(async ({ ctx, input }) => {
      const id = await createRecipe({
        authorId: ctx.user.id,
        countryCode: input.countryCode,
        category: input.category,
        title: input.title,
        summary: input.summary ?? null,
        imageUrl: input.imageUrl ?? input.media?.[0]?.url ?? null,
        servings: input.servings,
        prepMinutes: input.prepMinutes,
        cookMinutes: input.cookMinutes,
        ingredientsJson: JSON.stringify(input.ingredients),
        stepsJson: JSON.stringify(input.steps),
        status: "published",
      });
      const recipeId = Number(id);
      await saveRecipeMedia(input.media ?? [], recipeId, ctx.user.id);
      return { id: recipeId };
    }),
    update: protectedProcedure.input(recipeInputSchema.extend({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const { id, ingredients, steps, media, ...rest } = input;
      await updateRecipe(id, ctx.user.id, {
        ...rest,
        summary: rest.summary ?? null,
        imageUrl: rest.imageUrl ?? media?.[0]?.url ?? null,
        ingredientsJson: JSON.stringify(ingredients),
        stepsJson: JSON.stringify(steps),
      });
      await saveRecipeMedia(media ?? [], id, ctx.user.id);
      return { success: true } as const;
    }),
    hide: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => {
      await hideRecipe(input.id);
      return { success: true } as const;
    }),
  }),
});

export type AppRouter = typeof appRouter;
