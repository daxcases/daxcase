import { STORE } from "@/lib/config";
export default function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`logo inline-flex items-start leading-none select-none ${className}`}>
      {STORE.name}
      <sup className="text-[0.32em] font-sans not-italic font-bold ml-[0.08em] mt-[-0.1em]">®</sup>
    </span>
  );
}
