type SupabaseConfig = { url: string; secretKey: string };

function getConfig(): SupabaseConfig | null {
  const url = process.env["SUPABASE_URL"]?.trim();
  const secretKey = process.env["SUPABASE_SECRET_KEY"]?.trim();
  if (!url || !secretKey) return null;
  return { url: url.replace(/\/$/, ""), secretKey };
}

export function isRagDatabaseConfigured(): boolean {
  return getConfig() !== null;
}

async function request(path: string, init: RequestInit = {}): Promise<Response> {
  const config = getConfig();
  if (!config) throw new Error("Supabase RAG database is not configured.");
  const headers = new Headers(init.headers);
  headers.set("apikey", config.secretKey);
  headers.set("Authorization", "Bearer " + config.secretKey);
  headers.set("Content-Type", "application/json");
  return fetch(config.url + "/rest/v1/" + path, { ...init, headers });
}

export type MedicalDocument = {
  id: number;
  source_url: string;
  content_hash: string;
};

export async function getMedicalDocumentByUrl(
  sourceUrl: string,
): Promise<MedicalDocument | null> {
  const params = new URLSearchParams({
    select: "id,source_url,content_hash",
    source_url: "eq." + sourceUrl,
    limit: "1",
  });
  const response = await request("medical_documents?" + params);
  if (!response.ok)
    throw new Error(
      "Supabase document lookup returned " +
        response.status +
        ": " +
        (await response.text().catch(() => "")),
    );
  const rows = (await response.json()) as MedicalDocument[];
  return rows[0] ?? null;
}

export async function deleteMedicalChunks(documentId: number): Promise<void> {
  const params = new URLSearchParams({ document_id: "eq." + documentId });
  const response = await request("medical_chunks?" + params, { method: "DELETE" });
  if (!response.ok)
    throw new Error(
      "Supabase chunk cleanup returned " +
        response.status +
        ": " +
        (await response.text().catch(() => "")),
    );
}

export async function upsertMedicalDocument(row: {
  source_url: string;
  source_type: "pubmed" | "guidance";
  organization: string;
  title: string;
  description: string;
  publication_year?: string;
  study_type?: string;
  content_hash: string;
}): Promise<{ id: number }> {
  const response = await request("medical_documents?on_conflict=source_url", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify(row),
  });
  if (!response.ok)
    throw new Error(
      "Supabase document upsert returned " +
        response.status +
        ": " +
        (await response.text().catch(() => "")),
    );
  const rows = (await response.json()) as Array<{ id: number }>;
  if (!rows[0]?.id) throw new Error("Supabase document upsert returned no id.");
  return rows[0];
}

export async function upsertMedicalChunk(row: {
  document_id: number;
  chunk_index: number;
  content: string;
  embedding: number[];
}): Promise<void> {
  const response = await request("medical_chunks?on_conflict=document_id%2Cchunk_index", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(row),
  });
  if (!response.ok)
    throw new Error(
      "Supabase chunk upsert returned " +
        response.status +
        ": " +
        (await response.text().catch(() => "")),
    );
}

export type RagMatch = {
  id: number;
  document_id: number;
  content: string;
  similarity: number;
  source_url: string;
  source_type: "pubmed" | "guidance";
  organization: string;
  title: string;
  publication_year?: string;
  study_type?: string;
};

export async function matchMedicalChunks(
  embedding: number[],
  threshold = 0.55,
  count = 8,
): Promise<RagMatch[]> {
  const response = await request("rpc/match_medical_chunks", {
    method: "POST",
    body: JSON.stringify({
      query_embedding: embedding,
      match_threshold: threshold,
      match_count: count,
    }),
  });
  if (!response.ok)
    throw new Error(
      "Supabase vector search returned " +
        response.status +
        ": " +
        (await response.text().catch(() => "")),
    );
  return (await response.json()) as RagMatch[];
}
