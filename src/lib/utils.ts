import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(num: number): string {
  if (num < 1000) return num.toString();
  if (num < 1_000_000) {
    const val = num / 1000;
    return `${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1).replace(/\.0$/, '')}K`;
  }
  const val = num / 1_000_000;
  return `${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1).replace(/\.0$/, '')}M`;
}
