// Renders the Stage 5 HTML inside a styled card so you can see what the
// markup actually looks like — not just the markup itself.
export function RenderedPreview({ html }: { html: string }) {
  return (
    <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-950 overflow-hidden">
      <div className="px-4 py-2 text-xs font-mono uppercase tracking-widest text-zinc-500 border-b border-zinc-800">
        Live preview
      </div>
      <div
        className="preview-frame p-6 bg-white text-zinc-900"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
