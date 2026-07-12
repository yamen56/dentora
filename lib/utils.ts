import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(totalSeconds: number) {
  if (!totalSeconds || totalSeconds < 0) return "0:00";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * Serialize JSON-LD for embedding in a <script> tag. JSON.stringify leaves
 * "<" intact, so a value containing "</script>" would otherwise close the tag
 * and inject markup (course titles/descriptions are instructor-supplied).
 */
export function jsonLdString(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/**
 * wa.me link for a stored phone number. Numbers are free-form in the DB
 * (local "07…" or international "+962…"); WhatsApp needs digits with country
 * code and no "+". Local numbers starting with a single 0 are assumed
 * Jordanian (962).
 */
export function waPhoneHref(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  else if (digits.startsWith("0")) digits = `962${digits.slice(1)}`;
  return `https://wa.me/${digits}`;
}
