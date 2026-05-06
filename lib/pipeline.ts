// The 7-stage pipeline. Each stage transforms the previous and exposes its
// real output. The whole thing runs server-side at build/request time.
import matter from "gray-matter";
import Handlebars from "handlebars";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkDirective from "remark-directive";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { visit } from "unist-util-visit";
import type { Root } from "mdast";
import { SOURCE_MD, DATA_JSON } from "./source";

// ── Block handlers ─────────────────────────────────────────────────────
// One handler per primitive. These are the entire rendering rule set for
// the directive layer; everything else is plain markdown.

type DirectiveNode = {
  type: "containerDirective" | "leafDirective" | "textDirective";
  name: string;
  attributes?: Record<string, string>;
  children: unknown[];
  data?: Record<string, unknown>;
};

const CURRENCY_SYMBOL: Record<string, string> = { GBP: "£", USD: "$", EUR: "€" };

function blockHandlers() {
  return (tree: Root) => {
    visit(tree, (node) => {
      if (
        node.type !== "containerDirective" &&
        node.type !== "leafDirective" &&
        node.type !== "textDirective"
      )
        return;
      const d = node as unknown as DirectiveNode;
      const attrs = d.attributes ?? {};

      switch (d.name) {
        case "group": {
          const role = attrs.role ?? "region";
          const tag = role === "form" ? "form" : role === "panel" ? "aside" : "article";
          d.data = {
            hName: tag,
            hProperties: {
              className: ["group", `group--${role}`],
              "data-role": role,
              ...(attrs.id ? { "data-id": attrs.id } : {}),
            },
          };
          return;
        }
        case "image": {
          d.data = {
            hName: "img",
            hProperties: {
              src: attrs.src,
              alt: attrs.alt ?? "",
              loading: "lazy",
            },
          };
          return;
        }
        case "status": {
          const tone = attrs.tone ?? "info";
          d.data = {
            hName: "div",
            hProperties: { className: ["status", `status--${tone}`] },
          };
          return;
        }
        case "price": {
          const sym = CURRENCY_SYMBOL[attrs.currency ?? "GBP"] ?? "";
          d.children = [
            ...(attrs.label
              ? [
                  {
                    type: "text",
                    value: "",
                    data: {
                      hName: "span",
                      hProperties: { className: ["price-label"] },
                      hChildren: [{ type: "text", value: attrs.label }],
                    },
                  },
                ]
              : []),
            {
              type: "text",
              value: "",
              data: {
                hName: "span",
                hProperties: { className: ["price-value"] },
                hChildren: [{ type: "text", value: `${sym}${attrs.value}` }],
              },
            },
          ];
          d.data = {
            hName: "div",
            hProperties: { className: ["price"] },
          };
          return;
        }
        case "list": {
          const layout = attrs.layout ?? "stack";
          d.data = {
            hName: "div",
            hProperties: { className: ["list", `list--${layout}`] },
          };
          return;
        }
        case "action": {
          const variant = attrs.variant ?? "secondary";
          const isLink = attrs.href && !attrs.onclick && !attrs.submit;
          d.data = {
            hName: isLink ? "a" : "button",
            hProperties: {
              className: ["action", `action--${variant}`],
              ...(isLink ? { href: attrs.href } : { type: "button" }),
            },
          };
          return;
        }
        default: {
          d.data = {
            hName: "div",
            hProperties: { className: ["unknown-directive", `unknown--${d.name}`] },
          };
        }
      }
    });
  };
}

// ── Pipeline stages ────────────────────────────────────────────────────

export type PipelineResult = {
  stage0_source: string;
  stage1_data: unknown;
  stage2_meta: Record<string, unknown>;
  stage2_body: string;
  stage3_concrete: string;
  stage4_ast: unknown;
  stage5_html: string;
  stage6_fullHtml: string;
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

  return {
    stage0_source: source,
    stage1_data: data,
    stage2_meta: meta as Record<string, unknown>,
    stage2_body: body,
    stage3_concrete: concrete,
    stage4_ast: ast,
    stage5_html: html,
    stage6_fullHtml: fullHtml,
  };
}

// Strip position info from AST for cleaner display.
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

// ── Stage metadata for the UI ──────────────────────────────────────────

export type Stage = {
  number: number;
  title: string;
  subtitle: string;
  blurb: string;
  detail: string[];
  highlight?: string;
  /** Pre-highlighted code panels for this stage */
  panels: Array<{
    label?: string;
    code: string;
    language: string;
  }>;
  /** Stage 5 / 6: render the live HTML preview alongside */
  preview?: { html: string; mode: "fragment" | "full" };
};

export function buildStages(r: PipelineResult): Stage[] {
  return [
    {
      number: 0,
      title: "Source",
      subtitle: "The markdown file as authored",
      blurb:
        "Three layers stacked: YAML frontmatter, Handlebars templating, directive blocks for semantic shapes plain markdown can't carry.",
      detail: [
        "An LLM produces this format the same way it produces any markdown — no special API, no JSX, no schema gymnastics. The format itself is the contract.",
        "Plain markdown still works: # ## - * [link](href). Directives only appear where standard markdown can't carry the meaning.",
      ],
      panels: [{ code: r.stage0_source, language: "markdown" }],
    },
    {
      number: 1,
      title: "Data",
      subtitle: "JSON the frontmatter referenced",
      blurb:
        "Two products, deliberately different — Crowne Plaza has both a highlight and a packageCount; Hilton has neither. Both {{#if}} branches will fire.",
      detail: [
        "The data: field in frontmatter could equally be a URL — the renderer just needs JSON at this point in the pipeline. The original prototype's /hotels route uses a live API call.",
      ],
      panels: [
        { code: JSON.stringify(r.stage1_data, null, 2), language: "json" },
      ],
    },
    {
      number: 2,
      title: "Frontmatter",
      subtitle: "After gray-matter splits meta from body",
      blurb:
        "The first transformation. The --- fences are recognised; frontmatter becomes a typed object, the body is everything below. Nothing else has been parsed.",
      detail: [
        "Frontmatter resolution is what tells the pipeline which template, which data, and which title to use. Everything else is still raw text.",
      ],
      panels: [
        { label: "meta", code: JSON.stringify(r.stage2_meta, null, 2), language: "json" },
        { label: "body (raw)", code: r.stage2_body, language: "markdown" },
      ],
    },
    {
      number: 3,
      title: "Concrete",
      subtitle: "After Handlebars expands every {{ }}",
      blurb:
        "Templating ran. {{#each products}} produced two card blocks. Hilton's :::status block is gone — {{#if highlight}} was false. Crowne's CTA reads 'Show Packages (4)'; Hilton's reads 'Choose'.",
      detail: [
        "Notably this is still valid markdown text — you could commit this output and skip Handlebars at request time if your content is fully static. But it's also the last point at which the document is just a string.",
      ],
      highlight: "Templating done. Still text — no structure yet.",
      panels: [{ code: r.stage3_concrete, language: "markdown" }],
    },
    {
      number: 4,
      title: "AST",
      subtitle: "After remark + remark-directive parse",
      blurb:
        "Strings became a tree. Standard markdown nodes (heading, paragraph, list) sit alongside containerDirective and leafDirective nodes. Each directive carries name and attributes.",
      detail: [
        "This is the structured schema the proposal describes — the layer between markdown (input) and rendered UI (output). Iterate it differently and you get JSON for iOS, table-based HTML for email, paged HTML for print.",
        "Position info (line/column) has been stripped here for readability — in real ASTs each node carries source location, which is what makes validation errors line-precise.",
      ],
      highlight: "The boundary. Text became structure.",
      panels: [
        { code: JSON.stringify(trimAst(r.stage4_ast), null, 2), language: "json" },
      ],
    },
    {
      number: 5,
      title: "HTML",
      subtitle: "After block handlers walk the tree",
      blurb:
        "Each directive node was transformed by its handler. group{role=card} → <article class=\"group group--card\">. price got currency-symbol formatting. action with an href emitted <a> rather than <button>.",
      detail: [
        "The handlers are the entire rendering rule set for the directive layer. Roughly ten small functions, five lines each. New primitive = new handler. New pattern = no new code.",
        "Swap these handlers with iOS or email versions and the same Stage 4 tree drives every target.",
      ],
      highlight: "The only target-specific step.",
      panels: [{ code: r.stage5_html, language: "html" }],
      preview: { html: r.stage5_html, mode: "fragment" },
    },
    {
      number: 6,
      title: "Page",
      subtitle: "Shell wraps the body — final served HTML",
      blurb:
        "The shell template is the only template left in the new architecture. It wraps Stage 5 in <html>, head metadata, the site header. Per-page templates are gone.",
      detail: [
        "Adding a new page in production becomes writing one markdown file. No new template, no new route handler, no new code.",
      ],
      panels: [{ code: r.stage6_fullHtml, language: "html" }],
      preview: { html: r.stage5_html, mode: "full" },
    },
  ];
}
