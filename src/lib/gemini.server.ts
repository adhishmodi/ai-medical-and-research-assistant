import type { AssistantAnswer } from "@/data/mockResponses";

type GeminiInteractionResponse = {
  output_text?: string;
  status?: string;
  steps?: Array<{
    type?: string;
    content?: Array<{ type?: string; text?: string }>;
  }>;
};

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
  required: [
    "topic",
    "summary",
    "keyInformation",
    "considerations",
    "whenToSeekCare",
    "sources",
  ],
};

function getOutputText(payload: GeminiInteractionResponse): string | undefined {
  if (typeof payload.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text;
  }

  for (const step of payload.steps ?? []) {
    if (step.type !== "model_output") continue;
    for (const item of step.content ?? []) {
      if (item.type === "text" && typeof item.text === "string" && item.text.trim()) {
        return item.text;
      }
    }
  }

  return undefined;
}

export async function generateGeminiAnswer(
  question: string,
  systemPrompt: string,
): Promise<AssistantAnswer> {
  const apiKey = process.env["GEMINI_API_KEY"];
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const model = process.env["GEMINI_MODEL"] || "gemini-3.8-flash";
  const endpoint = "https://generativelanguage.googleapis.com/v1beta/interactions";

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      model,
      input: question,
      system_instruction: systemPrompt,
      response_format: {
        type: "text",
        mime_type: "application/json",
        schema: RESPONSE_SCHEMA,
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(`Gemini Interactions API returned ${response.status}: ${errorBody}`);
  }

  const payload = (await response.json()) as GeminiInteractionResponse;
  const text = getOutputText(payload);

  if (!text) {
    throw new Error(`Gemini Interactions API returned no model output (status: ${payload.status ?? "unknown"}).`);
  }

  return JSON.parse(text) as AssistantAnswer;
}
