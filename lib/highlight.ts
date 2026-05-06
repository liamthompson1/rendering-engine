// Server-side syntax highlighting via Shiki.
// Highlighter is created once and reused.
import { createHighlighter, type Highlighter } from "shiki";

let cached: Promise<Highlighter> | null = null;

function getHighlighter() {
  if (!cached) {
    cached = createHighlighter({
      themes: ["github-dark-dimmed"],
      langs: ["markdown", "json", "html", "yaml", "javascript", "typescript", "bash"],
    });
  }
  return cached;
}

export async function highlight(code: string, lang: string): Promise<string> {
  const hl = await getHighlighter();
  return hl.codeToHtml(code, {
    lang,
    theme: "github-dark-dimmed",
  });
}
