// The 7-stage pipeline.
//   0. Source — pure GFM markdown
//   1. Frontmatter — gray-matter splits meta from body
//   2. Concrete — Handlebars expands {{ }} against the data
//   3. AST — remark parses to a tree (no directive plugin needed)
//   4. Rules — layout + classification rules infer shape from structure
//   5. HTML — design system styles the rule-classified nodes
//   6. Page — final served document
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import Handlebars from "handlebars";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { SOURCE_MD, DATA_JSON } from "./source";
import { applyRules } from "./rules";
import { PREVIEW_TOKENS, PREVIEW_COMPONENTS } from "./preview-styles";

export type PipelineResult = {
  source: string;
  data: unknown;
  meta: Record<string, unknown>;
  body: string;
  concrete: string;
  ast: unknown;
  html: string;
  fullHtml: string;
  rules: { rulesSource: string; tokens: string; components: string };
};

export async function runPipeline(): Promise<PipelineResult> {
  const source = SOURCE_MD;
  const data = DATA_JSON;

  const parsed = matter(source);
  const meta = parsed.data;
  const body = parsed.content;

  const concrete = Handlebars.compile(body, { noEscape: true })(data);

  // AST is plain mdast — no directive parsing, no special syntax.
  const ast = unified().use(remarkParse).use(remarkGfm).parse(concrete);

  // The rules plugin walks the AST, restructures by layout, and
  // classifies each node with the right hast hints. Same plain mdast in,
  // hast-tagged mdast out.
  const html = String(
    await unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(applyRules, meta.template as string | undefined)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeStringify, { allowDangerousHtml: true })
      .process(concrete),
  );

  const fullHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${meta.title}</title>
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <header class="site-header">
    <a href="/"><strong>Holiday Extras</strong></a>
  </header>
  <main class="page">
${html
    .split("\n")
    .map((l) => "    " + l)
    .join("\n")}
  </main>
</body>
</html>`;

  const rulesSource = fs.readFileSync(
    path.join(process.cwd(), "lib/rules.ts"),
    "utf-8",
  );

  return {
    source,
    data,
    meta: meta as Record<string, unknown>,
    body,
    concrete,
    ast,
    html,
    fullHtml,
    rules: {
      rulesSource,
      tokens: PREVIEW_TOKENS,
      components: PREVIEW_COMPONENTS,
    },
  };
}

export function trimAst(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(trimAst);
  if (node && typeof node === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      if (k === "position") continue;
      out[k] = trimAst(v);
    }
    return out;
  }
  return node;
}

// ── Stage definitions ──────────────────────────────────────────────────

export type FlowNode = {
  label: string;
  detail?: string;
  tone?: "input" | "process" | "output" | "neutral";
};

export type StageVisual =
  | { kind: "flow"; nodes: FlowNode[] }
  | { kind: "layers"; layers: Array<{ label: string; tone: string; sample?: string }> }
  | { kind: "tree"; ast: unknown }
  | { kind: "mapping"; rows: Array<{ from: string; to: string }> }
  | { kind: "substitution"; rows: Array<{ token: string; value: string }> };

export type Stage = {
  number: number;
  title: string;
  subtitle: string;
  blurb: string;
  detail: string[];
  highlight?: string;
  visual: StageVisual;
  panels: Array<{ label?: string; code: string; language: string }>;
  preview?: { html: string; mode: "fragment" | "full" };
};

export function buildStages(r: PipelineResult): Stage[] {
  return [
    {
      number: 0,
      title: "Source",
      subtitle: "Pure markdown — no directives, no special syntax",
      visual: {
        kind: "layers",
        layers: [
          { label: "Frontmatter", tone: "amber", sample: "title: …\\ntemplate: listing\\ndata: …" },
          { label: "Handlebars", tone: "rose", sample: "{{#each products}}\\n{{name}}" },
          { label: "Markdown", tone: "emerald", sample: "## Heading\\n![img](src)\\n> quote\\n- bullet\\n[link](url)" },
        ],
      },
      blurb:
        "Three layers: YAML frontmatter (config), Handlebars (data binding), and standard GFM markdown — headings, paragraphs, images, blockquotes, lists, links. That's it. No :::groups, no ::price, no named primitives. Anything an LLM produces by default works.",
      detail: [
        "An h2 followed by an image, a blockquote, a bold-with-currency line, a list of bullets, prose, and a link is exactly what an AI returns if you ask it to write a hotel listing in markdown — no schema awareness required.",
        "Frontmatter `template: listing` is the only authoring hint. It tells the renderer which detection rules apply to this document.",
      ],
      panels: [{ code: r.source, language: "markdown" }],
    },
    {
      number: 1,
      title: "Frontmatter",
      subtitle: "gray-matter splits meta from body",
      visual: {
        kind: "flow",
        nodes: [
          { label: "Source .md", tone: "input" },
          { label: "split at ---", tone: "process", detail: "gray-matter" },
          { label: "{ meta, body }", tone: "output" },
        ],
      },
      blurb:
        "The first transformation. Frontmatter becomes a typed object; body is everything below. The meta tells the pipeline which template's rules to use and which data file to load.",
      detail: [
        "template: listing is the entire authoring contract. The author never names a component. The renderer's rules know what listing pages look like.",
      ],
      panels: [
        { label: "meta", code: JSON.stringify(r.meta, null, 2), language: "json" },
        { label: "body (raw)", code: r.body, language: "markdown" },
      ],
    },
    {
      number: 2,
      title: "Concrete",
      subtitle: "Handlebars expands every {{ }} against the data",
      visual: {
        kind: "substitution",
        rows: substitutionRows(r),
      },
      blurb:
        "Templating ran. {{#each products}} produced two h2-headed product blocks. Hilton's blockquote highlight is gone — {{#if highlight}} was false. Crowne's CTA reads 'Show Packages (4)'; Hilton's reads 'Choose'.",
      detail: [
        "After this stage every {{token}} is gone. The output is plain markdown — h2s, images, blockquotes, lists, links — that would render correctly in any markdown viewer.",
      ],
      highlight: "Templating done. Still pure markdown.",
      panels: [{ code: r.concrete, language: "markdown" }],
    },
    {
      number: 3,
      title: "AST",
      subtitle: "remark parses standard mdast",
      visual: {
        kind: "tree",
        ast: trimAst(r.ast),
      },
      blurb:
        "Plain mdast. Headings, paragraphs (some carrying images, some carrying links, some carrying just text), blockquotes, lists. No directive nodes — there are no directives in the source.",
      detail: [
        "Notice no containerDirective or leafDirective anywhere. The structure carries all the information; the rules will read it.",
        "Position info has been stripped from the visual for readability — in real ASTs each node carries source location, which is what makes validation errors line-precise.",
      ],
      highlight: "Plain markdown structure.",
      panels: [{ code: JSON.stringify(trimAst(r.ast), null, 2), language: "json" }],
    },
    {
      number: 4,
      title: "Rules",
      subtitle: "Inference: structure → semantic role",
      visual: {
        kind: "mapping",
        rows: [
          { from: "h1 at top of doc", to: '.page-title' },
          { from: "h2 + content beneath it", to: 'article.card (grouped)' },
          { from: "paragraph holding only an image", to: 'img.card-hero' },
          { from: "blockquote", to: '.status.status--positive' },
          { from: "**…£…** alone in paragraph", to: '.price > .price-value' },
          { from: "bullet list", to: '.badges' },
          { from: "trailing link, alone in paragraph", to: 'a.cta.cta--primary' },
        ],
      },
      blurb:
        "No named primitives in the source. No alphabet to learn. Visual roles are INFERRED from structural shape + the frontmatter template. A blockquote becomes a status pill because that's what blockquotes mean in a listing-template document. Bold-with-currency is a price because that's what '**…£X**' looks like.",
      detail: [
        "Adding a new visual treatment doesn't add a new authoring primitive — it adds a new detection rule. The author keeps writing standard markdown; the renderer keeps inferring.",
        "Different templates can have different rule sets: a 'form' template might treat task-list items as fields. A 'gallery' template might cluster runs of images into a grid. The dialect is invariant — pure markdown — and the meaning depends on context.",
      ],
      highlight: "Pure markdown in. No alphabet to learn.",
      panels: [
        { label: "rules.ts", code: r.rules.rulesSource, language: "typescript" },
        { label: "preview-tokens.css", code: r.rules.tokens, language: "css" },
        { label: "preview-components.css", code: r.rules.components, language: "css" },
      ],
    },
    {
      number: 5,
      title: "HTML",
      subtitle: "What the rules produce",
      visual: {
        kind: "flow",
        nodes: [
          { label: "AST", tone: "input" },
          { label: "rules walk + classify", tone: "process" },
          { label: "rehype-stringify", tone: "process" },
          { label: "HTML body", tone: "output" },
        ],
      },
      blurb:
        "Each markdown node has been tagged with a class. Both cards have the same shape because they came from the same structural pattern (h2 + image + blockquote? + price + list + prose + link). Identical input shape → identical output, every time.",
      detail: [
        "The author wrote zero class names. The author named zero components. The classes here are entirely the renderer's decision based on structural inference.",
      ],
      panels: [{ code: r.html, language: "html" }],
      preview: { html: r.html, mode: "fragment" },
    },
    {
      number: 6,
      title: "Page",
      subtitle: "Shell wraps the body — final served HTML",
      visual: {
        kind: "flow",
        nodes: [
          { label: "HTML body", tone: "input" },
          { label: "shell template", tone: "process", detail: "head + chrome" },
          { label: "served document", tone: "output" },
        ],
      },
      blurb:
        "The shell template is the only template left in the new architecture. It wraps Stage 5 in <html>, head metadata, and the site header.",
      detail: [
        "Adding a new page in production is writing one markdown file. No template, no route handler, no component import.",
      ],
      panels: [{ code: r.fullHtml, language: "html" }],
      preview: { html: r.html, mode: "full" },
    },
  ];
}

function substitutionRows(r: PipelineResult): Array<{ token: string; value: string }> {
  const products = (r.data as { products?: Array<Record<string, unknown>> }).products ?? [];
  const first = products[0] ?? {};
  return [
    { token: "{{#each products}}", value: `→ iterates ${products.length} times` },
    { token: "{{name}}", value: String(first.name ?? "") },
    { token: "{{price}}", value: `"${String(first.price ?? "")}"` },
    { token: "{{location}}", value: String(first.location ?? "") },
    { token: "{{#if highlight}}", value: first.highlight ? "true → blockquote kept" : "false → blockquote elided" },
    { token: "{{#if packageCount}}", value: first.packageCount ? "true → 'Show Packages'" : "false → 'Choose'" },
  ];
}
