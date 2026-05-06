"use client";
// Stepping walkthrough — holds current stage, animates between stages.
// All content (highlighted code panels, previews, copy) is pre-computed
// on the server and passed in.
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Glass } from "./Glass";
import { Stepper } from "./Stepper";
import { CodePanel } from "./CodePanel";
import { Preview } from "./Preview";

export type StageView = {
  number: number;
  title: string;
  subtitle: string;
  blurb: string;
  detail: string[];
  highlight?: string;
  panels: Array<{ label?: string; highlightedHtml: string; language: string }>;
  preview?: { html: string; mode: "fragment" | "full" };
};

export function Walkthrough({ stages }: { stages: StageView[] }) {
  const [i, setI] = useState(0);
  const stage = stages[i];
  const total = stages.length;

  const go = useCallback(
    (delta: number) => setI((c) => Math.max(0, Math.min(total - 1, c + delta))),
    [total],
  );

  // Keyboard arrows + page up/down
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        e.target &&
        (e.target as HTMLElement).tagName?.toLowerCase() === "input"
      )
        return;
      if (e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        go(1);
      }
      if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        go(-1);
      }
      if (e.key >= "0" && e.key <= "9") {
        const n = parseInt(e.key, 10);
        if (n < total) setI(n);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, total]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header bar */}
      <header className="sticky top-0 z-30 flex justify-center pt-4 px-4">
        <Glass
          tone="default"
          className="w-full max-w-6xl px-3 py-2 flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3 pl-2">
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-500 shadow-[0_0_20px_-2px_rgba(167,139,250,0.6)]" />
            <div className="leading-tight">
              <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                Rendering engine
              </p>
              <p className="text-sm font-medium text-zinc-100">
                Markdown → Schema → UI
              </p>
            </div>
          </div>
          <Stepper
            total={total}
            current={i}
            labels={stages.map((s) => s.title)}
            onChange={setI}
          />
        </Glass>
      </header>

      {/* Stage area */}
      <main className="flex-1 flex flex-col items-center px-4 pt-8 pb-24">
        <div className="w-full max-w-6xl">
          {/* Title */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`title-${stage.number}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="mb-6"
            >
              <div className="flex items-baseline gap-3 mb-1">
                <span className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">
                  Stage {String(stage.number).padStart(2, "0")} / {String(total - 1).padStart(2, "0")}
                </span>
                {stage.highlight && (
                  <span className="text-xs font-medium text-violet-300/90 bg-violet-500/10 border border-violet-400/20 px-2 py-0.5 rounded-full">
                    {stage.highlight}
                  </span>
                )}
              </div>
              <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-zinc-50">
                {stage.title}
              </h2>
              <p className="mt-2 text-zinc-400 text-base md:text-lg">
                {stage.subtitle}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Body — code panel(s) on the left, glass explanation card on the right */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={`panels-${stage.number}`}
                initial={{ opacity: 0, y: 16, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.99 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col gap-4 min-w-0"
              >
                {stage.preview && stage.preview.mode === "fragment" && (
                  <Preview html={stage.preview.html} mode={stage.preview.mode} />
                )}
                {stage.preview && stage.preview.mode === "full" && (
                  <Preview html={stage.preview.html} mode={stage.preview.mode} />
                )}
                {stage.panels.map((p, pi) => (
                  <CodePanel
                    key={pi}
                    highlightedHtml={p.highlightedHtml}
                    language={p.language}
                    label={p.label}
                  />
                ))}
              </motion.div>
            </AnimatePresence>

            <div className="lg:sticky lg:top-28 lg:self-start space-y-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`expl-${stage.number}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Glass tone="violet" floating className="p-6">
                    <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-violet-300/80 mb-3">
                      What just happened
                    </p>
                    <p className="text-zinc-100 text-[0.95rem] leading-relaxed">
                      {stage.blurb}
                    </p>
                    {stage.detail.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                        {stage.detail.map((d, di) => (
                          <p
                            key={di}
                            className="text-zinc-300/90 text-sm leading-relaxed"
                          >
                            {d}
                          </p>
                        ))}
                      </div>
                    )}
                  </Glass>
                </motion.div>
              </AnimatePresence>

              {/* Nav buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => go(-1)}
                  disabled={i === 0}
                  className="flex-1 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-zinc-200 hover:bg-white/[0.08] hover:border-white/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed text-sm font-medium"
                >
                  ← Previous
                </button>
                <button
                  onClick={() => go(1)}
                  disabled={i === total - 1}
                  className="flex-1 px-4 py-3 rounded-xl text-white text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_8px_30px_-8px_rgba(167,139,250,0.6)]"
                  style={{
                    background:
                      "linear-gradient(135deg, rgb(124,58,237) 0%, rgb(167,139,250) 100%)",
                  }}
                >
                  Next →
                </button>
              </div>

              <p className="text-[10px] font-mono text-zinc-500 text-center">
                ← → arrow keys · 0–6 jump
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
