"use client";
// Renders the Stage 5 HTML inside a styled preview frame.
// `mode` toggles between fragment (just the cards) and full (chrome + cards).
import { Glass } from "./Glass";

export function Preview({
  html,
  mode,
}: {
  html: string;
  mode: "fragment" | "full";
}) {
  return (
    <Glass tone="default" className="overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]">
        <span className="text-xs font-mono text-zinc-400">
          {mode === "full" ? "rendered page" : "live preview"}
        </span>
        <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
          rendered
        </span>
      </div>
      <div className="preview-stage p-4 md:p-6 overflow-y-auto max-h-[64vh]">
        {mode === "full" && (
          <div className="preview-shell-header">
            <div className="preview-shell-logo">Holiday Extras</div>
            <div className="preview-shell-tagline">Less hassle, more holiday</div>
          </div>
        )}
        <div
          className="preview-content"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </Glass>
  );
}
