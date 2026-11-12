import OrderDone from "@/components/OrderDone";
import { isLang, type Lang } from "@/lib/i18n";

export default async function OrderPage({ params }: { params: Promise<{ lang: string; id: string }> }) {
  const { lang: l, id } = await params;
  const lang: Lang = isLang(l) ? l : "sq";
  return <OrderDone lang={lang} id={id.slice(0, 12)} />;
}
