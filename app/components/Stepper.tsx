"use client";
// Top stepper. Each stage is a clickable pill; the active one is highlighted
// with a gliding indicator using motion's layoutId.
import { motion } from "motion/react";

export function Stepper({
  total,
  current,
  labels,
  onChange,
}: {
  total: number;
  current: number;
  labels: string[];
  onChange: (i: number) => void;
}) {
  return (
    <div className="flex items-center gap-1 px-2 py-2 rounded-full">
      {Array.from({ length: total }).map((_, i) => {
        const isActive = i === current;
        const isDone = i < current;
        return (
          <button
            key={i}
            onClick={() => onChange(i)}
            className="relative px-3 py-2 text-xs font-medium font-mono text-zinc-400 hover:text-zinc-100 transition-colors min-w-[3.5rem]"
            aria-label={`Go to stage ${i}: ${labels[i]}`}
          >
            {isActive && (
              <motion.span
                layoutId="stepper-active"
                className="absolute inset-0 rounded-full"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.04))",
                  boxShadow:
                    "0 0 0 1px rgba(255,255,255,0.12) inset, 0 0 24px -8px rgba(167,139,250,0.5)",
                }}
                transition={{ type: "spring", stiffness: 400, damping: 35 }}
              />
            )}
            <span
              className={`relative flex flex-col items-center gap-0.5 ${
                isActive ? "text-zinc-50" : isDone ? "text-zinc-300" : ""
              }`}
            >
              <span className="text-[0.65rem] tracking-widest opacity-70">
                {String(i).padStart(2, "0")}
              </span>
              <span className="text-[0.7rem]">{labels[i]}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
