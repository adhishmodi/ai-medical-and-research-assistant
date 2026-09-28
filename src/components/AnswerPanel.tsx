import type { AssistantAnswer, Source } from "@/data/mockResponses";
import { SourceCard } from "./SourceCard";
import { SafetyNotice } from "./SafetyNotice";

type EvidenceSource = Source & { category?: "research" | "guidance"; publicationYear?: string; studyType?: string; relevance?: number };
function Section({ title, children }: { title: string; children: React.ReactNode }) { return <section className="border-t border-border px-5 py-6 sm:px-7"><h3 className="rule-label">{title}</h3><div className="mt-3">{children}</div></section>; }
function BulletList({ items }: { items: string[] }) { return <ul className="space-y-2.5">{items.map((item) => <li key={item} className="flex gap-3 text-[0.95rem] leading-relaxed text-foreground"><span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-primary" /><span>{item}</span></li>)}</ul>; }
function sourceCategory(source: Source): "research" | "guidance" { return (source as EvidenceSource).category ?? (source.organization.toLowerCase().includes("pubmed") ? "research" : "guidance"); }

export function AnswerPanel({ answer, question }: { answer: AssistantAnswer; question: string }) {
  const researchSources = answer.sources.filter((source) => sourceCategory(source) === "research");
  const guidanceSources = answer.sources.filter((source) => sourceCategory(source) === "guidance");
  const renderSources = (sources: Source[]) => <div className="space-y-2">{sources.map((source, index) => <SourceCard key={`${source.url ?? source.title}-${index}`} source={source} />)}</div>;
  return <article className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
    <header className="bg-surface px-5 py-5 sm:px-7"><p className="rule-label">Question</p><p className="mt-1.5 font-display text-xl leading-snug text-foreground sm:text-2xl">{question}</p><p className="mt-2 text-xs text-muted-foreground">Topic: {answer.topic}</p></header>
    <Section title="Summary"><p className="text-[1.02rem] leading-relaxed text-foreground">{answer.summary}</p></Section>
    <Section title="Key information"><BulletList items={answer.keyInformation} /></Section>
    <Section title="Important considerations"><BulletList items={answer.considerations} /></Section>
    {answer.whenToSeekCare && answer.whenToSeekCare.length > 0 ? <Section title="When to seek medical care"><BulletList items={answer.whenToSeekCare} /></Section> : null}
    <Section title={`Sources (${answer.sources.length})`}>
      {researchSources.length > 0 ? <div><div className="mb-3 flex items-baseline justify-between gap-3"><h4 className="text-sm font-semibold text-foreground">Research evidence <span className="font-normal text-muted-foreground">({researchSources.length})</span></h4><span className="text-xs text-muted-foreground">Studies & papers</span></div>{renderSources(researchSources)}</div> : null}
      {guidanceSources.length > 0 ? <div className={researchSources.length > 0 ? "mt-6" : ""}><div className="mb-3 flex items-baseline justify-between gap-3"><h4 className="text-sm font-semibold text-foreground">Authoritative health guidance <span className="font-normal text-muted-foreground">({guidanceSources.length})</span></h4><span className="text-xs text-muted-foreground">Clinical information</span></div>{renderSources(guidanceSources)}</div> : null}
    </Section>
    <div className="border-t border-border px-5 py-6 sm:px-7"><SafetyNotice /></div>
  </article>;
}

export function AnswerSkeleton() { return <div aria-live="polite" aria-busy="true" className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"><div className="bg-surface px-5 py-5 sm:px-7"><p className="rule-label">Preparing answer</p><p className="mt-1.5 text-sm text-muted-foreground">Reviewing reference material and assembling a structured response…</p></div><div className="space-y-6 px-5 py-6 sm:px-7">{[0,1,2].map((block) => <div key={block} className="space-y-2.5"><div className="h-3 w-32 animate-pulse rounded bg-muted" /><div className="h-3 w-full animate-pulse rounded bg-muted" /><div className="h-3 w-11/12 animate-pulse rounded bg-muted" /><div className="h-3 w-8/12 animate-pulse rounded bg-muted" /></div>)}</div></div>; }
