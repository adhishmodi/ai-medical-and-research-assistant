import type { Source } from "@/data/mockResponses";

export function SourceCard({ source }: { source: Source }) {
  return (
    <article className="flex h-full flex-col rounded-lg border border-border bg-background p-4">
      <h4 className="font-display text-base leading-snug font-semibold text-foreground">
        {source.title}
      </h4>
      <p className="mt-1 text-xs font-medium tracking-wide text-primary">{source.organization}</p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{source.description}</p>
      {source.url ? (
        <a
          href={source.url}
          target="_blank"
          rel="noreferrer noopener"
          className="mt-3 inline-flex w-fit items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          View source
          <span aria-hidden>↗</span>
        </a>
      ) : (
        <span className="mt-3 text-xs text-muted-foreground">No public link available</span>
      )}
    </article>
  );
}
