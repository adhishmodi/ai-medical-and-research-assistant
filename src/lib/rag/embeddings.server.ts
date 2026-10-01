const DEFAULT_MODEL = "gemini-embedding-001";
const DEFAULT_DIMENSIONS = 768;

export async function embedText(
  text: string,
  taskType: "RETRIEVAL_QUERY" | "RETRIEVAL_DOCUMENT" = "RETRIEVAL_QUERY",
): Promise<number[]> {
  const apiKey = process.env["GEMINI_API_KEY"];
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");
  const model = process.env["GEMINI_EMBEDDING_MODEL"] || DEFAULT_MODEL;
  const dimensions = Number(process.env["GEMINI_EMBEDDING_DIMENSIONS"] || DEFAULT_DIMENSIONS);
  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":embedContent",
    {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        content: { parts: [{ text }] },
        taskType,
        outputDimensionality: dimensions,
      }),
    },
  );
  if (!response.ok)
    throw new Error(
      "Gemini embedding API returned " +
        response.status +
        ": " +
        (await response.text().catch(() => "")),
    );
  const payload = (await response.json()) as { embedding?: { values?: number[] } };
  const values = payload.embedding?.values;
  if (!values?.length) throw new Error("Gemini embedding response contained no vector.");
  return values;
}
