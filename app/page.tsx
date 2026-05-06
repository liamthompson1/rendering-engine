// Server entry. Runs the pipeline + Shiki highlighting once at build/request,
// then hands off to the client Walkthrough.
import { runPipeline, buildStages } from "@/lib/pipeline";
import { highlight } from "@/lib/highlight";
import { Background } from "./components/Background";
import { Walkthrough, type StageView } from "./components/Walkthrough";

export const dynamic = "force-static";

export default async function Home() {
  const r = await runPipeline();
  const stages = buildStages(r);

  const views: StageView[] = await Promise.all(
    stages.map(async (s) => ({
      number: s.number,
      title: s.title,
      subtitle: s.subtitle,
      blurb: s.blurb,
      detail: s.detail,
      highlight: s.highlight,
      panels: await Promise.all(
        s.panels.map(async (p) => ({
          label: p.label,
          language: p.language,
          highlightedHtml: await highlight(p.code, p.language),
        })),
      ),
      preview: s.preview,
    })),
  );

  return (
    <>
      <Background />
      <Walkthrough stages={views} />
    </>
  );
}
