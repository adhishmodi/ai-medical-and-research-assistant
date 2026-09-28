import type { AssistantAnswer } from "@/data/mockResponses";

type GeminiPart = { text?: string };
type GeminiResponse = {
  candidates?: Array<{
    content?: { parts?: GeminiPart[] };
  }>;
};

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    topic: { type: "STRING" },
    summary: { type: "STRING" },
    keyInformation: { type: "ARRAY", items: { type: "STRING" } },
    considerations: { type: "ARRAY", items: { type: "STRING" } },
    whenToSeekCare: { type: "ARRAY", items: { type: "STRING" } },
    sources: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          title: { type: "STRING" },
          organization: { type: "STRING" },
          description: { type: "STRING" },
          url: { type: "STRING" },
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

export async function generateGeminiAnswer(
  question: string,
  systemPrompt: string,
): Promise<AssistantAnswer> {
  const apiKey = process.env["GEMINI_API_KEY"];
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const model = process.env["GEMINI_MODEL"] || "gemini-3.8-flash";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: question }],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        temperature: 0.2,
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(`Gemini API returned ${response.status}: ${errorBody}`);
  }

  const payload = (await response.json()) as GeminiResponse;
  const text = payload.candidates?.[0]?.content?.parts?.find((part) => part.text)?.text;

  if (!text) {
    throw new Error("Gemini API response did not contain text content.");
  }

  return JSON.parse(text) as AssistantAnswer;
}
