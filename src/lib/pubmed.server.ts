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

function clean(value: string): string { return value.replace(/\s+/g, " ").trim(); }

function decodeXml(value: string): string {
  return value.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">" ).replace(/&#39;/g, "'").replace(/&quot;/g, '"');
}

export async function searchPubMed(question: string, limit = 5): Promise<PubMedArticle[]> {
  const params = new URLSearchParams({ db: "pubmed", term: question, retmode: "json", retmax: String(limit), sort: "relevance", tool: "ai_medical_research_assistant" });
  const searchResponse = await fetch(`${BASE}/esearch.fcgi?${params}`);
  if (!searchResponse.ok) throw new Error(`PubMed search returned ${searchResponse.status}`);
  const search = (await searchResponse.json()) as { esearchresult?: { idlist?: string[] } };
  const ids = search.esearchresult?.idlist ?? [];
  if (ids.length === 0) return [];

  const fetchParams = new URLSearchParams({ db: "pubmed", id: ids.join(","), retmode: "xml", rettype: "abstract", tool: "ai_medical_research_assistant" });
  const fetchResponse = await fetch(`${BASE}/efetch.fcgi?${fetchParams}`);
  if (!fetchResponse.ok) throw new Error(`PubMed fetch returned ${fetchResponse.status}`);
  const xml = await fetchResponse.text();

  return ids.map((pmid) => {
    const block = xml.match(new RegExp(`<PubmedArticle>[\\s\\S]*?<PMID[^>]*>${pmid}</PMID>[\\s\\S]*?</PubmedArticle>`))?.[0] ?? "";
    const title = decodeXml(clean(block.match(/<ArticleTitle>([\s\S]*?)<\/ArticleTitle>/)?.[1]?.replace(/<[^>]+>/g, " ") ?? "PubMed article"));
    const journal = decodeXml(clean(block.match(/<Journal><Title>([\s\S]*?)<\/Title>/)?.[1] ?? "PubMed"));
    const year = block.match(/<PubDate>[\s\S]*?<Year>(\d{4})<\/Year>/)?.[1] ?? block.match(/<PubDate>[\s\S]*?<MedlineDate>(\d{4})/)?.[1] ?? "";
    const publicationTypes = [...block.matchAll(/<PublicationType[^>]*>([\s\S]*?)<\/PublicationType>/g)].map((m) => decodeXml(clean(m[1]))).filter(Boolean);
    const studyType = publicationTypes.length ? publicationTypes.slice(0, 2).join("; ") : "Biomedical study";
    const abstract = clean((block.match(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/g) ?? []).map((x) => x.replace(/<[^>]+>/g, " ").replace(/^<AbstractText[^>]*>/, "").replace(/<\/AbstractText>$/, "")).join(" "));
    return { pmid, title, journal, publicationDate: year, abstract, url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`, studyType };
  });
}
