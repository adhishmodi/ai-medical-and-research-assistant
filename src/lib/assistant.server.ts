import { createServerFn } from "@tanstack/react-start";
import { getMockAnswer, type AssistantAnswer, type Source } from "@/data/mockResponses";
import { getOptionalProviders } from "@/lib/ai/providers.server";
import { searchPubMed, type PubMedArticle } from "@/lib/pubmed.server";
import { searchTrustedSources, type TrustedSource } from "@/lib/trusted-sources.server";
import { classifyQuery, type QueryRoute } from "@/lib/query-router.server";

const BASE_SYSTEM_PROMPT = `You are the AI Medical & Research Assistant: an educational medical and biomedical research assistant. Help students, researchers, and general users understand medical and biomedical topics — not to replace a clinician.

Rules: provide general educational information; do not diagnose; do not prescribe or change medicines; distinguish established evidence from uncertainty; never invent citations, studies, statistics, or URLs; recommend appropriate professional/emergency care for urgent situations; explain limitations rather than guessing.

When live evidence is supplied, use it as the primary factual context. Distinguish peer-reviewed research from patient-facing health information. Do not claim that a supplied study proves more than its abstract supports. The application attaches retrieved evidence sources to the final answer. Never invent additional papers or URLs.

Evidence synthesis: discuss agreement and disagreement across retrieved studies when relevant. Treat study design as metadata, not as a universal quality ranking. Do not call an observational study causal. Mention meaningful limitations such as sample size, population, study design, follow-up, and recency when they affect interpretation.

Response format: output ONLY valid JSON matching:
{"topic":string,"summary":string,"keyInformation":string[],"considerations":string[],"whenToSeekCare":string[],"sources":[{"title":string,"organization":string,"description":string,"url":string}]}`;

const RESPONSE_SCHEMA = { type: "object", properties: { topic: { type: "string" }, summary: { type: "string" }, keyInformation: { type: "array", items: { type: "string" } }, considerations: { type: "array", items: { type: "string" } }, whenToSeekCare: { type: "array", items: { type: "string" } }, sources: { type: "array", items: { type: "object", properties: { title: { type: "string" }, organization: { type: "string" }, description: { type: "string" }, url: { type: "string" } }, required: ["title", "organization", "description", "url"] } } }, required: ["topic", "summary", "keyInformation", "considerations", "whenToSeekCare", "sources"] };

function isValidAnswer(value: unknown): value is AssistantAnswer {
  if (!value || typeof value !== "object") return false;
  const a = value as Record<string, unknown>;
  return typeof a.topic === "string" && typeof a.summary === "string" && Array.isArray(a.keyInformation) && a.keyInformation.every((x) => typeof x === "string") && Array.isArray(a.considerations) && a.considerations.every((x) => typeof x === "string") && Array.isArray(a.whenToSeekCare) && a.whenToSeekCare.every((x) => typeof x === "string") && Array.isArray(a.sources) && a.sources.every((x) => x && typeof x === "object" && typeof (x as any).title === "string" && typeof (x as any).organization === "string" && typeof (x as any).description === "string" && typeof (x as any).url === "string");
}

type AskAssistantRequest = { question?: unknown };
const MAX_QUESTION_LENGTH = 2000;

function isRequest(data: unknown): data is { question: string } {
  if (typeof data !== "object" || data === null) return false;
  const question = (data as AskAssistantRequest).question;
  return typeof question === "string" && question.trim().length >= 6 && question.length <= MAX_QUESTION_LENGTH;
}

function normalizeQuestion(question: string): string {
  return question.trim().replace(/\s+/g, " ");
}

function buildSystemPrompt(route: QueryRoute): string {
  if (route.safetyFirst) return `${BASE_SYSTEM_PROMPT}\n\nSAFETY-FIRST ROUTE: This query may involve an urgent situation or medication safety. Do not reassure the user that an emergency is harmless. If symptoms could represent an emergency, clearly recommend contacting local emergency services or going to the nearest emergency department. Do not provide a definitive diagnosis. For medication questions, do not give individualized dosing or tell the user to start, stop, or change a prescription. Keep urgent guidance prominent and concise.`;
  if (route.category === "research") return `${BASE_SYSTEM_PROMPT}\n\nRESEARCH ROUTE: Prioritize the supplied PubMed evidence. Clearly distinguish study findings from general medical guidance, summarize convergence or disagreement when supported, mention meaningful limitations, and avoid treating association as causation.`;
  if (route.category === "medication") return `${BASE_SYSTEM_PROMPT}\n\nMEDICATION ROUTE: Prioritize authoritative health information and supplied research. Explain common uses, precautions, interactions, and common adverse effects at a general educational level. Do not provide individualized prescribing instructions.`;
  return BASE_SYSTEM_PROMPT;
}

function buildEvidenceContext(articles: PubMedArticle[], trusted: TrustedSource[]): string {
  const pubmed = articles.length ? articles.map((a, i) => `${i + 1}. PMID: ${a.pmid}\nTitle: ${a.title}\nJournal: ${a.journal}\nPublication year: ${a.publicationDate}\nStudy type: ${a.studyType}\nURL: ${a.url}\nAbstract: ${a.abstract || "Abstract unavailable."}`).join("\n\n") : "No PubMed articles were retrieved.";
  const sources = trusted.length ? trusted.map((s, i) => `${i + 1}. Organization: ${s.organization}\nTitle: ${s.title}\nURL: ${s.url}\nDescription: ${s.description}`).join("\n\n") : "No trusted patient-facing sources were retrieved.";
  return `LIVE EVIDENCE — PUBMED (${articles.length}):\n${pubmed}\n\nLIVE TRUSTED HEALTH SOURCES (${trusted.length}):\n${sources}`;
}

function relevanceScore(query: string, title: string, description: string): number {
  const terms = query.toLowerCase().split(/\W+/).filter((term) => term.length > 2);
  const haystack = `${title} ${description}`.toLowerCase();
  if (!terms.length) return 0;
  const hits = terms.reduce((n, term) => n + (haystack.includes(term) ? 1 : 0), 0);
  return Math.min(100, Math.round((hits / terms.length) * 100));
}

type EvidenceMeta = { category: "research" | "guidance"; publicationYear?: string; studyType?: string; evidenceLevel: "high" | "moderate" | "limited" | "not_applicable"; relevance: number };
function classifyEvidence(studyType: string): { normalized: string; level: EvidenceMeta["evidenceLevel"] } {
  const s = studyType.toLowerCase();
  if (s.includes("meta-analysis") || s.includes("systematic review")) return { normalized: "Systematic review / meta-analysis", level: "high" };
  if (s.includes("randomized controlled trial") || s.includes("randomised controlled trial") || s.includes("clinical trial")) return { normalized: "Randomized / controlled trial", level: "high" };
  if (s.includes("cohort")) return { normalized: "Cohort study", level: "moderate" };
  if (s.includes("case-control")) return { normalized: "Case-control study", level: "moderate" };
  if (s.includes("cross-sectional")) return { normalized: "Cross-sectional study", level: "limited" };
  if (s.includes("case report") || s.includes("case series")) return { normalized: "Case report / series", level: "limited" };
  if (s.includes("review")) return { normalized: "Review", level: "moderate" };
  return { normalized: studyType || "Biomedical study", level: "limited" };
}


function relevanceScore(query: string, title: string, description: string): number {
  const terms = query.toLowerCase().split(/\W+/).filter((term) => term.length > 2);
  const haystack = \`\${title} \${description}\`.toLowerCase();
  if (!terms.length) return 0;
  const hits = terms.reduce((n, term) => n + (haystack.includes(term) ? 1 : 0), 0);
  return Math.min(100, Math.round((hits / terms.length) * 100));
}

type EvidenceMeta = {
  category: "research" | "guidance";
  publicationYear?: string;
  studyType?: string;
  evidenceLevel: "high" | "moderate" | "limited" | "not_applicable";
  relevance: number;
};

function classifyEvidence(studyType: string): { normalized: string; level: EvidenceMeta["evidenceLevel"] } {
  const s = studyType.toLowerCase();
  if (s.includes("meta-analysis") || s.includes("systematic review")) return { normalized: "Systematic review / meta-analysis", level: "high" };
  if (s.includes("randomized controlled trial") || s.includes("randomised controlled trial") || s.includes("clinical trial")) return { normalized: "Randomized / controlled trial", level: "high" };
  if (s.includes("cohort")) return { normalized: "Cohort study", level: "moderate" };
  if (s.includes("case-control")) return { normalized: "Case-control study", level: "moderate" };
  if (s.includes("cross-sectional")) return { normalized: "Cross-sectional study", level: "limited" };
  if (s.includes("case report") || s.includes("case series")) return { normalized: "Case report / series", level: "limited" };
  if (s.includes("review")) return { normalized: "Review", level: "moderate" };
  return { normalized: studyType || "Biomedical study", level: "limited" };
}

function mergeRetrievedSources(answer: AssistantAnswer, articles: PubMedArticle[], trusted: TrustedSource[], question: string): AssistantAnswer {
  const retrieved: Source[] = articles.map((article) => {
    const classification = classifyEvidence(article.studyType);
    return { title: article.title, organization: "PubMed", description: article.abstract || `PubMed record for PMID ${article.pmid}.`, url: article.url, category: "research" as const, publicationYear: article.publicationDate || undefined, studyType: classification.normalized, evidenceLevel: classification.level, relevance: relevanceScore(question, article.title, article.abstract) };
  });
  retrieved.push(...trusted.map((source) => ({ title: source.title, organization: source.organization, description: source.description, url: source.url, category: "guidance" as const, studyType: "Authoritative health guidance", evidenceLevel: "not_applicable" as const, relevance: relevanceScore(question, source.title, source.description) })));
  const seen = new Set<string>();
  const sources = [...retrieved, ...answer.sources].filter((source) => {
    if (!source.url || seen.has(source.url)) return false;
    seen.add(source.url); return true;
  });
  return { ...answer, sources };
}

export const askAssistant = createServerFn({ method: "POST" })
  .validator((data: unknown) => { if (!isRequest(data)) throw new Error("Invalid request payload."); return data; })
  .handler(async ({ data }): Promise<AssistantAnswer> => {
    const question = normalizeQuestion(data.question);
    const route = classifyQuery(question);
    console.info(`Query route: ${route.category}; PubMed=${route.usePubMed}; trusted=${route.useTrustedSources}; reason=${route.reason}`);
    let evidence: PubMedArticle[] = [];
    let trusted: TrustedSource[] = [];
    if (route.usePubMed) {
      try { evidence = await searchPubMed(question, route.pubMedLimit); console.info(`PubMed retrieved ${evidence.length} article(s).`); }
      catch (error) { console.warn("PubMed retrieval unavailable; continuing without it.", error); }
    } else console.info("PubMed skipped by query router.");
    if (route.useTrustedSources) {
      trusted = await searchTrustedSources(question, route.trustedLimit);
      console.info(`Trusted health sources retrieved ${trusted.length} source(s).`);
    } else console.info("Trusted health sources skipped by query router.");

    let ragEvidence: Awaited<ReturnType<typeof retrieveRagEvidence>> = [];
    if (isRagDatabaseConfigured()) {
      try {
        ragEvidence = await retrieveRagEvidence(question, 8);
        console.info(\`RAG retrieved \${ragEvidence.length} semantic chunk(s).\`);
        if (ragEvidence.length === 0 && (evidence.length > 0 || trusted.length > 0)) {
          await indexRetrievedEvidence(evidence, trusted);
          ragEvidence = await retrieveRagEvidence(question, 8);
          console.info(\`RAG seeded and retrieved \${ragEvidence.length} semantic chunk(s).\`);
        }
      } catch (error) {
        console.warn("RAG retrieval unavailable; continuing with live evidence.", error);
      }
    }

    const providers = getOptionalProviders(RESPONSE_SCHEMA);
    if (providers.length === 0) return getMockAnswer(question);
    const ragContext = ragEvidence.length
      ? "\n\nSEMANTIC RAG MATCHES:\n" +
        ragEvidence.map((match, i) =>
          (i + 1) + ". " + match.title +
          "\nSimilarity: " + match.similarity.toFixed(3) +
          "\nSource: " + match.source_url +
          "\nContent: " + match.content
        ).join("\n\n")
      : "";
    const groundedQuestion = \`\${question}\n\nQUERY ROUTE: \${route.category}\n\n\${buildEvidenceContext(evidence, trusted)}\${ragContext}\`;
    const systemPrompt = buildSystemPrompt(route);
    for (const provider of providers) {
      try {
        const answer = await provider.generate(groundedQuestion, systemPrompt);
        if (isValidAnswer(answer)) {
          const groundedAnswer = mergeRetrievedSources(answer, evidence, trusted, question);
          const researchCount = groundedAnswer.sources.filter((s: any) => s.category === "research").length;
          const guidanceCount = groundedAnswer.sources.filter((s: any) => s.category === "guidance").length;
          console.info(`AI response generated by ${provider.label} using ${evidence.length} PubMed article(s) and ${trusted.length} trusted source(s); displaying ${groundedAnswer.sources.length} source(s) (${researchCount} research, ${guidanceCount} guidance).`);
          return groundedAnswer;
        }
        console.warn(`${provider.label} returned an invalid response shape; trying next provider.`);
      } catch (error) { console.warn(`${provider.label} unavailable; trying next provider.`, error); }
    }
    return getMockAnswer(question);
  });
