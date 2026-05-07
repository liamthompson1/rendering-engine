// The rendering rules.
//
// No named primitives. No directives. Pure markdown comes in and the
// renderer INFERS shape from structure + frontmatter context.
//
// Two layers:
//
//   1. Layout rules (chosen by frontmatter `template:`)
//      Decide how to GROUP top-level nodes into semantic regions.
//      e.g. listing → every h2 starts a new card, content beneath it
//      becomes the card body.
//
//   2. Classification rules (run inside each grouped region)
//      Inspect each node's structural shape and tag it with a class.
//      e.g. blockquote → highlight pill. paragraph containing only
//      bold-with-currency → price line. paragraph containing only a
//      single link at the end → primary CTA. Bullet list → badge row.
//
// Every visual decision flows from these rules acting on standard
// markdown shapes. Adding a new visual treatment doesn't add a new
// authoring primitive; it adds a new detection rule.
import { visit } from "unist-util-visit";
import type { Root, RootContent, Heading, Paragraph, Image, Link } from "mdast";

// Currency-detector for the price rule. A bold run that contains a
// currency symbol followed by digits is treated as a price line, no
// matter where in the text the symbol appears.
const CURRENCY_RE = /[£$€¥]\s*\d/;

// ── Layout rule registry ───────────────────────────────────────────────
// Each frontmatter `template:` value maps to a layout rule. The rule
// regroups the root's children into typed regions. If no template
// matches, the document is left as-is (plain prose styling).

type LayoutRule = (tree: Root) => void;

const layouts: Record<string, LayoutRule> = {
  listing: listingLayout,
};

export function applyRules(template: string | undefined) {
  return (tree: Root) => {
    const rule = template ? layouts[template] : undefined;
    if (rule) rule(tree);
    classifyEverywhere(tree);
  };
}

// ── Layout: listing ────────────────────────────────────────────────────
// Group every h2 + everything beneath it (until the next h2) into a card.
// h1 stays at the top as the page title.

function listingLayout(tree: Root) {
  const out: RootContent[] = [];
  let card: CardGroup | null = null;

  for (const node of tree.children) {
    if (node.type === "heading" && (node as Heading).depth === 1) {
      flush();
      out.push(node);
    } else if (node.type === "heading" && (node as Heading).depth === 2) {
      flush();
      card = makeCard(node as Heading);
    } else if (card) {
      card.children.push(node);
    } else {
      out.push(node);
    }
  }
  flush();
  tree.children = out;

  function flush() {
    if (card) {
      out.push(card as unknown as RootContent);
      card = null;
    }
  }
}

// We hijack containerDirective as the carrier for "card region" since
// remark-rehype already knows how to flatten its data.hName + children
// down to HTML. The token never appears in source markdown — we synth
// it ourselves from the layout rule.
type CardGroup = {
  type: "containerDirective";
  name: "_card";
  attributes: Record<string, string>;
  data: { hName: string; hProperties: { className: string[] } };
  children: RootContent[];
};

function makeCard(heading: Heading): CardGroup {
  return {
    type: "containerDirective",
    name: "_card",
    attributes: {},
    data: { hName: "article", hProperties: { className: ["card"] } },
    children: [heading],
  };
}

// ── Classification: walk every node, attach hast hints ─────────────────
// These rules apply universally; they're how the design system reaches
// into standard markdown shapes.

function classifyEverywhere(tree: Root) {
  // Page-level h1
  for (const node of tree.children) {
    if (node.type === "heading" && (node as Heading).depth === 1) {
      attach(node, "h1", ["page-title"]);
    }
  }

  // Walk into card regions. Cards are synthesised by listingLayout —
  // they don't appear in standard mdast types, so we identify them by
  // the marker name we set rather than by the `type` field.
  visit(tree, (node: unknown) => {
    const n = node as { name?: string };
    if (n.name === "_card") {
      classifyCardChildren(node as unknown as CardGroup);
    }
  });
}

function classifyCardChildren(card: CardGroup) {
  let sawImage = false;
  for (let i = 0; i < card.children.length; i++) {
    const n = card.children[i];
    const isLast = i === card.children.length - 1;

    // h2 → card title
    if (n.type === "heading" && (n as Heading).depth === 2) {
      attach(n, "h2", ["card-title"]);
      continue;
    }

    // Paragraph holding ONLY an image → hero
    if (!sawImage && n.type === "paragraph" && isImageOnly(n as Paragraph)) {
      const img = (n as Paragraph).children[0] as Image;
      attach(img, "img", ["card-hero"], {
        src: img.url,
        alt: img.alt ?? "",
        loading: "lazy",
      });
      attach(n, "div", ["card-hero-wrap"]);
      sawImage = true;
      continue;
    }

    // Blockquote → status pill (the single paragraph inside is unwrapped
    // so the pill renders as a tight inline block, not block-level prose)
    if (n.type === "blockquote") {
      const inner = (n as { children: RootContent[] }).children?.[0];
      if (inner && inner.type === "paragraph") {
        // Replace blockquote children with paragraph's children
        (n as { children: RootContent[] }).children =
          (inner as Paragraph).children as unknown as RootContent[];
      }
      attach(n, "div", ["status", "status--positive"]);
      continue;
    }

    // Paragraph with **bold containing currency** as its only child → price
    if (n.type === "paragraph" && isBoldPriceOnly(n as Paragraph)) {
      attach(n, "div", ["price"]);
      const strong = (n as Paragraph).children[0] as { type: string; children?: RootContent[] };
      // Render the strong as an inline span so we can tone the whole price
      attach(strong as RootContent, "span", ["price-value"]);
      continue;
    }

    // Bullet list → badge row. Don't override hName — keep the natural
    // <ul> element so listItems remain valid <li> children. Just attach
    // the class so CSS can flex the row.
    if (n.type === "list") {
      addClass(n, ["badges"]);
      continue;
    }

    // Last paragraph that's just a link → CTA
    if (
      isLast &&
      n.type === "paragraph" &&
      isLinkOnly(n as Paragraph)
    ) {
      const link = (n as Paragraph).children[0] as Link;
      attach(link, "a", ["cta", "cta--primary"], { href: link.url });
      attach(n, "div", ["cta-wrap"]);
      continue;
    }

    // Otherwise paragraph → meta line / prose
    if (n.type === "paragraph") {
      attach(n, "p", ["card-prose"]);
    }
  }
}

// ── helpers ────────────────────────────────────────────────────────────

function attach(
  node: RootContent | Image | Link,
  hName: string,
  classes: string[],
  extra: Record<string, unknown> = {},
) {
  const n = node as { data?: Record<string, unknown> };
  n.data = {
    ...(n.data ?? {}),
    hName,
    hProperties: { className: classes, ...extra },
  };
}

// Add a class without overriding the natural element. Used for nodes
// where the default hast tag is correct (e.g. list → <ul>) and we just
// want the design system to recognise it.
function addClass(node: RootContent, classes: string[]) {
  const n = node as { data?: { hProperties?: Record<string, unknown> } };
  n.data = {
    ...(n.data ?? {}),
    hProperties: { ...(n.data?.hProperties ?? {}), className: classes },
  };
}

function isImageOnly(p: Paragraph): boolean {
  const kids = p.children ?? [];
  return kids.length === 1 && kids[0].type === "image";
}

function isLinkOnly(p: Paragraph): boolean {
  const kids = p.children ?? [];
  return kids.length === 1 && kids[0].type === "link";
}

function isBoldPriceOnly(p: Paragraph): boolean {
  const kids = p.children ?? [];
  if (kids.length !== 1 || kids[0].type !== "strong") return false;
  const strong = kids[0] as { children?: Array<{ type: string; value?: string }> };
  const text = (strong.children ?? [])
    .map((c) => (c.type === "text" ? c.value ?? "" : ""))
    .join("");
  return CURRENCY_RE.test(text);
}
