// The 7-stage pipeline.
//   0. Source — markdown as authored
//   1. Frontmatter — gray-matter splits meta from body
//   2. Concrete — Handlebars expands {{ }} against the data file
//   3. AST — remark + remark-directive parse to a tree
//   4. Rules — block handlers + design tokens + component CSS
//   5. HTML — block handlers walk the tree, design system styles the result
//   6. Page — final served document
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import Handlebars from "handlebars";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkDirective from "remark-directive";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { SOURCE_MD, DATA_JSON } from "./source";
import { blockHandlers } from "./blocks";
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
  rules: { handlersSource: string; tokens: string; components: string };
};

export async function runPipeline(): Promise<PipelineResult> {
  const source = SOURCE_MD;
  const data = DATA_JSON;

  const parsed = matter(source);
  const meta = parsed.data;
  const body = parsed.content;

  const concrete = Handlebars.compile(body, { noEscape: true })(data);

  const ast = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkDirective)
    .parse(concrete);

  const html = String(
    await unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkDirective)
      .use(blockHandlers)
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

  // The actual block-handlers source code, shown in the Rules stage so
  // it's clear these aren't pseudocode — this is the rule set, in full.
  const handlersSource = fs.readFileSync(
    path.join(process.cwd(), "lib/blocks.ts"),
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
      handlersSource,
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
  // Linear input → process → output diagram
  | { kind: "flow"; nodes: FlowNode[] }
  // Concentric layers (used on Source stage to show the 3 layers)
  | { kind: "layers"; layers: Array<{ label: string; tone: string; sample?: string }> }
  // Tree view (used on AST stage)
  | { kind: "tree"; ast: unknown }
  // Mapping table (used on Rules stage — directive → element + class)
  | { kind: "mapping"; rows: Array<{ from: string; to: string }> }
  // Substitution table (used on Concrete stage — show {{var}} → value pairs)
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
  /** Stage shows the live HTML preview alongside */
  preview?: { html: string; mode: "fragment" | "full" };
};

export function buildStages(r: PipelineResult): Stage[] {
  return [
    {
      number: 0,
      title: "Source",
      subtitle: "Markdown as authored — three layers stacked in one file",
      visual: {
        kind: "layers",
        layers: [
          { label: "Frontmatter", tone: "amber", sample: "title: …\\ndata: …" },
          { label: "Handlebars", tone: "rose", sample: "{{#each products}}\\n{{name}}" },
          { label: "Directives", tone: "violet", sample: "::::group{role=card}\\n::price{value=…}" },
          { label: "Markdown", tone: "emerald", sample: "# Heading\\n- bullet" },
        ],
      },
      blurb:
        "Three layers stacked: YAML frontmatter (config), Handlebars (templating), directives (semantic blocks). Plain markdown still works for everything else — # headings, bullets, paragraphs.",
      detail: [
        "Outer containers use ::::group (4 colons) so they survive nesting around inner :::status / :::list / :::action containers (3 colons).",
        "An LLM produces this format the same way it produces any markdown — no special API, no schema. The format itself is the contract.",
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
        "The first transformation. The --- fences are recognised; frontmatter becomes a typed object, the body is everything below. The meta tells the pipeline which data file to load and which template to use. Nothing else has been parsed.",
      detail: [
        "data: data/hotels.json points the renderer at a JSON file (or a URL — same shape either way). That data feeds Handlebars in the next stage.",
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
        "Templating ran. {{#each products}} produced two card blocks. Hilton's :::status block is gone — {{#if highlight}} was false. Crowne's CTA reads 'Show Packages (4)'; Hilton's reads 'Choose'.",
      detail: [
        "Values come from the JSON loaded via frontmatter (data/hotels.json — Crowne Plaza, Hilton Garden Inn, prices, badges). After this stage every {{token}} is gone.",
        "This is still valid markdown text — you could commit this output and skip Handlebars at request time if content is fully static.",
      ],
      highlight: "Templating done. Still text.",
      panels: [{ code: r.concrete, language: "markdown" }],
    },
    {
      number: 3,
      title: "AST",
      subtitle: "remark + remark-directive parse to a tree",
      visual: {
        kind: "tree",
        ast: trimAst(r.ast),
      },
      blurb:
        "Strings became a tree. Standard markdown nodes (heading, paragraph, list) sit alongside containerDirective and leafDirective nodes. Each directive carries name and attributes.",
      detail: [
        "This is the structured schema the proposal describes — the layer between markdown (input) and rendered UI (output). Iterate it differently and you get JSON for iOS, table-based HTML for email, paged HTML for print.",
        "Position info (line/column) has been stripped from the tree visual for readability — in real ASTs each node carries source location, which is what makes validation errors line-precise.",
      ],
      highlight: "The boundary. Text → structure.",
      panels: [{ code: JSON.stringify(trimAst(r.ast), null, 2), language: "json" }],
    },
    {
      number: 4,
      title: "Rules",
      subtitle: "Handlers + design tokens + component CSS",
      visual: {
        kind: "mapping",
        rows: [
          { from: "::::group{role=card}", to: '<article class="group group--card">' },
          { from: "::image{src= alt=}", to: '<img src= alt= loading="lazy">' },
          { from: ":::status{tone=positive}", to: '<div class="status status--positive">' },
          { from: "::price{value= currency=GBP}", to: '<div class="price"><span>£…</span></div>' },
          { from: ":::list{layout=inline}", to: '<div class="list list--inline">' },
          { from: ":::action{href= variant=primary}", to: '<a class="action action--primary" href=>' },
        ],
      },
      blurb:
        "The visible rule set. Three artifacts together turn the AST into rendered UI: handlers (which directive becomes which element + class), tokens (colour / type / spacing primitives), and component CSS (how each class consumes those tokens). Every card on every page flows through these.",
      detail: [
        "There is no 'LoungeCard' or 'HotelCard' component anywhere. There is one .group--card style. Both rendered cards in the preview consume it identically. Consistency comes from this layer being the only place visual decisions are made.",
        "Replace the handlers with a JSON emitter and Stage 5 becomes an iOS manifest. Replace them with a table emitter and it becomes email HTML. Tokens stay; components specialise.",
      ],
      highlight: "Where every pixel comes from",
      panels: [
        { label: "blocks.ts — handlers", code: r.rules.handlersSource, language: "typescript" },
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
          { label: "block handlers", tone: "process", detail: "walk + transform" },
          { label: "rehype-stringify", tone: "process" },
          { label: "HTML body", tone: "output" },
        ],
      },
      blurb:
        "Each directive node was transformed by its handler. group{role=card} → <article class=\"group group--card\">. price got currency-symbol formatting. action with an href emitted <a> rather than <button>. The classes here are exactly the classes the design system styles.",
      detail: [
        "Both cards consume the same .group--card style. The :::status pill on Crowne is .status--positive — same class any other 'positive' message anywhere would use. Different content, identical rules.",
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
          { label: "shell.ejs", tone: "process", detail: "head + chrome" },
          { label: "served document", tone: "output" },
        ],
      },
      blurb:
        "The shell template is the only template left in the new architecture. It wraps Stage 5 in <html>, head metadata, and the site header. Per-page templates are gone.",
      detail: [
        "Adding a new page in production becomes writing one markdown file. No new template, no new route handler, no new code.",
      ],
      panels: [{ code: r.fullHtml, language: "html" }],
      preview: { html: r.html, mode: "full" },
    },
  ];
}

// Pull a few illustrative substitutions out of the data → markdown step.
// We don't try to exhaustively diff — just show the user a handful of
// representative {{token}} → value rows so they see what's happening.
function substitutionRows(r: PipelineResult): Array<{ token: string; value: string }> {
  const products = (r.data as { products?: Array<Record<string, unknown>> }).products ?? [];
  const first = products[0] ?? {};
  return [
    { token: "{{#each products}}", value: `→ iterates ${products.length} times` },
    { token: "{{name}}", value: String(first.name ?? "") },
    { token: "{{price}}", value: `"${String(first.price ?? "")}"` },
    { token: "{{location}}", value: String(first.location ?? "") },
    { token: "{{#if highlight}}", value: first.highlight ? "true → block kept" : "false → block elided" },
    { token: "{{#if packageCount}}", value: first.packageCount ? "true → 'Show Packages'" : "false → 'Choose'" },
  ];
}
