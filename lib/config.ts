// ─── Store settings you may want to change ─────────────────────────────
export const STORE = {
  name: "DAXCASES",
  shortName: "DaxCases",
  // Shown in footer / order confirmation. Leave "" to hide.
  phone: "+383 44 000 000",
  // Instagram and TikTok usernames (without @). The owner can change them in /admin/settings.
  instagram: "daxcases",
  tiktok: "daxcases",
  email: "",
};

export type CountryCode = "KS" | "AL" | "MK";
/** The four looks the case preview can draw */
export type Finish = "soft" | "glossy" | "matte" | "tough";
export type MaterialId = Finish;
export type Material = { id: string; sq: string; en: string; descSq: string; descEn: string; finish: Finish };

export type Pricing = Record<
  CountryCode,
  { prices: Record<string, number>; shipping: number; custom: number }
>;

// Kosovo: a case is 12 € with free shipping; a personalised case costs 3 € more (15 €).
// Albania and North Macedonia: same case price in local currency, plus shipping worth about 2 €.
// The owner can change all of this in /admin/settings.
export const DEFAULT_PRICING: Pricing = {
  KS: { prices: { soft: 12, glossy: 12, matte: 12, tough: 12 }, shipping: 0, custom: 3 },
  AL: { prices: { soft: 1200, glossy: 1200, matte: 1200, tough: 1200 }, shipping: 200, custom: 300 },
  MK: { prices: { soft: 750, glossy: 750, matte: 750, tough: 750 }, shipping: 120, custom: 180 },
};

/** Lowest case price in a country (shipping not included) */
export const fromPrice = (p: Pricing, c: CountryCode) => Math.min(...Object.values(p[c].prices));

export const CURRENCY: Record<CountryCode, { code: string; sq: string; en: string; decimals: number }> = {
  KS: { code: "EUR", sq: "€", en: "€", decimals: 2 },
  AL: { code: "ALL", sq: "Lekë", en: "ALL", decimals: 0 },
  MK: { code: "MKD", sq: "Denarë", en: "MKD", decimals: 0 },
};

export function formatPrice(amount: number, country: CountryCode, lang: "sq" | "en" = "sq") {
  const c = CURRENCY[country];
  const n = new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: c.decimals,
    maximumFractionDigits: c.decimals,
  }).format(amount);
  return `${n} ${c[lang]}`;
}

// Built-in materials. The owner can switch them off or add more in /admin/materials.
export const MATERIALS: Material[] = [
  { id: "soft", sq: "Silikon i butë", en: "Soft silicone", descSq: "I butë në prekje, mbrojtje e përditshme.", descEn: "Soft touch, everyday protection.", finish: "soft" },
  { id: "glossy", sq: "Me shkëlqim", en: "Glossy", descSq: "Ngjyra të gjalla me shkëlqim.", descEn: "Vivid colours with a shiny finish.", finish: "glossy" },
  { id: "matte", sq: "Mat", en: "Matte", descSq: "Pa reflektim, pa shenja gishtash.", descEn: "No glare, no fingerprints.", finish: "matte" },
  { id: "tough", sq: "E fortë (2 shtresa)", en: "Tough (dual layer)", descSq: "Mbrojtje maksimale nga rëniet.", descEn: "Maximum drop protection.", finish: "tough" },
];

export const CASE_COLORS: { id: string; hex: string; sq: string; en: string }[] = [
  { id: "black", hex: "#141416", sq: "E zezë", en: "Black" },
  { id: "white", hex: "#f2f2f2", sq: "E bardhë", en: "White" },
  { id: "clear", hex: "#d7dbe0", sq: "Transparente", en: "Clear" },
  { id: "navy", hex: "#1f2a44", sq: "Blu e errët", en: "Navy" },
  { id: "pink", hex: "#e9b7c3", sq: "Rozë", en: "Pink" },
];
