export type Social = { instagram: string; tiktok: string; whatsapp?: string };

export function WhatsAppIcon({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm0 18.2c-1.5 0-3-.4-4.300-1.200l-.300-.200-3 .800.800-2.900-.200-.300A8.200 8.200 0 1112 20.200zm4.500-6.100c-.200-.100-1.500-.700-1.700-.800-.200-.100-.400-.100-.600.100l-.800 1c-.100.200-.300.200-.500.100a6.700 6.700 0 01-3.300-2.900c-.200-.400.200-.400.700-1.300.100-.200 0-.300 0-.500l-.800-1.900c-.200-.500-.400-.400-.600-.400h-.500c-.200 0-.500.100-.700.300-.800.800-1 1.800-.700 2.900.600 1.800 2.400 4.300 5.600 5.500 1.800.700 2.600.600 3.400.300.600-.200 1.300-.800 1.400-1.500.100-.400.100-.700 0-.800z" />
    </svg>
  );
}

export const socialUrl = {
  instagram: (u: string) => `https://www.instagram.com/${u}`,
  tiktok: (u: string) => `https://www.tiktok.com/@${u}`,
};

export function InstagramIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.3" cy="6.7" r="0.6" fill="currentColor" />
    </svg>
  );
}

export function TikTokIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );
}

/** Round icon buttons that open the shop's Instagram and TikTok */
export default function SocialLinks({ social, className = "" }: { social: Social; className?: string }) {
  if (!social.instagram && !social.tiktok) return null;
  const btn = "w-11 h-11 rounded-full border border-line bg-white grid place-items-center text-ink transition hover:bg-ink hover:text-white hover:border-ink";
  return (
    <div className={`flex gap-2.5 ${className}`}>
      {social.instagram && <a href={socialUrl.instagram(social.instagram)} target="_blank" rel="noreferrer" aria-label="Instagram" title={`Instagram @${social.instagram}`} className={btn}><InstagramIcon /></a>}
      {social.tiktok && <a href={socialUrl.tiktok(social.tiktok)} target="_blank" rel="noreferrer" aria-label="TikTok" title={`TikTok @${social.tiktok}`} className={btn}><TikTokIcon size={19} /></a>}
    </div>
  );
}
