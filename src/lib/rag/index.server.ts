import { createHash } from "node:crypto";
import type { PubMedArticle } from "@/lib/pubmed.server";
import type { TrustedSource } from "@/lib/trusted-sources.server";
import { embedText } from "./embeddings.server";
import { chunkText } from "./chunking";
import {
  isRagDatabaseConfigured, matchMedicalChunks, upsertMedicalChunk, upsertMedicalDocument,
  type RagMatch,
} from "./supabase.server";

function hashContent(value: string): string {
  return createHash("sha256").update(value).digest("hex");
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
  return ["Title: " + source.title, "Organization: " + source.organization, source.description].join("\n");
}

async function indexDocument(input: {
  source_url: string; source_type: "pubmed" | "guidance"; organization: string;
  title: string; description: string; publication_year?: string; study_type?: string; content: string;
}): Promise<void> {
  const document = await upsertMedicalDocument({
    source_url: input.source_url,
    source_type: input.source_type,
    organization: input.organization,
    title: input.title,
    description: input.description,
    publication_year: input.publication_year,
    study_type: input.study_type,
    content_hash: hashContent(input.content),
  });
  for (const chunk of chunkText(input.content)) {
    const embedding = await embedText(chunk.content, "RETRIEVAL_DOCUMENT");
    await upsertMedicalChunk({ document_id: document.id, chunk_index: chunk.index, content: chunk.content, embedding });
  }
}

export async function indexRetrievedEvidence(articles: PubMedArticle[], trusted: TrustedSource[]): Promise<void> {
  if (!isRagDatabaseConfigured()) return;
  const jobs = [
    ...articles.map((article) => indexDocument({
      source_url: article.url, source_type: "pubmed", organization: "PubMed", title: article.title,
      description: article.abstract || "PubMed record for PMID " + article.pmid + ".",
      publication_year: article.publicationDate, study_type: article.studyType, content: articleContent(article),
    })),
    ...trusted.map((source) => indexDocument({
      source_url: source.url, source_type: "guidance", organization: source.organization,
      title: source.title, description: source.description, content: guidanceContent(source),
    })),
  ];
  await Promise.allSettled(jobs);
}

export async function retrieveRagEvidence(question: string, count = 8): Promise<RagMatch[]> {
  if (!isRagDatabaseConfigured()) return [];
  const embedding = await embedText(question, "RETRIEVAL_QUERY");
  return matchMedicalChunks(embedding, 0.55, count);
}
