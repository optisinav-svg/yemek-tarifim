import { getApiBaseUrl } from "@/constants/oauth";
import { recipeImages, type CountryCode, type Recipe } from "./recipe-data";

export function resolveAssetUrl(url: string) {
  if (/^https?:\/\//i.test(url) || url.startsWith("data:")) return url;
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) return url;
  return `${baseUrl}${url.startsWith("/") ? url : `/${url}`}`;
}

const PLACEHOLDER_IMAGES = [recipeImages.mercimek, recipeImages.manti, recipeImages.zeytinyagli];

/** Fotoğrafı olmayan tarifler için, hepsi aynı görsele düşmesin diye
 * elimizdeki birkaç örnek fotoğraf arasında dönüşümlü bir seçim yapar. */
function placeholderImageFor(id: number) {
  const index = Math.abs(id) % PLACEHOLDER_IMAGES.length;
  return PLACEHOLDER_IMAGES[index];
}

/** Sunucudan (trpc.recipes.list / byId) gelen ham tarifi, uygulamanın her
 * yerde kullandığı yerel `Recipe` biçimine çevirir. */
export function adaptServerRecipe(server: {
  id: number;
  title: string;
  category: string;
  countryCode: string;
  summary: string | null;
  tip: string | null;
  imageUrl: string | null;
  prepMinutes: number;
  cookMinutes: number;
  servings: number;
  ingredients: unknown;
  steps: unknown;
  createdAt: string | Date;
}): Recipe {
  const country: CountryCode = server.countryCode === "TR" ? "TR" : server.countryCode === "AZ" ? "AZ" : "ALL";
  const countryMeta =
    country === "TR"
      ? { name: "Türkiye", flag: "🇹🇷" }
      : country === "AZ"
        ? { name: "Azerbaycan", flag: "🇦🇿" }
        : { name: "Dünya mutfağı", flag: "🌍" };

  let ingredients: Recipe["ingredients"] = [];
  try {
    const raw = server.ingredients;
    ingredients = Array.isArray(raw)
      ? raw.map((item) => {
          const record = typeof item === "object" && item !== null ? (item as Record<string, unknown>) : {};
          const amountValue = record.amount;
          const parsedAmount = typeof amountValue === "number" ? amountValue : Number(String(amountValue ?? "").replace(",", "."));
          return {
            name: String(record.name ?? "Malzeme"),
            unit: String(record.unit ?? "adet"),
            amount: Number.isFinite(parsedAmount) ? parsedAmount : null,
            scalable: Boolean(record.scalable ?? Number.isFinite(parsedAmount)),
          };
        })
      : [];
  } catch {
    ingredients = [];
  }

  const steps = Array.isArray(server.steps) ? server.steps.map((s) => String(s)) : [];

  return {
    id: String(server.id),
    title: server.title,
    category: server.category,
    country,
    countryName: countryMeta.name,
    flag: countryMeta.flag,
    image: server.imageUrl ? { uri: resolveAssetUrl(server.imageUrl) } : placeholderImageFor(server.id),
    author: "Topluluk üyesi",
    authorAvatar: "TY",
    prepMinutes: server.prepMinutes,
    cookMinutes: server.cookMinutes,
    servings: server.servings,
    summary: server.summary ?? "",
    ingredients,
    steps,
    tip: server.tip ?? "",
    createdAt: typeof server.createdAt === "string" ? server.createdAt : server.createdAt.toISOString(),
  };
}
