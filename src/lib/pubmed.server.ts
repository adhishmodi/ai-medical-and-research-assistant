export type PubMedArticle = {
  pmid: string;
  title: string;
  journal: string;
  publicationDate: string;
  abstract: string;
  url: string;
  studyType: string;
};

const BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
import { fetchWithTimeout } from "@/lib/server-fetch";

const SEARCH_STOP_WORDS = new Set([
  "a",
  "about",
  "an",
  "and",
  "are",
  "be",
  "between",
  "can",
  "current",
  "does",
  "do",
  "for",
  "from",
  "findings",
  "how",
  "in",
  "latest",
  "of",
  "on",
  "research",
  "say",
  "studies",
  "study",
  "the",
  "to",
  "what",
  "which",
  "with",
]);

function clean(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function decodeXml(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"');
}

function buildFallbackTerms(question: string): string[] {
  const terms = question
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .map((term) => term.replace(/^-+|-+$/g, ""))
    .filter((term) => term.length >= 3 && !SEARCH_STOP_WORDS.has(term));

  return [...new Set(terms)].slice(0, 10);
}

function buildFallbackQueries(question: string): string[] {
  const terms = buildFallbackTerms(question);
  if (terms.length === 0) return [];

  const simple = terms.join(" ");
  const titleAbstract = terms.map((term) => `"${term}"[Title/Abstract]`).join(" AND ");

  return [...new Set([simple, titleAbstract])];
}

async function searchPubMedIds(term: string, limit: number): Promise<string[]> {
  const params = new URLSearchParams({
    db: "pubmed",
    term,
    retmode: "json",
    retmax: String(limit),
    sort: "relevance",
    tool: "ai_medical_research_assistant",
  });

  const response = await fetchWithTimeout(
    `${BASE}/esearch.fcgi?${params}`,
    {},
    8000,
  );
  if (!response.ok) throw new Error(`PubMed search returned ${response.status}`);

  const search = (await response.json()) as {
    esearchresult?: { idlist?: string[] };
  };

  return search.esearchresult?.idlist ?? [];
}

export async function searchPubMed(question: string, limit = 5): Promise<PubMedArticle[]> {
  const primaryTerm = clean(question);
  let ids = await searchPubMedIds(primaryTerm, limit);

  if (ids.length === 0) {
    for (const fallbackTerm of buildFallbackQueries(question)) {
      ids = await searchPubMedIds(fallbackTerm, limit);
      if (ids.length > 0) {
        console.info(`PubMed fallback query matched ${ids.length} article(s): ${fallbackTerm}`);
        break;
      }
    }
  }

  if (ids.length === 0) return [];

  const fetchParams = new URLSearchParams({
    db: "pubmed",
    id: ids.join(","),
    retmode: "xml",
    rettype: "abstract",
    tool: "ai_medical_research_assistant",
  });
  const fetchResponse = await fetchWithTimeout(
    `${BASE}/efetch.fcgi?${fetchParams}`,
    {},
    10000,
  );
  if (!fetchResponse.ok) throw new Error(`PubMed fetch returned ${fetchResponse.status}`);
  const xml = await fetchResponse.text();

  return ids.map((pmid) => {
    const block =
      xml.match(
        new RegExp(`<PubmedArticle>[\\s\\S]*?<PMID[^>]*>${pmid}</PMID>[\\s\\S]*?</PubmedArticle>`),
      )?.[0] ?? "";
    const title = decodeXml(
      clean(
        block.match(/<ArticleTitle>([\s\S]*?)<\/ArticleTitle>/)?.[1]?.replace(/<[^>]+>/g, " ") ??
          "PubMed article",
      ),
    );
    const journal = decodeXml(
      clean(block.match(/<Journal><Title>([\s\S]*?)<\/Title>/)?.[1] ?? "PubMed"),
    );
    const year =
      block.match(/<PubDate>[\s\S]*?<Year>(\d{4})<\/Year>/)?.[1] ??
      block.match(/<PubDate>[\s\S]*?<MedlineDate>(\d{4})/)?.[1] ??
      "";
    const publicationTypes = [
      ...block.matchAll(/<PublicationType[^>]*>([\s\S]*?)<\/PublicationType>/g),
    ]
      .map((m) => decodeXml(clean(m[1] ?? "")))
      .filter(Boolean);
    const studyType = publicationTypes.length
      ? publicationTypes.slice(0, 2).join("; ")
      : "Biomedical study";
    const abstract = clean(
      (block.match(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/g) ?? [])
        .map((x) =>
          x
            .replace(/<[^>]+>/g, " ")
            .replace(/^<AbstractText[^>]*>/, "")
            .replace(/<\/AbstractText>$/, ""),
        )
        .join(" "),
    );
    return {
      pmid,
      title,
      journal,
      publicationDate: year,
      abstract,
      url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
      studyType,
    };
  });
}
