import type { CountryCode, Pricing } from "./config";

/** OFERTA BOX: a fixed price for a pack of cases, e.g. 2 cases for 22 € */
export type Offer = { id: string; qty: number; prices: Record<CountryCode, number> };
export type CartLine = { material: string; custom: boolean; qty: number };
export const CART_KEY = "dax-cart";
/** Two phone numbers are the same customer when their last 8 digits match */
export const phoneKey = (p: unknown) => String(p ?? "").replace(/\D/g, "").slice(-8);
export type Marketing = { welcomeOn: boolean; welcomePercent: number; loyaltyOn: boolean; loyaltyEvery: number };
export const DEFAULT_MARKETING: Marketing = { welcomeOn: true, welcomePercent: 10, loyaltyOn: true, loyaltyEvery: 5 };
export const MAX_CART_ITEMS = 12;

export const DEFAULT_OFFERS: Offer[] = [
  { id: "box2", qty: 2, prices: { KS: 22, AL: 2200, MK: 1380 } },
  { id: "box3", qty: 3, prices: { KS: 30, AL: 3000, MK: 1880 } },
  { id: "box4", qty: 4, prices: { KS: 38, AL: 3800, MK: 2380 } },
];

/** A code the owner creates; the customer types it in the basket for a percentage off */
export type DiscountCode = { code: string; percent: number; active: boolean; used: number };
export const normCode = (v: unknown) => String(v ?? "").trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 24);

/**
 * Works out what a basket costs. Used by the shop (to show prices) and by the server (to charge),
 * so both always agree.
 *
 * OFERTA BOX is the customer's choice: only the box they picked (offerId) is used, and only once
 * the basket holds at least that many cases. Its price replaces the normal price of that many
 * cases (the most expensive ones first); extra cases pay the normal price.
 * Loyalty: `freeUnits` cases are free (the cheapest ones).
 * The personalisation fee is added per personalised case. A discount code then takes its
 * percentage off the cases (not off shipping). Shipping is added once per order.
 */
export function priceCart(
  lines: CartLine[], pricing: Pricing, offers: Offer[], country: CountryCode,
  opts: { offerId?: string | null; percent?: number; freeUnits?: number } = {},
) {
  const p = pricing[country];
  const round = (n: number) => (country === "KS" ? Math.round(n * 100) / 100 : Math.round(n));
  const units: number[] = [];
  let customFee = 0;
  for (const l of lines) {
    const base = p.prices[l.material] ?? p.prices.soft ?? 0;
    for (let i = 0; i < l.qty; i++) units.push(base);
    if (l.custom) customFee += p.custom * l.qty;
  }
  const count = units.length;
  const full = units.reduce((a, b) => a + b, 0) + customFee;
  units.sort((a, b) => b - a);
  const chosen = offers.find((o) => o.id === opts.offerId && o.qty >= 2) ?? null;
  let offer: Offer | null = null;
  let discount = 0;
  if (chosen && count >= chosen.qty) {
    const covered = units.slice(0, chosen.qty).reduce((a, b) => a + b, 0);
    const d = covered - (chosen.prices[country] ?? Infinity);
    if (d > 0) { offer = chosen; discount = d; }
  }
  const freeUnits = Math.min(count, Math.max(0, Math.floor(opts.freeUnits ?? 0)));
  const loyaltyDiscount = Math.min(full - discount, freeUnits ? units.slice(count - freeUnits).reduce((a, b) => a + b, 0) : 0);
  const percent = Math.min(100, Math.max(0, opts.percent ?? 0));
  const codeDiscount = round(((full - discount - loyaltyDiscount) * percent) / 100);
  const subtotal = round(full - discount - loyaltyDiscount - codeDiscount);
  return {
    count, full, customFee, chosen, missing: chosen ? Math.max(0, chosen.qty - count) : 0, offer, discount,
    freeUnits, loyaltyDiscount, percent, codeDiscount, subtotal, shipping: count ? p.shipping : 0, total: count ? subtotal + p.shipping : 0,
  };
}
