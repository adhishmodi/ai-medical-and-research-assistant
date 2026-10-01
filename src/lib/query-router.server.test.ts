import { describe, expect, it } from "vitest";
import { classifyQuery } from "./query-router.server";

describe("classifyQuery", () => {
  it("routes research questions to PubMed and trusted sources", () => {
    const route = classifyQuery("What does recent research say about COPD treatment?");
    expect(route.category).toBe("research");
    expect(route.usePubMed).toBe(true);
    expect(route.useTrustedSources).toBe(true);
    expect(route.pubMedLimit).toBe(8);
    expect(route.trustedLimit).toBe(4);
    expect(route.safetyFirst).toBe(false);
  });

  it("prioritizes urgent safety routing", () => {
    const route = classifyQuery("I have severe chest pain and difficulty breathing");
    expect(route.category).toBe("urgent-safety");
    expect(route.usePubMed).toBe(false);
    expect(route.useTrustedSources).toBe(true);
    expect(route.safetyFirst).toBe(true);
  });

  it("routes medication questions with safety-focused research", () => {
    const route = classifyQuery(
      "What are common side effects and interactions of this medication?",
    );
    expect(route.category).toBe("medication");
    expect(route.usePubMed).toBe(true);
    expect(route.useTrustedSources).toBe(true);
    expect(route.safetyFirst).toBe(true);
  });

  it("does not retrieve medical evidence for clearly non-medical questions", () => {
    const route = classifyQuery("How do I improve my JavaScript code?");
    expect(route.category).toBe("non-medical");
    expect(route.usePubMed).toBe(false);
    expect(route.useTrustedSources).toBe(false);
  });
});
