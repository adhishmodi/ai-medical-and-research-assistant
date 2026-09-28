export type TrustedSource = {
  title: string;
  organization: string;
  description: string;
  url: string;
};

function clean(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

async function searchMedlinePlus(query: string, limit = 3): Promise<TrustedSource[]> {
  const params = new URLSearchParams({ db: "healthTopics", term: query, retmax: String(limit), retmode: "json" });
  const response = await fetch(`https://wsearch.nlm.nih.gov/ws/query?${params}`);
  if (!response.ok) throw new Error(`MedlinePlus search returned ${response.status}`);
  const xml = await response.text();
  const docs = [...xml.matchAll(/<document[^>]*>([\s\S]*?)<\/document>/g)].slice(0, limit);
  return docs.map((match) => {
    const block = match[1];
    const title = clean(block.match(/<content name="title">([\s\S]*?)<\/content>/)?.[1] ?? "MedlinePlus Health Topic");
    const url = clean(block.match(/<content name="url">([\s\S]*?)<\/content>/)?.[1] ?? "https://medlineplus.gov/");
    const snippet = clean(block.match(/<content name="FullSummary">([\s\S]*?)<\/content>/)?.[1]?.replace(/<[^>]+>/g, " ") ?? "Trusted health information from the U.S. National Library of Medicine.");
    return { title, organization: "MedlinePlus / U.S. National Library of Medicine", description: snippet.slice(0, 900), url };
  });
}

export async function searchTrustedSources(question: string): Promise<TrustedSource[]> {
  try {
    return await searchMedlinePlus(question, 3);
  } catch (error) {
    console.warn("MedlinePlus retrieval unavailable; continuing with PubMed evidence.", error);
    return [];
  }
}
