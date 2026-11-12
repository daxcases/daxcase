import { getMaterials, getNotifyEmail, getPricing, getSocial, getTelegramChat } from "@/lib/db";
import { InstagramIcon, TikTokIcon } from "@/components/SocialLinks";
import { requireOwner, testTelegram, updateNotifyEmail, updatePricing, updateSocial, updateTelegram } from "../actions";
import { CURRENCY, type CountryCode } from "@/lib/config";
import { COUNTRIES } from "@/lib/locations";

export default async function SettingsAdmin({ searchParams }: { searchParams: Promise<{ saved?: string; email?: string; social?: string; tg?: string }> }) {
  await requireOwner();
  const { saved, email: emailState, social: socialState, tg } = await searchParams;
  const [p, notify, MATERIALS, social, chat] = await Promise.all([getPricing(), getNotifyEmail(), getMaterials(), getSocial(), getTelegramChat()]);
  const hasBot = !!process.env.TELEGRAM_BOT_TOKEN;
  const hasKey = !!process.env.RESEND_API_KEY;
  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-[32px] font-bold">Prices & shipping</h1>
      <p className="text-muted mt-1">Customers pay in cash on delivery. Prices are per case, in each country's currency.</p>
      {saved && <p className="mt-4 rounded-xl bg-green-100 text-green-800 px-4 py-3 text-[14px]">Saved.</p>}
      <form action={updatePricing} className="card p-5 mt-5 overflow-x-auto">
        <table className="w-full text-[15px] min-w-[560px]">
          <thead><tr className="text-left text-muted text-[13px]">
            <th className="pb-3 font-medium">Material</th>
            {COUNTRIES.map((c) => <th key={c.code} className="pb-3 font-medium">{c.flag} {c.en} ({CURRENCY[c.code].code})</th>)}
          </tr></thead>
          <tbody>
            {MATERIALS.map((m) => (
              <tr key={m.id}><td className="py-1.5 pr-4 font-medium">{m.en}</td>
                {COUNTRIES.map((c) => <td key={c.code} className="py-1.5 pr-3"><input name={`${c.code}_${m.id}`} type="number" step="0.01" min="0" defaultValue={p[c.code as CountryCode].prices[m.id]} className="input h-11" /></td>)}
              </tr>
            ))}
            <tr><td className="pt-5 pr-4 font-medium">Personalised case (extra)</td>
              {COUNTRIES.map((c) => <td key={c.code} className="pt-5 pr-3"><input name={`${c.code}_custom`} type="number" step="0.01" min="0" defaultValue={p[c.code as CountryCode].custom} className="input h-11" /></td>)}
            </tr>
            <tr><td className="pt-5 pr-4 font-medium">Shipping</td>
              {COUNTRIES.map((c) => <td key={c.code} className="pt-5 pr-3"><input name={`${c.code}_shipping`} type="number" step="0.01" min="0" defaultValue={p[c.code as CountryCode].shipping} className="input h-11" /></td>)}
            </tr>
          </tbody>
        </table>
        <button className="btn-dark mt-6">Save prices</button>
      </form>

      <h2 className="font-display text-[24px] font-bold mt-12">Order emails</h2>
      <p className="text-muted mt-1">Every new order is sent to this address with the customer details, the preview and the print file link. For several addresses, separate them with commas.</p>
      {emailState === "saved" && <p className="mt-4 rounded-xl bg-green-100 text-green-800 px-4 py-3 text-[14px]">Saved.</p>}
      {emailState === "bad" && <p className="mt-4 rounded-xl bg-red-100 text-red-800 px-4 py-3 text-[14px]">That email address does not look right.</p>}
      {!hasKey && <p className="mt-4 rounded-xl bg-amber-100 text-amber-900 px-4 py-3 text-[14px]">Emails are not being sent yet: add <b>RESEND_API_KEY</b> in Vercel → Settings → Environment Variables (free key from resend.com), then redeploy.</p>}
      <form action={updateNotifyEmail} className="card p-5 mt-5 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[240px]"><label className="label">Send orders to</label><input name="email" defaultValue={notify} placeholder="orders@daxcases.com" className="input" /></div>
        <button className="btn-dark">Save email</button>
      </form>

      <h2 className="font-display text-[24px] font-bold mt-12">Telegram: new orders on your phone</h2>
      <p className="text-muted mt-1">Every new order arrives as a Telegram message with the customer, the cases and the amount to collect.</p>
      {tg === "saved" && <p className="mt-4 rounded-xl bg-green-100 text-green-800 px-4 py-3 text-[14px]">Saved.</p>}
      {tg === "sent" && <p className="mt-4 rounded-xl bg-green-100 text-green-800 px-4 py-3 text-[14px]">Test message sent. Check Telegram.</p>}
      {tg === "failed" && <p className="mt-4 rounded-xl bg-red-100 text-red-800 px-4 py-3 text-[14px]">The test message could not be sent. Check the bot token and the chat ID, and that you pressed Start in your bot.</p>}
      {!hasBot && <p className="mt-4 rounded-xl bg-amber-100 text-amber-900 px-4 py-3 text-[14px]">Not active yet: create a bot with <b>@BotFather</b> in Telegram, add its token in Vercel as <b>TELEGRAM_BOT_TOKEN</b>, then redeploy.</p>}
      <div className="card p-5 mt-5 flex flex-wrap gap-3 items-end">
        <form action={updateTelegram} className="flex flex-wrap gap-3 items-end flex-1">
          <div className="flex-1 min-w-[220px]"><label className="label">Your chat ID <span className="font-normal text-muted">(send /start to @userinfobot to see it)</span></label><input name="chat" defaultValue={chat} placeholder="123456789" className="input" /></div>
          <button className="btn-dark">Save</button>
        </form>
        <form action={testTelegram}><button className="btn-light">Send a test</button></form>
      </div>

      <h2 className="font-display text-[24px] font-bold mt-12">Instagram, TikTok & WhatsApp</h2>
      <p className="text-muted mt-1">Your usernames. The logos appear at the bottom of every page and open your profiles. Leave one empty to hide it. With a WhatsApp number, a green chat button appears on every page.</p>
      {socialState === "saved" && <p className="mt-4 rounded-xl bg-green-100 text-green-800 px-4 py-3 text-[14px]">Saved.</p>}
      <form action={updateSocial} className="card p-5 mt-5 grid sm:grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end">
        <div><label className="label flex items-center gap-2"><InstagramIcon size={18} /> Instagram</label><input name="instagram" defaultValue={social.instagram} placeholder="daxcases" className="input" /></div>
        <div><label className="label flex items-center gap-2"><TikTokIcon size={17} /> TikTok</label><input name="tiktok" defaultValue={social.tiktok} placeholder="daxcases" className="input" /></div>
        <div><label className="label">WhatsApp number</label><input name="whatsapp" defaultValue={social.whatsapp} placeholder="38344123456" className="input" /></div>
        <button className="btn-dark">Save</button>
      </form>
    </div>
  );
}
