import "server-only";
import { randomUUID } from "crypto";

/** Local development only: images are kept in ./.data/uploads and served by /api/img */
const LOCAL = "/api/img?p=";
const localPath = (url: string) => url.slice(LOCAL.length);

const EXT: Record<string, string> = {
  "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/svg+xml": "svg", "image/gif": "gif",
};
export const ALLOWED_IMAGE_TYPES = Object.keys(EXT);

/** Saves an image and returns its public URL. Uses Vercel Blob in production, ./.data/uploads locally. */
export async function saveImage(data: Blob | ArrayBuffer | Buffer, contentType: string, folder: string): Promise<string> {
  const ext = EXT[contentType] ?? "bin";
  const name = `${folder}/${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    const body = data instanceof Blob ? data : new Blob([data as ArrayBuffer]);
    const res = await put(name, body, { access: "public", contentType, addRandomSuffix: false });
    return res.url;
  }
  if (process.env.VERCEL) throw new Error("BLOB_READ_WRITE_TOKEN is missing. Connect Vercel Blob storage.");
  const fs = await import("fs/promises");
  const path = await import("path");
  const buf = data instanceof Blob ? Buffer.from(await data.arrayBuffer()) : Buffer.from(data as ArrayBuffer);
  const full = path.join(process.cwd(), ".data", "uploads", name);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, buf);
  return `${LOCAL}${name}`;
}

export async function deleteImage(url: string) {
  try {
    if (url.startsWith("/seed/")) return;
    if (process.env.BLOB_READ_WRITE_TOKEN && url.startsWith("http")) {
      const { del } = await import("@vercel/blob");
      await del(url);
    } else if (url.startsWith(LOCAL)) {
      const fs = await import("fs/promises");
      const path = await import("path");
      await fs.unlink(path.join(process.cwd(), ".data", "uploads", localPath(url)));
    }
  } catch { /* ignore */ }
}

/** Only accept image URLs that we stored ourselves. */
export function isOwnImageUrl(url: unknown): url is string {
  if (typeof url !== "string" || url.length > 500) return false;
  if (url.startsWith(LOCAL) || url.startsWith("/seed/")) return !url.includes("..") && !url.includes("\\");
  try {
    const u = new URL(url);
    return u.protocol === "https:" && u.hostname.endsWith(".public.blob.vercel-storage.com");
  } catch { return false; }
}

/** Reads back an image we stored (local folder or Vercel Blob). */
export async function readImage(url: string): Promise<Buffer> {
  if (!isOwnImageUrl(url)) throw new Error("not our image");
  const fs = await import("fs/promises");
  const path = await import("path");
  if (url.startsWith(LOCAL)) return fs.readFile(path.join(process.cwd(), ".data", "uploads", localPath(url)));
  if (url.startsWith("/seed/")) return fs.readFile(path.join(process.cwd(), "public", url));
  const res = await fetch(url);
  if (!res.ok) throw new Error("image not found");
  return Buffer.from(await res.arrayBuffer());
}
