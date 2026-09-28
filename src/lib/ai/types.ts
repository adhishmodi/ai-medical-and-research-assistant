import type { AssistantAnswer } from "@/data/mockResponses";

export type AIProviderName = "gemini-primary" | "gemini-fast" | "openai" | "anthropic" | "groq";

export type AIProvider = {
  name: AIProviderName;
  label: string;
  generate: (question: string, systemPrompt: string) => Promise<AssistantAnswer>;
};
