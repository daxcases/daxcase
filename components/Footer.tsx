import Link from "next/link";
import Logo from "./Logo";
import { STORE } from "@/lib/config";
import { t, type Lang } from "@/lib/i18n";
import { getSocial } from "@/lib/db";
import SocialLinks, { socialUrl, WhatsAppIcon } from "./SocialLinks";

export default async function Footer({ lang }: { lang: Lang }) {
  const d = t(lang);
  const social = await getSocial().catch(() => ({ instagram: STORE.instagram, tiktok: STORE.tiktok, whatsapp: "" }));
  return (
    <footer className="mt-24 border-t border-line bg-paper">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-14 grid gap-10 md:grid-cols-[2fr_1fr_1fr]">
        <div>
          <Logo className="text-[26px]" />
          <p className="mt-4 max-w-sm text-muted leading-relaxed">{d.footer_about}</p>
          <SocialLinks social={social} className="mt-5" />
        </div>
        <div>
          <h4 className="font-semibold mb-3">{d.shop}</h4>
          <ul className="space-y-2 text-muted">
            <li><Link href={`/${lang}/designs`} className="hover:text-ink">{d.nav_designs}</Link></li>
            <li><Link href={`/${lang}/create`} className="hover:text-ink">{d.cta_customize}</Link></li>
            <li><Link href={`/${lang}/quiz`} className="hover:text-ink">{d.quiz}</Link></li>
            <li><Link href={`/${lang}/track`} className="hover:text-ink">{d.track}</Link></li>
            <li><Link href={`/${lang}/wholesale`} className="hover:text-ink">{d.wholesale}</Link></li>
          </ul>
        </div>
        {(STORE.phone || social.instagram || social.tiktok || STORE.email) && (
          <div>
            <h4 className="font-semibold mb-3">{d.contact}</h4>
            <ul className="space-y-2 text-muted">
              {STORE.phone && <li><a href={`tel:${STORE.phone.replace(/\s/g, "")}`} className="hover:text-ink">{STORE.phone}</a></li>}
              {social.instagram && <li><a href={socialUrl.instagram(social.instagram)} target="_blank" rel="noreferrer" className="hover:text-ink">Instagram · @{social.instagram}</a></li>}
              {social.tiktok && <li><a href={socialUrl.tiktok(social.tiktok)} target="_blank" rel="noreferrer" className="hover:text-ink">TikTok · @{social.tiktok}</a></li>}
              {STORE.email && <li><a href={`mailto:${STORE.email}`} className="hover:text-ink">{STORE.email}</a></li>}
            </ul>
          </div>
        )}
      </div>
      {social.whatsapp && (
        <a href={`https://wa.me/${social.whatsapp}`} target="_blank" rel="noreferrer" aria-label={d.whatsapp_us} title={d.whatsapp_us}
          className="fixed z-40 right-4 bottom-24 sm:bottom-6 w-14 h-14 rounded-full grid place-items-center shadow-lg transition hover:scale-105" style={{ background: "#25D366", color: "#fff" }}>
          <WhatsAppIcon />
        </a>
      )}
      <div className="border-t border-line py-6 text-center text-[13px] text-muted">
        © {new Date().getFullYear()} {STORE.shortName}. {d.rights}
      </div>
    </footer>
  );
}
