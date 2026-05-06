"use client";
// Renders a Shiki-highlighted code block in a dark glass panel.
import { Glass } from "./Glass";

export function CodePanel({
  highlightedHtml,
  label,
  language,
}: {
  highlightedHtml: string;
  label?: string;
  language: string;
}) {
  return (
    <Glass tone="default" className="overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <span className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400/40" />
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/40" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-400/40" />
          </span>
          <span className="text-xs font-mono text-zinc-400 ml-2">
            {label ?? language}
          </span>
        </div>
        <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
          {language}
        </span>
      </div>
      <div
        className="text-[0.82rem] leading-relaxed [&_pre]:!bg-transparent [&_pre]:!p-5 [&_pre]:overflow-x-auto [&_pre]:max-h-[64vh] [&_code]:font-mono"
        dangerouslySetInnerHTML={{ __html: highlightedHtml }}
      />
    </Glass>
  );
}
