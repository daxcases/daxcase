import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "./lib/auth";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") return NextResponse.next();
    if (!verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value)) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
    return NextResponse.next();
  }

  // Language prefix: /sq/... or /en/...
  const first = pathname.split("/")[1];
  if (first !== "sq" && first !== "en") {
    const pref = req.cookies.get("lang")?.value;
    const lang = pref === "en" || pref === "sq" ? pref : "sq";
    const url = req.nextUrl.clone();
    url.pathname = `/${lang}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next|seed|icons|favicon.ico|manifest.webmanifest|robots.txt|.*\\..*).*)"],
};
