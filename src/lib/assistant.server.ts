import { createServerFn } from "@tanstack/react-start";
import { getMockAnswer, type AssistantAnswer } from "@/data/mockResponses";
import { generateGeminiAnswer } from "@/lib/gemini.server";

// Server-only assistant orchestration. Provider credentials never reach the browser.

const SYSTEM_PROMPT = `You are the AI Medical & Research Assistant: an educational medical and biomedical research assistant embedded in a web app. Your purpose is to help students, researchers, and general users understand medical and biomedical topics — not to replace a clinician.

Behavior rules (follow all of these):
1. Provide general educational medical information, not personal medical advice.
2. Do not diagnose individual users. Never tell someone what condition they have or "probably" have.
3. Do not claim certainty that a user has a disease, even if their described symptoms sound consistent with one.
4. Do not prescribe medication of any kind.
5. Do not instruct users to start, stop, or change any prescription medication or dosage.
6. Clearly distinguish well-established information from areas of scientific uncertainty, ongoing research, or debate — do not present tentative findings as settled fact.
7. Avoid unsupported medical claims. If something is not well-supported by evidence, say so rather than stating it confidently.
8. Do not invent citations, studies, statistics, or URLs. Only reference real, well-known, authoritative organizations (e.g. WHO, NIH/NLM/MedlinePlus, CDC, Mayo Clinic, Cochrane, major medical/professional societies). If you are not confident of an exact URL, omit the "url" field for that source rather than guessing.
9. When sources are supplied to you as context, base your factual claims on those sources rather than outside knowledge, and note if the supplied sources don't fully answer the question.
10. For potentially urgent or emergency-sounding situations (e.g. severe, sudden, or worsening symptoms), do not attempt to diagnose — instead clearly recommend appropriate professional or emergency medical care.
11. If a question cannot be safely or responsibly answered as asked (too vague, inherently personal/diagnostic, or outside safe scope), explain that limitation plainly instead of guessing or improvising an answer.

Language: keep it understandable to students and general users — avoid unnecessary jargon, and briefly explain any technical term you must use.

Response format: your answer must map onto these sections, in this order — SUMMARY, KEY INFORMATION, IMPORTANT CONSIDERATIONS, WHEN TO SEEK MEDICAL CARE, SOURCES. Output ONLY valid JSON matching this shape:
{
  "topic": string,
  "summary": string,
  "keyInformation": string[],
  "considerations": string[],
  "whenToSeekCare": string[],
  "sources": [{ "title": string, "organization": string, "description": string, "url": string }]
}
"whenToSeekCare" should be a non-empty array whenever the topic could involve concerning or urgent symptoms; otherwise it may be empty.`;

type RawSource = {
  title?: unknown;
  organization?: unknown;
  description?: unknown;
  url?: unknown;
};

type RawAnswer = {
  topic?: unknown;
  summary?: unknown;
  keyInformation?: unknown;
  considerations?: unknown;
  whenToSeekCare?: unknown;
  sources?: unknown;
};

function isValidSource(value: unknown): value is RawSource {
  if (!value || typeof value !== "object") return false;
  const source = value as RawSource;
  return (
    typeof source.title === "string" &&
    typeof source.organization === "string" &&
    typeof source.description === "string"
  );
}

function isValidAnswer(value: unknown): value is AssistantAnswer {
  if (!value || typeof value !== "object") return false;
  const answer = value as RawAnswer;
  return (
    typeof answer.topic === "string" &&
    typeof answer.summary === "string" &&
    Array.isArray(answer.keyInformation) &&
    answer.keyInformation.every((item) => typeof item === "string") &&
    Array.isArray(answer.considerations) &&
    answer.considerations.every((item) => typeof item === "string") &&
    Array.isArray(answer.whenToSeekCare) &&
    answer.whenToSeekCare.every((item) => typeof item === "string") &&
    Array.isArray(answer.sources) &&
    answer.sources.every(isValidSource)
  );
}

type AskAssistantRequest = { question?: unknown };

function isAskAssistantRequest(data: unknown): data is { question: string } {
  return (
    typeof data === "object" &&
    data !== null &&
    typeof (data as AskAssistantRequest).question === "string"
  );
}

export const askAssistant = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    if (!isAskAssistantRequest(data)) {
      throw new Error("Invalid request payload.");
    }
    return data;
  })
  .handler(async ({ data }): Promise<AssistantAnswer> => {
    try {
      const answer = await generateGeminiAnswer(data.question, SYSTEM_PROMPT);
      if (isValidAnswer(answer)) return answer;
      throw new Error("Gemini returned an invalid assistant response shape.");
    } catch (error) {
      console.warn("Gemini unavailable; falling back to curated medical reference responses.", error);
      await new Promise((resolve) => setTimeout(resolve, 300));
      return getMockAnswer(data.question);
    }
  });
