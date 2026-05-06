// The 6-stage pipeline, run live.
// Each stage transforms the previous and returns its output for inspection.
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
// One small handler per primitive. These are the ENTIRE rendering rules
// for the directive layer — everything else is plain markdown.

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
          // Replace children with a structured set of spans.
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
          // Unknown directive — render as a div with a marker class so
          // validation can flag it without breaking the page.
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
  // Stage 0 — source as authored
  const source = SOURCE_MD;

  // Stage 1 — data file (in this demo, an in-memory object)
  const data = DATA_JSON;

  // Stage 2 — gray-matter splits frontmatter from body
  const parsed = matter(source);
  const meta = parsed.data;
  const body = parsed.content;

  // Stage 3 — Handlebars expands {{...}} against the data
  const concrete = Handlebars.compile(body, { noEscape: true })(data);

  // Stage 4 — markdown + directives → AST
  const processor = unified().use(remarkParse).use(remarkGfm).use(remarkDirective);
  const ast = processor.parse(concrete);

  // Stage 5 — block handlers + rehype-stringify → HTML body
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

  // Stage 6 — wrapped in shell HTML
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

// Strip the AST down to the interesting bits for display (drop position info).
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
