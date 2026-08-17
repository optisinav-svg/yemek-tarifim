import { describe, expect, it } from "vitest";

import { appRouter } from "../server/routers";

const context = {
  req: {} as never,
  res: { clearCookie: () => undefined } as never,
  user: null,
};

describe("recipe router security", () => {
  it("allows public recipe discovery to return a list", async () => {
    const caller = appRouter.createCaller(context);
    const result = await caller.recipes.list({ countryCode: "TR" });
    expect(Array.isArray(result)).toBe(true);
  });

  it("rejects anonymous sync reads", async () => {
    const caller = appRouter.createCaller(context);
    await expect(caller.sync.get()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects anonymous sync writes", async () => {
    const caller = appRouter.createCaller(context);
    await expect(caller.sync.replace({ savedRecipeIds: ["recipe-1"], shoppingItems: [] })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects anonymous recipe media uploads", async () => {
    const caller = appRouter.createCaller(context);
    await expect(caller.recipes.media.upload({
      dataBase64: "c29tZS1kZXRlcm1pbmlzdGljLWRhdGE=",
      fileName: "recipe.jpg",
      mimeType: "image/jpeg",
      mediaType: "image",
    })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects anonymous recipe OCR", async () => {
    const caller = appRouter.createCaller(context);
    await expect(caller.recipes.ocr({
      dataBase64: "c29tZS1kZXRlcm1pbmlzdGljLWRhdGE=",
      mimeType: "image/jpeg",
    })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects anonymous recipe comments", async () => {
    const caller = appRouter.createCaller(context);
    await expect(caller.recipes.community.addComment({ recipeId: 1, body: "Güzel tarif." })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects anonymous photo attempts", async () => {
    const caller = appRouter.createCaller(context);
    await expect(caller.recipes.community.addAttempt({
      recipeId: 1,
      dataBase64: "c29tZS1kZXRlcm1pbmlzdGljLWRhdGE=",
      fileName: "deneme.jpg",
      mimeType: "image/jpeg",
    })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects anonymous recipe creation", async () => {
    const caller = appRouter.createCaller(context);
    await expect(caller.recipes.create({
      countryCode: "TR",
      category: "Çorba",
      title: "Test çorbası",
      tip: "Mercimeği önceden yıkayın.",
      servings: 4,
      prepMinutes: 10,
      cookMinutes: 20,
      ingredients: [{ name: "Mercimek", amount: "1", unit: "su bardağı" }],
      steps: ["Pişir."],
    })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects protected operations for suspended accounts", async () => {
    const suspendedContext = {
      ...context,
      user: { accountStatus: "suspended", role: "user" },
    } as never;
    const caller = appRouter.createCaller(suspendedContext);
    await expect(caller.sync.get()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects anonymous account deletion", async () => {
    const caller = appRouter.createCaller(context);
    await expect(caller.account.delete()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
