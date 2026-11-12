import { readFile } from "fs/promises";
import path from "path";

// Local development only: serves images saved in ./.data/uploads.
// On Vercel, images live in Vercel Blob and this route is not used.
const TYPES: Record<string, string> = { png: "image/png", jpg: "image/jpeg", webp: "image/webp", svg: "image/svg+xml", gif: "image/gif" };

export async function GET(req: Request) {
  const parts = (new URL(req.url).searchParams.get("p") || "").split("/").filter(Boolean);
  if (!parts.length) return new Response("Not found", { status: 404 });
  if (parts.some((p) => p.includes("..") || p.includes("/") || p.includes("\\"))) return new Response("Not found", { status: 404 });
  const ext = parts[parts.length - 1].split(".").pop() || "";
  if (!TYPES[ext]) return new Response("Not found", { status: 404 });
  try {
    const buf = await readFile(path.join(process.cwd(), ".data", "uploads", ...parts));
    return new Response(new Uint8Array(buf), {
      headers: { "content-type": TYPES[ext], "cache-control": "public, max-age=31536000, immutable", "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'" },
    });
  } catch { return new Response("Not found", { status: 404 }); }
}
