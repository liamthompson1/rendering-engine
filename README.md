# rendering-engine

A walkthrough of a markdown rendering pipeline that turns one `.md` file into
rendered UI through six well-defined stages. Built as a companion to the HX
rendering-engine proposal.

The page runs the actual pipeline server-side at request time and shows the
real intermediate output of every stage — frontmatter parse, Handlebars
expansion, markdown + directive AST, block-handler walk, HTML, served page.

Live: https://rendering.heha.ai

## Stages

| # | What happens | What you get |
|---|---|---|
| 0 | Source `.md` as authored | Frontmatter + Handlebars + `:::directives` + markdown |
| 1 | Data file referenced by `data:` | JSON |
| 2 | `gray-matter` splits frontmatter from body | `{ meta, body }` |
| 3 | `Handlebars.compile(body)(data)` | Concrete markdown, no `{{}}` left |
| 4 | `unified` + `remark-parse` + `remark-directive` | AST (mdast) |
| 5 | Block handlers + `rehype-stringify` | HTML body |
| 6 | Shell template wraps the body | Final served HTML |

The two boundaries that matter:

- **Stage 3 → Stage 4** is where text becomes structure. AI-generated content
  stops being a blob and becomes a tree the system can validate, reject, or
  render.
- **Stage 4 → Stage 5** is the only target-specific step. Swap the block
  handlers and the same AST drives iOS, email, or print.

## Running locally

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build (statically prerendered)
```

## Where the pipeline lives

- `lib/source.ts` — the example `hotels.md` and its JSON data
- `lib/pipeline.ts` — the six-stage `runPipeline()`, plus the block handlers
- `lib/highlight.ts` — Shiki for server-side syntax highlighting
- `app/page.tsx` — the walkthrough UI

The block handlers in `pipeline.ts` are the entire rendering rule set for the
directive layer — `group`, `image`, `status`, `price`, `list`, `action`. New
primitive = new handler. New pattern = no new code.
