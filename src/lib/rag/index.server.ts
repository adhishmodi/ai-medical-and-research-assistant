import type { PubMedArticle } from "@/lib/pubmed.server";
import type { TrustedSource } from "@/lib/trusted-sources.server";
import { embedText } from "./embeddings.server";
import { chunkText } from "./chunking";
import {
  deleteMedicalChunks,
  getMedicalDocumentByUrl,
  isRagDatabaseConfigured,
  matchMedicalChunks,
  upsertMedicalChunk,
  upsertMedicalDocument,
  type RagMatch,
} from "./supabase.server";

async function hashContent(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function articleContent(article: PubMedArticle): string {
  return [
    "Title: " + article.title,
    "Journal: " + article.journal,
    "Publication year: " + article.publicationDate,
    "Study type: " + article.studyType,
    "Abstract: " + (article.abstract || "Abstract unavailable."),
  ].join("\n");
}

function guidanceContent(source: TrustedSource): string {
  return [
    "Title: " + source.title,
    "Organization: " + source.organization,
    source.description,
  ].join("\n");
}

async function indexDocument(input: {
  source_url: string;
  source_type: "pubmed" | "guidance";
  organization: string;
  title: string;
  description: string;
  publication_year?: string;
  study_type?: string;
  content: string;
}): Promise<void> {
  const contentHash = await hashContent(input.content);
  const existing = await getMedicalDocumentByUrl(input.source_url);

  if (existing?.content_hash === contentHash) {
    console.info("RAG skipped unchanged source: " + input.source_url);
    return;
  }

  const document = await upsertMedicalDocument({
    source_url: input.source_url,
    source_type: input.source_type,
    organization: input.organization,
    title: input.title,
    description: input.description,
    ...(input.publication_year ? { publication_year: input.publication_year } : {}),
    ...(input.study_type ? { study_type: input.study_type } : {}),
    content_hash: contentHash,
  });

  if (existing) {
    await deleteMedicalChunks(document.id);
  }

  for (const chunk of chunkText(input.content)) {
    const embedding = await embedText(chunk.content, "RETRIEVAL_DOCUMENT");
    await upsertMedicalChunk({
      document_id: document.id,
      chunk_index: chunk.index,
      content: chunk.content,
      embedding,
    });
  }

  console.info(
    "RAG indexed " + chunkText(input.content).length + " chunk(s): " + input.title,
  );
}

export async function indexRetrievedEvidence(
  articles: PubMedArticle[],
  trusted: TrustedSource[],
): Promise<void> {
  if (!isRagDatabaseConfigured()) return;
  const jobs = [
    ...articles.map((article) =>
      indexDocument({
        source_url: article.url,
        source_type: "pubmed",
        organization: "PubMed",
        title: article.title,
        description: article.abstract || "PubMed record for PMID " + article.pmid + ".",
        publication_year: article.publicationDate,
        study_type: article.studyType,
        content: articleContent(article),
      }),
    ),
    ...trusted.map((source) =>
      indexDocument({
        source_url: source.url,
        source_type: "guidance",
        organization: source.organization,
        title: source.title,
        description: source.description,
        content: guidanceContent(source),
      }),
    ),
  ];
  const results = await Promise.allSettled(jobs);
  const failures = results.filter(
    (result): result is PromiseRejectedResult => result.status === "rejected",
  );
  if (failures.length > 0) {
    const messages = failures.map((failure) =>
      failure.reason instanceof Error ? failure.reason.message : String(failure.reason),
    );
    throw new Error(
      "RAG indexing failed for " + failures.length + " source(s): " + messages.join(" | "),
    );
  }
}

export async function retrieveRagEvidence(question: string, count = 8): Promise<RagMatch[]> {
  if (!isRagDatabaseConfigured()) return [];
  const embedding = await embedText(question, "RETRIEVAL_QUERY");
  return matchMedicalChunks(embedding, 0.4, count);
}
