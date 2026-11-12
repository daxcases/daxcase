import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";

export type Role = "admin" | "editor" | "shipper";
export const toRole = (r: unknown): Role => (r === "admin" || r === "shipper" ? r : "editor");
export type Session = { uid: number; role: Role };

export const SESSION_COOKIE = "dax_admin";
const MAX_AGE = 60 * 60 * 24 * 14; // 14 days

function secret() {
  return process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || "dev-secret-change-me";
}

export function adminPassword(): string | null {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD;
  return process.env.NODE_ENV === "production" ? null : "admin";
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("hex");
}

/** uid 0 = the owner (logs in with ADMIN_PASSWORD); other ids are rows in the users table */
export function createSessionToken(uid: number, role: Role) {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE;
  const body = `${exp}.${uid}.${role}`;
  return { token: `${body}.${sign(body)}`, maxAge: MAX_AGE };
}

export function parseSession(token: string | undefined | null): Session | null {
  if (!token) return null;
  const [exp, uid, role, sig] = token.split(".");
  if (!exp || !sig || Number(exp) < Date.now() / 1000) return null;
  if (role !== "admin" && role !== "editor" && role !== "shipper") return null;
  const expected = Buffer.from(sign(`${exp}.${uid}.${role}`));
  const got = Buffer.from(sig);
  if (expected.length !== got.length || !timingSafeEqual(expected, got)) return null;
  return { uid: Number(uid), role };
}

export const verifySessionToken = (token: string | undefined | null) => parseSession(token) !== null;

export function hashPassword(pw: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(pw, salt, 64).toString("hex")}`;
}

export function verifyPassword(pw: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const a = Buffer.from(hash, "hex");
  const b = scryptSync(pw, salt, 64);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** A fingerprint of the ADMIN_PASSWORD currently set in the environment (never the password itself) */
export function envPasswordMark() {
  return createHmac("sha256", "env-mark").update(adminPassword() ?? "").digest("hex").slice(0, 24);
}

export function checkPassword(input: string) {
  const pw = adminPassword();
  if (!pw) return false;
  const a = Buffer.from(createHmac("sha256", "cmp").update(input).digest("hex"));
  const b = Buffer.from(createHmac("sha256", "cmp").update(pw).digest("hex"));
  return timingSafeEqual(a, b);
}
