import { TRPCError } from "@trpc/server";
import { z } from "zod";
import crypto from "crypto";

import { invokeLLM } from "./_core/llm";
import { getSessionCookieOptions } from "./_core/cookies";
import { SUPPORTED_TRANSLATION_LANGUAGES } from "../shared/const";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { consumeRateLimit, createAuditLog, createContentReport, createRecipe, createRecipeAttempt, createRecipeComment, createRecipeGroup, createRecipeMedia, deleteAccount, deleteOwnRecipe, findRecipeGroup, getRecipeById, getUserMealPlan, getUserSyncState, hideRecipe, listPendingContentReports, listPublishedRecipes, listRecipeAttempts, listRecipeComments, listRecipeGroups, listRecipeMedia, replaceUserMealPlan, replaceUserSyncState, resolveContentReport, updateRecipe, updateUserProfile } from "./db";
import { storagePut } from "./storage";
import { authCustomRouter } from "./routers/auth-custom";
import { systemRouter } from "./_core/systemRouter";

const ingredientSchema = z.object({
  name: z.string().trim().min(1).max(120),
  amount: z.string().trim().max(40).optional(),
  unit: z.string().trim().max(30).optional(),
});

const recipeAssetUrlSchema = z.string().trim().max(2_000_000).refine((value) => value.startsWith("/manus-storage/") || value.startsWith("data:") || /^https?:\/\//i.test(value), "Geçerli bir medya adresi girin.");
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
  tip: z.string().trim().max(2000).optional(),
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

const translateInputSchema = z.object({
  id: z.number().int().positive(),
  targetLanguage: z.enum(["en", "de", "fr", "es", "ar", "ru"]),
});

const translateResultSchema = z.object({
  title: z.string(),
  summary: z.string(),
  tip: z.string(),
  ingredients: z.array(z.object({ name: z.string(), amount: z.union([z.string(), z.number()]).nullable().optional(), unit: z.string().optional() })),
  steps: z.array(z.string()),
});

const ocrResultSchema = z.object({
  title: z.string().trim().min(1).max(180),
  summary: z.string().trim().max(1000),
  tip: z.string().trim().max(2000).optional(),
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

const reportInputSchema = z.object({
  targetType: z.enum(["recipe", "comment", "attempt", "user"]),
  targetId: z.number().int().positive(),
  reason: z.string().trim().min(2).max(80),
  details: z.string().trim().max(800).optional(),
});

const attemptInputSchema = z.object({
  recipeId: z.number().int().positive(),
  dataBase64: z.string().trim().min(16).max(12_000_000).regex(/^[A-Za-z0-9+/]+={0,2}$/, "Geçersiz görsel verisi."),
  fileName: z.string().trim().min(1).max(120),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  caption: z.string().trim().max(600).optional(),
});

const groupListInputSchema = z.object({
  countryCode: z.string().trim().max(8).optional(),
}).optional();

const groupCreateInputSchema = z.object({
  countryCode: z.string().trim().min(2).max(8).refine((value) => value !== "ALL", "Yeni grup için belirli bir ülke seçin."),
  name: z.string().trim().min(2, "Grup adı en az 2 karakter olmalıdır.").max(80, "Grup adı 80 karakterden uzun olamaz."),
});

const BUILT_IN_CATEGORY_NAMES = new Set(["Çorbalar", "Ana Yemek", "Salatalar", "Tatlılar", "Hamur İşi", "İçecekler"]);

const syncStateSchema = z.object({
  savedRecipeIds: z.array(z.string().trim().min(1).max(120)).max(500),
  shoppingItems: z.array(z.object({
    id: z.string().trim().min(1).max(160),
    name: z.string().trim().min(1).max(160),
    amount: z.string().trim().max(80),
    checked: z.boolean(),
  })).max(500),
});

const mealPlanEntriesSchema = z.array(z.object({
  id: z.string().trim().min(1).max(160),
  date: z.string().trim().min(1).max(10),
  slot: z.string().trim().min(1).max(20),
  recipeId: z.string().trim().min(1).max(60),
  recipeTitle: z.string().trim().min(1).max(200),
  servings: z.number().int().positive().max(100),
})).max(500);

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

function getRequestIp(req: { headers: Record<string, string | string[] | undefined>; ip?: string }) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0]?.trim() || "unknown";
  if (Array.isArray(forwarded)) return forwarded[0] || "unknown";
  return req.ip || "unknown";
}

async function enforceMutationRateLimit(ctx: { user: { id: number }; req: { headers: Record<string, string | string[] | undefined>; ip?: string } }, scope: string, limit: number, windowMs: number, message: string) {
  const bucketKey = `user:${ctx.user.id}:${scope}:${getRequestIp(ctx.req)}`;
  const result = await consumeRateLimit(bucketKey, limit, windowMs);
  if (!result.allowed) {
    await createAuditLog({ actorId: ctx.user.id, action: "rate_limit_denied", entityType: scope, entityId: String(ctx.user.id), metadataJson: JSON.stringify({ resetAt: result.resetAt.toISOString() }) });
    throw new TRPCError({ code: "TOO_MANY_REQUESTS", message });
  }
}

async function audit(ctx: { user: { id: number } }, action: string, entityType: string, entityId?: number | string, metadata?: Record<string, unknown>) {
  await createAuditLog({ actorId: ctx.user.id, action, entityType, entityId: entityId === undefined ? null : String(entityId), metadataJson: metadata ? JSON.stringify(metadata) : null });
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
  system: systemRouter,
  authCustom: authCustomRouter,
  // app routers
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie("session", { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  account: router({
    delete: protectedProcedure.mutation(async ({ ctx }) => {
      await enforceMutationRateLimit(ctx, "account-delete", 2, 24 * 60 * 60 * 1000, "Hesap silme işlemi için günlük sınır aşıldı.");
      await deleteAccount(ctx.user.id);
      await audit(ctx, "account_deleted", "user", ctx.user.id);
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie("session", { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  groups: router({
    list: publicProcedure.input(groupListInputSchema).query(({ input }) => listRecipeGroups(input?.countryCode)),
    create: protectedProcedure.input(groupCreateInputSchema).mutation(async ({ ctx, input }) => {
      await enforceMutationRateLimit(ctx, "group-create-daily", 5, 24 * 60 * 60 * 1000, "Günlük grup ekleme sınırına ulaştınız.");
      const normalizedName = input.name.replace(/\s+/g, " ").trim();
      if (BUILT_IN_CATEGORY_NAMES.has(normalizedName)) {
        throw new TRPCError({ code: "CONFLICT", message: "Bu ad zaten sistem gruplarında bulunuyor." });
      }
      if (await findRecipeGroup(input.countryCode, normalizedName)) {
        throw new TRPCError({ code: "CONFLICT", message: "Bu ülkede aynı isimde bir grup zaten var." });
      }
      const id = await createRecipeGroup({ countryCode: input.countryCode, name: normalizedName, authorId: ctx.user.id, status: "active" });
      await audit(ctx, "recipe_group_created", "recipe_group", Number(id), { countryCode: input.countryCode, name: normalizedName });
      return { id: Number(id), countryCode: input.countryCode, name: normalizedName };
    }),
  }),
  sync: router({
    get: protectedProcedure.query(async ({ ctx }) => getUserSyncState(ctx.user.id)),
    replace: protectedProcedure.input(syncStateSchema).mutation(async ({ ctx, input }) => {
      await replaceUserSyncState(ctx.user.id, input);
      return { success: true } as const;
    }),
  }),
  mealPlan: router({
    get: protectedProcedure.query(async ({ ctx }) => getUserMealPlan(ctx.user.id)),
    replace: protectedProcedure.input(mealPlanEntriesSchema).mutation(async ({ ctx, input }) => {
      await replaceUserMealPlan(ctx.user.id, input);
      return { success: true } as const;
    }),
  }),
  recipes: router({
    list: publicProcedure.input(listInputSchema).query(async ({ input }) => {
      const rows = await listPublishedRecipes(input);
      return rows.map((row: Awaited<ReturnType<typeof listPublishedRecipes>>[number]) => decodeRecipe(row));
    }),
    byId: publicProcedure.input(z.object({ id: z.number().int().positive() })).query(async ({ input }) => {
      const recipe = decodeRecipe(await getRecipeById(input.id));
      if (!recipe) return null;
      return { ...recipe, media: await listRecipeMedia(input.id) };
    }),
    translate: publicProcedure.input(translateInputSchema).mutation(async ({ ctx, input }) => {
      const bucketKey = `translate:${getRequestIp(ctx.req)}`;
      const rate = await consumeRateLimit(bucketKey, 30, 60 * 60 * 1000);
      if (!rate.allowed) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Kısa sürede çok fazla çeviri isteği gönderildi. Lütfen biraz sonra tekrar deneyin." });
      }
      const recipe = decodeRecipe(await getRecipeById(input.id));
      if (!recipe) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Tarif bulunamadı." });
      }
      const languageName = SUPPORTED_TRANSLATION_LANGUAGES.find((l) => l.code === input.targetLanguage)?.label ?? input.targetLanguage;
      const response = await invokeLLM({
        model: "gemini-3-flash-preview",
        max_tokens: 3000,
        messages: [
          {
            role: "system",
            content: `Sen bir yemek tarifi çevirmenisin. Verilen Türkçe tarifi ${languageName} diline çevir. Malzeme miktarlarındaki sayıları DEĞİŞTİRME, sadece birim ve isim metnini çevir. Yalnızca istenen JSON nesnesini döndür, başka açıklama ekleme.`,
          },
          {
            role: "user",
            content: JSON.stringify({
              title: recipe.title,
              summary: recipe.summary ?? "",
              tip: recipe.tip ?? "",
              ingredients: recipe.ingredients,
              steps: recipe.steps,
            }),
          },
        ],
        response_format: { type: "json_object" },
      });
      const content = response.choices[0]?.message.content;
      const jsonText = typeof content === "string" ? content : content.filter((part) => part.type === "text").map((part) => part.text).join("\n");
      try {
        return translateResultSchema.parse(JSON.parse(jsonText));
      } catch {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Çeviri şu anda yapılamadı. Lütfen tekrar deneyin." });
      }
    }),
    media: router({
      upload: protectedProcedure.input(uploadInputSchema).mutation(async ({ ctx, input }) => {
        await enforceMutationRateLimit(ctx, "media-upload", 30, 15 * 60 * 1000, "Kısa sürede çok fazla medya yüklediniz. Lütfen biraz sonra tekrar deneyin.");
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
        await audit(ctx, "media_uploaded", "recipe_media", undefined, { mediaType: input.mediaType, mimeType: input.mimeType });
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
        await enforceMutationRateLimit(ctx, "comment-create", 20, 15 * 60 * 1000, "Kısa sürede çok fazla yorum gönderdiniz.");
        if (!await getRecipeById(input.recipeId)) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Tarif bulunamadı." });
        }
        const id = await createRecipeComment({ recipeId: input.recipeId, authorId: ctx.user.id, body: input.body, status: "visible" });
        await audit(ctx, "comment_created", "recipe_comment", Number(id), { recipeId: input.recipeId });
        return { id: Number(id) };
      }),
      attempts: publicProcedure.input(z.object({ recipeId: z.number().int().positive() })).query(async ({ input }) => {
        if (!await getRecipeById(input.recipeId)) return [];
        return listRecipeAttempts(input.recipeId);
      }),
      addAttempt: protectedProcedure.input(attemptInputSchema).mutation(async ({ ctx, input }) => {
        await enforceMutationRateLimit(ctx, "attempt-create", 10, 60 * 60 * 1000, "Saatlik fotoğraflı deneme sınırını aştınız.");
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
        await audit(ctx, "recipe_attempt_created", "recipe_attempt", Number(id), { recipeId: input.recipeId });
        return { id: Number(id), url: uploaded.url };
      }),
    }),
    ocr: protectedProcedure.input(ocrInputSchema).mutation(async ({ ctx, input }) => {
      await enforceMutationRateLimit(ctx, "ocr", 10, 60 * 60 * 1000, "Saatlik görsel tarif aktarma sınırını aştınız.");
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
                text: "Bu görseldeki yemek tarifini düzenlenebilir alanlara aktar. Başlık, kısa açıklama, kategori, ülke kodu (Türkiye için TR; emin değilsen TR), porsiyon, hazırlama ve pişirme dakikaları, malzemeler (miktar/birim/ad) ve yapılış adımlarını çıkar. JSON anahtarları tam olarak title, summary, tip, category, countryCode, servings, prepMinutes, cookMinutes, ingredients, steps olsun. tip tarifteki püf noktası okunabiliyorsa metin, okunamıyorsa boş bırakılabilir. ingredients her biri name, amount ve unit alanlarına sahip dizi olsun.",
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
        await audit(ctx, "recipe_ocr_completed", "recipe_import");
        return parsed;
      } catch {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Görselde düzenlenebilir bir tarif metni bulunamadı. Lütfen daha net bir fotoğraf deneyin." });
      }
    }),
    create: protectedProcedure.input(recipeInputSchema).mutation(async ({ ctx, input }) => {
      await enforceMutationRateLimit(ctx, "recipe-create-daily", 20, 24 * 60 * 60 * 1000, "Günlük tarif ekleme sınırını aştınız.");
      const id = await createRecipe({
        authorId: ctx.user.id,
        countryCode: input.countryCode,
        category: input.category,
        title: input.title,
        summary: input.summary ?? null,
        tip: input.tip ?? null,
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
      await audit(ctx, "recipe_created", "recipe", recipeId, { countryCode: input.countryCode, category: input.category });
      return { id: recipeId };
    }),
    update: protectedProcedure.input(recipeInputSchema.extend({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      await enforceMutationRateLimit(ctx, "recipe-update", 30, 60 * 60 * 1000, "Saatlik tarif düzenleme sınırını aştınız.");
      const { id, ingredients, steps, media, ...rest } = input;
      await updateRecipe(id, ctx.user.id, {
        ...rest,
        summary: rest.summary ?? null,
        imageUrl: rest.imageUrl ?? media?.[0]?.url ?? null,
        ingredientsJson: JSON.stringify(ingredients),
        stepsJson: JSON.stringify(steps),
      });
      await saveRecipeMedia(media ?? [], id, ctx.user.id);
      await audit(ctx, "recipe_updated", "recipe", id);
      return { success: true } as const;
    }),
    hide: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      await hideRecipe(input.id);
      await audit(ctx, "recipe_hidden", "recipe", input.id);
      return { success: true } as const;
    }),
    delete: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const deleted = await deleteOwnRecipe(input.id, ctx.user.id);
      if (!deleted) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Bu tarifi silme yetkiniz yok veya tarif zaten silinmiş." });
      }
      await audit(ctx, "recipe_deleted", "recipe", input.id);
      return { success: true } as const;
    }),
  }),
  profile: router({
    uploadAvatar: protectedProcedure.input(uploadInputSchema.extend({ mediaType: z.literal("image"), mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]) })).mutation(async ({ ctx, input }) => {
      const bytes = Buffer.from(input.dataBase64, "base64");
      if (!bytes.byteLength || bytes.byteLength > 8 * 1024 * 1024) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Profil fotoğrafı 8 MB'dan küçük olmalıdır." });
      }
      const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80) || "avatar.jpg";
      const uploaded = await storagePut(`avatars/${ctx.user.id}/${Date.now()}-${safeName}`, bytes, input.mimeType);
      return { url: uploaded.url };
    }),
  }),
  moderation: router({
    report: protectedProcedure.input(reportInputSchema).mutation(async ({ ctx, input }) => {
      await enforceMutationRateLimit(ctx, "report-create", 10, 24 * 60 * 60 * 1000, "Günlük rapor gönderme sınırını aştınız.");
      if (input.targetType === "recipe" && !await getRecipeById(input.targetId)) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Raporlanacak tarif bulunamadı." });
      }
      const id = await createContentReport({ reporterId: ctx.user.id, targetType: input.targetType, targetId: input.targetId, reason: input.reason, details: input.details ?? null, status: "pending" });
      await audit(ctx, "content_report_created", input.targetType, input.targetId, { reason: input.reason });
      return { id: Number(id) };
    }),
    pending: adminProcedure.query(async () => listPendingContentReports()),
    resolve: adminProcedure.input(z.object({ id: z.number().int().positive(), status: z.enum(["resolved", "dismissed"]) })).mutation(async ({ ctx, input }) => {
      await resolveContentReport(input.id, ctx.user.id, input.status);
      await audit(ctx, "content_report_resolved", "content_report", input.id, { status: input.status });
      return { success: true } as const;
    }),
  }),
  updateProfile: protectedProcedure
    .input(z.object({
      name: z.string().trim().min(1).max(80).optional(),
      surname: z.string().trim().min(1).max(80).optional(),
      imageUrl: z.string().trim().max(2_000_000).optional(),
      password: z.string().min(6).optional(),
      confirmPassword: z.string().min(6).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await enforceMutationRateLimit(ctx, "profile-update", 30, 60 * 60 * 1000, "Profil güncelleme sınırını aştınız.");
      if (input.password !== undefined && input.password !== input.confirmPassword) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Şifreler birbiriyle aynı değil." });
      }
      const { password, confirmPassword: _confirmPassword, ...profileFields } = input;
      await updateUserProfile(ctx.user.openId, {
        ...profileFields,
        ...(password ? { passwordHash: crypto.createHash("sha256").update(password).digest("hex") } : {}),
      });
      await audit(ctx, "profile_updated", "user", ctx.user.id);
      return { success: true };
    }),
});

export type AppRouter = typeof appRouter;
