"use client";

import { useRef, type ReactNode } from "react";

/**
 * Pulls its child slightly toward the pointer. Only on fine pointers and when
 * the visitor hasn't asked for reduced motion.
 */
export function Magnetic({ children, strength = 0.22 }: { children: ReactNode; strength?: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  const enabled = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(pointer: fine)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <span
      ref={ref}
      className="inline-flex transition-transform duration-500 ease-[var(--ease-out-expo)] will-change-transform"
      onPointerMove={(e) => {
        const el = ref.current;
        if (!el || !enabled()) return;
        const r = el.getBoundingClientRect();
        const x = (e.clientX - (r.left + r.width / 2)) * strength;
        const y = (e.clientY - (r.top + r.height / 2)) * strength;
        el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      }}
      onPointerLeave={() => {
        if (ref.current) ref.current.style.transform = "";
      }}
    >
      {children}
    </span>
  );
}
