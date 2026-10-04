import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "secondary-dark" | "ghost" | "ghost-dark";
type Size = "md" | "lg";

const base =
  "group/btn relative inline-flex select-none items-center justify-center gap-2.5 whitespace-nowrap rounded-sm font-medium tracking-[-0.01em] transition-[background-color,color,border-color,transform,box-shadow] duration-300 ease-out disabled:pointer-events-none disabled:opacity-60";

const variants: Record<Variant, string> = {
  primary:
    "bg-signal text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.18)] hover:bg-signal-deep active:translate-y-px",
  secondary: "border border-ink/15 bg-transparent text-ink hover:border-ink/40 hover:bg-ink/[0.03]",
  "secondary-dark": "border border-white/15 bg-white/[0.02] text-white hover:border-white/35 hover:bg-white/[0.06]",
  ghost: "text-ink hover:text-signal",
  "ghost-dark": "text-white hover:text-signal-soft",
};

const sizes: Record<Size, string> = {
  md: "h-11 px-5 text-[0.9375rem]",
  lg: "h-13 px-6 text-base",
};

function Arrow() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="size-4 transition-transform duration-300 ease-out group-hover/btn:translate-x-0.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <path d="M3 8h9.5M8.5 4l4 4-4 4" strokeLinecap="square" />
    </svg>
  );
}

type Common = { variant?: Variant; size?: Size; arrow?: boolean; children: ReactNode; className?: string };

export function ButtonLink({
  variant = "primary",
  size = "md",
  arrow = false,
  className,
  children,
  ...props
}: Common & ComponentProps<typeof Link>) {
  const ghost = variant === "ghost" || variant === "ghost-dark";
  return (
    <Link className={cn(base, variants[variant], ghost ? "h-auto px-0" : sizes[size], className)} {...props}>
      {children}
      {arrow && <Arrow />}
    </Link>
  );
}

export function Button({
  variant = "primary",
  size = "md",
  arrow = false,
  className,
  children,
  ...props
}: Common & ComponentProps<"button">) {
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {children}
      {arrow && <Arrow />}
    </button>
  );
}
