// A single labelled stage panel with a syntax-highlighted code block.
import { highlight } from "@/lib/highlight";

export async function Stage({
  number,
  title,
  description,
  code,
  language,
  notes,
}: {
  number: string;
  title: string;
  description: React.ReactNode;
  code: string;
  language: string;
  notes?: React.ReactNode;
}) {
  const html = await highlight(code, language);
  return (
    <section
      id={`stage-${number}`}
      className="scroll-mt-20 border-t border-zinc-800 pt-12 pb-4"
    >
      <div className="flex items-baseline gap-3 mb-2">
        <span className="font-mono text-xs uppercase tracking-widest text-zinc-500">
          Stage {number}
        </span>
      </div>
      <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-zinc-100 mb-3">
        {title}
      </h2>
      <div className="prose prose-invert prose-zinc max-w-none mb-6 text-zinc-300">
        {description}
      </div>
      <div
        className="rounded-lg overflow-hidden border border-zinc-800 [&_pre]:!bg-transparent [&_pre]:!p-5 [&_pre]:overflow-x-auto [&_pre]:text-sm [&_pre]:leading-relaxed bg-[#22272e]"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {notes && (
        <div className="mt-4 text-sm text-zinc-400 border-l-2 border-zinc-700 pl-4">
          {notes}
        </div>
      )}
    </section>
  );
}
