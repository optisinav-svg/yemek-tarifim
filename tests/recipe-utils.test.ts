import { describe, expect, it } from "vitest";

import { formatIngredient, formatShoppingAmount, scaleIngredientAmount } from "../lib/recipe-utils";

const scalable = { amount: 1, unit: "su bardağı", name: "mercimek", scalable: true } as const;
const unscalable = { amount: 0, unit: "bir tutam", name: "tuz", scalable: false } as const;

describe("recipe portion utilities", () => {
  it("scales measurable ingredients proportionally", () => {
    expect(scaleIngredientAmount(scalable, 8, 4)).toBe(2);
    expect(formatIngredient(scalable, 2, 4)).toBe("0.5 su bardağı mercimek");
    expect(formatShoppingAmount(scalable, 6, 4)).toBe("1.5 su bardağı");
  });

  it("keeps approximate ingredients unscaled", () => {
    expect(scaleIngredientAmount(unscalable, 8, 4)).toBeNull();
    expect(formatIngredient(unscalable, 8, 4)).toBe("bir tutam tuz");
    expect(formatShoppingAmount(unscalable, 8, 4)).toBe("");
  });
});
