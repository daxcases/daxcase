import "server-only";
import { DEFAULT_PRICING, MATERIALS, STORE, type Material, type Pricing } from "./config";
import { PHONES, type PhoneModel } from "./phones";
import { DEFAULT_MARKETING, DEFAULT_OFFERS, type DiscountCode, type Marketing, type Offer } from "./cart";

type Row = Record<string, any>;
type QueryFn = (text: string, params?: unknown[]) => Promise<Row[]>;

declare global {
  // eslint-disable-next-line no-var
  var __dbReady: Promise<QueryFn> | undefined;
}

async function makeQuery(): Promise<QueryFn> {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (url) {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(url);
    return (text, params = []) => sql.query(text, params as any[]) as Promise<Row[]>;
  }
  // Local development fallback: Postgres in WebAssembly, stored in ./.data
  if (process.env.VERCEL) {
    throw new Error("DATABASE_URL is missing. Connect a Neon Postgres database in Vercel → Storage.");
  }
  const { PGlite } = await import("@electric-sql/pglite");
  const fs = await import("fs");
  fs.mkdirSync("./.data", { recursive: true });
  const db = new PGlite("./.data/pg");
  return async (text, params = []) => (await db.query<Row>(text, params as any[])).rows;
}

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    name_sq TEXT NOT NULL,
    name_en TEXT NOT NULL,
    sort INT NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS designs (
    id SERIAL PRIMARY KEY,
    category_id INT REFERENCES categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    image_url TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    featured BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'new',
    lang TEXT NOT NULL DEFAULT 'sq',
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    country TEXT NOT NULL,
    city TEXT NOT NULL,
    address TEXT NOT NULL,
    notes TEXT,
    items JSONB NOT NULL,
    currency TEXT NOT NULL,
    subtotal NUMERIC NOT NULL,
    shipping NUMERIC NOT NULL,
    total NUMERIC NOT NULL
  )`,
  `ALTER TABLE designs ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'design'`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_code TEXT`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount NUMERIC NOT NULL DEFAULT 0`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS offer_label TEXT`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS code TEXT`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS loyalty_discount NUMERIC NOT NULL DEFAULT 0`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS code_discount NUMERIC NOT NULL DEFAULT 0`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ`,
  `CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'editor',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS images (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    data TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL
  )`,
];

const SEED_CATEGORIES = [
  ["patriotike", "Patriotike", "Patriotic", 1],
  ["dashni", "Dashni", "Love", 2],
  ["abstrakte", "Abstrakte", "Abstract", 3],
  ["minimale", "Minimale", "Minimal", 4],
  ["natyre", "Natyrë", "Nature", 5],
] as const;

const SEED_DESIGNS: [string, string, boolean][] = [
  ["patriotike", "Kuq e Zi", true],
  ["patriotike", "Kosova Blue", true],
  ["dashni", "Heart Waves", true],
  ["dashni", "Pink Love", false],
  ["abstrakte", "Blobs", true],
  ["abstrakte", "Waves", false],
  ["minimale", "Lines", true],
  ["minimale", "Dots", false],
  ["natyre", "Sunset", true],
  ["natyre", "Ocean", false],
];

async function init(q: QueryFn) {
  for (const s of SCHEMA) await q(s);
  const [{ count }] = await q("SELECT COUNT(*)::int AS count FROM categories");
  if (count === 0) {
    for (const [slug, sqn, enn, sort] of SEED_CATEGORIES) {
      await q("INSERT INTO categories (slug, name_sq, name_en, sort) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING", [slug, sqn, enn, sort]);
    }
    const cats = await q("SELECT id, slug FROM categories");
    const bySlug = Object.fromEntries(cats.map((c) => [c.slug, c.id]));
    for (const [cat, name, featured] of SEED_DESIGNS) {
      const file = name.toLowerCase().replace(/\s+/g, "-");
      await q("INSERT INTO designs (category_id, name, image_url, featured) VALUES ($1,$2,$3,$4)", [bySlug[cat], name, `/seed/${file}.svg`, featured]);
    }
  }
}

export async function sql(text: string, params?: unknown[]): Promise<Row[]> {
  // One shared promise, so parallel first requests don't open the database twice
  if (!globalThis.__dbReady) {
    globalThis.__dbReady = (async () => {
      const q = await makeQuery();
      await init(q);
      return q;
    })().catch((e) => {
      globalThis.__dbReady = undefined;
      throw e;
    });
  }
  const q = await globalThis.__dbReady;
  return q(text, params);
}

// ─── Typed helpers ───────────────────────────────────────────────────
export type Category = { id: number; slug: string; name_sq: string; name_en: string; sort: number };
export type Design = {
  id: number; category_id: number | null; name: string; image_url: string;
  active: boolean; featured: boolean; created_at: string; category_slug?: string | null;
};

export async function getCategories(): Promise<Category[]> {
  return (await sql("SELECT * FROM categories ORDER BY sort, id")) as Category[];
}

export async function getDesigns(opts: { activeOnly?: boolean; category?: string; featured?: boolean; limit?: number; kind?: "design" | "sticker" } = {}): Promise<Design[]> {
  const where: string[] = [`d.kind = '${opts.kind === "sticker" ? "sticker" : "design"}'`];
  const params: unknown[] = [];
  if (opts.activeOnly !== false) where.push("d.active = TRUE");
  if (opts.category) { params.push(opts.category); where.push(`c.slug = $${params.length}`); }
  if (opts.featured) where.push("d.featured = TRUE");
  const lim = opts.limit ? ` LIMIT ${Math.floor(opts.limit)}` : "";
  return (await sql(
    `SELECT d.*, c.slug AS category_slug FROM designs d LEFT JOIN categories c ON c.id = d.category_id
     ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY d.featured DESC, d.created_at DESC, d.id DESC${lim}`,
    params,
  )) as Design[];
}

async function getJsonSetting<T>(key: string, fallback: T): Promise<T> {
  const rows = await sql("SELECT value FROM settings WHERE key = $1", [key]);
  return rows.length ? (rows[0].value as T) : fallback;
}
async function setJsonSetting(key: string, value: unknown) {
  await sql("INSERT INTO settings (key, value) VALUES ($1, $2::jsonb) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value", [key, JSON.stringify(value)]);
}

// ── OFERTA BOX: pack prices ──
export async function getOffers(): Promise<Offer[]> {
  const list = await getJsonSetting<Offer[]>("offers", DEFAULT_OFFERS);
  return [...list].sort((a, b) => a.qty - b.qty);
}
export const setOffers = (list: Offer[]) => setJsonSetting("offers", list);

// ── Owner password changed from the dashboard ──
// `env` remembers which ADMIN_PASSWORD was in Vercel when it was changed: if the owner later sets a
// different ADMIN_PASSWORD in Vercel (for example after forgetting this one), that one works again.
export type OwnerPassword = { hash: string; env: string };
export const getOwnerPassword = () => getJsonSetting<OwnerPassword | null>("owner_pw", null);
export const setOwnerPassword = (v: OwnerPassword | null) => setJsonSetting("owner_pw", v);

// ── Marketing: welcome discount for email sign-ups, loyalty (every Nth case free) ──
export async function getMarketing(): Promise<Marketing> {
  return { ...DEFAULT_MARKETING, ...(await getJsonSetting<Partial<Marketing>>("marketing", {})) };
}
export const setMarketing = (m: Marketing) => setJsonSetting("marketing", m);

export type Subscriber = { email: string; at: string; used: boolean };
export const getSubscribers = () => getJsonSetting<Subscriber[]>("subscribers", []);
export const setSubscribers = (l: Subscriber[]) => setJsonSetting("subscribers", l);
/** The welcome discount for this email, or 0 when it is unknown, already used, or switched off */
export async function welcomePercentFor(email: string): Promise<number> {
  const m = await getMarketing();
  if (!m.welcomeOn || !email) return 0;
  const s = (await getSubscribers()).find((x) => x.email === email.toLowerCase());
  return s && !s.used ? m.welcomePercent : 0;
}

export type WaitEntry = { id: string; model: string; contact: string; at: string };
export const getWaitlist = () => getJsonSetting<WaitEntry[]>("waitlist", []);
export const setWaitlist = (l: WaitEntry[]) => setJsonSetting("waitlist", l);

export type WholesaleRequest = { id: string; name: string; business: string; phone: string; qty: string; message: string; at: string };
export const getWholesale = () => getJsonSetting<WholesaleRequest[]>("wholesale", []);
export const setWholesale = (l: WholesaleRequest[]) => setJsonSetting("wholesale", l);

/** How many cases this phone number has bought so far (cancelled orders do not count) */
export async function casesBoughtBy(key: string): Promise<number> {
  if (key.length < 8) return 0;
  const [r] = await sql(
    `SELECT COALESCE(SUM((it->>'qty')::int), 0)::int AS n FROM orders, jsonb_array_elements(items) AS it
     WHERE status <> 'cancelled' AND right(regexp_replace(phone, '\\D', '', 'g'), 8) = $1`, [key]);
  return r?.n ?? 0;
}
/** Loyalty: how many of the cases in this order are free for this phone number */
export async function loyaltyFor(key: string, count: number): Promise<{ every: number; have: number; free: number }> {
  const m = await getMarketing();
  if (!m.loyaltyOn || m.loyaltyEvery < 2) return { every: 0, have: 0, free: 0 };
  const prev = await casesBoughtBy(key);
  return { every: m.loyaltyEvery, have: prev % m.loyaltyEvery, free: Math.floor((prev + count) / m.loyaltyEvery) - Math.floor(prev / m.loyaltyEvery) };
}

/** Models that are tracked in stock and have run out (customers can join a waiting list) */
export async function getSoldOutPhones(): Promise<string[]> {
  const [off, stock] = await Promise.all([getDisabledPhones(), getStock()]);
  return Object.keys(stock).filter((id) => stock[id] <= 0 && !off.includes(id));
}

// ── Discount codes ──
export const getCodes = () => getJsonSetting<DiscountCode[]>("codes", []);
export const setCodes = (list: DiscountCode[]) => setJsonSetting("codes", list);
/** The code if it exists and is switched on, otherwise null */
export async function findActiveCode(code: string): Promise<DiscountCode | null> {
  if (!code) return null;
  return (await getCodes()).find((c) => c.code === code && c.active) ?? null;
}

// ── Instagram / TikTok usernames shown on the site ──
export type SocialSettings = { instagram: string; tiktok: string; whatsapp: string };
export async function getSocial(): Promise<SocialSettings> {
  return { instagram: STORE.instagram, tiktok: STORE.tiktok, whatsapp: "", ...(await getJsonSetting<Partial<SocialSettings>>("social", {})) };
}
export const setSocial = (v: SocialSettings) => setJsonSetting("social", v);

// ── Telegram chat that receives a message for every new order ──
export const getTelegramChat = () => getJsonSetting<string>("telegram_chat", "");
export const setTelegramChat = (v: string) => setJsonSetting("telegram_chat", v);

/** Our designs that were ordered most (cancelled orders do not count) */
export async function getBestsellers(limit = 8): Promise<Design[]> {
  const rows = await sql(
    `SELECT d.*, c.slug AS category_slug, s.n FROM (
       SELECT (it->>'designId')::int AS id, SUM((it->>'qty')::int) AS n
       FROM orders, jsonb_array_elements(items) AS it
       WHERE status <> 'cancelled' AND it->>'designId' IS NOT NULL GROUP BY 1
     ) s JOIN designs d ON d.id = s.id AND d.active = TRUE AND d.kind = 'design' LEFT JOIN categories c ON c.id = d.category_id
     ORDER BY s.n DESC, d.id DESC LIMIT ${Math.floor(limit)}`,
  );
  return rows as Design[];
}

// ── Materials: built-in ones plus the ones added in the dashboard ──
export const getCustomMaterials = () => getJsonSetting<Material[]>("materials_custom", []);
export const setCustomMaterials = (list: Material[]) => setJsonSetting("materials_custom", list);
export const getMaterialsOff = () => getJsonSetting<string[]>("materials_off", []);
export const setMaterialsOff = (ids: string[]) => setJsonSetting("materials_off", ids);
export async function getMaterials(): Promise<Material[]> {
  return [...MATERIALS, ...(await getCustomMaterials())];
}
/** Materials customers can choose in the shop */
export async function getActiveMaterials(): Promise<Material[]> {
  const [all, off] = await Promise.all([getMaterials(), getMaterialsOff()]);
  const on = all.filter((m) => !off.includes(m.id));
  return on.length ? on : all.slice(0, 1);
}

export async function getPricing(): Promise<Pricing> {
  const p = await getStoredPricing();
  // every material added later needs a price in every country
  for (const m of await getCustomMaterials()) {
    for (const c of ["KS", "AL", "MK"] as const) if (typeof p[c].prices[m.id] !== "number") p[c].prices[m.id] = p[c].prices.soft;
  }
  return p;
}

async function getStoredPricing(): Promise<Pricing> {
  const rows = await sql("SELECT value FROM settings WHERE key = 'pricing'");
  if (!rows.length) return structuredClone(DEFAULT_PRICING);
  const v = rows[0].value as Partial<Pricing>;
  return {
    KS: { ...DEFAULT_PRICING.KS, ...v.KS, prices: { ...DEFAULT_PRICING.KS.prices, ...v.KS?.prices } },
    AL: { ...DEFAULT_PRICING.AL, ...v.AL, prices: { ...DEFAULT_PRICING.AL.prices, ...v.AL?.prices } },
    MK: { ...DEFAULT_PRICING.MK, ...v.MK, prices: { ...DEFAULT_PRICING.MK.prices, ...v.MK?.prices } },
  };
}

/** Models the owner added in the dashboard */
export async function getCustomPhones(): Promise<PhoneModel[]> {
  const rows = await sql("SELECT value FROM settings WHERE key = 'custom_phones'");
  return Array.isArray(rows[0]?.value) ? (rows[0].value as PhoneModel[]) : [];
}

export async function setCustomPhones(list: PhoneModel[]) {
  await sql(
    "INSERT INTO settings (key, value) VALUES ('custom_phones', $1::jsonb) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
    [JSON.stringify(list)],
  );
}

/** Every model: the ones added in the dashboard first (newest on top), then the built-in list */
export async function getAllPhones(): Promise<PhoneModel[]> {
  return [...(await getCustomPhones()), ...PHONES];
}

/** Ids of phone models the owner has switched off */
export async function getDisabledPhones(): Promise<string[]> {
  const rows = await sql("SELECT value FROM settings WHERE key = 'phones_off'");
  return Array.isArray(rows[0]?.value) ? (rows[0].value as string[]) : [];
}

export async function setDisabledPhones(ids: string[]) {
  await sql(
    "INSERT INTO settings (key, value) VALUES ('phones_off', $1::jsonb) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
    [JSON.stringify(ids)],
  );
}

/** Stock of blank cases per phone model. A model that is not in the list is not tracked. */
export async function getStock(): Promise<Record<string, number>> {
  const rows = await sql("SELECT value FROM settings WHERE key = 'stock'");
  return rows[0]?.value && typeof rows[0].value === "object" ? (rows[0].value as Record<string, number>) : {};
}

export async function setStock(stock: Record<string, number>) {
  await sql(
    "INSERT INTO settings (key, value) VALUES ('stock', $1::jsonb) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
    [JSON.stringify(stock)],
  );
}

/** Adds (or with a negative number, removes) cases of one model. Does nothing if the model is not tracked. */
export async function adjustStock(phoneId: string, delta: number) {
  const stock = await getStock();
  if (typeof stock[phoneId] !== "number") return;
  stock[phoneId] = Math.max(0, stock[phoneId] + delta);
  await setStock(stock);
}

/** Models hidden from the shop: switched off, or tracked with nothing left in stock */
export async function getUnavailablePhones(): Promise<string[]> {
  const [off, stock] = await Promise.all([getDisabledPhones(), getStock()]);
  const out = Object.keys(stock).filter((id) => stock[id] <= 0);
  return [...new Set([...off, ...out])];
}

export async function getNotifyEmail(): Promise<string> {
  const rows = await sql("SELECT value FROM settings WHERE key = 'notify_email'");
  return typeof rows[0]?.value === "string" ? rows[0].value : "";
}

export async function setNotifyEmail(email: string) {
  await sql(
    "INSERT INTO settings (key, value) VALUES ('notify_email', $1::jsonb) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
    [JSON.stringify(email)],
  );
}

export async function savePricing(p: Pricing) {
  await sql(
    "INSERT INTO settings (key, value) VALUES ('pricing', $1::jsonb) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
    [JSON.stringify(p)],
  );
}
