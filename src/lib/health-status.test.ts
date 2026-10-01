import { afterEach, describe, expect, it } from "vitest";

import { getBackendHealth } from "./health-status.server";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

function setCompleteEnvironment(): void {
  process.env["GEMINI_API_KEY"] = "test-gemini-key";
  process.env["SUPABASE_URL"] = "https://example.supabase.co";
  process.env["SUPABASE_SECRET_KEY"] = "test-supabase-secret";
  process.env["GEMINI_EMBEDDING_MODEL"] = "gemini-embedding-001";
  process.env["GEMINI_EMBEDDING_DIMENSIONS"] = "768";
}

describe("backend health status", () => {
  it("reports ready when required configuration is present", () => {
    setCompleteEnvironment();

    const health = getBackendHealth();

    expect(health.status).toBe("ok");
    expect(health.ready).toBe(true);
    expect(health.configuration).toEqual({
      gemini: "configured",
      supabase: "configured",
      rag: "configured",
    });
  });

  it("reports Gemini configuration as missing without exposing the secret", () => {
    setCompleteEnvironment();
    delete process.env["GEMINI_API_KEY"];

    const health = getBackendHealth();

    expect(health.ready).toBe(false);
    expect(health.configuration.gemini).toBe("missing");
    expect(JSON.stringify(health)).not.toContain("test-gemini-key");
  });

  it("reports Supabase configuration as missing without exposing the secret", () => {
    setCompleteEnvironment();
    delete process.env["SUPABASE_SECRET_KEY"];

    const health = getBackendHealth();

    expect(health.ready).toBe(false);
    expect(health.configuration.supabase).toBe("missing");
    expect(JSON.stringify(health)).not.toContain("test-supabase-secret");
    expect(JSON.stringify(health)).not.toContain("example.supabase.co");
  });

  it("reports invalid Supabase URLs without exposing configuration values", () => {
    setCompleteEnvironment();
    process.env["SUPABASE_URL"] = "not-a-url";

    const health = getBackendHealth();

    expect(health.ready).toBe(false);
    expect(health.configuration.supabase).toBe("invalid");
    expect(JSON.stringify(health)).not.toContain("not-a-url");
  });

  it("uses the existing safe defaults for embedding configuration", () => {
    setCompleteEnvironment();
    delete process.env["GEMINI_EMBEDDING_MODEL"];
    delete process.env["GEMINI_EMBEDDING_DIMENSIONS"];

    const health = getBackendHealth();

    expect(health.ready).toBe(true);
    expect(health.configuration.rag).toBe("configured");
  });
});
