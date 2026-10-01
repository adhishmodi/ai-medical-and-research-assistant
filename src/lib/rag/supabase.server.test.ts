import { afterEach, describe, expect, it, vi } from "vitest";
import { matchMedicalChunks } from "./supabase.server";

describe("matchMedicalChunks", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env["SUPABASE_URL"];
    delete process.env["SUPABASE_SECRET_KEY"];
  });

  it("returns semantic matches from the vector RPC", async () => {
    process.env["SUPABASE_URL"] = "https://example.supabase.co";
    process.env["SUPABASE_SECRET_KEY"] = "test-secret";

    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify([
        {
          id: 1,
          document_id: 2,
          content: "COPD evidence",
          similarity: 0.91,
          source_url: "https://example.org/copd",
          source_type: "guidance",
          organization: "WHO",
          title: "COPD",
        },
      ]), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const matches = await matchMedicalChunks([1, 0, 0], 0.4, 8);

    expect(matches[0]?.similarity).toBe(0.91);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.supabase.co/rest/v1/rpc/match_medical_chunks",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          apikey: "test-secret",
          Authorization: "Bearer test-secret",
        }),
      }),
    );
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({
      query_embedding: [1, 0, 0],
      match_threshold: 0.4,
      match_count: 8,
    });
  });

  it("fails clearly when Supabase RAG is not configured", async () => {
    await expect(matchMedicalChunks([1, 0, 0])).rejects.toThrow("Supabase RAG database is not configured.");
  });
});
