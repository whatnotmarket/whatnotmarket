import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { ORIGINAL_LANGUAGE } from "@/lib/language-policy";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat(ORIGINAL_LANGUAGE.locale, {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat(ORIGINAL_LANGUAGE.locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}
