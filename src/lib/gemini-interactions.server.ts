import type { AssistantAnswer } from "@/data/mockResponses";

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    topic: { type: "string" },
    summary: { type: "string" },
    keyInformation: { type: "array", items: { type: "string" } },
    considerations: { type: "array", items: { type: "string" } },
    whenToSeekCare: { type: "array", items: { type: "string" } },
    sources: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          organization: { type: "string" },
          description: { type: "string" },
          url: { type: "string" },
        },
        required: ["title", "organization", "description"],
      },
    },
  },
  required: ["topic", "summary", "keyInformation", "considerations", "whenToSeekCare", "sources"],
};

type InteractionResponse = {
  output_text?: string;
  steps?: Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }>;
};

export async function generateGeminiInteraction(
  question: string,
  systemPrompt: string,
): Promise<AssistantAnswer> {
  const apiKey = process.env["GEMINI_API_KEY"];
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");

  const model = process.env["GEMINI_MODEL"] || "gemini-3.8-flash";
  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      model,
      input: question,
      system_instruction: systemPrompt,
      response_format: { type: "text", mime_type: "application/json", schema: RESPONSE_SCHEMA },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(`Gemini API returned ${response.status}: ${errorBody}`);
  }

  const payload = (await response.json()) as InteractionResponse;
  const text =
    payload.output_text ||
    payload.steps?.find((s) => s.type === "model_output")?.content?.find((p) => p.type === "text")
      ?.text;
  if (!text) throw new Error("Gemini API response did not contain model output text.");
  return JSON.parse(text) as AssistantAnswer;
}
