import { classifyQuery } from "./query-router.server";

describe("classifyQuery", () => {
  it("routes urgent symptoms to safety-first guidance", () => {
    expect(classifyQuery("I have severe chest pain and can't breathe").category).toBe("urgent-safety");
  });

  it("routes medication questions to medication safety", () => {
    expect(classifyQuery("What are common side effects of this medication?").category).toBe("medication");
  });

  it("routes research questions to PubMed", () => {
    const route = classifyQuery("Show me the latest randomized clinical trial evidence");
    expect(route.category).toBe("research");
    expect(route.usePubMed).toBe(true);
  });

  it("does not call medical retrieval for clearly non-medical questions", () => {
    const route = classifyQuery("How do I write a JavaScript loop?");
    expect(route.category).toBe("non-medical");
    expect(route.usePubMed).toBe(false);
    expect(route.useTrustedSources).toBe(false);
  });
});
