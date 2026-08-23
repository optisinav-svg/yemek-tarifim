import type { ImageSourcePropType } from "react-native";

export type CountryCode = "TR" | "AZ" | "ALL";

export type Ingredient = {
  amount: number | null;
  unit: string;
  name: string;
  scalable: boolean;
};

export type Recipe = {
  id: string;
  title: string;
  category: string;
  country: CountryCode;
  countryName: string;
  flag: string;
  image: ImageSourcePropType;
  author: string;
  authorAvatar: string;
  prepMinutes: number;
  cookMinutes: number;
  servings: number;
  summary: string;
  ingredients: Ingredient[];
  steps: string[];
  tip: string;
  createdAt: string;
};

export const recipeImages = {
  mercimek: require("../assets/images/recipes/mercimek-kofte.jpg"),
  manti: require("../assets/images/recipes/manti.jpg"),
  zeytinyagli: require("../assets/images/recipes/zeytinyagli.jpg"),
} as const;

export const countries = [
  { code: "TR" as CountryCode, name: "Türkiye", flag: "🇹🇷", subtitle: "Anadolu sofraları" },
  { code: "AZ" as CountryCode, name: "Azerbaycan", flag: "🇦🇿", subtitle: "Kafkas sofraları" },
  { code: "ALL" as CountryCode, name: "Tümü", flag: "🌍", subtitle: "Dünya mutfakları" },
];

export const baseCategories = [
  { name: "Kahvaltı", icon: "free-breakfast", color: "#D9A441" },
  { name: "Çorbalar", icon: "soup-kitchen", color: "#E98B3A" },
  { name: "Ana Yemek", icon: "restaurant", color: "#5C8D62" },
  { name: "Salatalar", icon: "eco", color: "#7B9F5B" },
  { name: "Tatlılar", icon: "cake", color: "#C56B7A" },
  { name: "Hamur İşi", icon: "bakery-dining", color: "#B87941" },
  { name: "İçecekler", icon: "local-cafe", color: "#7A6AA8" },
];

// getCategories moved below recipes

export const recipes: Recipe[] = [];

export function getRecipe(id: string) {
  return recipes.find((recipe) => recipe.id === id);
}

export function getRecipes(country: CountryCode, category?: string, search?: string) {
  const normalized = search?.trim().toLocaleLowerCase("tr-TR");
  return recipes.filter((recipe) => {
    const countryMatches = country === "ALL" || recipe.country === country;
    const categoryMatches = !category || recipe.category === category;
    const searchMatches =
      !normalized ||
      recipe.title.toLocaleLowerCase("tr-TR").includes(normalized) ||
      recipe.ingredients.some((ingredient) => ingredient.name.toLocaleLowerCase("tr-TR").includes(normalized));
    return countryMatches && categoryMatches && searchMatches;
  });
}

export function formatTotalTime(recipe: Recipe) {
  const total = recipe.prepMinutes + recipe.cookMinutes;
  if (total < 60) return `${total} dk`;
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return minutes === 0 ? `${hours} sa` : `${hours} sa ${minutes} dk`;
}

export function getCategoryCount(categoryName: string, country: CountryCode = "ALL") {
  return getRecipes(country, categoryName).length;
}

export function getCategories(selectedCountry: CountryCode = "TR") {
  return baseCategories.map((cat) => {
    const count = recipes.filter((r) => r.category === cat.name && (selectedCountry === "ALL" || r.country === selectedCountry)).length;
    return { ...cat, count };
  });
}

export const categories = getCategories("TR");
