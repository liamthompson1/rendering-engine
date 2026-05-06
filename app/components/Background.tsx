"use client";
// Soft, slowly-moving colour orbs behind the glass. Gives the blur something to chew.
import { motion } from "motion/react";

export function Background() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[#0a0a0f]">
      {/* base radial */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(1200px 800px at 50% -10%, rgba(91,42,134,0.35), transparent 60%), radial-gradient(900px 600px at 110% 10%, rgba(20,184,166,0.18), transparent 55%), radial-gradient(800px 500px at -10% 80%, rgba(236,72,153,0.18), transparent 60%)",
        }}
      />
      {/* drifting orbs */}
      <motion.div
        className="absolute -left-32 top-40 h-96 w-96 rounded-full blur-3xl"
        style={{ background: "rgba(124,58,237,0.30)" }}
        animate={{ x: [0, 60, -20, 0], y: [0, 40, -30, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute right-0 top-1/3 h-[28rem] w-[28rem] rounded-full blur-3xl"
        style={{ background: "rgba(20,184,166,0.18)" }}
        animate={{ x: [0, -40, 30, 0], y: [0, -30, 50, 0] }}
        transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute left-1/3 -bottom-32 h-96 w-96 rounded-full blur-3xl"
        style={{ background: "rgba(236,72,153,0.18)" }}
        animate={{ x: [0, 40, -50, 0], y: [0, -50, 30, 0] }}
        transition={{ duration: 32, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* grain */}
      <div
        className="absolute inset-0 opacity-[0.05] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        }}
      />
    </div>
  );
}
