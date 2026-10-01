import { useEffect, useMemo, useState } from "react";
import type { AssistantAnswer, Source } from "@/data/mockResponses";
import { SourceCard } from "./SourceCard";
import { EvidenceComparison } from "./EvidenceComparison";
import { SafetyNotice } from "./SafetyNotice";

type EvidenceSource = Source & {
  category?: "research" | "guidance" | string;
  publicationYear?: string | number;
  studyType?: string;
  evidenceType?: string;
  relevance?: number;
};

type SourceFilter =
  | "all"
  | "research"
  | "guidance"
  | "systematic-review"
  | "clinical-trial"
  | "observational"
  | "review"
  | "other-research";

type SourceSort = "relevance" | "newest" | "oldest";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-border px-5 py-6 sm:px-7">
      <h3 className="rule-label">{title}</h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item} className="flex gap-3 text-[0.95rem] leading-relaxed text-foreground">
          <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-primary" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function evidenceSource(source: Source): EvidenceSource {
  return source as EvidenceSource;
}

function sourceCategory(source: Source): "research" | "guidance" {
  const evidence = evidenceSource(source);
  if (evidence.category === "research" || evidence.category === "guidance") {
    return evidence.category;
  }

  const text = `${source.organization} ${source.title} ${source.description}`.toLowerCase();
  const researchSignals = [
    "pubmed",
    "journal",
    "randomized",
    "randomised",
    "trial",
    "cohort",
    "case-control",
    "case control",
    "cross-sectional",
    "systematic review",
    "meta-analysis",
    "meta analysis",
    "research literature",
    "study",
  ];

  return researchSignals.some((signal) => text.includes(signal)) ? "research" : "guidance";
}

function studyType(source: Source): string {
  const evidence = evidenceSource(source);
  const text =
    `${evidence.studyType ?? ""} ${evidence.evidenceType ?? ""} ${source.title} ${source.description}`.toLowerCase();

  if (
    text.includes("systematic review") ||
    text.includes("meta-analysis") ||
    text.includes("meta analysis")
  ) {
    return "systematic-review";
  }
  if (
    text.includes("randomized controlled") ||
    text.includes("randomised controlled") ||
    text.includes("randomized trial") ||
    text.includes("randomised trial") ||
    text.includes("clinical trial") ||
    text.includes("controlled trial")
  ) {
    return "clinical-trial";
  }
  if (
    text.includes("cohort") ||
    text.includes("case-control") ||
    text.includes("case control") ||
    text.includes("cross-sectional") ||
    text.includes("cross sectional") ||
    text.includes("observational")
  ) {
    return "observational";
  }
  if (text.includes("review")) {
    return "review";
  }
  return "other-research";
}

function matchesFilter(source: Source, filter: SourceFilter): boolean {
  if (filter === "all") return true;

  const category = sourceCategory(source);
  if (filter === "research") return category === "research";
  if (filter === "guidance") return category === "guidance";

  return category === "research" && studyType(source) === filter;
}

function sourceRelevance(source: Source): number | null {
  const value = evidenceSource(source).relevance;
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function sourceYear(source: Source): number | null {
  const value = Number(evidenceSource(source).publicationYear);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function EvidenceControls({
  total,
  filtered,
  filter,
  sort,
  onFilterChange,
  onSortChange,
  onReset,
}: {
  total: number;
  filtered: number;
  filter: SourceFilter;
  sort: SourceSort;
  onFilterChange: (value: SourceFilter) => void;
  onSortChange: (value: SourceSort) => void;
  onReset: () => void;
}) {
  const hasChanges = filter !== "all" || sort !== "relevance";

  return (
    <div className="mb-5 rounded-lg border border-border bg-surface p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Filter sources
            </span>
            <select
              value={filter}
              onChange={(event) => onFilterChange(event.target.value as SourceFilter)}
              className="min-h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <option value="all">All sources</option>
              <option value="research">Research evidence</option>
              <option value="guidance">Health guidance</option>
              <option value="systematic-review">Systematic reviews / meta-analyses</option>
              <option value="clinical-trial">Clinical trials</option>
              <option value="observational">Observational studies</option>
              <option value="review">Reviews</option>
              <option value="other-research">Other research</option>
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Sort sources
            </span>
            <select
              value={sort}
              onChange={(event) => onSortChange(event.target.value as SourceSort)}
              className="min-h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <option value="relevance">Relevance</option>
              <option value="newest">Newest publication</option>
              <option value="oldest">Oldest publication</option>
            </select>
          </label>
        </div>

        <div className="flex items-center justify-between gap-3 lg:justify-end">
          <p className="text-xs text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{filtered}</span> of{" "}
            <span className="font-semibold text-foreground">{total}</span> sources
          </p>
          {hasChanges ? (
            <button
              type="button"
              onClick={onReset}
              className="text-xs font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              Reset
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function AnswerPanel({ answer, question }: { answer: AssistantAnswer; question: string }) {
  const [filter, setFilter] = useState<SourceFilter>("all");
  const [sort, setSort] = useState<SourceSort>("relevance");
  const [selectedSources, setSelectedSources] = useState<number[]>([]);
  const [isComparing, setIsComparing] = useState(false);

  useEffect(() => {
    setSelectedSources([]);
    setIsComparing(false);
  }, [answer]);

  const filteredSources = useMemo(() => {
    const matching = answer.sources.filter((source) => matchesFilter(source, filter));

    return [...matching].sort((a, b) => {
      if (sort === "relevance") {
        const relevanceA = sourceRelevance(a);
        const relevanceB = sourceRelevance(b);
        if (relevanceA !== null && relevanceB !== null) return relevanceB - relevanceA;
        if (relevanceA !== null) return -1;
        if (relevanceB !== null) return 1;
        return 0;
      }

      const yearA = sourceYear(a);
      const yearB = sourceYear(b);
      if (yearA === null && yearB === null) return 0;
      if (yearA === null) return 1;
      if (yearB === null) return -1;
      return sort === "newest" ? yearB - yearA : yearA - yearB;
    });
  }, [answer.sources, filter, sort]);

  const sourceEntries = useMemo(
    () => answer.sources.map((source, index) => ({ source, index })),
    [answer.sources],
  );
  const selectedSourceEntries = sourceEntries.filter(({ index }) =>
    selectedSources.includes(index),
  );
  const selectedComparisonSources = selectedSourceEntries.map(
    ({ source }) => source as EvidenceSource,
  );

  const researchSources = filteredSources.filter((source) => sourceCategory(source) === "research");
  const guidanceSources = filteredSources.filter((source) => sourceCategory(source) === "guidance");

  const renderSources = (sources: Source[]) => (
    <div className="space-y-2">
      {sources.map((source) => {
        const sourceIndex = answer.sources.indexOf(source);
        const isSelected = selectedSources.includes(sourceIndex);
        const selectionDisabled = !isSelected && selectedSources.length >= 3;
        return (
          <div
            key={source.url ?? source.title + sourceIndex}
            className="rounded-lg border border-border bg-card"
          >
            <div className="flex items-start gap-3 px-4 pt-3 sm:px-5">
              <input
                type="checkbox"
                checked={isSelected}
                disabled={selectionDisabled}
                onChange={() => {
                  setSelectedSources((current) =>
                    isSelected
                      ? current.filter((index) => index !== sourceIndex)
                      : current.length < 3
                        ? [...current, sourceIndex]
                        : current,
                  );
                }}
                aria-label={"Select " + source.title + " for comparison"}
                className="mt-1.5 size-4 shrink-0 accent-primary disabled:cursor-not-allowed disabled:opacity-40"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Compare source
                </p>
                {selectionDisabled ? (
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    Maximum of 3 sources selected
                  </p>
                ) : null}
              </div>
            </div>
            <div className="px-1 pb-1">
              <SourceCard source={source} />
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <article className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <header className="bg-surface px-5 py-5 sm:px-7">
        <p className="rule-label">Question</p>
        <p className="mt-1.5 font-display text-xl leading-snug text-foreground sm:text-2xl">
          {question}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">Topic: {answer.topic}</p>
      </header>

      <Section title="Summary">
        <p className="text-[1.02rem] leading-relaxed text-foreground">{answer.summary}</p>
      </Section>

      <Section title="Key information">
        <BulletList items={answer.keyInformation} />
      </Section>

      <Section title="Important considerations">
        <BulletList items={answer.considerations} />
      </Section>

      {answer.whenToSeekCare && answer.whenToSeekCare.length > 0 ? (
        <Section title="When to seek medical care">
          <BulletList items={answer.whenToSeekCare} />
        </Section>
      ) : null}

      <Section title={`Sources (${filteredSources.length} of ${answer.sources.length})`}>
        <EvidenceControls
          total={answer.sources.length}
          filtered={filteredSources.length}
          filter={filter}
          sort={sort}
          onFilterChange={(value) => {
            setFilter(value);
            setIsComparing(false);
          }}
          onSortChange={(value) => {
            setSort(value);
            setIsComparing(false);
          }}
          onReset={() => {
            setFilter("all");
            setSort("relevance");
            setIsComparing(false);
          }}
        />

        {selectedSources.length > 0 ? (
          <div className="mb-5 flex flex-col gap-3 rounded-lg border border-border bg-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {selectedSources.length} of 3 sources selected
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Select 2–3 sources to compare their available metadata side by side.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedSources([])}
                className="rounded-md border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                Clear
              </button>
              <button
                type="button"
                disabled={selectedSources.length < 2}
                onClick={() => setIsComparing(true)}
                className="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                Compare selected
              </button>
            </div>
          </div>
        ) : null}

        {isComparing ? (
          <EvidenceComparison
            sources={selectedComparisonSources}
            onClose={() => setIsComparing(false)}
            onClear={() => {
              setSelectedSources([]);
              setIsComparing(false);
            }}
          />
        ) : null}

        {filteredSources.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-surface px-4 py-6 text-center">
            <p className="text-sm font-medium text-foreground">No sources match this filter.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Try another source type or reset the filters.
            </p>
          </div>
        ) : (
          <>
            {researchSources.length > 0 ? (
              <div>
                <div className="mb-3 flex items-baseline justify-between gap-3">
                  <h4 className="text-sm font-semibold text-foreground">
                    Research evidence{" "}
                    <span className="font-normal text-muted-foreground">
                      ({researchSources.length})
                    </span>
                  </h4>
                  <span className="text-xs text-muted-foreground">Studies & papers</span>
                </div>
                {renderSources(researchSources)}
              </div>
            ) : null}

            {guidanceSources.length > 0 ? (
              <div className={researchSources.length > 0 ? "mt-6" : ""}>
                <div className="mb-3 flex items-baseline justify-between gap-3">
                  <h4 className="text-sm font-semibold text-foreground">
                    Authoritative health guidance{" "}
                    <span className="font-normal text-muted-foreground">
                      ({guidanceSources.length})
                    </span>
                  </h4>
                  <span className="text-xs text-muted-foreground">Clinical information</span>
                </div>
                {renderSources(guidanceSources)}
              </div>
            ) : null}
          </>
        )}
      </Section>

      <div className="border-t border-border px-5 py-6 sm:px-7">
        <SafetyNotice />
      </div>
    </article>
  );
}

export function AnswerSkeleton() {
  return (
    <div
      aria-live="polite"
      aria-busy="true"
      className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
    >
      <div className="bg-surface px-5 py-5 sm:px-7">
        <p className="rule-label">Preparing answer</p>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Reviewing reference material and assembling a structured response…
        </p>
      </div>
      <div className="space-y-6 px-5 py-6 sm:px-7">
        {[0, 1, 2].map((block) => (
          <div key={block} className="space-y-2.5">
            <div className="h-3 w-32 animate-pulse rounded bg-muted" />
            <div className="h-3 w-full animate-pulse rounded bg-muted" />
            <div className="h-3 w-11/12 animate-pulse rounded bg-muted" />
            <div className="h-3 w-8/12 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
