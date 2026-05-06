// Block handlers — the entire rendering rule set for the directive layer.
// One handler per primitive: group, image, status, price, list, action.
// New primitive = new handler. New pattern = no new code.
//
// This file is also displayed verbatim in the "Rules" stage of the
// walkthrough — it IS the rule set, not just a simulation of it.
import { visit } from "unist-util-visit";
import type { Root } from "mdast";

type DirectiveNode = {
  type: "containerDirective" | "leafDirective" | "textDirective";
  name: string;
  attributes?: Record<string, string>;
  children: unknown[];
  data?: Record<string, unknown>;
};

const CURRENCY_SYMBOL: Record<string, string> = { GBP: "£", USD: "$", EUR: "€" };

// Containers whose body is a single paragraph (button labels, status
// messages) get the <p> wrapper unwrapped — we want <a>Show Packages</a>
// not <a><p>Show Packages</p></a>.
function unwrapTextBody(d: DirectiveNode) {
  if (
    d.children &&
    d.children.length === 1 &&
    (d.children[0] as { type?: string; children?: unknown[] }).type === "paragraph"
  ) {
    d.children = (d.children[0] as { children: unknown[] }).children;
  }
}

export function blockHandlers() {
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
            hProperties: { src: attrs.src, alt: attrs.alt ?? "", loading: "lazy" },
          };
          return;
        }
        case "status": {
          const tone = attrs.tone ?? "info";
          unwrapTextBody(d);
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
          d.data = { hName: "div", hProperties: { className: ["price"] } };
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
          unwrapTextBody(d);
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
