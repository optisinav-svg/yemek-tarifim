import { MEAL_SLOT_DEFAULT_TIME, MEAL_SLOT_LABELS, type MealSlot } from "./meal-plan-store";

function pad(value: number) {
  return String(value).padStart(2, "0");
}

/** YYYYMMDDTHHMMSS biçiminde, yerel saat (Google bunu kullanıcının kendi saat dilimine göre yorumlar). */
function formatLocalDateTime(date: Date) {
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}00`;
}

/**
 * Google Takvim'in kendi "hızlı ekle" sayfasını, etkinlik bilgileri
 * doldurulmuş halde açan bir link üretir. Google API/OAuth izni
 * gerektirmez; kullanıcı linke tıklar, Google Takvim açılır, "Kaydet"
 * der ve etkinlik kendi takvimine eklenir.
 */
export function buildGoogleCalendarLink(params: { date: string; slot: MealSlot; recipeTitle: string; servings: number }) {
  const { date, slot, recipeTitle, servings } = params;
  const [year, month, day] = date.split("-").map(Number);
  const { hour, minute } = MEAL_SLOT_DEFAULT_TIME[slot];
  const start = new Date(year, (month ?? 1) - 1, day, hour, minute);
  const end = new Date(start.getTime() + 30 * 60 * 1000);

  const title = `${MEAL_SLOT_LABELS[slot]}: ${recipeTitle}`;
  const details = `Gastronotlar üzerinden planlanan öğün.\n${servings} kişilik.`;

  const searchParams = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${formatLocalDateTime(start)}/${formatLocalDateTime(end)}`,
    details,
  });

  return `https://calendar.google.com/calendar/render?${searchParams.toString()}`;
}
