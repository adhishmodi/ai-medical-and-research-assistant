import { describe, expect, it } from "vitest";
import { chunkText } from "./chunking";

describe("chunkText", () => {
  it("normalizes whitespace and preserves all non-empty content", () => {
    const chunks = chunkText("First sentence.\n\nSecond sentence.");
    expect(chunks).toHaveLength(1);
    expect(chunks[0]?.content).toBe("First sentence. Second sentence.");
    expect(chunks[0]?.index).toBe(0);
  });

  it("splits long content into ordered chunks", () => {
    const input = Array.from({ length: 20 }, (_, i) => `Sentence ${i} contains medical evidence.`).join(" ");
    const chunks = chunkText(input, 120, 20);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.map((chunk) => chunk.index)).toEqual(chunks.map((_, index) => index));
    expect(chunks.every((chunk) => chunk.content.length > 0)).toBe(true);
  });

  it("rejects invalid overlap settings", () => {
    expect(() => chunkText("medical text", 100, 100)).toThrow("Chunk overlap must be smaller than chunk size.");
  });

  it("returns no chunks for empty input", () => {
    expect(chunkText("   \n\t  ")).toEqual([]);
  });
});
