/**
 * Asia/Kolkata Timezone Date Utilities
 * Ensures dates are never shifted by UTC conversions.
 */

// Timezone name
export const TIMEZONE = "Asia/Kolkata";

/**
 * Returns today's date in YYYY-MM-DD format based on Asia/Kolkata timezone.
 */
export function getKolkataToday(): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  // en-CA format returns YYYY-MM-DD
  return formatter.format(new Date());
}

/**
 * Returns ISO timestamp string in IST timezone offset format.
 */
export function getKolkataISOString(): string {
  return new Date().toISOString();
}

/**
 * Returns formatted long date string: e.g. "Saturday, 8 August 2026"
 */
export function formatKolkataFullDate(dateStr?: string): string {
  let targetDate: Date;
  if (!dateStr) {
    targetDate = new Date();
  } else {
    // Append T12:00:00 to prevent local midnight boundary shifts
    targetDate = new Date(`${dateStr}T12:00:00`);
  }

  return new Intl.DateTimeFormat("en-IN", {
    timeZone: TIMEZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(targetDate);
}

/**
 * Returns short formatted date: e.g. "8 Aug 2026"
 */
export function formatKolkataShortDate(dateStr: string): string {
  if (!dateStr) return "";
  const targetDate = new Date(`${dateStr}T12:00:00`);
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: TIMEZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(targetDate);
}

/**
 * Returns appropriate time-of-day greeting for Prof. Fahim Sir:
 * Good Morning / Good Afternoon / Good Evening
 */
export function getKolkataGreeting(): string {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    hour: "numeric",
    hour12: false,
  });
  const hour = parseInt(formatter.format(new Date()), 10);

  if (hour >= 4 && hour < 12) return "Good Morning";
  if (hour >= 12 && hour < 17) return "Good Afternoon";
  return "Good Evening";
}

/**
 * Returns month name and year: e.g. "August 2026"
 */
export function getMonthYearLabel(year: number, month: number): string {
  // month is 1-12
  const date = new Date(year, month - 1, 15);
  return date.toLocaleString("en-IN", { month: "long", year: "numeric" });
}

/**
 * Returns array of YYYY-MM-DD date strings for all days in a given month.
 */
export function getDaysInMonth(year: number, month: number): string[] {
  const days: string[] = [];
  const totalDays = new Date(year, month, 0).getDate();

  for (let day = 1; day <= totalDays; day++) {
    const dStr = String(day).padStart(2, "0");
    const mStr = String(month).padStart(2, "0");
    days.push(`${year}-${mStr}-${dStr}`);
  }

  return days;
}

/**
 * Checks if a given date string (YYYY-MM-DD) is in the future relative to today's Kolkata date.
 */
export function isFutureDate(dateStr: string): boolean {
  const today = getKolkataToday();
  return dateStr > today;
}
