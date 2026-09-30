import type { AssistantAnswer, Source } from "@/data/mockResponses";

type ReportSource = Source & {
  category?: string;
  publicationYear?: number;
  studyType?: string;
  evidenceType?: string;
  relevance?: number;
};

type Props = {
  question: string;
  answer: AssistantAnswer;
  onClose?: () => void;
};


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

  const sentence = decoded.match(/^.{1,420}?(?:[.!?](?:\s|$))/);
  const shortened = sentence?.[0]?.trim() ?? decoded.slice(0, 400).trimEnd();
  return shortened + " …";
}

function sourceCategory(source: ReportSource) {
  const value = (source.category ?? source.organization ?? "").toLowerCase();
  return value.includes("pubmed") || value.includes("journal") || value.includes("research")
    ? "Research evidence"
    : "Health guidance";
}

function downloadMarkdown(question: string, answer: AssistantAnswer) {
  const sources = answer.sources as ReportSource[];
  const lines = [
    "# AI Medical & Research Assistant — Research Report",
    "",
    `**Research question:** ${question}`,
    `**Topic:** ${answer.topic}`,
    "",
    "## Executive summary",
    answer.summary,
    "",
    "## Key findings",
    ...answer.keyInformation.map((item) => `- ${item}`),
    "",
    "## Important considerations",
    ...answer.considerations.map((item) => `- ${item}`),
  ];

  if (answer.whenToSeekCare?.length) {
    lines.push("", "## When to seek medical care", ...answer.whenToSeekCare.map((item) => `- ${item}`));
  }

  lines.push("", "## Evidence overview");
  const research = sources.filter((s) => sourceCategory(s) === "Research evidence");
  const guidance = sources.filter((s) => sourceCategory(s) !== "Research evidence");
  lines.push(`- Research evidence sources: ${research.length}`, `- Health guidance sources: ${guidance.length}`, "", "## References");

  sources.forEach((source, index) => {
    const metadata = [
      source.publicationYear ? `Year: ${source.publicationYear}` : "",
      source.studyType ? `Study type: ${source.studyType}` : "",
    ].filter(Boolean).join(" · ");
    lines.push(`${index + 1}. [${source.title}](${source.url ?? "#"}) — ${source.organization}${metadata ? ` (${metadata})` : ""}`);
    if (source.description) lines.push(`   ${cleanDescription(source.description)}`);
  });

  lines.push("", "---", "Educational use only. This report is not a diagnosis or a substitute for professional medical advice.");
  const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `research-report-${new Date().toISOString().slice(0, 10)}.md`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function ResearchReport({ question, answer, onClose }: Props) {
  const sources = answer.sources as ReportSource[];
  const researchSources = sources.filter((source) => sourceCategory(source) === "Research evidence");
  const guidanceSources = sources.filter((source) => sourceCategory(source) !== "Research evidence");

  return (
    <section className="rounded-xl border border-border bg-card p-5 sm:p-7 print:border-0 print:p-0" aria-label="Research report">
      <div className="flex items-start justify-between gap-4 print:hidden">
        <div>
          <p className="rule-label">Research report</p>
          <h2 className="mt-2 font-display text-2xl text-foreground">Evidence report</h2>
        </div>
        {onClose ? <button type="button" onClick={onClose} className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-surface">Close</button> : null}
      </div>

      <div className="mt-6 space-y-7">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Research question</p>
          <p className="mt-2 text-base leading-relaxed text-foreground">{question}</p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Topic</p>
          <p className="mt-2 font-display text-xl text-foreground">{answer.topic}</p>
        </div>

        <div>
          <h3 className="font-display text-lg text-foreground">Executive summary</h3>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">{answer.summary}</p>
        </div>

        <div>
          <h3 className="font-display text-lg text-foreground">Evidence overview</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border p-4">
              <p className="text-2xl font-semibold text-foreground">{researchSources.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">Research evidence sources</p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="text-2xl font-semibold text-foreground">{guidanceSources.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">Health guidance sources</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-display text-lg text-foreground">Key findings</h3>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
            {answer.keyInformation.map((item, index) => <li key={index}>• {item}</li>)}
          </ul>
        </div>

        <div>
          <h3 className="font-display text-lg text-foreground">Important considerations</h3>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
            {answer.considerations.map((item, index) => <li key={index}>• {item}</li>)}
          </ul>
        </div>

        {answer.whenToSeekCare?.length ? (
          <div>
            <h3 className="font-display text-lg text-foreground">When to seek medical care</h3>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
              {answer.whenToSeekCare.map((item, index) => <li key={index}>• {item}</li>)}
            </ul>
          </div>
        ) : null}

        <div>
          <h3 className="font-display text-lg text-foreground">References</h3>
          <div className="mt-3 space-y-4">
            {sources.map((source, index) => (
              <article key={`${source.title}-${index}`} className="border-t border-border pt-4 first:border-t-0 first:pt-0">
                <p className="text-sm font-semibold text-foreground">{index + 1}. {source.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{source.organization}</p>
                {(source.publicationYear || source.studyType) ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {[source.publicationYear ? `Published ${source.publicationYear}` : "", source.studyType ?? ""].filter(Boolean).join(" · ")}
                  </p>
                ) : null}
                {source.description ? <p className="mt-2 text-sm leading-6 text-muted-foreground">{cleanDescription(source.description)}</p> : null}
                {source.url ? <a href={source.url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-medium text-primary underline underline-offset-2">View source</a> : null}
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-surface p-4 text-xs leading-5 text-muted-foreground">
          Educational use only. AI-generated summaries can contain errors or omissions. Verify important medical claims against the linked source material and consult a qualified healthcare professional for personal medical decisions.
        </div>
      </div>

      <div className="mt-7 flex flex-wrap gap-3 print:hidden">
        <button type="button" onClick={() => downloadMarkdown(question, answer)} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">Export Markdown</button>
        <button type="button" onClick={() => window.print()} className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-surface">Print / Save PDF</button>
      </div>
    </section>
  );
}
