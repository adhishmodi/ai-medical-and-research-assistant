import type { Source } from "@/data/mockResponses";

type EvidenceSource = Source & { category?: "research" | "guidance"; publicationYear?: string; studyType?: string; relevance?: number };

export function SourceCard({ source }: { source: Source }) {
  const evidence = source as EvidenceSource;
  return <article className="rounded-lg border border-border bg-background p-4 transition-colors hover:bg-surface">
    <div className="flex flex-wrap items-center gap-2">
      {evidence.category ? <span className="rounded-full border border-border px-2 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wide text-muted-foreground">{evidence.category === "research" ? "Research evidence" : "Health guidance"}</span> : null}
      {evidence.relevance !== undefined ? <span className="rounded-full bg-muted px-2 py-0.5 text-[0.68rem] font-medium text-muted-foreground">Relevance {evidence.relevance}%</span> : null}
    </div>
    <div className="mt-2 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-5">
      <div className="min-w-0 flex-1">
        <h4 className="font-display text-base leading-snug font-semibold text-foreground">{source.title}</h4>
        <p className="mt-1 text-xs font-medium tracking-wide text-primary">{source.organization}</p>
      </div>
      {source.url ? <a href={source.url} target="_blank" rel="noreferrer noopener" className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">View source <span aria-hidden>↗</span></a> : null}
    </div>
    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
      {evidence.publicationYear ? <span>Published {evidence.publicationYear}</span> : null}
      {evidence.studyType ? <span>{evidence.studyType}</span> : null}
    </div>
    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{source.description}</p>
    {!source.url ? <span className="mt-3 block text-xs text-muted-foreground">No public link available</span> : null}
  </article>;
}
