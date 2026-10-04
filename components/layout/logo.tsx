import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className, onNavigate }: { className?: string; onNavigate?: () => void }) {
  return (
    <Link
      href="/"
      onClick={onNavigate}
      className={cn("group/logo inline-flex items-center gap-3 text-white", className)}
      aria-label="Dev Syndicate — home"
    >
      <Image
        src="/brand/crest.png"
        alt=""
        width={95}
        height={128}
        priority
        className="h-8 w-auto transition-transform duration-500 ease-out group-hover/logo:-rotate-3"
      />
      <span className="text-[0.8125rem] font-semibold uppercase tracking-[0.2em]">
        Dev<span className="text-mute-dark transition-colors group-hover/logo:text-white"> Syndicate</span>
      </span>
    </Link>
  );
}
