import { createServerFn } from "@tanstack/react-start";
import { getMockAnswer, type AssistantAnswer } from "@/data/mockResponses";
import { getOptionalProviders } from "@/lib/ai/providers.server";
import { searchPubMed, type PubMedArticle } from "@/lib/pubmed.server";
import { searchTrustedSources, type TrustedSource } from "@/lib/trusted-sources.server";

const SYSTEM_PROMPT = `You are the AI Medical & Research Assistant: an educational medical and biomedical research assistant. Help students, researchers, and general users understand medical and biomedical topics — not to replace a clinician.

Rules: provide general educational information; do not diagnose; do not prescribe or change medicines; distinguish established evidence from uncertainty; never invent citations, studies, statistics, or URLs; recommend appropriate professional/emergency care for urgent situations; explain limitations rather than guessing.

When live evidence is supplied, use it as the primary factual context. Distinguish peer-reviewed research from patient-facing health information. Do not claim that a supplied study proves more than its abstract supports. The application will attach the retrieved evidence sources to the final answer, so do not omit relevant supplied sources merely to shorten the source list. Never invent additional papers or URLs.

Response format: output ONLY valid JSON matching:
{"topic":string,"summary":string,"keyInformation":string[],"considerations":string[],"whenToSeekCare":string[],"sources":[{"title":string,"organization":string,"description":string,"url":string}]}`;

const RESPONSE_SCHEMA = { type: "object", properties: { topic: { type: "string" }, summary: { type: "string" }, keyInformation: { type: "array", items: { type: "string" } }, considerations: { type: "array", items: { type: "string" } }, whenToSeekCare: { type: "array", items: { type: "string" } }, sources: { type: "array", items: { type: "object", properties: { title: { type: "string" }, organization: { type: "string" }, description: { type: "string" }, url: { type: "string" } }, required: ["title", "organization", "description", "url"] } } }, required: ["topic", "summary", "keyInformation", "considerations", "whenToSeekCare", "sources"] };

function isValidAnswer(value: unknown): value is AssistantAnswer {
  if (!value || typeof value !== "object") return false;
  const a = value as Record<string, unknown>;
  return typeof a.topic === "string" && typeof a.summary === "string" && Array.isArray(a.keyInformation) && a.keyInformation.every((x) => typeof x === "string") && Array.isArray(a.considerations) && a.considerations.every((x) => typeof x === "string") && Array.isArray(a.whenToSeekCare) && a.whenToSeekCare.every((x) => typeof x === "string") && Array.isArray(a.sources) && a.sources.every((x) => x && typeof x === "object" && typeof (x as any).title === "string" && typeof (x as any).organization === "string" && typeof (x as any).description === "string");
}

type AskAssistantRequest = { question?: unknown };
function isRequest(data: unknown): data is { question: string } { return typeof data === "object" && data !== null && typeof (data as AskAssistantRequest).question === "string"; }

function buildEvidenceContext(articles: PubMedArticle[], trusted: TrustedSource[]): string {
  const pubmed = articles.length ? articles.map((a, i) => `${i + 1}. PMID: ${a.pmid}\nTitle: ${a.title}\nJournal: ${a.journal}\nPublication year: ${a.publicationDate}\nURL: ${a.url}\nAbstract: ${a.abstract || "Abstract unavailable."}`).join("\n\n") : "No PubMed articles were retrieved.";
  const sources = trusted.length ? trusted.map((s, i) => `${i + 1}. Organization: ${s.organization}\nTitle: ${s.title}\nURL: ${s.url}\nDescription: ${s.description}`).join("\n\n") : "No trusted patient-facing sources were retrieved.";
  return `LIVE EVIDENCE — PUBMED (${articles.length}):\n${pubmed}\n\nLIVE TRUSTED HEALTH SOURCES (${trusted.length}):\n${sources}`;
}

function mergeRetrievedSources(answer: AssistantAnswer, articles: PubMedArticle[], trusted: TrustedSource[]): AssistantAnswer {
  const retrieved: AssistantAnswer["sources"] = [
    ...articles.map((article) => ({ title: article.title, organization: "PubMed", description: article.abstract || `PubMed record for PMID ${article.pmid}.`, url: article.url })),
    ...trusted.map((source) => ({ title: source.title, organization: source.organization, description: source.description, url: source.url })),
  ];
  const seen = new Set<string>();
  const sources = [...retrieved, ...answer.sources].filter((source) => {
    if (!source.url || seen.has(source.url)) return false;
    seen.add(source.url);
    return true;
  });
  return { ...answer, sources };
}

export const askAssistant = createServerFn({ method: "POST" })
  .validator((data: unknown) => { if (!isRequest(data)) throw new Error("Invalid request payload."); return data; })
  .handler(async ({ data }): Promise<AssistantAnswer> => {
    let evidence: PubMedArticle[] = [];
    let trusted: TrustedSource[] = [];
    try { evidence = await searchPubMed(data.question, 5); console.info(`PubMed retrieved ${evidence.length} article(s).`); } catch (error) { console.warn("PubMed retrieval unavailable; continuing without it.", error); }
    trusted = await searchTrustedSources(data.question);
    console.info(`Trusted health sources retrieved ${trusted.length} source(s).`);

    const providers = getOptionalProviders(RESPONSE_SCHEMA);
    if (providers.length === 0) return getMockAnswer(data.question);

    const groundedQuestion = `${data.question}\n\n${buildEvidenceContext(evidence, trusted)}`;
    for (const provider of providers) {
      try {
        const answer = await provider.generate(groundedQuestion, SYSTEM_PROMPT);
        if (isValidAnswer(answer)) {
          const groundedAnswer = mergeRetrievedSources(answer, evidence, trusted);
          console.info(`AI response generated by ${provider.label} using ${evidence.length} PubMed article(s) and ${trusted.length} trusted source(s); displaying ${groundedAnswer.sources.length} source(s).`);
          return groundedAnswer;
        }
        console.warn(`${provider.label} returned an invalid response shape; trying next provider.`);
      } catch (error) { console.warn(`${provider.label} unavailable; trying next provider.`, error); }
    }
    return getMockAnswer(data.question);
  });
