import { useState } from "react";
import type { Source } from "@/data/mockResponses";

type EvidenceSource = Source & { category?: "research" | "guidance"; publicationYear?: string; studyType?: string; evidenceLevel?: "high" | "moderate" | "limited" | "not_applicable"; relevance?: number };

function cleanDescription(value: string): string {
  const decoded = value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#([0-9]+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&beta;/gi, "β")
    .replace(/&alpha;/gi, "α")
    .replace(/&gamma;/gi, "γ")
    .replace(/&ndash;/gi, "–")
    .replace(/&mdash;/gi, "—")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();

  if (decoded.length <= 420) return decoded;

  const sentences = decoded.match(/^.{1,420}?(?:[.!?](?:\s|$))/);
  const shortened = sentences?.[0]?.trim() ?? decoded.slice(0, 400).trimEnd();
  return shortened + " …";
}

const levelLabel: Record<NonNullable<EvidenceSource["evidenceLevel"]>, string> = {
  high: "Evidence type: higher-level synthesis / controlled evidence",
  moderate: "Evidence type: observational or review evidence",
  limited: "Evidence type: limited / early evidence",
  not_applicable: "Authoritative health guidance",
};

export function SourceCard({ source }: { source: Source }) {
  const evidence = source as EvidenceSource;
  const level = evidence.evidenceLevel;
  const [copied, setCopied] = useState(false);

  const citation = [
    source.title,
    source.organization,
    evidence.publicationYear ? String(evidence.publicationYear) : "",
    source.url ?? "",
  ]
    .filter(Boolean)
    .join(". ");

  const handleCopyCitation = async () => {
    try {
      await navigator.clipboard.writeText(citation);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

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
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={handleCopyCitation}
          className="inline-flex items-center rounded-md border border-border px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          aria-label={copied ? "Citation copied" : "Copy citation"}
        >
          {copied ? "Copied" : "Copy citation"}
        </button>
        {source.url ? <a href={source.url} target="_blank" rel="noreferrer noopener" className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">View source <span aria-hidden>↗</span></a> : null}
      </div>
    </div>
    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
      {evidence.publicationYear ? <span>Published {evidence.publicationYear}</span> : null}
      {evidence.studyType ? <span>{evidence.studyType}</span> : null}
    </div>
    {level ? <p className="mt-2 text-xs font-medium text-muted-foreground">{levelLabel[level]}</p> : null}
    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{cleanDescription(source.description)}</p>
    {!source.url ? <span className="mt-3 block text-xs text-muted-foreground">No public link available</span> : null}
  </article>;
}
