"use client";
// Per-stage visual representation of the transformation. One component
// here per StageVisual.kind. The visual sits between the stage title and
// the code panels — the "look at what's happening" half of the page,
// while the code below is the "look at the actual data" half.
import type { ReactNode } from "react";
import { motion } from "motion/react";
import { Glass } from "./Glass";

type FlowNode = {
  label: string;
  detail?: string;
  tone?: "input" | "process" | "output" | "neutral";
};

const TONE: Record<NonNullable<FlowNode["tone"]>, { ring: string; pill: string; text: string }> = {
  input:   { ring: "border-emerald-400/30", pill: "bg-emerald-500/15", text: "text-emerald-200" },
  process: { ring: "border-violet-400/30",  pill: "bg-violet-500/15",  text: "text-violet-200" },
  output:  { ring: "border-fuchsia-400/30", pill: "bg-fuchsia-500/15", text: "text-fuchsia-200" },
  neutral: { ring: "border-white/10",       pill: "bg-white/[0.04]",   text: "text-zinc-200" },
};

export type StageVisual =
  | { kind: "flow"; nodes: FlowNode[] }
  | { kind: "layers"; layers: Array<{ label: string; tone: string; sample?: string }> }
  | { kind: "tree"; ast: unknown }
  | { kind: "mapping"; rows: Array<{ from: string; to: string }> }
  | { kind: "substitution"; rows: Array<{ token: string; value: string }> };

export function StageVisual({ visual }: { visual: StageVisual }) {
  return (
    <Glass className="p-5 md:p-6">
      <Header />
      <div className="mt-4">
        {visual.kind === "flow" && <FlowDiagram nodes={visual.nodes} />}
        {visual.kind === "layers" && <LayersDiagram layers={visual.layers} />}
        {visual.kind === "tree" && <TreeView ast={visual.ast} />}
        {visual.kind === "mapping" && <MappingTable rows={visual.rows} />}
        {visual.kind === "substitution" && <SubstitutionTable rows={visual.rows} />}
      </div>
    </Glass>
  );
}

function Header() {
  return (
    <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500">
      The transformation
    </p>
  );
}

// ── flow: linear input → process → output ─────────────────────────────
function FlowDiagram({ nodes }: { nodes: FlowNode[] }) {
  return (
    <div className="flex flex-wrap items-stretch gap-3">
      {nodes.map((n, i) => (
        <Wrap key={i} delay={i * 0.06}>
          <FlowChip node={n} />
          {i < nodes.length - 1 && <Arrow />}
        </Wrap>
      ))}
    </div>
  );
}

function Wrap({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-center gap-3"
    >
      {children}
    </motion.div>
  );
}

function FlowChip({ node }: { node: FlowNode }) {
  const t = TONE[node.tone ?? "neutral"];
  return (
    <div
      className={`min-h-[60px] rounded-xl px-4 py-2.5 border ${t.ring} ${t.pill} flex flex-col justify-center min-w-[120px]`}
    >
      <p className={`text-sm font-medium ${t.text}`}>{node.label}</p>
      {node.detail && (
        <p className="text-[11px] font-mono text-zinc-500 mt-0.5">{node.detail}</p>
      )}
    </div>
  );
}

function Arrow() {
  return (
    <svg width="22" height="14" viewBox="0 0 22 14" className="shrink-0">
      <path
        d="M0 7 L18 7 M14 3 L18 7 L14 11"
        stroke="rgb(113 113 122 / 0.7)"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── layers: concentric / stacked layers showing the source format ────
function LayersDiagram({
  layers,
}: {
  layers: Array<{ label: string; tone: string; sample?: string }>;
}) {
  const TONES: Record<string, string> = {
    amber:   "bg-amber-500/[0.06]   border-amber-400/30   text-amber-100",
    rose:    "bg-rose-500/[0.06]    border-rose-400/30    text-rose-100",
    violet:  "bg-violet-500/[0.06]  border-violet-400/30  text-violet-100",
    emerald: "bg-emerald-500/[0.06] border-emerald-400/30 text-emerald-100",
  };
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {layers.map((l, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className={`rounded-xl border px-4 py-3 ${TONES[l.tone] ?? TONES.violet}`}
        >
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] opacity-70">
            Layer {i + 1}
          </p>
          <p className="text-sm font-semibold mt-0.5">{l.label}</p>
          {l.sample && (
            <pre className="text-[11px] font-mono opacity-70 mt-2 whitespace-pre-wrap leading-tight">
              {l.sample.replace(/\\n/g, "\n")}
            </pre>
          )}
        </motion.div>
      ))}
    </div>
  );
}

// ── tree: render the AST as an indented, glyph-connected tree ────────
type AstNode = {
  type?: string;
  name?: string;
  depth?: number;
  attributes?: Record<string, string>;
  children?: AstNode[];
  value?: string;
};

function TreeView({ ast }: { ast: unknown }) {
  const root = ast as AstNode;
  return (
    <div className="rounded-xl bg-black/30 border border-white/[0.06] p-4 overflow-x-auto max-h-[60vh]">
      <pre className="text-[12px] leading-[1.55] font-mono text-zinc-300 whitespace-pre">
        <TreeLine node={root} prefix="" isLast />
      </pre>
    </div>
  );
}

function TreeLine({
  node,
  prefix,
  isLast,
}: {
  node: AstNode;
  prefix: string;
  isLast: boolean;
}) {
  const connector = prefix === "" ? "" : isLast ? "└─ " : "├─ ";
  const childPrefix = prefix === "" ? "" : prefix + (isLast ? "   " : "│  ");
  const children = node.children ?? [];

  return (
    <>
      <span className="text-zinc-600">{prefix}</span>
      <span className="text-zinc-500">{connector}</span>
      <NodeLabel node={node} />
      {"\n"}
      {children.map((c, i) => (
        <TreeLine
          key={i}
          node={c}
          prefix={childPrefix}
          isLast={i === children.length - 1}
        />
      ))}
    </>
  );
}

function NodeLabel({ node }: { node: AstNode }) {
  if (!node.type) return <span className="text-zinc-400">(unknown)</span>;
  const isDirective =
    node.type === "containerDirective" ||
    node.type === "leafDirective" ||
    node.type === "textDirective";

  if (isDirective) {
    const colour = node.type === "containerDirective" ? "text-violet-300" : "text-fuchsia-300";
    return (
      <>
        <span className={`${colour} font-semibold`}>{node.name}</span>
        <span className="text-zinc-500"> [{node.type.replace("Directive", "")}]</span>
        {node.attributes && Object.keys(node.attributes).length > 0 && (
          <span className="text-zinc-500">
            {" "}
            {Object.entries(node.attributes)
              .map(([k, v]) => `${k}=${trimVal(v)}`)
              .join(" ")}
          </span>
        )}
      </>
    );
  }

  if (node.type === "heading") {
    const text = collectText(node);
    return (
      <>
        <span className="text-emerald-300 font-semibold">heading</span>
        <span className="text-zinc-500"> h{node.depth}</span>
        {text && <span className="text-zinc-400"> "{trimVal(text)}"</span>}
      </>
    );
  }

  if (node.type === "paragraph") {
    const text = collectText(node);
    return (
      <>
        <span className="text-cyan-300">paragraph</span>
        {text && <span className="text-zinc-400"> "{trimVal(text)}"</span>}
      </>
    );
  }

  if (node.type === "list" || node.type === "listItem") {
    return <span className="text-amber-300">{node.type}</span>;
  }

  if (node.type === "text") {
    return <span className="text-zinc-400">"{trimVal(node.value ?? "")}"</span>;
  }

  return <span className="text-zinc-400">{node.type}</span>;
}

function trimVal(v: string, max = 50) {
  if (v.length <= max) return v;
  return v.slice(0, max - 1) + "…";
}

function collectText(node: AstNode): string {
  if (node.value) return node.value;
  if (node.children) {
    return node.children.map(collectText).join("");
  }
  return "";
}

// ── mapping: directive on the left, emitted HTML on the right ────────
function MappingTable({
  rows,
}: {
  rows: Array<{ from: string; to: string }>;
}) {
  return (
    <div className="space-y-1.5">
      {rows.map((r, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.04, duration: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_24px_minmax(0,1.4fr)] gap-2 md:gap-3 items-center px-2 py-1.5 rounded-lg hover:bg-white/[0.02]"
        >
          <code className="text-[12px] font-mono text-violet-200 truncate">{r.from}</code>
          <span className="hidden md:flex justify-center text-zinc-500">→</span>
          <code className="text-[12px] font-mono text-fuchsia-200 truncate">{r.to}</code>
        </motion.div>
      ))}
    </div>
  );
}

// ── substitution: token → resolved value ─────────────────────────────
function SubstitutionTable({
  rows,
}: {
  rows: Array<{ token: string; value: string }>;
}) {
  return (
    <div className="space-y-1.5">
      {rows.map((r, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05, duration: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_24px_minmax(0,1.4fr)] gap-2 md:gap-3 items-center px-2 py-1.5 rounded-lg hover:bg-white/[0.02]"
        >
          <code className="text-[12px] font-mono text-rose-200 truncate">{r.token}</code>
          <span className="hidden md:flex justify-center text-zinc-500">→</span>
          <code className="text-[12px] font-mono text-emerald-200 truncate">{r.value}</code>
        </motion.div>
      ))}
    </div>
  );
}
