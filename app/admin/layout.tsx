import "../globals.css";
import Link from "next/link";
import { cookies } from "next/headers";
import Fonts from "@/components/Fonts";
import ThemeToggle, { THEME_SCRIPT } from "@/components/ThemeToggle";
import Logo from "@/components/Logo";
import { SESSION_COOKIE, parseSession } from "@/lib/auth";
import { logout } from "./actions";

export const metadata = { title: "Dashboard · DaxCases", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = parseSession((await cookies()).get(SESSION_COOKIE)?.value);
  const authed = !!session;
  const links = session?.role === "shipper" ? [] : [["/admin", "Orders"]];
  links.push(["/admin/shipping", "Shipping & stock"]);
  if (session?.role !== "shipper") links.push(["/admin/designs", "Designs"], ["/admin/categories", "Categories"]);
  if (session?.role === "admin") links.push(["/admin/stats", "Statistics"], ["/admin/models", "Phone models"], ["/admin/materials", "Materials"], ["/admin/offers", "Offers & codes"], ["/admin/marketing", "Marketing"], ["/admin/settings", "Prices"], ["/admin/users", "Users"]);
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} /><Fonts /></head>
      <body className="min-h-dvh bg-paper">
        {authed && (
          <header className="bg-white border-b border-line sticky top-0 z-30">
            <div className="mx-auto max-w-6xl px-4 h-16 flex items-center gap-5 overflow-x-auto no-scrollbar">
              <Link href={session?.role === "shipper" ? "/admin/shipping" : "/admin"} className="text-[20px] shrink-0"><Logo /></Link>
              <nav className="flex gap-1 text-[14px] font-medium">
                {links.map(([h, l]) => (
                  <Link key={h} href={h} className="px-3 h-9 inline-flex items-center rounded-lg hover:bg-paper whitespace-nowrap">{l}</Link>
                ))}
              </nav>
              <div className="ml-auto flex items-center gap-3 shrink-0">
                <ThemeToggle className="!w-9 !h-9" />
                <Link href="/" target="_blank" className="text-[14px] text-muted hover:text-ink whitespace-nowrap">View shop ↗</Link>
                <form action={logout}><button className="chip h-9 text-[13px]">Log out</button></form>
              </div>
            </div>
          </header>
        )}
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
