import type { AssistantAnswer } from "@/data/mockResponses";
import type { AIProvider } from "./types";
import { fetchWithTimeout } from "@/lib/server-fetch";

async function callJsonProvider(
  url: string,
  headers: Record<string, string>,
  body: unknown,
  label: string,
): Promise<AssistantAnswer> {
  const response = await fetchWithTimeout(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  }, 30000);
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`${label} returned ${response.status}: ${detail}`);
  }
  const payload = (await response.json()) as { output_text?: string; choices?: Array<{ message?: { content?: string } }>; content?: Array<{ text?: string }> };
  const text = payload.output_text ?? payload.choices?.[0]?.message?.content ?? payload.content?.find((x) => x.text)?.text;
  if (!text) throw new Error(`${label} returned no text output.`);
  return JSON.parse(text) as AssistantAnswer;
}

export function getOptionalProviders(responseSchema: unknown): AIProvider[] {
  const providers: AIProvider[] = [];
  const geminiKey = process.env["GEMINI_API_KEY"]?.trim();
  const openaiKey = process.env["OPENAI_API_KEY"]?.trim();
  const anthropicKey = process.env["ANTHROPIC_API_KEY"]?.trim();
  const groqKey = process.env["GROQ_API_KEY"]?.trim();

  if (geminiKey) {
    const gemini = async (model: string, question: string, systemPrompt: string) => {
      const response = await fetchWithTimeout("https://generativelanguage.googleapis.com/v1beta/interactions", {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": geminiKey },
        body: JSON.stringify({ model, input: question, system_instruction: systemPrompt, response_format: { type: "text", mime_type: "application/json", schema: responseSchema } }),
      }, 30000);
      if (!response.ok) throw new Error(`Gemini ${model} returned ${response.status}: ${await response.text().catch(() => "")}`);
      const payload = (await response.json()) as { status?: string; output_text?: string; steps?: Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }> };
      if (payload.status && payload.status !== "completed") throw new Error(`Gemini ${model} interaction status: ${payload.status}`);
      const text = payload.output_text ?? payload.steps?.filter((s) => s.type === "model_output").flatMap((s) => s.content ?? []).find((x) => x.type === "text")?.text;
      if (!text) throw new Error(`Gemini ${model} returned no text output.`);
      return JSON.parse(text) as AssistantAnswer;
    };
    providers.push({ name: "gemini-primary", label: "Gemini 3.8 Flash", generate: (q, s) => gemini(process.env["GEMINI_MODEL"]?.trim() || "gemini-3.8-flash", q, s) });
    providers.push({ name: "gemini-fast", label: "Gemini 3.5 Flash-Lite", generate: (q, s) => gemini("gemini-3.5-flash-lite", q, s) });
  }

  if (openaiKey) {
    providers.push({
      name: "openai", label: "OpenAI GPT-5 mini", generate: (question, systemPrompt) => callJsonProvider(
        "https://api.openai.com/v1/responses",
        { authorization: `Bearer ${openaiKey}` },
        { model: process.env["OPENAI_MODEL"]?.trim() || "gpt-5-mini", instructions: systemPrompt, input: question, text: { format: { type: "json_object" } } },
        "OpenAI",
      ),
    });
  }

  if (anthropicKey) {
    providers.push({
      name: "anthropic", label: "Claude Sonnet", generate: async (question, systemPrompt) => {
        const response = await fetchWithTimeout("https://api.anthropic.com/v1/messages", {
          method: "POST", headers: { "content-type": "application/json", "x-api-key": anthropicKey, "anthropic-version": "2023-06-01" },
          body: JSON.stringify({ model: process.env["ANTHROPIC_MODEL"]?.trim() || "claude-sonnet-4-5", max_tokens: 4096, system: systemPrompt, messages: [{ role: "user", content: question }] }),
        }, 30000);
        if (!response.ok) throw new Error(`Anthropic returned ${response.status}: ${await response.text().catch(() => "")}`);
        const payload = (await response.json()) as { content?: Array<{ text?: string }> };
        const text = payload.content?.find((x) => x.text)?.text;
        if (!text) throw new Error("Anthropic returned no text output.");
        return JSON.parse(text) as AssistantAnswer;
      },
    });
  }

  if (groqKey) {
    providers.push({
      name: "groq", label: "Groq Llama", generate: (question, systemPrompt) => callJsonProvider(
        "https://api.groq.com/openai/v1/chat/completions",
        { authorization: `Bearer ${groqKey}` },
        { model: process.env["GROQ_MODEL"]?.trim() || "llama-3.3-70b-versatile", messages: [{ role: "system", content: systemPrompt }, { role: "user", content: question }], response_format: { type: "json_object" } },
        "Groq",
      ),
    });
  }

  return providers;
}
