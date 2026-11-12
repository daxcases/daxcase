import { readImage } from "@/lib/storage";

// Serves images that are not on a public URL: private Vercel Blob (?b=), the database (?d=),
// or the local folder in development (?p=).
export async function GET(req: Request) {
  const u = new URL(req.url);
  const key = ["b", "d", "p"].find((k) => u.searchParams.has(k));
  if (!key) return new Response("Not found", { status: 404 });
  const value = u.searchParams.get(key) || "";
  const url = `/api/img?${key}=${key === "b" ? encodeURIComponent(value) : value}`;
  try {
    const img = await readImage(url);
    if (!/^image\/(png|jpeg|webp|gif|svg\+xml)$/.test(img.type)) return new Response("Not found", { status: 404 });
    return new Response(new Uint8Array(img.data), {
      headers: {
        "content-type": img.type,
        "cache-control": "public, max-age=31536000, immutable",
        "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'",
        "x-content-type-options": "nosniff",
      },
    });
  } catch { return new Response("Not found", { status: 404 }); }
}
