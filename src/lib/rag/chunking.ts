export type Chunk = { index: number; content: string };

export function chunkText(text: string, chunkSize = 1800, overlap = 250): Chunk[] {
  const normalized = text.replace(/\\s+/g, " ").trim();
  if (!normalized) return [];
  if (overlap >= chunkSize) throw new Error("Chunk overlap must be smaller than chunk size.");

  const chunks: Chunk[] = [];
  let start = 0;
  while (start < normalized.length) {
    const end = Math.min(normalized.length, start + chunkSize);
    let boundary = end;
    if (end < normalized.length) {
      const sentence = normalized.lastIndexOf(". ", end);
      const word = normalized.lastIndexOf(" ", end);
      if (sentence > start + Math.floor(chunkSize * 0.55)) boundary = sentence + 1;
      else if (word > start + Math.floor(chunkSize * 0.55)) boundary = word;
    }
    const content = normalized.slice(start, boundary).trim();
    if (content) chunks.push({ index: chunks.length, content });
    if (boundary >= normalized.length) break;
    start = Math.max(boundary - overlap, start + 1);
  }
  return chunks;
}
