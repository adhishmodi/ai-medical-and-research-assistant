export type QueryCategory = "general-medical" | "research" | "medication" | "urgent-safety" | "non-medical";

export type QueryRoute = {
  category: QueryCategory;
  usePubMed: boolean;
  useTrustedSources: boolean;
  pubMedLimit: number;
  trustedLimit: number;
  safetyFirst: boolean;
  reason: string;
};

const URGENT_TERMS = [
  "can't breathe", "cannot breathe", "difficulty breathing", "shortness of breath", "chest pain", "severe bleeding",
  "unconscious", "passed out", "seizure", "stroke", "overdose", "poisoning", "suicide", "suicidal", "not breathing",
  "blue lips", "severe allergic reaction", "anaphylaxis", "emergency", "life threatening", "life-threatening",
];
const MEDICATION_TERMS = ["medicine", "medication", "drug", "dose", "dosage", "tablet", "capsule", "antibiotic", "side effect", "interaction", "contraindication", "prescription"];
const RESEARCH_TERMS = ["research", "study", "studies", "systematic review", "meta-analysis", "clinical trial", "evidence", "literature", "publication", "paper", "association", "efficacy", "effectiveness", "mechanism"];
const MEDICAL_TERMS = ["symptom", "disease", "condition", "diagnosis", "treatment", "therapy", "cause", "risk factor", "prevention", "prognosis", "anemia", "diabetes", "cancer", "infection", "fever", "pain", "hypothermia", "blood pressure", "heart", "lung", "kidney", "liver", "brain"];

function includesAny(text: string, terms: string[]): boolean { return terms.some((term) => text.includes(term)); }

export function classifyQuery(question: string): QueryRoute {
  const q = question.toLowerCase().replace(/\s+/g, " ").trim();

  if (includesAny(q, URGENT_TERMS)) {
    return { category: "urgent-safety", usePubMed: false, useTrustedSources: true, pubMedLimit: 0, trustedLimit: 4, safetyFirst: true, reason: "Potential emergency or time-sensitive safety query." };
  }
  if (includesAny(q, MEDICATION_TERMS)) {
    return { category: "medication", usePubMed: true, useTrustedSources: true, pubMedLimit: 6, trustedLimit: 6, safetyFirst: true, reason: "Medication-related query requires safety-focused authoritative information." };
  }
  if (includesAny(q, RESEARCH_TERMS)) {
    return { category: "research", usePubMed: true, useTrustedSources: true, pubMedLimit: 8, trustedLimit: 4, safetyFirst: false, reason: "Research-oriented query benefits from peer-reviewed literature." };
  }
  if (includesAny(q, MEDICAL_TERMS)) {
    return { category: "general-medical", usePubMed: true, useTrustedSources: true, pubMedLimit: 5, trustedLimit: 6, safetyFirst: false, reason: "Medical information query uses research and trusted health sources." };
  }
  return { category: "non-medical", usePubMed: false, useTrustedSources: false, pubMedLimit: 0, trustedLimit: 0, safetyFirst: false, reason: "No clear medical or research intent detected." };
}
