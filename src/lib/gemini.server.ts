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
  required: ["topic", "summary", "keyInformation", "considerations", "whenToSeekCare", "sources"],
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

async function requestGemini(
  model: string,
  question: string,
  systemPrompt: string,
  apiKey: string,
): Promise<AssistantAnswer> {
  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
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
    const error = new Error(
      `Gemini Interactions API returned ${response.status}: ${errorBody}`,
    ) as Error & {
      status?: number;
    };
    error.status = response.status;
    throw error;
  }

  const payload = (await response.json()) as GeminiInteractionResponse;
  const text = getOutputText(payload);

  if (!text) {
    throw new Error(
      `Gemini Interactions API returned no model output (status: ${payload.status ?? "unknown"}).`,
    );
  }

  return JSON.parse(text) as AssistantAnswer;
}

export async function generateGeminiAnswer(
  question: string,
  systemPrompt: string,
): Promise<AssistantAnswer> {
  const apiKey = process.env["GEMINI_API_KEY"];
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const primaryModel = process.env["GEMINI_MODEL"] || "gemini-3.8-flash";
  const fallbackModel = process.env["GEMINI_FALLBACK_MODEL"] || "gemini-3.5-flash-lite";

  try {
    return await requestGemini(primaryModel, question, systemPrompt, apiKey);
  } catch (error) {
    const status = (error as { status?: number })?.status;
    if ((status === 503 || status === 429) && fallbackModel !== primaryModel) {
      console.warn(`${primaryModel} unavailable (${status}); trying ${fallbackModel}.`);
      return await requestGemini(fallbackModel, question, systemPrompt, apiKey);
    }
    throw error;
  }
}
