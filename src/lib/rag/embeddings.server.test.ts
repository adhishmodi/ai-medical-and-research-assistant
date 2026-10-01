import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { embedText } from "./embeddings.server";

describe("embedText", () => {
  beforeEach(() => {
    delete process.env["GEMINI_API_KEY"];
    delete process.env["GEMINI_EMBEDDING_MODEL"];
    delete process.env["GEMINI_EMBEDDING_DIMENSIONS"];
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env["GEMINI_API_KEY"];
    delete process.env["GEMINI_EMBEDDING_MODEL"];
    delete process.env["GEMINI_EMBEDDING_DIMENSIONS"];
  });

  it("fails clearly when the Gemini API key is missing", async () => {
    await expect(embedText("test")).rejects.toThrow("GEMINI_API_KEY is not configured.");
  });

  it("requests the configured embedding model and task type", async () => {
    process.env["GEMINI_API_KEY"] = "test-key";
    process.env["GEMINI_EMBEDDING_MODEL"] = "gemini-embedding-001";
    process.env["GEMINI_EMBEDDING_DIMENSIONS"] = "768";

    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ embedding: { values: [0.1, 0.2, 0.3] } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const vector = await embedText("COPD research", "RETRIEVAL_QUERY");
    expect(vector).toEqual([0.1, 0.2, 0.3]);

    const request = fetchMock.mock.calls[0]?.[1];
    expect(request?.method).toBe("POST");
    expect(Object.fromEntries(new Headers(request?.headers))).toEqual(expect.objectContaining({
      "content-type": "application/json",
      "x-goog-api-key": "test-key",
    }));
    expect(JSON.parse(String(request?.body))).toMatchObject({
      content: { parts: [{ text: "COPD research" }] },
      taskType: "RETRIEVAL_QUERY",
      outputDimensionality: 768,
    });
  });

  it("reports upstream embedding failures", async () => {
    process.env["GEMINI_API_KEY"] = "test-key";
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("upstream failure", { status: 503 }),
    );

    await expect(embedText("test")).rejects.toThrow("Gemini embedding API returned 503");
  });
});


describe("embedding configuration", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env["GEMINI_API_KEY"];
    delete process.env["GEMINI_EMBEDDING_MODEL"];
    delete process.env["GEMINI_EMBEDDING_DIMENSIONS"];
  });

  it("rejects a model that does not match the RAG task configuration", async () => {
    process.env["GEMINI_API_KEY"] = "test-key";
    process.env["GEMINI_EMBEDDING_MODEL"] = "gemini-embedding-2";

    await expect(embedText("test")).rejects.toThrow("RAG currently requires gemini-embedding-001");
  });

  it("rejects dimensions that do not match the pgvector schema", async () => {
    process.env["GEMINI_API_KEY"] = "test-key";
    process.env["GEMINI_EMBEDDING_DIMENSIONS"] = "1536";

    await expect(embedText("test")).rejects.toThrow("RAG currently requires 768-dimensional embeddings");
  });
});
