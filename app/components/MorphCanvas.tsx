"use client";
// MorphCanvas — the same hotel content rendered in 7 different visual
// states, one per pipeline stage. Each "element" (title, image, status,
// price, etc.) keeps a stable React identity across stages so Motion's
// `layout` animation morphs its position, size, colour, and typography
// between renders.
//
// Stage 0/1 — raw markdown text
// Stage 2   — markdown text with values resolved
// Stage 3   — boxed AST-node representations
// Stage 4   — boxes labelled with their semantic role
// Stage 5/6 — fully styled rendered card
import { motion, MotionConfig } from "motion/react";
import type { ReactNode } from "react";

const PRODUCT = {
  name: "Crowne Plaza Manchester Airport T1",
  imageUrl: "https://picsum.photos/seed/crowne-plaza-t1/1200/600",
  highlight: "Walk to T1 in 5 minutes",
  meta: "Adjacent to Terminal 1 · ★ 4 · 8.6/10",
  priceLabel: "Hotel packages from",
  priceValue: "£129.00",
  badges: ["Flextras: Free Cancellation", "Never Beaten on Price"],
  description:
    "Modern 4-star hotel a 5-minute walk from T1 with restaurant, bar and free wifi.",
  ctaLabel: "Show Packages (4)",
  ctaHref: "/hotel/crowne-plaza-t1/packages",
};

const SPRING = { type: "spring", stiffness: 220, damping: 28, mass: 0.6 } as const;

export function MorphCanvas({ stage }: { stage: number }) {
  // The card frame appears at stage 3 onwards (when structure is recognised)
  const isStructured = stage >= 3;
  const isStyled = stage >= 5;
  const isPage = stage >= 6;

  return (
    <MotionConfig transition={SPRING}>
      <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
        {/* Page chrome only at Stage 6 (Page) */}
        <motion.div
          initial={false}
          animate={{
            height: isPage ? 48 : 0,
            opacity: isPage ? 1 : 0,
          }}
          className="overflow-hidden"
          style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.04), transparent)",
            borderBottom: isPage ? "1px solid rgba(255,255,255,0.06)" : "none",
          }}
        >
          <div className="flex items-center justify-between px-5 h-12 text-[13px]">
            <span className="font-bold tracking-tight text-violet-300">Holiday Extras</span>
            <span className="text-zinc-500 text-xs">Less hassle, more holiday</span>
          </div>
        </motion.div>

        {/* The morph stage — background shifts from "code editor" to "page" */}
        <motion.div
          animate={{
            backgroundColor: isStyled ? "#fafafa" : "rgba(8, 8, 12, 0.4)",
            paddingTop: isStyled ? 0 : 24,
            paddingBottom: 24,
          }}
          className="relative"
        >
          {/* Frontmatter card — only visible on Stage 1 */}
          <motion.div
            initial={false}
            animate={{
              opacity: stage === 1 ? 1 : 0,
              y: stage === 1 ? 0 : -10,
              height: stage === 1 ? "auto" : 0,
            }}
            className="overflow-hidden mx-5 mb-3"
          >
            <div className="rounded-lg border border-amber-400/30 bg-amber-500/[0.08] px-4 py-2.5 font-mono text-xs text-amber-100">
              <div className="text-[10px] uppercase tracking-widest text-amber-300/70 mb-1">
                meta
              </div>
              <div>title: Hotels at Manchester Airport</div>
              <div>template: listing</div>
              <div>data: data/hotels.json</div>
            </div>
          </motion.div>

          {/* The content. Each element has stable identity via key + layout */}
          <motion.div
            layout
            className={isStyled ? "" : "px-5"}
            transition={SPRING}
          >
            <Card isStructured={isStructured} isStyled={isStyled}>
              {/* Image */}
              <Element key="image" stage={stage} kind="image" />

              {/* Title */}
              <Element key="title" stage={stage} kind="title" />

              {/* Status — only shows when there's a highlight */}
              <Element key="status" stage={stage} kind="status" />

              {/* Meta line */}
              <Element key="meta" stage={stage} kind="meta" />

              {/* Price */}
              <Element key="price" stage={stage} kind="price" />

              {/* Badges */}
              <Element key="badges" stage={stage} kind="badges" />

              {/* Description */}
              <Element key="description" stage={stage} kind="description" />

              {/* CTA */}
              <Element key="cta" stage={stage} kind="cta" />
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </MotionConfig>
  );
}

// The card frame fades in once structure is recognised (Stage 3+)
function Card({
  isStructured,
  isStyled,
  children,
}: {
  isStructured: boolean;
  isStyled: boolean;
  children: ReactNode;
}) {
  return (
    <motion.div
      layout
      animate={{
        backgroundColor: isStyled ? "#ffffff" : "transparent",
        borderRadius: isStyled ? 18 : 12,
        boxShadow: isStyled
          ? "0 1px 2px rgba(0,0,0,0.04), 0 12px 32px -16px rgba(0,0,0,0.08)"
          : "0 0 0 1px rgba(255,255,255,0.04) inset",
        borderColor: isStructured && !isStyled ? "rgba(167,139,250,0.25)" : "rgba(0,0,0,0.06)",
        borderWidth: isStructured ? 1 : 0,
        borderStyle: "solid",
        margin: isStyled ? "0 1.5rem" : "0",
        overflow: "hidden",
      }}
      transition={SPRING}
    >
      <motion.div layout className="flex flex-col">
        {children}
      </motion.div>
    </motion.div>
  );
}

// ── Element ────────────────────────────────────────────────────────────
// One persistent element across all stages. The visual changes based on
// stage; the layout / position is animated by motion automatically.
type ElementKind =
  | "image"
  | "title"
  | "status"
  | "meta"
  | "price"
  | "badges"
  | "description"
  | "cta";

function Element({ stage, kind }: { stage: number; kind: ElementKind }) {
  return (
    <motion.div
      layout
      transition={SPRING}
      className={containerClass(kind, stage)}
    >
      {renderInner(kind, stage)}
    </motion.div>
  );
}

function containerClass(kind: ElementKind, stage: number): string {
  // Stage 0–2: raw lines, monospace, no special wrapper
  if (stage <= 2) return "font-mono text-[12.5px] leading-relaxed py-0.5 px-3 my-0.5";
  // Stage 3: AST boxes — labelled, bordered
  if (stage === 3) return "my-1.5 mx-3";
  // Stage 4: AST boxes with role tags
  if (stage === 4) return "my-1.5 mx-3";
  // Stage 5/6: rendered card
  return `morph-card-child morph-${kind}`;
}

function renderInner(kind: ElementKind, stage: number): ReactNode {
  switch (kind) {
    case "title":
      if (stage <= 1) return <RawLine>{`## {{name}}`}</RawLine>;
      if (stage === 2) return <RawLine>{`## ${PRODUCT.name}`}</RawLine>;
      if (stage === 3) return <AstBox label="heading h2" tone="violet">{PRODUCT.name}</AstBox>;
      if (stage === 4) return <TaggedBox label="heading h2" role=".card-title" tone="violet">{PRODUCT.name}</TaggedBox>;
      return <h2 className="morph-title">{PRODUCT.name}</h2>;

    case "image":
      if (stage <= 1) return <RawLine>{`![{{name}}]({{logoUrl}})`}</RawLine>;
      if (stage === 2) return <RawLine>{`![${PRODUCT.name}](${PRODUCT.imageUrl.replace(/^https?:\/\//, "")})`}</RawLine>;
      if (stage === 3) return <AstBox label="paragraph > image" tone="cyan">{PRODUCT.imageUrl}</AstBox>;
      if (stage === 4) return <TaggedBox label="image-only paragraph" role=".card-hero" tone="cyan">{PRODUCT.imageUrl}</TaggedBox>;
      // eslint-disable-next-line @next/next/no-img-element
      return <img src={PRODUCT.imageUrl} alt={PRODUCT.name} className="morph-image" />;

    case "status":
      if (stage <= 1) return <RawLine>{`> {{highlight}}`}</RawLine>;
      if (stage === 2) return <RawLine>{`> ${PRODUCT.highlight}`}</RawLine>;
      if (stage === 3) return <AstBox label="blockquote" tone="emerald">{PRODUCT.highlight}</AstBox>;
      if (stage === 4) return <TaggedBox label="blockquote" role=".status.status--positive" tone="emerald">{PRODUCT.highlight}</TaggedBox>;
      return (
        <div className="morph-status">
          <span className="morph-status-dot" />
          {PRODUCT.highlight}
        </div>
      );

    case "meta":
      if (stage <= 1)
        return <RawLine>{`{{location}} · ★ {{stars}} · {{rating}}/10`}</RawLine>;
      if (stage === 2) return <RawLine>{PRODUCT.meta}</RawLine>;
      if (stage === 3) return <AstBox label="paragraph" tone="zinc">{PRODUCT.meta}</AstBox>;
      if (stage === 4) return <TaggedBox label="paragraph" role=".card-prose" tone="zinc">{PRODUCT.meta}</TaggedBox>;
      return <p className="morph-meta">{PRODUCT.meta}</p>;

    case "price":
      if (stage <= 1) return <RawLine>{`**Hotel packages from £{{price}}**`}</RawLine>;
      if (stage === 2)
        return <RawLine>{`**${PRODUCT.priceLabel} ${PRODUCT.priceValue}**`}</RawLine>;
      if (stage === 3)
        return (
          <AstBox label="paragraph > strong" tone="zinc">
            {PRODUCT.priceLabel} {PRODUCT.priceValue}
          </AstBox>
        );
      if (stage === 4)
        return (
          <TaggedBox label="**…£…**" role=".price > .price-value" tone="violet">
            {PRODUCT.priceLabel} {PRODUCT.priceValue}
          </TaggedBox>
        );
      return (
        <div className="morph-price">
          <span className="morph-price-value">{PRODUCT.priceLabel} {PRODUCT.priceValue}</span>
        </div>
      );

    case "badges":
      if (stage <= 1)
        return (
          <>
            <RawLine>{`- {{badge}}`}</RawLine>
            <RawLine>{`- {{badge}}`}</RawLine>
          </>
        );
      if (stage === 2)
        return PRODUCT.badges.map((b, i) => <RawLine key={i}>{`- ${b}`}</RawLine>);
      if (stage === 3)
        return <AstBox label="list (ul)" tone="amber">
          {PRODUCT.badges.join(" · ")}
        </AstBox>;
      if (stage === 4)
        return <TaggedBox label="list" role=".badges" tone="amber">
          {PRODUCT.badges.join(" · ")}
        </TaggedBox>;
      return (
        <ul className="morph-badges">
          {PRODUCT.badges.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      );

    case "description":
      if (stage <= 1) return <RawLine>{`{{description}}`}</RawLine>;
      if (stage === 2) return <RawLine>{PRODUCT.description}</RawLine>;
      if (stage === 3) return <AstBox label="paragraph" tone="zinc">{trim(PRODUCT.description)}</AstBox>;
      if (stage === 4) return <TaggedBox label="paragraph" role=".card-prose" tone="zinc">{trim(PRODUCT.description)}</TaggedBox>;
      return <p className="morph-description">{PRODUCT.description}</p>;

    case "cta":
      if (stage <= 1)
        return <RawLine>{`[Show Packages ({{packageCount}})]({{links.packages}})`}</RawLine>;
      if (stage === 2)
        return <RawLine>{`[${PRODUCT.ctaLabel}](${PRODUCT.ctaHref})`}</RawLine>;
      if (stage === 3) return <AstBox label="paragraph > link" tone="rose">{PRODUCT.ctaLabel}</AstBox>;
      if (stage === 4) return <TaggedBox label="trailing link" role=".cta.cta--primary" tone="rose">{PRODUCT.ctaLabel}</TaggedBox>;
      return <a className="morph-cta" href="#">{PRODUCT.ctaLabel}</a>;
  }
}

function trim(s: string, max = 64) {
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

function RawLine({ children }: { children: ReactNode }) {
  return (
    <span className="block text-zinc-300 whitespace-pre-wrap">{children}</span>
  );
}

const TONE_CLASS: Record<string, string> = {
  violet:  "border-violet-400/30 bg-violet-500/[0.06] text-violet-100",
  cyan:    "border-cyan-400/30 bg-cyan-500/[0.06] text-cyan-100",
  emerald: "border-emerald-400/30 bg-emerald-500/[0.06] text-emerald-100",
  amber:   "border-amber-400/30 bg-amber-500/[0.06] text-amber-100",
  rose:    "border-rose-400/30 bg-rose-500/[0.06] text-rose-100",
  zinc:    "border-white/15 bg-white/[0.04] text-zinc-200",
};

function AstBox({
  label,
  tone,
  children,
}: {
  label: string;
  tone: string;
  children: ReactNode;
}) {
  return (
    <div className={`rounded-lg border px-3 py-2 ${TONE_CLASS[tone] ?? TONE_CLASS.zinc}`}>
      <div className="text-[10px] font-mono uppercase tracking-[0.18em] opacity-60 mb-0.5">
        {label}
      </div>
      <div className="text-[12.5px] leading-snug">{children}</div>
    </div>
  );
}

function TaggedBox({
  label,
  role,
  tone,
  children,
}: {
  label: string;
  role: string;
  tone: string;
  children: ReactNode;
}) {
  return (
    <div className={`rounded-lg border px-3 py-2 ${TONE_CLASS[tone] ?? TONE_CLASS.zinc}`}>
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[10px] font-mono uppercase tracking-[0.18em] opacity-60">
          {label}
        </span>
        <span className="text-[10px] font-mono opacity-90 font-semibold">
          → {role}
        </span>
      </div>
      <div className="text-[12.5px] leading-snug">{children}</div>
    </div>
  );
}
