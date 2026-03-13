import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, isValid } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Safely formats a date string using date-fns format.
 * Returns a fallback string instead of throwing RangeError on invalid dates.
 */
export function formatSafeDate(dateStr: string | null | undefined, formatStr: string, fallback: string = "Invalid Date"): string {
  if (!dateStr) return fallback;
  try {
    const date = new Date(dateStr);
    if (!isValid(date)) return fallback;
    return format(date, formatStr);
  } catch (e) {
    return fallback;
  }
}
