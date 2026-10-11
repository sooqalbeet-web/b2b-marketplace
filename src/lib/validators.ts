import { HttpError } from "@/lib/guards";

// The platform uses Latin digits (0-9) only. Arabic-Indic digits are rejected, never silently converted,
// so every stored phone / registry / tax number is in one canonical form.
function assertLatin(s: string) {
  if (/[٠-٩۰-۹]/.test(s)) throw new HttpError(400, "Use Latin digits (0-9) only.");
}

/** Mobile number: digits with optional leading + / 00 country code, 8-15 digits. */
export function normalizeMobile(raw: unknown): string {
  const s = String(raw ?? "").trim();
  if (!s) throw new HttpError(400, "Mobile phone number is required.");
  assertLatin(s);
  let v = s.replace(/[\s\-().]/g, "");
  if (v.startsWith("00")) v = "+" + v.slice(2);
  if (!/^\+?\d{8,15}$/.test(v)) {
    throw new HttpError(400, "Invalid mobile phone number. Use digits with an optional country code, e.g. +962791234567.");
  }
  return v;
}

/** Commercial / industrial registration number: spaces removed, upper-case, so "ab 12" and "AB12" collide. */
export function normalizeRegNo(raw: unknown): string {
  const s = String(raw ?? "");
  if (!s.trim()) throw new HttpError(400, "Commercial registration number is required.");
  assertLatin(s);
  const v = s.replace(/\s+/g, "").toUpperCase();
  if (!/^[A-Z0-9\-\/]{3,30}$/.test(v)) throw new HttpError(400, "Invalid commercial registration number.");
  return v;
}

export function normalizeTaxNo(raw: unknown): string {
  const s = String(raw ?? "");
  if (!s.trim()) throw new HttpError(400, "Tax number is required.");
  assertLatin(s);
  const v = s.replace(/[\s\-]/g, "").toUpperCase();
  if (!/^[A-Z0-9]{4,20}$/.test(v)) throw new HttpError(400, "Invalid tax number.");
  return v;
}

/** 6-digit email verification code, Latin digits only. */
export function parseCode(raw: unknown): string {
  const v = String(raw ?? "").trim();
  if (!/^[0-9]{6}$/.test(v)) throw new HttpError(400, "Verification code must be 6 digits (Latin 0-9).");
  return v;
}
