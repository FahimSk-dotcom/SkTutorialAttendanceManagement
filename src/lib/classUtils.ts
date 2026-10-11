import { BatchType } from "@/types";

/**
 * Standard list of normalized classes for consistent grade-level ordering:
 * Jr.Kg, Sr.Kg, Class 1 through Class 10
 */
export const ORDERED_CLASS_NORMS = [
  "jr.kg",
  "sr.kg",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
];

/**
 * Normalizes a class string to its canonical matching token.
 * Handles variations such as:
 * - "Class 9" -> "9"
 * - "Class Class 9" -> "9"
 * - "9" -> "9"
 * - "Class Jr.Kg" -> "jr.kg"
 * - "Jr.Kg" -> "jr.kg"
 * - "Jr. Kg" -> "jr.kg"
 * - "Class Sr.Kg" -> "sr.kg"
 * - "Sr.Kg" -> "sr.kg"
 */
export function normalizeClass(c: string = ""): string {
  if (!c) return "";
  return c
    .toLowerCase()
    .replace(/^(class\s*)+/i, "")
    .replace(/\s+/g, "")
    .trim();
}

/**
 * Formats a class string cleanly for UI display without redundant "Class" repetition.
 * E.g.:
 * - "Class 9" -> "Class 9"
 * - "Class Class 9" -> "Class 9"
 * - "9" -> "Class 9"
 * - "Class Jr.Kg" -> "Class Jr.Kg"
 * - "Jr.Kg" -> "Class Jr.Kg"
 * - "Jr. Kg" -> "Class Jr.Kg"
 */
export function formatClassDisplay(className: string = ""): string {
  if (!className) return "";
  const trimmed = className.trim();
  const stripped = trimmed.replace(/^(class\s*)+/i, "").trim();
  return `Class ${stripped}`;
}

/**
 * Checks if a student's class matches any entry in a list of classes.
 */
export function isClassInList(studentClass: string = "", classList: string[] = []): boolean {
  if (!studentClass || !classList || classList.length === 0) return false;
  const normSt = normalizeClass(studentClass);
  return classList.some((c) => normalizeClass(c) === normSt);
}

/**
 * Computes the effective batch ("5-7" | "7-9" | "Unassigned") for a student
 * based on explicit student.batch or class mapping settings.
 */
export function getEffectiveBatch(
  student: { batch?: string; class?: string },
  batch1Classes: string[] = [],
  batch2Classes: string[] = []
): BatchType | "Unassigned" {
  // If explicitly assigned to a valid batch
  if (student.batch === "5-7" || student.batch === "7-9") {
    return student.batch as BatchType;
  }

  // Check Batch 1 classes (e.g. 5–7)
  if (isClassInList(student.class, batch1Classes)) {
    return "5-7";
  }

  // Check Batch 2 classes (e.g. 7–9)
  if (isClassInList(student.class, batch2Classes)) {
    return "7-9";
  }

  return "Unassigned";
}

/**
 * Returns a numerical sort index for grade-level sorting from Jr.Kg to Class 10.
 */
export function getClassSortRank(className: string = ""): number {
  const norm = normalizeClass(className);
  const idx = ORDERED_CLASS_NORMS.indexOf(norm);
  return idx === -1 ? 99 : idx;
}
