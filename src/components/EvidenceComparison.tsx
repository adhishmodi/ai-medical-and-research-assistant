import type { Source } from "@/data/mockResponses";

type ComparisonSource = Source & {
  category?: "research" | "guidance" | string;
  publicationYear?: string | number;
  studyType?: string;
  evidenceType?: string;
  evidenceLevel?: string;
  relevance?: number;
};

function valueOrFallback(value: unknown): string {
  if (value === undefined || value === null || value === "") return "Not provided";
  return String(value);
}

function categoryLabel(source: ComparisonSource): string {
  if (source.category === "research") return "Research evidence";
  if (source.category === "guidance") return "Health guidance";
  return "Source classification not available";
}

function studyTypeLabel(source: ComparisonSource): string {
  const value = source.studyType;
  if (!value) return "Not provided";
  return value.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function EvidenceComparison({
  sources,
  onClose,
  onClear,
}: {
  sources: ComparisonSource[];
  onClose: () => void;
  onClear: () => void;
}) {
  return (
    <div className="mb-6 overflow-hidden rounded-xl border border-primary/30 bg-surface">
      <div className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
        <div>
          <p className="rule-label">Evidence comparison</p>
          <h4 className="mt-1 text-base font-semibold text-foreground">
            Comparing {sources.length} selected sources
          </h4>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            This comparison displays available source metadata side by side. It does not rank
            sources or determine which source is better.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={onClear}
            className="rounded-md border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Clear selection
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Exit comparison
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[760px] w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-border bg-background/60">
              <th className="w-40 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:w-48 sm:px-5">
                Field
              </th>
              {sources.map((source, index) => (
                <th
                  key={source.url ?? source.title + index}
                  className="min-w-[240px] border-l border-border px-4 py-3 align-top sm:px-5"
                >
                  <p className="text-sm font-semibold leading-snug text-foreground">
                    {source.title}
                  </p>
                  {source.url ? (
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex text-xs font-semibold text-primary underline-offset-4 hover:underline"
                    >
                      View source
                    </a>
                  ) : (
                    <span className="mt-2 block text-xs text-muted-foreground">
                      Source link not available
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              {
                label: "Organization / journal",
                getValue: (source: ComparisonSource) => valueOrFallback(source.organization),
              },
              {
                label: "Category",
                getValue: (source: ComparisonSource) => categoryLabel(source),
              },
              {
                label: "Publication year",
                getValue: (source: ComparisonSource) => valueOrFallback(source.publicationYear),
              },
              {
                label: "Study type",
                getValue: (source: ComparisonSource) => studyTypeLabel(source),
              },
              {
                label: "Relevance",
                getValue: (source: ComparisonSource) =>
                  typeof source.relevance === "number" ? String(source.relevance) : "Not provided",
              },
              {
                label: "Evidence type / level",
                getValue: (source: ComparisonSource) =>
                  valueOrFallback(source.evidenceType ?? source.evidenceLevel),
              },
              {
                label: "Description / findings",
                getValue: (source: ComparisonSource) => valueOrFallback(source.description),
              },
            ].map((row) => (
              <tr key={row.label} className="border-b border-border last:border-b-0">
                <th className="bg-background/40 px-4 py-3 align-top text-xs font-semibold text-foreground sm:px-5">
                  {row.label}
                </th>
                {sources.map((source, index) => (
                  <td
                    key={source.url ?? source.title + index}
                    className="border-l border-border px-4 py-3 align-top text-sm leading-relaxed text-foreground sm:px-5"
                  >
                    {row.getValue(source)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
