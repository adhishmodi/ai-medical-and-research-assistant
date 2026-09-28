export type TrustedSource = {
  title: string;
  organization: string;
  description: string;
  url: string;
  category: "guidance";
};

function clean(value: string): string { return value.replace(/\s+/g, " ").trim(); }
function decodeHtml(value: string): string { return value.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;/g, "'").replace(/&quot;/g, '"'); }

function validHttpsUrl(url: string): boolean {
  try { const parsed = new URL(url); return parsed.protocol === "https:" && (parsed.hostname === "www.who.int" || parsed.hostname === "who.int" || parsed.hostname === "medlineplus.gov" || parsed.hostname.endsWith(".nlm.nih.gov")); }
  catch { return false; }
}

async function searchMedlinePlus(query: string, limit = 4): Promise<TrustedSource[]> {
  const params = new URLSearchParams({ db: "healthTopics", term: query, retmax: String(limit), retmode: "json" });
  const response = await fetch(`https://wsearch.nlm.nih.gov/ws/query?${params}`);
  if (!response.ok) throw new Error(`MedlinePlus search returned ${response.status}`);
  const xml = await response.text();
  const docs = [...xml.matchAll(/<document[^>]*>([\s\S]*?)<\/document>/g)].slice(0, limit);
  return docs.map((match) => {
    const block = match[1];
    const title = decodeHtml(clean(block.match(/<content name="title">([\s\S]*?)<\/content>/)?.[1] ?? "MedlinePlus Health Topic"));
    const url = decodeHtml(clean(block.match(/<content name="url">([\s\S]*?)<\/content>/)?.[1] ?? ""));
    const snippet = decodeHtml(clean(block.match(/<content name="FullSummary">([\s\S]*?)<\/content>/)?.[1]?.replace(/<[^>]+>/g, " ") ?? "Trusted health information from the U.S. National Library of Medicine."));
    return { title, organization: "MedlinePlus / U.S. National Library of Medicine", description: snippet.slice(0, 900), url, category: "guidance" as const };
  }).filter((source) => validHttpsUrl(source.url));
}

async function getWhoTopics(query: string, limit = 6): Promise<TrustedSource[]> {
  const response = await fetch("https://www.who.int/api/multimedias/healthtopics");
  if (!response.ok) throw new Error(`WHO health topics returned ${response.status}`);
  const payload = (await response.json()) as { value?: Array<{ Title?: string; Summary?: string; UrlName?: string; ItemDefaultUrl?: string; ExternalURL?: string }> };
  const all = (payload.value ?? []).map((item) => {
    const title = clean(item.Title ?? "WHO Health Topic");
    const url = item.ExternalURL || item.ItemDefaultUrl || "";
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
  if (medlineResult.status === "fulfilled") results.push(...medlineResult.value); else console.warn("MedlinePlus retrieval unavailable.", medlineResult.reason);
  if (whoResult.status === "fulfilled") results.push(...whoResult.value); else console.warn("WHO retrieval unavailable.", whoResult.reason);
  return deduplicateAndRank(results, question, limit);
}
