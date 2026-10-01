export type ConfigurationStatus = "configured" | "missing" | "invalid";

export type BackendHealth = {
  status: "ok" | "not_ready";
  service: "ai-medical-research-assistant";
  ready: boolean;
  configuration: {
    gemini: ConfigurationStatus;
    supabase: ConfigurationStatus;
    rag: ConfigurationStatus;
  };
};

const DEFAULT_EMBEDDING_MODEL = "gemini-embedding-001";
const DEFAULT_EMBEDDING_DIMENSIONS = 768;

function getEnv(name: string): string {
  return process.env[name]?.trim() ?? "";
}

function getConfigurationStatus(): BackendHealth["configuration"] {
  const gemini = getEnv("GEMINI_API_KEY") ? "configured" : "missing";

  const supabaseUrl = getEnv("SUPABASE_URL");
  const supabaseSecret = getEnv("SUPABASE_SECRET_KEY");
  const supabaseUrlValid = /^https?:\/\//i.test(supabaseUrl);
  const supabase =
    !supabaseUrl || !supabaseSecret ? "missing" : supabaseUrlValid ? "configured" : "invalid";

  const embeddingModel = getEnv("GEMINI_EMBEDDING_MODEL") || DEFAULT_EMBEDDING_MODEL;
  const embeddingDimensions = Number(
    getEnv("GEMINI_EMBEDDING_DIMENSIONS") || DEFAULT_EMBEDDING_DIMENSIONS,
  );
  const embeddingConfigurationValid =
    embeddingModel === DEFAULT_EMBEDDING_MODEL &&
    Number.isInteger(embeddingDimensions) &&
    embeddingDimensions === DEFAULT_EMBEDDING_DIMENSIONS;

  const rag: ConfigurationStatus =
    supabase === "missing"
      ? "missing"
      : supabase === "invalid" || !embeddingConfigurationValid
        ? "invalid"
        : "configured";

  return { gemini, supabase, rag };
}

export function getBackendHealth(): BackendHealth {
  const configuration = getConfigurationStatus();
  const ready =
    configuration.gemini === "configured" &&
    configuration.supabase === "configured" &&
    configuration.rag === "configured";

  return {
    status: ready ? "ok" : "not_ready",
    service: "ai-medical-research-assistant",
    ready,
    configuration,
  };
}
