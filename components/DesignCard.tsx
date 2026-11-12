import Link from "next/link";
import CaseFrame from "./CaseFrame";
import { getPhone, DEFAULT_PHONE } from "@/lib/phones";
import type { Lang } from "@/lib/i18n";

export type DesignLite = { id: number; name: string; image_url: string; category?: string | null };

export default function DesignCard({ d, lang, href }: { d: DesignLite; lang: Lang; href?: string }) {
  const phone = getPhone(DEFAULT_PHONE);
  return (
    <Link href={href ?? `/${lang}/create?design=${d.id}`} className="group block">
      <div className="px-2 pt-2 transition group-hover:-translate-y-1">
        <CaseFrame model={phone} image={d.image_url} className="w-full h-auto case-shadow" />
      </div>
      <div className="mt-4 px-1">
        <div className="font-semibold uppercase tracking-tight leading-tight">{d.name}</div>
        {d.category && <div className="text-[13px] text-muted uppercase">{d.category}</div>}
      </div>
    </Link>
  );
}
