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

/**
 * Premium email masking for Network identity.
 * Rules:
 * 1. Show first 3 characters clearly
 * 2. Replace middle with 6 soft dots
 * 3. Show last char before @
 * 4. Keep @domain intact
 */
export function maskEmail(email: string): string {
  const atIndex = email.indexOf('@');
  if (atIndex === -1) return email;

  const local = email.slice(0, atIndex);
  const domain = email.slice(atIndex); // includes @

  if (local.length <= 2) return email;
  if (local.length <= 4) {
    return local[3] + '•'.repeat(6) + local[local.length - 1] + domain;
  }

  const first = local.slice(0, 3);
  const last = local[local.length - 1];
  return first + '•'.repeat(6) + last + domain;
}
