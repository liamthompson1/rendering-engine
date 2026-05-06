// The walkthrough page. Runs the pipeline at request/build time
// and shows every intermediate stage with the actual data that flows through.
import { runPipeline, trimAst } from "@/lib/pipeline";
import { Stage } from "./components/Stage";
import { RenderedPreview } from "./components/RenderedPreview";

export default async function Home() {
  const r = await runPipeline();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200">
      <header className="border-b border-zinc-800 sticky top-0 bg-zinc-950/95 backdrop-blur z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-baseline justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-widest text-zinc-500 font-mono">
              Rendering engine
            </p>
            <h1 className="text-lg font-semibold text-zinc-100">
              Markdown → Structured Schema → UI
            </h1>
          </div>
          <nav className="hidden md:flex gap-3 text-xs font-mono text-zinc-400">
            <a href="#stage-0" className="hover:text-zinc-100">0</a>
            <a href="#stage-1" className="hover:text-zinc-100">1</a>
            <a href="#stage-2a" className="hover:text-zinc-100">2</a>
            <a href="#stage-3" className="hover:text-zinc-100">3</a>
            <a href="#stage-4" className="hover:text-zinc-100">4</a>
            <a href="#stage-5" className="hover:text-zinc-100">5</a>
            <a href="#stage-6" className="hover:text-zinc-100">6</a>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-16">
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-zinc-50 mb-6">
            One markdown file, six stages, one rendered page.
          </h2>
          <p className="text-lg text-zinc-400 max-w-2xl leading-relaxed">
            This is the same pipeline as the proposal — Handlebars expansion,
            then markdown + directive parse to a structured AST, then a small
            set of block handlers turning that AST into target output. Every
            code block below is real output from the next stage to the right
            of it.
          </p>
          <div className="mt-8 grid grid-cols-2 md:grid-cols-7 gap-2 text-xs font-mono">
            {[
              ["0", "Source"],
              ["1", "Data"],
              ["2a", "Frontmatter"],
              ["3", "Concrete"],
              ["4", "AST"],
              ["5", "HTML"],
              ["6", "Page"],
            ].map(([n, label]) => (
              <a
                key={n}
                href={`#stage-${n}`}
                className="rounded border border-zinc-800 px-3 py-2 text-center hover:border-zinc-600 hover:bg-zinc-900 transition-colors"
              >
                <div className="text-zinc-500">{n}</div>
                <div className="text-zinc-200">{label}</div>
              </a>
            ))}
          </div>
        </div>

        <Stage
          number="0"
          title="The source as authored"
          language="markdown"
          code={r.stage0_source}
          description={
            <>
              <p className="mb-3">
                A single <code>.md</code> file. Three layers stacked: YAML-style
                frontmatter, Handlebars (<code>{`{{...}}`}</code>) for templating,
                and <code>:::name{`{`}attrs{`}`}</code> directives for semantic
                blocks the renderer understands.
              </p>
              <p>
                Plain markdown (<code>#</code>, <code>-</code>, paragraphs) still
                works as you&rsquo;d expect — directives only appear where standard
                markdown can&rsquo;t carry the meaning.
              </p>
            </>
          }
          notes={
            <>
              This is also what an LLM would produce if asked to write a hotel
              listing in this dialect. The format is the contract.
            </>
          }
        />

        <Stage
          number="1"
          title="The data file"
          language="json"
          code={JSON.stringify(r.stage1_data, null, 2)}
          description={
            <p>
              The <code>data:</code> field in frontmatter pointed at this JSON.
              Two products, deliberately different — Crowne Plaza has both a{" "}
              <code>highlight</code> and a <code>packageCount</code>; Hilton has
              neither. Both <code>{`{{#if}}`}</code> branches will fire.
            </p>
          }
          notes={
            <>
              In production, <code>data:</code> could equally be a URL — the
              renderer just needs JSON at this point in the pipeline.
            </>
          }
        />

        <Stage
          number="2a"
          title="After gray-matter — frontmatter extracted"
          language="json"
          code={JSON.stringify(r.stage2_meta, null, 2)}
          description={
            <p>
              <code>gray-matter</code> splits the file at the <code>---</code>{" "}
              fences. The frontmatter becomes a typed object. Nothing else has
              been parsed yet — the body is still raw text.
            </p>
          }
        />

        <Stage
          number="2b"
          title="After gray-matter — body, still raw"
          language="markdown"
          code={r.stage2_body}
          description={
            <p>
              Identical to Stage 0 minus the frontmatter. Handlebars hasn&rsquo;t
              run, directives haven&rsquo;t been parsed — this is just a string
              waiting to be transformed.
            </p>
          }
        />

        <Stage
          number="3"
          title="After Handlebars — data fully resolved"
          language="markdown"
          code={r.stage3_concrete}
          description={
            <>
              <p className="mb-3">
                <code>Handlebars.compile(body)(data)</code> ran. Every{" "}
                <code>{`{{...}}`}</code> is gone.{" "}
                <code>{`{{#each products}}`}</code> produced two copies of the
                card block. <code>{`{{name}}`}</code>, <code>{`{{price}}`}</code>,
                etc. are now literal text.
              </p>
              <p className="mb-3">
                Notice: Hilton&rsquo;s card has <strong>no </strong>
                <code>:::status</code> block —{" "}
                <code>{`{{#if highlight}}`}</code> was false, the whole block
                was elided. Crowne&rsquo;s CTA reads &ldquo;Show Packages
                (4)&rdquo;; Hilton&rsquo;s reads &ldquo;Choose&rdquo;.
              </p>
              <p>
                This stage is interesting because it&rsquo;s still valid markdown
                text. You could commit this and skip Handlebars at request time
                if your content is fully static.
              </p>
            </>
          }
        />

        <Stage
          number="4"
          title="After remark + remark-directive — the AST"
          language="json"
          code={JSON.stringify(trimAst(r.stage4_ast), null, 2)}
          description={
            <>
              <p className="mb-3">
                Strings became a tree. Standard markdown nodes (
                <code>heading</code>, <code>paragraph</code>, <code>list</code>)
                sit alongside <code>containerDirective</code> and{" "}
                <code>leafDirective</code> nodes. Each directive carries its{" "}
                <code>name</code> (<code>group</code>, <code>price</code>,{" "}
                <code>action</code>, …) and <code>attributes</code>.
              </p>
              <p>
                <strong>This is the structured schema</strong> the proposal
                describes — the layer between markdown (input) and rendered UI
                (output). Everything below this point is just a target-specific
                walk of this tree. Iterate it differently and you get JSON for
                iOS, table-based HTML for email, paged HTML for print.
              </p>
            </>
          }
          notes={
            <>
              <code>position</code> info (line/column) has been stripped for
              readability — in real ASTs each node also carries source location,
              which is what makes validation errors line-precise.
            </>
          }
        />

        <Stage
          number="5"
          title="After block handlers — HTML body"
          language="html"
          code={r.stage5_html}
          description={
            <>
              <p className="mb-3">
                Each directive node was transformed by its handler in{" "}
                <code>blocks/</code>. <code>group{`{role=card}`}</code> →{" "}
                <code>{`<article class="group group--card">`}</code>.{" "}
                <code>price</code> got currency-symbol formatting; an action
                with an <code>href</code> emitted an <code>{`<a>`}</code> rather
                than a <code>{`<button>`}</code>.
              </p>
              <p>
                The handlers are the entire rendering rule set for the directive
                layer. ~10 small functions, each ~5 lines. New primitive = new
                handler; new pattern = no new code.
              </p>
            </>
          }
          notes={<RenderedPreview html={r.stage5_html} />}
        />

        <Stage
          number="6"
          title="After shell wrapping — the served page"
          language="html"
          code={r.stage6_fullHtml}
          description={
            <p>
              The shell template is the only template that survives in the new
              architecture. It wraps Stage 5 in <code>{`<html>`}</code>, head
              metadata, the site header, and script tags for any client-side
              runtime (Alpine, htmx). Per-page templates are gone — there&rsquo;s
              only the shell.
            </p>
          }
          notes={
            <>
              Adding a new page in production is now writing one markdown file.
              No new template, no new route handler, no new code.
            </>
          }
        />

        <section className="border-t border-zinc-800 pt-12 mt-12 text-zinc-400">
          <h2 className="text-2xl font-semibold text-zinc-100 mb-4">
            The two boundaries that matter
          </h2>
          <div className="space-y-4 leading-relaxed">
            <p>
              <strong className="text-zinc-200">Stage 3 → Stage 4</strong> is
              where text becomes structure. Everything before is string
              transforms; everything after is tree walks. This is the moment
              AI-generated content stops being &ldquo;a blob the system has to
              trust&rdquo; and becomes &ldquo;a tree the system can validate,
              reject, or render.&rdquo;
            </p>
            <p>
              <strong className="text-zinc-200">Stage 4 → Stage 5</strong> is
              the only target-specific step. Replace <code>blocks/*</code> with
              iOS handlers and Stage 5 becomes a JSON manifest. Replace with
              email handlers and it becomes table-based HTML. Same Stage 4
              tree, every target.
            </p>
          </div>
        </section>

        <footer className="mt-16 pt-8 border-t border-zinc-800 text-xs text-zinc-500 font-mono">
          rendering-engine · pipeline runs server-side at request time · every
          code block is real output from the previous stage
        </footer>
      </main>
    </div>
  );
}
