export type TrustedSource = {
  title: string;
  organization: string;
  description: string;
  url: string;
  category: "guidance";
};

import { fetchWithTimeout } from "@/lib/server-fetch";

function clean(value: string): string { return value.replace(/\s+/g, " ").trim(); }
function decodeHtml(value: string): string { return value.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;/g, "'").replace(/&quot;/g, '"'); }

function normalizeTrustedUrl(url: string, organization: "who" | "medlineplus"): string {
  const value = clean(decodeHtml(url));
  if (!value) return "";
  try {
    const parsed = new URL(value, organization === "who" ? "https://www.who.int" : "https://medlineplus.gov");
    if (parsed.protocol !== "https:") return "";
    const allowed = organization === "who"
      ? (parsed.hostname === "www.who.int" || parsed.hostname === "who.int")
      : (parsed.hostname === "medlineplus.gov" || parsed.hostname.endsWith(".nlm.nih.gov"));
    return allowed ? parsed.toString() : "";
  } catch {
    return "";
  }
}

async function searchMedlinePlus(query: string, limit = 4): Promise<TrustedSource[]> {
  const params = new URLSearchParams({
    db: "healthTopics",
    term: query,
    retmax: String(limit),
    rettype: "brief",
    tool: "ai_medical_research_assistant",
  });
  const response = await fetchWithTimeout(`https://wsearch.nlm.nih.gov/ws/query?${params}`, {}, 8000);
  if (!response.ok) throw new Error(`MedlinePlus search returned ${response.status}`);
  const xml = await response.text();
  const docs = [...xml.matchAll(/<document[^>]*>([\s\S]*?)<\/document>/g)].slice(0, limit);
  return docs.map((match) => {
    const block = match[1];
    const rawUrl = block.match(/<document[^>]*\burl="([^"]+)"/)?.[1] ?? "";
    const title = decodeHtml(clean(block.match(/<content name="title">([\s\S]*?)<\/content>/)?.[1] ?? "MedlinePlus Health Topic"));
    const snippet = decodeHtml(clean(block.match(/<content name="FullSummary">([\s\S]*?)<\/content>/)?.[1]?.replace(/<[^>]+>/g, " ") ?? block.match(/<content name="snippet">([\s\S]*?)<\/content>/)?.[1]?.replace(/<[^>]+>/g, " ") ?? "Trusted health information from the U.S. National Library of Medicine."));
    return {
      title,
      organization: "MedlinePlus / U.S. National Library of Medicine",
      description: snippet.slice(0, 900),
      url: normalizeTrustedUrl(rawUrl, "medlineplus"),
      category: "guidance" as const,
    };
  }).filter((source) => Boolean(source.url));
}

async function getWhoTopics(query: string, limit = 6): Promise<TrustedSource[]> {
  const response = await fetchWithTimeout("https://www.who.int/api/multimedias/healthtopics", {}, 8000);
  if (!response.ok) throw new Error(`WHO health topics returned ${response.status}`);
  const payload = (await response.json()) as { value?: Array<{ Title?: string; Summary?: string; UrlName?: string; ItemDefaultUrl?: string; ExternalURL?: string }> };
  const all = (payload.value ?? []).map((item) => {
    const title = clean(item.Title ?? "WHO Health Topic");
    const url = normalizeTrustedUrl(item.ExternalURL || item.ItemDefaultUrl || "", "who");
    return { title, organization: "World Health Organization", description: clean(item.Summary ?? "Official WHO health-topic information.").slice(0, 900), url, category: "guidance" as const };
  }).filter((source) => validHttpsUrl(source.url));
  return deduplicateAndRank(all, query, limit);
}

function scoreSource(source: TrustedSource, query: string): number {
  const terms = query.toLowerCase().split(/\W+/).filter((term) => term.length > 2);
  const haystack = `${source.title} ${source.description}`.toLowerCase();
  return terms.reduce((score, term) => score + (haystack.includes(term) ? 1 : 0), 0);
}

function deduplicateAndRank(sources: TrustedSource[], query: string, limit = 6): TrustedSource[] {
  const seen = new Set<string>();
  return sources.filter((source) => { if (!source.url || seen.has(source.url)) return false; seen.add(source.url); return true; }).sort((a, b) => scoreSource(b, query) - scoreSource(a, query)).slice(0, limit);
}

export async function searchTrustedSources(question: string, limit = 6): Promise<TrustedSource[]> {
  const results: TrustedSource[] = [];
  const [medlineResult, whoResult] = await Promise.allSettled([searchMedlinePlus(question, Math.min(4, limit)), getWhoTopics(question, Math.max(2, limit))]);
  if (medlineResult.status === "fulfilled") {
    results.push(...medlineResult.value);
    console.info(`MedlinePlus returned ${medlineResult.value.length} trusted source(s).`);
  } else {
    console.warn("MedlinePlus retrieval unavailable.", medlineResult.reason);
  }
  if (whoResult.status === "fulfilled") {
    results.push(...whoResult.value);
    console.info(`WHO returned ${whoResult.value.length} trusted source(s).`);
  } else {
    console.warn("WHO retrieval unavailable.", whoResult.reason);
  }
  const ranked = deduplicateAndRank(results, question, limit);
  console.info(`Trusted-source retrieval returned ${ranked.length} guidance source(s) total.`);
  return ranked;
}
