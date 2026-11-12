import "server-only";
import { randomUUID } from "crypto";

const EXT: Record<string, string> = {
  "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/svg+xml": "svg", "image/gif": "gif",
};
export const ALLOWED_IMAGE_TYPES = Object.keys(EXT);

/**
 * Images are stored in one of four places, tried in this order:
 *  1. Vercel Blob, public store   → https://….public.blob.vercel-storage.com/…
 *  2. Vercel Blob, private store  → /api/img?b=<pathname>   (served through our own route)
 *  3. The Postgres database       → /api/img?d=<id>         (fallback when Blob is missing or fails)
 *  4. ./.data/uploads on disk     → /api/img?p=<path>       (local development only)
 */
const P_LOCAL = "/api/img?p=";
const P_PRIVATE = "/api/img?b=";
const P_DB = "/api/img?d=";

const hasBlob = () => !!(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
let blobMode: "public" | "private" | null = null; // remembered after the first successful upload

async function putBlob(name: string, body: Blob, contentType: string): Promise<string> {
  const { put } = await import("@vercel/blob");
  const tries: ("public" | "private")[] = blobMode ? [blobMode] : ["public", "private"];
  let last: unknown;
  for (const access of tries) {
    try {
      const res = await put(name, body, { access, contentType, addRandomSuffix: false });
      blobMode = access;
      return access === "public" ? res.url : P_PRIVATE + encodeURIComponent(res.pathname);
    } catch (e) { last = e; }
  }
  throw last;
}

async function putDb(data: Buffer, contentType: string): Promise<string> {
  const { sql } = await import("./db");
  const id = randomUUID();
  await sql("INSERT INTO images (id, type, data) VALUES ($1, $2, $3)", [id, contentType, data.toString("base64")]);
  return P_DB + id;
}

/** Saves an image and returns a URL the site can show. */
export async function saveImage(data: Blob | ArrayBuffer | Buffer, contentType: string, folder: string): Promise<string> {
  const ext = EXT[contentType] ?? "bin";
  const name = `${folder}/${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;
  const buf = data instanceof Blob ? Buffer.from(await data.arrayBuffer()) : Buffer.from(data as ArrayBuffer);
  if (hasBlob()) {
    try { return await putBlob(name, new Blob([new Uint8Array(buf)], { type: contentType }), contentType); }
    catch (e) { console.error("Vercel Blob upload failed, saving the image in the database instead:", e); }
  }
  if (process.env.VERCEL || process.env.DATABASE_URL || process.env.IMAGES_IN_DB) return putDb(buf, contentType);
  const fs = await import("fs/promises");
  const path = await import("path");
  const full = path.join(process.cwd(), ".data", "uploads", name);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, buf);
  return P_LOCAL + name;
}

/** Where an image currently lives, for the dashboard's status check */
export function storageMode(): string {
  if (hasBlob()) return blobMode ? `Vercel Blob (${blobMode})` : "Vercel Blob";
  if (process.env.VERCEL || process.env.DATABASE_URL) return "Database (Vercel Blob not connected)";
  return "Local folder (development)";
}

export async function deleteImage(url: string) {
  try {
    if (url.startsWith("/seed/")) return;
    if (url.startsWith(P_DB)) {
      const { sql } = await import("./db");
      await sql("DELETE FROM images WHERE id = $1", [url.slice(P_DB.length)]);
    } else if (url.startsWith(P_PRIVATE) || url.startsWith("http")) {
      const { del } = await import("@vercel/blob");
      await del(url.startsWith(P_PRIVATE) ? decodeURIComponent(url.slice(P_PRIVATE.length)) : url);
    } else if (url.startsWith(P_LOCAL)) {
      const fs = await import("fs/promises");
      const path = await import("path");
      await fs.unlink(path.join(process.cwd(), ".data", "uploads", url.slice(P_LOCAL.length)));
    }
  } catch { /* ignore */ }
}

/** Only accept image URLs that we stored ourselves. */
export function isOwnImageUrl(url: unknown): url is string {
  if (typeof url !== "string" || url.length > 500) return false;
  if ([P_LOCAL, P_PRIVATE, P_DB, "/seed/"].some((p) => url.startsWith(p))) return !url.includes("..") && !url.includes("\\");
  try {
    const u = new URL(url);
    return u.protocol === "https:" && u.hostname.endsWith(".blob.vercel-storage.com");
  } catch { return false; }
}

/** Reads back an image we stored, wherever it lives. */
export async function readImage(url: string): Promise<{ data: Buffer; type: string }> {
  if (!isOwnImageUrl(url)) throw new Error("not our image");
  const typeOf = (u: string) => "image/" + ({ png: "png", jpg: "jpeg", jpeg: "jpeg", webp: "webp", svg: "svg+xml", gif: "gif" }[u.split(".").pop()?.toLowerCase() ?? ""] ?? "jpeg");
  const fs = await import("fs/promises");
  const path = await import("path");
  if (url.startsWith(P_DB)) {
    const { sql } = await import("./db");
    const [r] = await sql("SELECT type, data FROM images WHERE id = $1", [url.slice(P_DB.length)]);
    if (!r) throw new Error("image not found");
    return { data: Buffer.from(r.data, "base64"), type: r.type };
  }
  if (url.startsWith(P_PRIVATE)) {
    const { get } = await import("@vercel/blob");
    const pathname = decodeURIComponent(url.slice(P_PRIVATE.length));
    const r = await get(pathname, { access: "private" });
    if (!r || r.statusCode !== 200) throw new Error("image not found");
    return { data: Buffer.from(await new Response(r.stream).arrayBuffer()), type: r.blob.contentType || typeOf(pathname) };
  }
  if (url.startsWith(P_LOCAL)) return { data: await fs.readFile(path.join(process.cwd(), ".data", "uploads", url.slice(P_LOCAL.length))), type: typeOf(url) };
  if (url.startsWith("/seed/")) return { data: await fs.readFile(path.join(process.cwd(), "public", url)), type: typeOf(url) };
  const res = await fetch(url);
  if (!res.ok) throw new Error("image not found");
  return { data: Buffer.from(await res.arrayBuffer()), type: res.headers.get("content-type") || typeOf(url) };
}
