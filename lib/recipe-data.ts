import type { ImageSourcePropType } from "react-native";

export type CountryCode = "TR" | "ALL";

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
  { code: "ALL" as CountryCode, name: "Tümü", flag: "🌍", subtitle: "Dünya mutfakları" },
];

export const categories = [
  { name: "Çorbalar", icon: "soup-kitchen", count: 24, color: "#E98B3A" },
  { name: "Ana Yemek", icon: "restaurant", count: 42, color: "#5C8D62" },
  { name: "Salatalar", icon: "eco", count: 18, color: "#7B9F5B" },
  { name: "Tatlılar", icon: "cake", count: 31, color: "#C56B7A" },
  { name: "Hamur İşi", icon: "bakery-dining", count: 29, color: "#B87941" },
  { name: "İçecekler", icon: "local-cafe", count: 15, color: "#7A6AA8" },
];

export const recipes: Recipe[] = [
  {
    id: "mercimek-kofte",
    title: "Mercimek Köftesi",
    category: "Salatalar",
    country: "TR",
    countryName: "Türkiye",
    flag: "🇹🇷",
    image: recipeImages.mercimek,
    author: "Ayşe Yılmaz",
    authorAvatar: "AY",
    prepMinutes: 25,
    cookMinutes: 20,
    servings: 6,
    summary: "Çayın yanına çok yakışan, bol yeşillikli klasik mercimek köftesi.",
    ingredients: [
      { amount: 1, unit: "su bardağı", name: "kırmızı mercimek", scalable: true },
      { amount: 2, unit: "su bardağı", name: "ince bulgur", scalable: true },
      { amount: 1, unit: "adet", name: "kuru soğan", scalable: true },
      { amount: 3, unit: "yemek kaşığı", name: "zeytinyağı", scalable: true },
      { amount: 0, unit: "bir tutam", name: "tuz ve karabiber", scalable: false },
    ],
    steps: [
      "Mercimeği yıkayıp yumuşayana kadar haşlayın.",
      "Sıcak mercimeğin üzerine bulguru ekleyip kapağı kapalı şekilde 20 dakika dinlendirin.",
      "Soğanı zeytinyağında pembeleştirin, salçayı ekleyip birkaç dakika çevirin.",
      "Tüm malzemeleri geniş bir kapta yoğurun; yeşillikleri ekleyip şekil verin.",
    ],
    tip: "Bulgurun iyi şişmesi için karışımı şekil vermeden önce en az 20 dakika dinlendirin.",
    createdAt: "2026-08-16T10:00:00.000Z",
  },
  {
    id: "kayseri-mantisi",
    title: "Kayseri Mantısı",
    category: "Ana Yemek",
    country: "TR",
    countryName: "Türkiye",
    flag: "🇹🇷",
    image: recipeImages.manti,
    author: "Mehmet Kaya",
    authorAvatar: "MK",
    prepMinutes: 60,
    cookMinutes: 15,
    servings: 4,
    summary: "İncecik hamuru ve sarımsaklı yoğurduyla ev yapımı mantı.",
    ingredients: [
      { amount: 3, unit: "su bardağı", name: "un", scalable: true },
      { amount: 250, unit: "gram", name: "kıyma", scalable: true },
      { amount: 1, unit: "adet", name: "yumurta", scalable: true },
      { amount: 2, unit: "diş", name: "sarımsak", scalable: true },
    ],
    steps: [
      "Un, yumurta, su ve tuzla sert bir hamur yoğurun.",
      "Hamuru dinlendirip ince açın ve küçük kareler kesin.",
      "Kıymalı harcı karelere paylaştırıp mantıları kapatın.",
      "Mantıları kaynar suda haşlayıp sarımsaklı yoğurt ve tereyağlı sosla servis edin.",
    ],
    tip: "Hamuru çok kalın bırakmayın; küçük mantılar daha dengeli pişer.",
    createdAt: "2026-08-15T14:20:00.000Z",
  },
  {
    id: "zeytinyagli-tabak",
    title: "Zeytinyağlı Sebze Tabağı",
    category: "Ana Yemek",
    country: "TR",
    countryName: "Türkiye",
    flag: "🇹🇷",
    image: recipeImages.zeytinyagli,
    author: "Elif Demir",
    authorAvatar: "ED",
    prepMinutes: 20,
    cookMinutes: 35,
    servings: 4,
    summary: "Mevsim sebzelerini hafif ve renkli bir sofraya dönüştüren tarif.",
    ingredients: [
      { amount: 2, unit: "adet", name: "kabak", scalable: true },
      { amount: 2, unit: "adet", name: "havuç", scalable: true },
      { amount: 1, unit: "adet", name: "kırmızı biber", scalable: true },
      { amount: 4, unit: "yemek kaşığı", name: "zeytinyağı", scalable: true },
    ],
    steps: [
      "Sebzeleri eşit büyüklükte doğrayın.",
      "Zeytinyağı ve soğanla birlikte sebzeleri tencereye alın.",
      "Az su ekleyip kapağı kapalı şekilde yumuşayana kadar pişirin.",
      "Ilık veya soğuk servis edin.",
    ],
    tip: "Zeytinyağlı yemekler dinlendikçe lezzetlenir; servis öncesi birkaç saat bekletin.",
    createdAt: "2026-08-14T09:10:00.000Z",
  },
];

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
  return `${recipe.prepMinutes + recipe.cookMinutes} dk`;
}

export function getCategoryCount(categoryName: string, country: CountryCode = "ALL") {
  return getRecipes(country, categoryName).length;
}
