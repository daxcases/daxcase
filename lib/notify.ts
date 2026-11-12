import "server-only";
import { getTelegramChat } from "./db";

/**
 * Sends a Telegram message to the shop owner. Needs TELEGRAM_BOT_TOKEN in the environment
 * and the owner's chat ID saved in /admin/settings. Returns false when it is not set up.
 */
export async function sendTelegram(text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = (await getTelegramChat()) || process.env.TELEGRAM_CHAT_ID || "";
  if (!token || !chat) return false;
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 6000);
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST", signal: ctl.signal, headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chat, text, disable_web_page_preview: true }),
    });
    if (!res.ok) console.error("telegram rejected", res.status, await res.text());
    return res.ok;
  } finally { clearTimeout(timer); }
}
