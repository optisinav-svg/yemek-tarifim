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

  it("rejects anonymous recipe creation", async () => {
    const caller = appRouter.createCaller(context);
    await expect(caller.recipes.create({
      countryCode: "TR",
      category: "Çorba",
      title: "Test çorbası",
      servings: 4,
      prepMinutes: 10,
      cookMinutes: 20,
      ingredients: [{ name: "Mercimek", amount: "1", unit: "su bardağı" }],
      steps: ["Pişir."],
    })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
