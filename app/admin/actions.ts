"use server";
import { cookies } from "next/headers";
import { normCode } from "@/lib/cart";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { SESSION_COOKIE, checkPassword, createSessionToken, envPasswordMark, hashPassword, parseSession, toRole, verifyPassword, type Role } from "@/lib/auth";
import { adjustStock, getAllPhones, getCustomMaterials, getMaterials, getMaterialsOff, setCustomMaterials, setMaterialsOff, getCustomPhones, getDisabledPhones, setCustomPhones, getPricing, savePricing, setDisabledPhones, setNotifyEmail, setSocial, setStock, getOffers, setOffers, getCodes, setCodes, setTelegramChat, getOwnerPassword, setOwnerPassword, setMarketing, getWaitlist, setWaitlist, getWholesale, setWholesale, sql } from "@/lib/db";
import { CAMERA_STYLES, PHONES, type PhoneModel } from "@/lib/phones";
import { ALLOWED_IMAGE_TYPES, deleteImage, saveImage } from "@/lib/storage";
import { ORDER_STATUSES } from "@/lib/orders";
import { MATERIALS, type CountryCode, type Finish, type Material, type Pricing } from "@/lib/config";

export type Me = { uid: number; role: Role; name: string };

/** Any signed-in user, including people who only handle shipping. Checks that the account still exists. */
export async function requireStaff(): Promise<Me> {
  const s = parseSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!s) redirect("/admin/login");
  if (s.uid === 0) return { uid: 0, role: "admin", name: "Owner" };
  const [u] = await sql("SELECT name, role FROM users WHERE id = $1", [s.uid]);
  if (!u) redirect("/admin/login");
  return { uid: s.uid, role: toRole(u.role), name: u.name };
}

/** Admins and editors. People with the shipping role are sent to the shipping page. */
export async function requireAdmin(): Promise<Me> {
  const me = await requireStaff();
  if (me.role === "shipper") redirect("/admin/shipping");
  return me;
}

/** Admins only: prices, phone models, users, deleting orders. */
export async function requireOwner(): Promise<Me> {
  const me = await requireAdmin();
  if (me.role !== "admin") redirect("/admin");
  return me;
}

/** The owner's password: the one set in the dashboard, unless ADMIN_PASSWORD in Vercel was changed after it */
async function ownerPasswordOk(pw: string): Promise<boolean> {
  const saved = await getOwnerPassword();
  if (saved && saved.env === envPasswordMark()) return verifyPassword(pw, saved.hash);
  return checkPassword(pw);
}

export async function changeMyPassword(_: unknown, form: FormData) {
  const me = await requireStaff();
  const current = String(form.get("current") || ""), next = String(form.get("next") || ""), again = String(form.get("again") || "");
  if (next.length < 8) return { error: "The new password must be at least 8 characters." };
  if (next !== again) return { error: "The two new passwords do not match." };
  if (me.uid === 0) {
    if (!(await ownerPasswordOk(current))) { await new Promise((r) => setTimeout(r, 600)); return { error: "The current password is wrong." }; }
    await setOwnerPassword({ hash: hashPassword(next), env: envPasswordMark() });
  } else {
    const [u] = await sql("SELECT password_hash FROM users WHERE id = $1", [me.uid]);
    if (!u || !verifyPassword(current, u.password_hash)) { await new Promise((r) => setTimeout(r, 600)); return { error: "The current password is wrong." }; }
    await sql("UPDATE users SET password_hash = $1 WHERE id = $2", [hashPassword(next), me.uid]);
  }
  return { ok: Date.now() };
}

export async function login(_: unknown, form: FormData) {
  const email = String(form.get("email") || "").trim().toLowerCase();
  const pw = String(form.get("password") || "");
  let uid = -1, role: Role = "editor";
  if (!email) {
    if (await ownerPasswordOk(pw)) { uid = 0; role = "admin"; }
  } else {
    const [u] = await sql("SELECT id, password_hash, role FROM users WHERE email = $1", [email]);
    if (u && verifyPassword(pw, u.password_hash)) { uid = u.id; role = toRole(u.role); }
  }
  if (uid < 0) {
    await new Promise((r) => setTimeout(r, 600));
    return { email, error: email || process.env.ADMIN_PASSWORD || process.env.NODE_ENV !== "production" ? "Wrong email or password." : "ADMIN_PASSWORD is not set in Vercel → Settings → Environment Variables." };
  }
  const { token, maxAge } = createSessionToken(uid, role);
  (await cookies()).set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge });
  redirect(role === "shipper" ? "/admin/shipping" : "/admin");
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/admin/login");
}

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "category";

// ── Categories ──────────────────────────────────────────
export async function addCategory(form: FormData) {
  await requireAdmin();
  const sq = String(form.get("name_sq") || "").trim();
  const en = String(form.get("name_en") || "").trim() || sq;
  if (!sq) return;
  let slug = slugify(en);
  const exists = await sql("SELECT 1 FROM categories WHERE slug = $1", [slug]);
  if (exists.length) slug += "-" + Date.now().toString(36).slice(-4);
  const [{ max }] = await sql("SELECT COALESCE(MAX(sort),0)::int AS max FROM categories");
  await sql("INSERT INTO categories (slug, name_sq, name_en, sort) VALUES ($1,$2,$3,$4)", [slug, sq, en, max + 1]);
  revalidatePath("/", "layout");
}

export async function updateCategory(form: FormData) {
  await requireAdmin();
  const id = Number(form.get("id"));
  const sq = String(form.get("name_sq") || "").trim();
  const en = String(form.get("name_en") || "").trim() || sq;
  const sort = Number(form.get("sort")) || 0;
  if (!id || !sq) return;
  await sql("UPDATE categories SET name_sq=$1, name_en=$2, sort=$3 WHERE id=$4", [sq, en, sort, id]);
  revalidatePath("/", "layout");
}

export async function deleteCategory(form: FormData) {
  await requireAdmin();
  await sql("DELETE FROM categories WHERE id=$1", [Number(form.get("id"))]);
  revalidatePath("/", "layout");
}

// ── Designs ─────────────────────────────────────────────
export async function addDesign(_: unknown, form: FormData) {
  await requireAdmin();
  const name = String(form.get("name") || "").trim();
  const file = form.get("image") as File | null;
  const cat = Number(form.get("category_id")) || null;
  if (!name) return { error: "Please enter a name." };
  if (!file || file.size === 0) return { error: "Please choose an image." };
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return { error: "Use a PNG, JPG, WEBP or SVG image." };
  if (file.size > 4 * 1024 * 1024) return { error: "Image is too large (max 4 MB)." };
  try {
    const url = await saveImage(file, file.type, "designs");
    const kind = form.get("kind") === "sticker" ? "sticker" : "design";
    await sql("INSERT INTO designs (category_id, name, image_url, featured, kind) VALUES ($1,$2,$3,$4,$5)", [kind === "sticker" ? null : cat, name, url, kind === "design" && form.get("featured") === "on", kind]);
  } catch (e: any) {
    return { error: e?.message || "Upload failed." };
  }
  revalidatePath("/", "layout");
  return { ok: Date.now() };
}

export async function updateDesign(form: FormData) {
  await requireAdmin();
  const id = Number(form.get("id"));
  const field = String(form.get("field"));
  if (field === "active" || field === "featured") {
    await sql(`UPDATE designs SET ${field} = NOT ${field} WHERE id=$1`, [id]);
  } else if (field === "category") {
    await sql("UPDATE designs SET category_id=$1 WHERE id=$2", [Number(form.get("category_id")) || null, id]);
  } else if (field === "name") {
    const name = String(form.get("name") || "").trim();
    if (name) await sql("UPDATE designs SET name=$1 WHERE id=$2", [name, id]);
  }
  revalidatePath("/", "layout");
}

export async function deleteDesign(form: FormData) {
  await requireAdmin();
  const rows = await sql("DELETE FROM designs WHERE id=$1 RETURNING image_url", [Number(form.get("id"))]);
  if (rows[0]) await deleteImage(rows[0].image_url);
  revalidatePath("/", "layout");
}

// ── Orders ──────────────────────────────────────────────

/** Changes a status and keeps stock right: cancelling puts the cases back, un-cancelling takes them again. */
async function changeStatus(id: string, status: string, tracking?: string) {
  const [o] = await sql("SELECT status, items FROM orders WHERE id = $1", [id]);
  if (!o) return;
  const sets = ["status = $1"];
  const params: unknown[] = [status];
  if (tracking !== undefined) { params.push(tracking || null); sets.push(`tracking_code = $${params.length}`); }
  if (status === "shipped" && o.status !== "shipped") sets.push("shipped_at = NOW()");
  params.push(id);
  await sql(`UPDATE orders SET ${sets.join(", ")} WHERE id = $${params.length}`, params);
  const wasOut = o.status === "cancelled", isOut = status === "cancelled";
  if (wasOut !== isOut) for (const it of o.items ?? []) await adjustStock(it.phoneId, isOut ? it.qty : -it.qty);
}

export async function setOrderStatus(form: FormData) {
  await requireAdmin();
  const status = String(form.get("status"));
  if (!ORDER_STATUSES.includes(status)) return;
  await changeStatus(String(form.get("id")), status);
  revalidatePath("/admin", "layout");
}

export async function deleteOrder(form: FormData) {
  await requireOwner();
  const rows = await sql("DELETE FROM orders WHERE id=$1 RETURNING items", [String(form.get("id"))]);
  for (const it of rows[0]?.items ?? []) { await deleteImage(it.printUrl); await deleteImage(it.previewUrl); }
  revalidatePath("/admin", "layout");
  redirect("/admin");
}

// ── Prices ──────────────────────────────────────────────
export async function updatePricing(form: FormData) {
  await requireOwner();
  const p: Pricing = await getPricing();
  const allMaterials = await getMaterials();
  (["KS", "AL", "MK"] as CountryCode[]).forEach((c) => {
    allMaterials.forEach((m) => {
      const v = Number(form.get(`${c}_${m.id}`));
      if (Number.isFinite(v) && v >= 0) p[c].prices[m.id] = v;
    });
    const cu = Number(form.get(`${c}_custom`));
    if (Number.isFinite(cu) && cu >= 0) p[c].custom = cu;
    const s = Number(form.get(`${c}_shipping`));
    if (Number.isFinite(s) && s >= 0) p[c].shipping = s;
  });
  await savePricing(p);
  revalidatePath("/", "layout");
  redirect("/admin/settings?saved=1");
}

// ── Phone models on / off ───────────────────────────────
export async function togglePhone(form: FormData) {
  await requireOwner();
  const id = String(form.get("id"));
  const all = await getAllPhones();
  if (!all.some((p) => p.id === id)) return;
  const off = await getDisabledPhones();
  const next = off.includes(id) ? off.filter((x) => x !== id) : [...off, id];
  if (next.length >= all.length) return; // keep at least one model on
  await setDisabledPhones(next);
  revalidatePath("/", "layout");
}

export async function setBrandPhones(form: FormData) {
  await requireOwner();
  const brand = String(form.get("brand"));
  const on = form.get("on") === "1";
  const all = await getAllPhones();
  const ids = all.filter((p) => p.brand === brand).map((p) => p.id);
  const off = (await getDisabledPhones()).filter((x) => !ids.includes(x));
  const next = on ? off : [...off, ...ids];
  if (next.length >= all.length) return;
  await setDisabledPhones(next);
  revalidatePath("/", "layout");
}

// ── Users (admins and editors) ──────────────────────────
export async function addUser(_: unknown, form: FormData) {
  await requireOwner();
  const name = String(form.get("name") || "").trim().slice(0, 80);
  const email = String(form.get("email") || "").trim().toLowerCase().slice(0, 120);
  const pw = String(form.get("password") || "");
  const role = toRole(form.get("role"));
  if (!name) return { error: "Please enter a name." };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: "Please enter a valid email." };
  if (pw.length < 8) return { error: "Password must be at least 8 characters." };
  const exists = await sql("SELECT 1 FROM users WHERE email = $1", [email]);
  if (exists.length) return { error: "A user with this email already exists." };
  await sql("INSERT INTO users (name, email, password_hash, role) VALUES ($1,$2,$3,$4)", [name, email, hashPassword(pw), role]);
  revalidatePath("/admin/users");
  return { ok: Date.now() };
}

export async function setUserRole(form: FormData) {
  const me = await requireOwner();
  const id = Number(form.get("id"));
  if (id === me.uid) return; // you can't change your own role
  await sql("UPDATE users SET role = $1 WHERE id = $2", [toRole(form.get("role")), id]);
  revalidatePath("/admin/users");
}

export async function setUserPassword(form: FormData) {
  await requireOwner();
  const pw = String(form.get("password") || "");
  if (pw.length < 8) return;
  await sql("UPDATE users SET password_hash = $1 WHERE id = $2", [hashPassword(pw), Number(form.get("id"))]);
  revalidatePath("/admin/users");
}

export async function deleteUser(form: FormData) {
  const me = await requireOwner();
  const id = Number(form.get("id"));
  if (id === me.uid) return;
  await sql("DELETE FROM users WHERE id = $1", [id]);
  revalidatePath("/admin/users");
}

// ── Shipping desk ───────────────────────────────────────
/** Moves every ticked order to "shipped" and saves the post code typed next to it. */
export async function shipSelected(form: FormData) {
  await requireStaff();
  const ids = form.getAll("ids").map(String).slice(0, 200);
  for (const id of ids) {
    const code = String(form.get(`tracking_${id}`) || "").trim().slice(0, 60);
    await changeStatus(id, "shipped", code);
  }
  revalidatePath("/admin", "layout");
  redirect(`/admin/shipping?shipped=${ids.length}`);
}

export async function saveTracking(form: FormData) {
  await requireStaff();
  const code = String(form.get("tracking") || "").trim().slice(0, 60);
  await sql("UPDATE orders SET tracking_code = $1 WHERE id = $2", [code || null, String(form.get("id"))]);
  revalidatePath("/admin", "layout");
}

export async function markDelivered(form: FormData) {
  await requireStaff();
  await changeStatus(String(form.get("id")), "delivered");
  revalidatePath("/admin", "layout");
}

export async function saveStock(form: FormData) {
  await requireStaff();
  const stock: Record<string, number> = {};
  for (const p of await getAllPhones()) {
    const raw = String(form.get(`stock_${p.id}`) ?? "").trim();
    if (raw === "") continue; // empty = not tracked
    const n = Math.floor(Number(raw));
    if (Number.isFinite(n) && n >= 0) stock[p.id] = n;
  }
  await setStock(stock);
  revalidatePath("/", "layout");
  redirect("/admin/shipping?saved=1#stock");
}

export async function updateNotifyEmail(form: FormData) {
  await requireOwner();
  const email = String(form.get("email") || "").trim().slice(0, 300);
  if (email && !email.split(",").every((e) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e.trim()))) redirect("/admin/settings?email=bad");
  await setNotifyEmail(email);
  redirect("/admin/settings?email=saved");
}

// ── Adding new phone models ─────────────────────────────
export async function addPhone(_: unknown, form: FormData) {
  await requireOwner();
  const name = String(form.get("name") || "").trim().slice(0, 60);
  const brand = form.get("brand") === "samsung" ? "samsung" : "apple";
  const w = Number(form.get("w")), h = Number(form.get("h"));
  const camera = CAMERA_STYLES.find((c) => c.id === form.get("camera"))?.id;
  if (!name) return { error: "Please enter the model name." };
  if (!(w >= 55 && w <= 95) || !(h >= 120 && h <= 185)) return { error: "Width must be 55–95 mm and height 120–185 mm (see the phone's specs)." };
  if (!camera) return { error: "Please choose a camera style." };
  const all = await getAllPhones();
  if (all.some((p) => p.name.toLowerCase() === name.toLowerCase())) return { error: "A model with this name already exists." };
  const base = name.toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "model";
  const model: PhoneModel = { id: `c-${base}-${Date.now().toString(36)}`, brand, name, w, h, r: brand === "apple" ? Math.round(w * 1.6) / 10 : Math.round(w * 1.3) / 10, camera };
  await setCustomPhones([model, ...(await getCustomPhones())]);
  revalidatePath("/", "layout");
  return { ok: Date.now() };
}

export async function deletePhone(form: FormData) {
  await requireOwner();
  const id = String(form.get("id"));
  await setCustomPhones((await getCustomPhones()).filter((p) => p.id !== id));
  await setDisabledPhones((await getDisabledPhones()).filter((x) => x !== id));
  revalidatePath("/", "layout");
}

// ── Materials: on / off, add, delete ────────────────────
export async function toggleMaterial(form: FormData) {
  await requireOwner();
  const id = String(form.get("id"));
  const all = await getMaterials();
  if (!all.some((m) => m.id === id)) return;
  const off = await getMaterialsOff();
  const next = off.includes(id) ? off.filter((x) => x !== id) : [...off, id];
  if (next.length >= all.length) return; // keep at least one material on
  await setMaterialsOff(next);
  revalidatePath("/", "layout");
}

export async function addMaterial(_: unknown, form: FormData) {
  await requireOwner();
  const g = (k: string, n: number) => String(form.get(k) || "").trim().slice(0, n);
  const sq = g("sq", 50), en = g("en", 50) || sq;
  const finish = (["soft", "glossy", "matte", "tough"] as Finish[]).find((f) => f === form.get("finish")) ?? "glossy";
  if (!sq) return { error: "Please enter the material name." };
  const all = await getMaterials();
  if (all.some((m) => m.sq.toLowerCase() === sq.toLowerCase() || m.en.toLowerCase() === en.toLowerCase())) return { error: "A material with this name already exists." };
  const m: Material = { id: `m-${Date.now().toString(36)}`, sq, en, descSq: g("descSq", 120), descEn: g("descEn", 120) || g("descSq", 120), finish };
  const p = await getPricing();
  for (const c of ["KS", "AL", "MK"] as CountryCode[]) {
    const v = Number(form.get(`price_${c}`));
    p[c].prices[m.id] = Number.isFinite(v) && v > 0 ? v : p[c].prices.soft;
  }
  await setCustomMaterials([...(await getCustomMaterials()), m]);
  await savePricing(p);
  revalidatePath("/", "layout");
  return { ok: Date.now() };
}

export async function deleteMaterial(form: FormData) {
  await requireOwner();
  const id = String(form.get("id"));
  if (MATERIALS.some((m) => m.id === id)) return; // built-in ones can only be switched off
  await setCustomMaterials((await getCustomMaterials()).filter((m) => m.id !== id));
  await setMaterialsOff((await getMaterialsOff()).filter((x) => x !== id));
  revalidatePath("/", "layout");
}

// ── Instagram / TikTok ──────────────────────────────────
const cleanHandle = (v: unknown) =>
  String(v || "").trim().replace(/^https?:\/\/(www\.)?(instagram|tiktok)\.com\//i, "").replace(/^@/, "").replace(/[/?#].*$/, "").replace(/[^A-Za-z0-9._]/g, "").slice(0, 40);

export async function updateSocial(form: FormData) {
  await requireOwner();
  await setSocial({ instagram: cleanHandle(form.get("instagram")), tiktok: cleanHandle(form.get("tiktok")), whatsapp: String(form.get("whatsapp") || "").replace(/\D/g, "").slice(0, 15) });
  revalidatePath("/", "layout");
  redirect("/admin/settings?social=saved");
}

// ── OFERTA BOX ──────────────────────────────────────────
export async function saveOffer(form: FormData) {
  await requireOwner();
  const qty = Math.floor(Number(form.get("qty")));
  const prices = { KS: Number(form.get("KS")), AL: Number(form.get("AL")), MK: Number(form.get("MK")) };
  if (!(qty >= 2 && qty <= 12) || Object.values(prices).some((v) => !Number.isFinite(v) || v <= 0)) redirect("/admin/offers?error=1");
  const id = String(form.get("id") || "") || `box-${Date.now().toString(36)}`;
  const list = (await getOffers()).filter((o) => o.id !== id && o.qty !== qty);
  await setOffers([...list, { id, qty, prices }]);
  revalidatePath("/", "layout");
  redirect("/admin/offers?saved=1");
}

export async function deleteOffer(form: FormData) {
  await requireOwner();
  await setOffers((await getOffers()).filter((o) => o.id !== String(form.get("id"))));
  revalidatePath("/", "layout");
}

// ── Discount codes ──────────────────────────────────────
export async function addCode(form: FormData) {
  await requireOwner();
  const code = normCode(form.get("code"));
  const percent = Math.round(Number(form.get("percent")));
  if (code.length < 3 || !(percent >= 1 && percent <= 100)) redirect("/admin/offers?codeError=1#codes");
  const list = (await getCodes()).filter((c) => c.code !== code);
  await setCodes([...list, { code, percent, active: true, used: 0 }]);
  redirect("/admin/offers?codeSaved=1#codes");
}

export async function toggleCode(form: FormData) {
  await requireOwner();
  const code = String(form.get("code"));
  await setCodes((await getCodes()).map((c) => (c.code === code ? { ...c, active: !c.active } : c)));
  revalidatePath("/admin/offers");
}

export async function deleteCode(form: FormData) {
  await requireOwner();
  await setCodes((await getCodes()).filter((c) => c.code !== String(form.get("code"))));
  revalidatePath("/admin/offers");
}

// ── Telegram notifications ──────────────────────────────
export async function updateTelegram(form: FormData) {
  await requireOwner();
  await setTelegramChat(String(form.get("chat") || "").trim().replace(/[^0-9@A-Za-z_-]/g, "").slice(0, 40));
  redirect("/admin/settings?tg=saved");
}

export async function testTelegram() {
  await requireOwner();
  const { sendTelegram } = await import("@/lib/notify");
  const ok = await sendTelegram("✅ DAXCASES: njoftimet për porositë janë aktive.").catch(() => false);
  redirect(`/admin/settings?tg=${ok ? "sent" : "failed"}`);
}

// ── Marketing: welcome discount, loyalty, waiting list, bulk requests ──
export async function updateMarketing(form: FormData) {
  await requireOwner();
  const pc = Math.round(Number(form.get("welcomePercent"))), ev = Math.round(Number(form.get("loyaltyEvery")));
  await setMarketing({
    welcomeOn: form.get("welcomeOn") === "on", welcomePercent: pc >= 1 && pc <= 90 ? pc : 10,
    loyaltyOn: form.get("loyaltyOn") === "on", loyaltyEvery: ev >= 2 && ev <= 50 ? ev : 5,
  });
  revalidatePath("/", "layout");
  redirect("/admin/marketing?saved=1");
}

export async function deleteWait(form: FormData) {
  await requireOwner();
  await setWaitlist((await getWaitlist()).filter((w) => w.id !== String(form.get("id"))));
  revalidatePath("/admin/marketing");
}

export async function deleteWholesale(form: FormData) {
  await requireOwner();
  await setWholesale((await getWholesale()).filter((w) => w.id !== String(form.get("id"))));
  revalidatePath("/admin/marketing");
}
