import { SERVER_ORIGIN } from "./api";

/** Tien chan: "£68". */
const gbpWhole = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** Tien le: "£74.50" — LUON du 2 chu so thap phan. */
const gbpFraction = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Gia hien thi theo GBP — dong nhat voi noi dung London cua landing page.
 *
 * Tien chan hien khong co phan thap phan ("£68"), tien le hien DU 2 chu so
 * ("£74.50"). Khong bao gio de mot chu so thap phan kieu "£74.5" — do la loi
 * trinh bay tien te ai cung nhan ra.
 */
export function formatPrice(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? gbpWhole.format(rounded) : gbpFraction.format(rounded);
}

export const FALLBACK_IMAGE = "/images/placeholder.svg";

/**
 * Chuan hoa imageUrl tu backend thanh URL mo duoc.
 * Backend luu dang "uploads/<uuid>_<ten>.jpg" (khong co dau '/' dau),
 * ham nay ghep dung mot lan, khong lap "uploads/" hay dau '/'.
 */
export function resolveImageUrl(imageUrl: string | null | undefined): string {
  if (!imageUrl || !imageUrl.trim()) return FALLBACK_IMAGE;
  const raw = imageUrl.trim();
  if (/^https?:\/\//i.test(raw) || raw.startsWith("data:")) return raw;
  if (raw.startsWith("/images/")) return raw;
  return `${SERVER_ORIGIN}/${raw.replace(/^\/+/, "")}`;
}
