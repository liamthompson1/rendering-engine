"use client";
// Reusable glass panel — frosted, subtle gradient border, soft shadow.
import { type ReactNode, type CSSProperties } from "react";
import { motion, type HTMLMotionProps } from "motion/react";

type GlassProps = Omit<HTMLMotionProps<"div">, "ref"> & {
  children: ReactNode;
  /** Tone tweaks the surface tint */
  tone?: "default" | "violet" | "teal";
  /** Floating gives a stronger shadow / lift */
  floating?: boolean;
  className?: string;
  style?: CSSProperties;
};

const TONES: Record<NonNullable<GlassProps["tone"]>, { tint: string; ring: string }> = {
  default: {
    tint: "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
    ring: "linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0.04))",
  },
  violet: {
    tint: "linear-gradient(180deg, rgba(167,139,250,0.10) 0%, rgba(91,42,134,0.04) 100%)",
    ring: "linear-gradient(180deg, rgba(196,181,253,0.30), rgba(124,58,237,0.06))",
  },
  teal: {
    tint: "linear-gradient(180deg, rgba(94,234,212,0.10) 0%, rgba(20,83,76,0.04) 100%)",
    ring: "linear-gradient(180deg, rgba(167,243,208,0.30), rgba(15,118,110,0.06))",
  },
};

export function Glass({
  children,
  tone = "default",
  floating = false,
  className = "",
  style,
  ...rest
}: GlassProps) {
  const t = TONES[tone];
  return (
    <motion.div
      {...rest}
      className={`relative rounded-2xl ${className}`}
      style={{
        background: t.tint,
        backdropFilter: "blur(24px) saturate(140%)",
        WebkitBackdropFilter: "blur(24px) saturate(140%)",
        boxShadow: floating
          ? "0 30px 80px -20px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset, 0 1px 0 rgba(255,255,255,0.10) inset"
          : "0 0 0 1px rgba(255,255,255,0.04) inset, 0 1px 0 rgba(255,255,255,0.10) inset",
        ...style,
      }}
    >
      {/* Gradient ring — looks like a 1px border that's lighter at the top */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl p-px"
        style={{
          background: t.ring,
          WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
      />
      <div className="relative">{children}</div>
    </motion.div>
  );
}
