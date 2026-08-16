import type { Ingredient } from "./recipe-data";

export function scaleIngredientAmount(ingredient: Ingredient, servings: number, baseServings: number): number | null {
  if (!ingredient.scalable || ingredient.amount === null || baseServings <= 0) return null;
  return Math.round(((ingredient.amount * servings) / baseServings) * 100) / 100;
}

export function formatIngredient(ingredient: Ingredient, servings: number, baseServings: number): string {
  const amount = scaleIngredientAmount(ingredient, servings, baseServings);
  if (amount === null) return `${ingredient.unit} ${ingredient.name}`;
  return `${amount} ${ingredient.unit} ${ingredient.name}`;
}

export function formatShoppingAmount(ingredient: Ingredient, servings: number, baseServings: number): string {
  const amount = scaleIngredientAmount(ingredient, servings, baseServings);
  if (amount === null) return "";
  return `${amount} ${ingredient.unit}`;
}
