import { createServerFn } from "@tanstack/react-start";
import type { AssistantAnswer } from "@/data/mockResponses";

// This whole file runs on the server only. TanStack Start strips server
// function bodies out of the client bundle, so process.env.ANTHROPIC_API_KEY
// never reaches the browser.

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

Response format: your answer must map onto these sections, in this order — SUMMARY, KEY INFORMATION, IMPORTANT CONSIDERATIONS, WHEN TO SEEK MEDICAL CARE, SOURCES. (A SAFETY NOTICE is appended separately by the app itself — do not write your own safety notice text.) Output ONLY valid JSON — no markdown fences, no commentary before or after — matching exactly this shape, where each field corresponds to one section above:
{
  "topic": string,
  "summary": string,
  "keyInformation": string[],
  "considerations": string[],
  "whenToSeekCare": string[],
  "sources": [{ "title": string, "organization": string, "description": string, "url": string }]
}
"whenToSeekCare" should be a non-empty array whenever the topic could involve concerning or urgent symptoms (per rule 10); otherwise it may be an empty array.`;

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
  const s = value as RawSource;
  return (
    typeof s.title === "string" &&
    typeof s.organization === "string" &&
    typeof s.description === "string"
  );
}

function isValidAnswer(value: unknown): value is AssistantAnswer {
  if (!value || typeof value !== "object") return false;
  const v = value as RawAnswer;
  const sourcesValid = Array.isArray(v.sources) && v.sources.every(isValidSource);

  return (
    typeof v.topic === "string" &&
    typeof v.summary === "string" &&
    Array.isArray(v.keyInformation) &&
    v.keyInformation.every((i) => typeof i === "string") &&
    Array.isArray(v.considerations) &&
    v.considerations.every((i) => typeof i === "string") &&
    (v.whenToSeekCare === undefined ||
      (Array.isArray(v.whenToSeekCare) && v.whenToSeekCare.every((i) => typeof i === "string"))) &&
    sourcesValid
  );
}

type AskAssistantRequest = { question?: unknown };

function isAskAssistantRequest(data: unknown): data is { question: string } {
  if (typeof data !== "object" || data === null) return false;
  return typeof (data as AskAssistantRequest).question === "string";
}

export const askAssistant = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    if (!isAskAssistantRequest(data)) {
      throw new Error("Invalid request payload.");
    }
    return data;
  })
  .handler(async ({ data }): Promise<AssistantAnswer> => {
    const apiKey = process.env["ANTHROPIC_API_KEY"];
    if (!apiKey) {
      console.error("ANTHROPIC_API_KEY is not set.");
      throw new Error("The AI service is not configured. Please try again later.");
    }

    let response: Response;
    try {
      response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-5",
          max_tokens: 1200,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: data.question }],
        }),
      });
    } catch (networkError) {
      console.error("Network error calling Anthropic API:", networkError);
      throw new Error("Could not reach the AI service. Check your connection and try again.");
    }

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      console.error("Anthropic API returned an error:", response.status, errorBody);
      throw new Error("The AI service could not process this question right now.");
    }

    const payload = (await response.json()) as {
      content?: { type: string; text?: string }[];
    };
    const text = payload.content?.find((block) => block.type === "text")?.text;

    if (!text) {
      console.error("Anthropic API response had no text content:", payload);
      throw new Error("The AI service returned an empty response.");
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch (parseError) {
      console.error("Failed to parse AI JSON response:", text, parseError);
      throw new Error("The AI service returned a response in an unexpected format.");
    }

    if (!isValidAnswer(parsed)) {
      console.error("AI response failed shape validation:", parsed);
      throw new Error("The AI service returned an incomplete response.");
    }

    return parsed;
  });
