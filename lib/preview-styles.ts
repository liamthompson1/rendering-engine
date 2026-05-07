// The design system for the rendered preview.
//
// These class names are the OUTPUT of the rules engine — they're not
// authoring primitives. Authors write pure markdown; the renderer infers
// these classes from structural shape; the CSS below paints them.
//
// Two parts: design tokens (the primitives every visual decision composes
// from) and the component rules (how each rule-emitted class consumes
// those tokens). The strings here are both injected into the page via
// <PreviewStyles> and shown verbatim in the Rules stage. Single source
// of truth.

export const PREVIEW_TOKENS = `/* Design tokens — every visual decision composes from these. */
.preview-content,
.preview-shell-header {
  /* Colour */
  --hx-purple:        #5b2a86;
  --hx-purple-light:  #7c3aed;
  --hx-green:         #047857;
  --hx-green-bg:      rgba(16,185,129,0.10);
  --hx-amber:         #b45309;
  --hx-amber-bg:      rgba(245,158,11,0.10);

  --ink-1: #09090b;   /* primary text */
  --ink-2: #18181b;
  --ink-3: #52525b;   /* body */
  --ink-4: #71717a;   /* meta */
  --line:  rgba(0, 0, 0, 0.06);

  --surface-card:     linear-gradient(180deg, #ffffff, #fafafb);
  --surface-page:     linear-gradient(180deg, #fafafa, #f4f4f5);

  /* Spacing */
  --space-card-pad:   1.5rem;
  --space-stack-sm:   0.5rem;
  --space-stack:      0.75rem;
  --space-stack-lg:   1.5rem;

  /* Type */
  --type-h1:          clamp(1.875rem, 3vw, 2.5rem);
  --type-h2:          1.25rem;
  --type-body:        0.9375rem;
  --type-meta:        0.8125rem;

  /* Radii */
  --radius-card:      18px;
  --radius-pill:      999px;
  --radius-button:    10px;
  --radius-tile:      6px;

  /* Shadows */
  --shadow-card:      0 1px 2px rgba(0,0,0,0.04), 0 12px 32px -16px rgba(0,0,0,0.08);
  --shadow-card-hover:0 1px 2px rgba(0,0,0,0.04), 0 24px 56px -20px rgba(91,42,134,0.18);
  --shadow-action:    0 1px 0 rgba(255,255,255,0.15) inset, 0 4px 14px -4px rgba(91,42,134,0.5);
}
`;

export const PREVIEW_COMPONENTS = `/* The preview frame itself */
.preview-stage {
  background: var(--surface-page);
  font-family: var(--font-geist-sans), system-ui, -apple-system, sans-serif;
  color: var(--ink-1);
  border-radius: 0 0 1rem 1rem;
}

/* Layout: cards auto-fit into a grid; page title spans columns.
   These rules apply to the rule-emitted .card and .page-title — the
   author wrote h1 and h2 + body content and got this layout. */
.preview-content {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}
@media (min-width: 720px) {
  .preview-content {
    grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
    column-gap: 1.25rem;
    row-gap: 1.5rem;
  }
  .preview-content > .page-title {
    grid-column: 1 / -1;
  }
}

/* Page heading (rule: h1 at top of doc) */
.preview-content > .page-title {
  font-size: var(--type-h1);
  font-weight: 700;
  letter-spacing: -0.03em;
  color: var(--ink-1);
  margin: 0;
  line-height: 1.05;
}

/* ── Card (rule: h2 + content grouped) ─────────────────────────────── */
.preview-content .card {
  display: flex;
  flex-direction: column;
  background: var(--surface-card);
  border: 1px solid var(--line);
  border-radius: var(--radius-card);
  margin: 0;
  overflow: hidden;
  box-shadow: var(--shadow-card);
  transition: transform 0.25s cubic-bezier(0.22,1,0.36,1),
              box-shadow 0.25s cubic-bezier(0.22,1,0.36,1);
}
.preview-content .card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-card-hover);
}

/* Hero image (rule: paragraph holding ONLY an image, first occurrence) */
.preview-content .card-hero-wrap {
  display: block;
  margin: 0;
  padding: 0;
  line-height: 0;
}
.preview-content .card-hero {
  display: block;
  width: 100%;
  height: 220px;
  object-fit: cover;
  background: linear-gradient(135deg, #ddd6fe 0%, #fbcfe8 50%, #99f6e4 100%);
}

/* Card body — every direct child of .card except the hero gets inset */
.preview-content .card > .card-title,
.preview-content .card > .status,
.preview-content .card > .price,
.preview-content .card > .badges,
.preview-content .card > .card-prose,
.preview-content .card > .cta-wrap {
  margin-left: var(--space-card-pad);
  margin-right: var(--space-card-pad);
}
.preview-content .card > .card-title    { margin-top: 1.125rem; margin-bottom: var(--space-stack-sm); }
.preview-content .card > .status        { margin-top: var(--space-stack-sm); margin-bottom: var(--space-stack); }
.preview-content .card > .cta-wrap      { margin-top: auto; margin-bottom: var(--space-card-pad); }

/* Title (rule: h2 inside grouped card) */
.preview-content .card-title {
  font-size: var(--type-h2);
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--ink-1);
  line-height: 1.25;
}

/* Status pill (rule: blockquote in a listing card) */
.preview-content .status {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.625rem;
  border-radius: var(--radius-pill);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  align-self: flex-start;
}
.preview-content .status::before {
  content: "";
  display: block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}
.preview-content .status--positive { background: var(--hx-green-bg); color: var(--hx-green); }
.preview-content .status--warning  { background: var(--hx-amber-bg); color: var(--hx-amber); }

/* Price (rule: paragraph containing only **…£…**) */
.preview-content .price {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  margin: 0 0 0.625rem;
}
.preview-content .price-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--hx-purple);
  letter-spacing: -0.015em;
}

/* Card prose (rule: any paragraph that wasn't a hero/price/cta) */
.preview-content .card-prose {
  margin: 0 0 var(--space-stack);
  color: var(--ink-3);
  font-size: var(--type-body);
  line-height: 1.5;
}

/* Badges (rule: bullet list inside a card — natural <ul> kept) */
.preview-content .badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  list-style: none;
  padding: 0;
  margin: 0.5rem 0 0.875rem;
}
.preview-content .badges li {
  list-style: none;
  padding: 0.25rem 0.625rem;
  border-radius: var(--radius-tile);
  background: linear-gradient(180deg, #fafafa, #f4f4f5);
  border: 1px solid var(--line);
  color: var(--ink-3);
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.01em;
}

/* CTA (rule: trailing link, alone in paragraph) */
.preview-content .cta-wrap {
  display: block;
  margin: 0;
}
.preview-content .cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  padding: 0.625rem 1.125rem;
  border-radius: var(--radius-button);
  font-weight: 600;
  text-decoration: none;
  font-size: 0.875rem;
  letter-spacing: -0.005em;
  transition: transform 0.12s ease, box-shadow 0.12s ease;
  cursor: pointer;
  border: 0;
  align-self: flex-start;
}
.preview-content .cta--primary {
  background: linear-gradient(135deg, var(--hx-purple) 0%, var(--hx-purple-light) 100%);
  color: #fff;
  box-shadow: var(--shadow-action);
}
.preview-content .cta--primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 1px 0 rgba(255,255,255,0.15) inset, 0 8px 24px -6px rgba(91,42,134,0.6);
}

/* Shell mock for Stage Page */
.preview-shell-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1.25rem;
  margin: -1rem -1rem 1.5rem -1rem;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--line);
  font-size: var(--type-meta);
}
@media (min-width: 768px) {
  .preview-shell-header {
    margin: -1.5rem -1.5rem 1.5rem -1.5rem;
    padding: 0.875rem 1.5rem;
  }
}
.preview-shell-logo { font-weight: 700; color: var(--hx-purple); letter-spacing: -0.01em; }
.preview-shell-tagline { color: var(--ink-4); font-size: 0.75rem; }
`;
