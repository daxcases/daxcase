import { NextResponse } from "next/server";
import { randomInt } from "crypto";
import { adjustStock, loyaltyFor, welcomePercentFor, getSubscribers, setSubscribers, findActiveCode, getCodes, setCodes, getActiveMaterials, getAllPhones, getOffers, getUnavailablePhones, getPricing, sql } from "@/lib/db";
import { sendOrderEmail } from "@/lib/email";
import { sendTelegram } from "@/lib/notify";
import { isOwnImageUrl } from "@/lib/storage";
import { MAX_CART_ITEMS, normCode, phoneKey, priceCart } from "@/lib/cart";
import { CASE_COLORS, CURRENCY, type CountryCode } from "@/lib/config";
import { isValidCity } from "@/lib/locations";

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const newId = () => "DX-" + Array.from({ length: 6 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
const bad = (error: string) => NextResponse.json({ error }, { status: 400 });

export async function POST(req: Request) {
  let b: any;
  try { b = await req.json(); } catch { return bad("bad_request"); }

  const country = b.country as CountryCode;
  if (!["KS", "AL", "MK"].includes(country)) return bad("country");
  const city = clean(b.city, 120);
  if (!isValidCity(country, city)) return bad("city");

  const firstName = clean(b.firstName, 60), lastName = clean(b.lastName, 60);
  const phone = clean(b.phone, 30), address = clean(b.address, 300);
  const email = clean(b.email, 120), notes = clean(b.notes, 500);
  if (!firstName || !lastName || !address) return bad("required");
  if (phone.replace(/\D/g, "").length < 8) return bad("phone");

  // One order can hold several cases
  const raw: any[] = Array.isArray(b.items) ? b.items.slice(0, MAX_CART_ITEMS) : [];
  if (!raw.length) return bad("empty");
  const [phones, unavailable, materials, pricing, offers] = await Promise.all([
    getAllPhones(), getUnavailablePhones(), getActiveMaterials(), getPricing(), getOffers(),
  ]);

  const items = [];
  for (const r of raw) {
    const model = phones.find((p) => p.id === r?.phoneId);
    if (!model) return bad("item");
    if (unavailable.includes(model.id)) return bad("model_off");
    const mat = materials.find((m) => m.id === r.material);
    const color = CASE_COLORS.find((c) => c.hex === r.caseColor);
    if (!mat || !color) return bad("item");
    if (!isOwnImageUrl(r.printUrl) || !isOwnImageUrl(r.previewUrl)) return bad("image");
    const qty = Math.min(10, Math.max(1, Math.floor(Number(r.qty) || 1)));
    // A case counts as "regular" only when it uses one of our designs with nothing added
    const designId = Number.isInteger(r.designId) ? (r.designId as number) : null;
    const designOk = designId !== null && (await sql("SELECT 1 FROM designs WHERE id = $1", [designId])).length > 0;
    const custom = r.custom !== false || !designOk;
    items.push({
      phoneId: model.id, phoneName: model.name, material: mat.id, materialName: mat.en, materialNameSq: mat.sq,
      caseColor: color.id, qty, custom, unitPrice: pricing[country].prices[mat.id] + (custom ? pricing[country].custom : 0),
      printUrl: r.printUrl as string, previewUrl: r.previewUrl as string, designId, designName: clean(r.designName, 120) || null,
    });
  }

  // Prices are always calculated on the server, with the same rules the basket shows
  // The box is the customer's choice; the code must exist and be switched on
  const code = await findActiveCode(normCode(b.code));
  // Welcome discount for an email that signed up in the pop-up (once per email); the bigger of the two percentages counts
  const welcomeEmail = clean(b.welcome, 120).toLowerCase();
  const welcome = await welcomePercentFor(welcomeEmail);
  const useWelcome = welcome > (code?.percent ?? 0);
  // Loyalty: every Nth case this phone number buys is free
  const loyal = await loyaltyFor(phoneKey(phone), items.reduce((a, i) => a + i.qty, 0));
  const tot = priceCart(items, pricing, offers, country, {
    offerId: typeof b.offerId === "string" ? b.offerId : null, percent: Math.max(code?.percent ?? 0, welcome), freeUnits: loyal.free,
  });
  const codeLabel = tot.codeDiscount > 0 ? (useWelcome ? "WELCOME" : code?.code ?? null) : null;
  const offerLabel = tot.offer ? `OFERTA BOX ${tot.offer.qty}` : null;

  const id = newId();
  await sql(
    `INSERT INTO orders (id, lang, first_name, last_name, phone, email, country, city, address, notes, items, currency, subtotal, shipping, total, discount, offer_label, code, code_discount, loyalty_discount)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12,$13,$14,$15,$16,$17,$18,$19,$20)`,
    [id, b.lang === "en" ? "en" : "sq", firstName, lastName, phone, email || null, country, city, address, notes || null,
      JSON.stringify(items), CURRENCY[country].code, tot.subtotal, tot.shipping, tot.total, tot.discount, offerLabel, codeLabel, tot.codeDiscount, tot.loyaltyDiscount],
  );
  for (const it of items) await adjustStock(it.phoneId, -it.qty).catch(() => {});
  if (useWelcome && tot.codeDiscount > 0) await setSubscribers((await getSubscribers()).map((s) => (s.email === welcomeEmail ? { ...s, used: true } : s))).catch(() => {});
  if (code && !useWelcome) await setCodes((await getCodes()).map((c) => (c.code === code.code ? { ...c, used: (c.used ?? 0) + 1 } : c))).catch(() => {});
  // Email the order to the shop. A failed email never blocks the order.
  await sendOrderEmail(
    { id, firstName, lastName, phone, email, country, city, address, notes, items, offerLabel, discount: tot.discount, code: codeLabel, codeDiscount: tot.codeDiscount, subtotal: tot.subtotal, shipping: tot.shipping, total: tot.total },
    new URL(req.url).origin,
  ).catch((e) => console.error("order email failed", e));
  await sendTelegram(
    [`🛒 Porosi e re ${id}`, `${firstName} ${lastName} · ${phone}`, `${city} · ${address}`, ...items.map((i) => `• ${i.phoneName} × ${i.qty} (${i.materialNameSq}${i.custom ? ", i personalizuar" : i.designName ? ", " + i.designName : ""})`),
      offerLabel ?? "", codeLabel ? `Kodi ${codeLabel}` : "", tot.loyaltyDiscount > 0 ? `Besnikëri: ${loyal.free} falas` : "", `Për pagesë: ${tot.total} ${CURRENCY[country].sq}`, `${new URL(req.url).origin}/admin/orders/${id}`].filter(Boolean).join("\n"),
  ).catch((e) => console.error("telegram failed", e));
  return NextResponse.json({ id, total: tot.total });
}
