export type Source = {
  title: string;
  organization: string;
  description: string;
  url?: string;
};

export type AssistantAnswer = {
  topic: string;
  summary: string;
  keyInformation: string[];
  considerations: string[];
  whenToSeekCare?: string[];
  sources: Source[];
};

export const EXAMPLE_QUESTIONS = [
  "What is hypertension?",
  "What are the symptoms of type 2 diabetes?",
  "Explain insulin resistance.",
  "What are the major risk factors for cardiovascular disease?",
  "What does current research say about hypertension?",
];

const hypertension: AssistantAnswer = {
  topic: "Hypertension",
  summary:
    "Hypertension, commonly called high blood pressure, is a long-term condition in which the pressure of blood against artery walls stays elevated. In most adults it is defined as a repeated office reading at or above 130/80 mmHg (ACC/AHA) or 140/90 mmHg (ESC/ESH). It usually causes no symptoms, which is why it is often detected only through routine measurement.",
  keyInformation: [
    "Blood pressure is reported as systolic (during the heartbeat) over diastolic (between beats), measured in millimetres of mercury.",
    "Roughly 90–95% of cases are primary (essential) hypertension, with no single identifiable cause; the remainder are secondary to kidney disease, endocrine disorders, sleep apnoea, or certain medicines.",
    "Sustained elevation increases the long-term risk of stroke, heart failure, coronary artery disease, chronic kidney disease, and vascular dementia.",
    "Population-level contributors include high dietary sodium, low potassium intake, excess body weight, physical inactivity, alcohol use, and chronic stress.",
    "Diagnosis generally requires several readings on separate occasions, and often home or 24-hour ambulatory monitoring to exclude white-coat or masked hypertension.",
  ],
  considerations: [
    "A single high reading is not a diagnosis; measurement technique, cuff size, caffeine, and recent activity all shift results.",
    "Thresholds and treatment targets differ between international guidelines and are adjusted for age, pregnancy, diabetes, and kidney function.",
    "Management is individualised and typically combines lifestyle measures with medication decisions made by a clinician.",
  ],
  whenToSeekCare: [
    "Very high readings (for example above 180/120 mmHg) accompanied by chest pain, breathlessness, severe headache, visual change, weakness, or confusion warrant emergency care.",
    "Persistent elevated home readings should be reviewed by a healthcare professional rather than self-managed.",
  ],
  sources: [
    {
      title: "Hypertension — Fact Sheet",
      organization: "World Health Organization",
      description:
        "Global overview of definitions, prevalence, complications, and population-level prevention strategies.",
      url: "https://www.who.int/news-room/fact-sheets/detail/hypertension",
    },
    {
      title: "High Blood Pressure — Health Topics",
      organization: "National Heart, Lung, and Blood Institute (NIH)",
      description:
        "Patient-oriented reference on causes, diagnosis, monitoring, and long-term management of high blood pressure.",
      url: "https://www.nhlbi.nih.gov/health/high-blood-pressure",
    },
    {
      title: "2017 ACC/AHA Guideline for the Prevention, Detection, Evaluation, and Management of High Blood Pressure in Adults",
      organization: "American College of Cardiology / American Heart Association",
      description:
        "Clinical practice guideline that introduced the 130/80 mmHg diagnostic threshold used in much of current literature.",
      url: "https://www.ahajournals.org/doi/10.1161/HYP.0000000000000065",
    },
  ],
};

const hypertensionResearch: AssistantAnswer = {
  topic: "Current research directions in hypertension",
  summary:
    "Recent hypertension research focuses on tighter blood-pressure targets, better measurement outside the clinic, simplified combination therapy, and device-based approaches for resistant cases. Findings are still debated, and guideline bodies weigh benefit against risks such as falls and kidney function decline.",
  keyInformation: [
    "Intensive-target trials such as SPRINT reported cardiovascular benefit from lower systolic targets in selected higher-risk adults, alongside more treatment-related adverse events.",
    "Out-of-office measurement (home and 24-hour ambulatory monitoring) is increasingly treated as the reference standard for diagnosis and follow-up.",
    "Single-pill combination therapy is being studied as a way to improve adherence and reach targets faster than sequential single-drug escalation.",
    "Renal denervation has returned to investigation for treatment-resistant hypertension, with sham-controlled trials showing modest average reductions.",
    "Sodium-reduction strategies, including potassium-enriched salt substitutes, have shown population-level cardiovascular benefit in large trials.",
  ],
  considerations: [
    "Trial populations are selected; results do not transfer uniformly to older adults, people with frailty, or those with advanced kidney disease.",
    "Guideline recommendations lag behind individual trials and vary by region.",
    "This is a general research overview, not an assessment of any specific treatment for any individual.",
  ],
  sources: [
    {
      title: "A Randomized Trial of Intensive versus Standard Blood-Pressure Control (SPRINT)",
      organization: "New England Journal of Medicine",
      description:
        "Landmark trial comparing intensive and standard systolic blood-pressure targets in high-risk adults.",
      url: "https://www.nejm.org/doi/full/10.1056/NEJMoa1511939",
    },
    {
      title: "2023 ESH Guidelines for the Management of Arterial Hypertension",
      organization: "European Society of Hypertension",
      description:
        "Current European guidance on diagnosis, measurement methods, and stepwise treatment strategy.",
      url: "https://www.eshonline.org/guidelines/",
    },
    {
      title: "Hypertension Research Literature",
      organization: "PubMed / National Library of Medicine",
      description: "Searchable index of peer-reviewed primary research and systematic reviews.",
      url: "https://pubmed.ncbi.nlm.nih.gov/?term=hypertension",
    },
  ],
};

const diabetesSymptoms: AssistantAnswer = {
  topic: "Type 2 diabetes — commonly reported symptoms",
  summary:
    "Type 2 diabetes develops gradually, and many people have no noticeable symptoms for years. When symptoms do appear they usually reflect sustained high blood glucose and its effect on fluid balance, energy use, healing, and nerves.",
  keyInformation: [
    "Increased thirst (polydipsia) and frequent urination (polyuria), often more noticeable at night.",
    "Persistent fatigue and reduced energy despite adequate rest.",
    "Increased hunger, sometimes with unintended weight loss.",
    "Blurred vision that fluctuates with glucose levels.",
    "Slow-healing cuts, recurrent skin, gum, or urinary infections.",
    "Tingling, numbness, or burning in the hands or feet, suggesting peripheral neuropathy.",
    "Darkened velvety skin patches (acanthosis nigricans), often on the neck or armpits, associated with insulin resistance.",
  ],
  considerations: [
    "These symptoms are non-specific and occur in many other conditions; they cannot confirm or exclude diabetes.",
    "Diagnosis relies on laboratory testing such as fasting plasma glucose, HbA1c, or an oral glucose tolerance test.",
    "A substantial share of cases are found through screening rather than symptoms, particularly in people with risk factors such as family history, higher body weight, or a history of gestational diabetes.",
  ],
  whenToSeekCare: [
    "Arrange testing with a healthcare professional if several of these symptoms persist.",
    "Seek urgent care for vomiting, rapid breathing, abdominal pain, fruity-smelling breath, drowsiness, or confusion — these can indicate a diabetic emergency.",
  ],
  sources: [
    {
      title: "Symptoms & Causes of Diabetes",
      organization: "National Institute of Diabetes and Digestive and Kidney Diseases (NIH)",
      description: "Reference description of symptoms, risk factors, and diagnostic testing for diabetes.",
      url: "https://www.niddk.nih.gov/health-information/diabetes/overview/symptoms-causes",
    },
    {
      title: "Diabetes — Fact Sheet",
      organization: "World Health Organization",
      description: "Global summary of diabetes types, common presentations, complications, and prevention.",
      url: "https://www.who.int/news-room/fact-sheets/detail/diabetes",
    },
    {
      title: "Standards of Care in Diabetes",
      organization: "American Diabetes Association",
      description: "Annually updated clinical standards covering screening thresholds and diagnostic criteria.",
      url: "https://diabetesjournals.org/care",
    },
  ],
};

const insulinResistance: AssistantAnswer = {
  topic: "Insulin resistance",
  summary:
    "Insulin resistance is a state in which muscle, fat, and liver cells respond less effectively to insulin, so the pancreas secretes more of it to keep blood glucose within range. It is a central mechanism in type 2 diabetes, metabolic syndrome, and non-alcoholic fatty liver disease.",
  keyInformation: [
    "Insulin normally signals cells to take up glucose from the blood and signals the liver to stop producing glucose.",
    "When signalling is blunted, beta cells compensate with higher insulin output (hyperinsulinaemia); blood glucose can stay normal during this phase.",
    "If beta-cell compensation eventually falls short, glucose rises into prediabetes and then type 2 diabetes ranges.",
    "Contributing factors include excess visceral fat, physical inactivity, sleep deprivation, chronic low-grade inflammation, certain medicines such as corticosteroids, and genetic predisposition.",
    "Associated findings can include raised triglycerides, low HDL cholesterol, raised blood pressure, fatty liver, and polycystic ovary syndrome.",
    "Regular physical activity increases glucose uptake by muscle through pathways that are partly independent of insulin.",
  ],
  considerations: [
    "There is no single routine clinical test; research measures such as HOMA-IR or the euglycaemic clamp are mostly used in studies.",
    "Insulin resistance is a physiological state rather than a formal diagnosis on its own, and its severity varies widely.",
    "Interpretation of related lab results should be done by a clinician in the context of the whole clinical picture.",
  ],
  sources: [
    {
      title: "Insulin Resistance & Prediabetes",
      organization: "National Institute of Diabetes and Digestive and Kidney Diseases (NIH)",
      description: "Overview of the mechanism, associated conditions, and evidence on lifestyle factors.",
      url: "https://www.niddk.nih.gov/health-information/diabetes/overview/what-is-diabetes/prediabetes-insulin-resistance",
    },
    {
      title: "Metabolic Syndrome",
      organization: "National Heart, Lung, and Blood Institute (NIH)",
      description: "Describes the cluster of metabolic findings frequently seen alongside insulin resistance.",
      url: "https://www.nhlbi.nih.gov/health/metabolic-syndrome",
    },
    {
      title: "Insulin Resistance Research Literature",
      organization: "PubMed / National Library of Medicine",
      description: "Peer-reviewed research on mechanisms, measurement, and clinical associations.",
      url: "https://pubmed.ncbi.nlm.nih.gov/?term=insulin+resistance",
    },
  ],
};

const cvdRisk: AssistantAnswer = {
  topic: "Cardiovascular disease risk factors",
  summary:
    "Cardiovascular disease risk is usually described as a combination of modifiable factors — those that respond to behaviour or treatment — and non-modifiable factors such as age, sex, and genetics. Risk is estimated from the whole profile rather than any single measurement.",
  keyInformation: [
    "Modifiable: high blood pressure, elevated LDL cholesterol, smoking and tobacco exposure, diabetes or high blood glucose, excess body weight, physical inactivity, unhealthy diet, and excess alcohol intake.",
    "Non-modifiable: increasing age, family history of premature cardiovascular disease, genetic conditions such as familial hypercholesterolaemia, and sex-related differences in risk pattern and presentation.",
    "Contributing conditions: chronic kidney disease, obstructive sleep apnoea, chronic inflammatory diseases such as rheumatoid arthritis, and adverse pregnancy outcomes including pre-eclampsia.",
    "Social and environmental factors — air pollution, chronic psychosocial stress, and limited access to care — measurably influence population risk.",
    "Clinicians commonly combine factors into an estimated 10-year risk score (for example PREVENT, SCORE2, or QRISK) to guide discussion.",
  ],
  considerations: [
    "Risk scores are population estimates and do not predict what will happen to any individual.",
    "Different calculators are validated for different regions and age ranges, so results are not directly comparable.",
    "Which factors matter most varies with the overall profile, and prevention decisions belong with a healthcare professional.",
  ],
  sources: [
    {
      title: "Cardiovascular Diseases (CVDs) — Fact Sheet",
      organization: "World Health Organization",
      description: "Global burden, principal behavioural risk factors, and prevention priorities.",
      url: "https://www.who.int/news-room/fact-sheets/detail/cardiovascular-diseases-(cvds)",
    },
    {
      title: "Understand Your Risks to Prevent a Heart Attack",
      organization: "American Heart Association",
      description: "Plain-language breakdown of modifiable and non-modifiable cardiovascular risk factors.",
      url: "https://www.heart.org/en/health-topics/heart-attack/understand-your-risks-to-prevent-a-heart-attack",
    },
    {
      title: "2021 ESC Guidelines on Cardiovascular Disease Prevention in Clinical Practice",
      organization: "European Society of Cardiology",
      description: "Guidance on risk estimation frameworks and stepwise prevention strategy.",
      url: "https://www.escardio.org/Guidelines",
    },
  ],
};

const fallback = (question: string): AssistantAnswer => ({
  topic: "General research guidance",
  summary: `A detailed prepared answer for "${question.trim()}" is not available in this prototype, which uses a curated offline reference set. The guidance below explains how this kind of question is usually approached in medical and biomedical literature, and where to look for evidence.`,
  keyInformation: [
    "Start from a tertiary source (national health institute pages, WHO fact sheets, or a clinical guideline) to establish definitions and accepted terminology.",
    "Move to systematic reviews and meta-analyses before individual studies — they summarise the weight of evidence rather than one result.",
    "Check the recency of the source; recommendations in fast-moving areas can change within a few years.",
    "Note the study population. Findings in one age group, sex, or comorbidity profile may not generalise.",
    "Distinguish association from causation, and note whether a result is a relative or an absolute effect.",
  ],
  considerations: [
    "This assistant provides educational context only and cannot evaluate an individual situation, symptoms, or test results.",
    "Sources below are general starting points rather than answers to this specific question; no citation has been invented to fill the gap.",
    "A clinician or medical librarian can help narrow a research question to the right literature.",
  ],
  whenToSeekCare: [
    "If the question relates to symptoms you or someone else is experiencing, contact a healthcare professional; for severe or rapidly worsening symptoms, seek emergency care.",
  ],
  sources: [
    {
      title: "PubMed",
      organization: "National Library of Medicine (NIH)",
      description: "Primary index of biomedical literature, including systematic reviews and clinical trials.",
      url: "https://pubmed.ncbi.nlm.nih.gov/",
    },
    {
      title: "Cochrane Library",
      organization: "Cochrane Collaboration",
      description: "Systematic reviews synthesising evidence on healthcare interventions.",
      url: "https://www.cochranelibrary.com/",
    },
    {
      title: "Health Topics",
      organization: "World Health Organization",
      description: "Reviewed overviews of conditions, prevention, and global health guidance.",
      url: "https://www.who.int/health-topics",
    },
  ],
});

type Entry = { keywords: string[][]; answer: AssistantAnswer };

const ENTRIES: Entry[] = [
  { keywords: [["hypertension", "research"], ["hypertension", "current"], ["blood pressure", "research"]], answer: hypertensionResearch },
  { keywords: [["hypertension"], ["high blood pressure"], ["blood pressure"]], answer: hypertension },
  { keywords: [["insulin resistance"], ["insulin-resistance"]], answer: insulinResistance },
  { keywords: [["diabetes"], ["type 2"], ["blood sugar"]], answer: diabetesSymptoms },
  { keywords: [["cardiovascular"], ["heart disease"], ["cvd"]], answer: cvdRisk },
];

export function getMockAnswer(question: string): AssistantAnswer {
  const q = question.toLowerCase();
  for (const entry of ENTRIES) {
    if (entry.keywords.some((group) => group.every((word) => q.includes(word)))) {
      return entry.answer;
    }
  }
  return fallback(question);
}

export const SAFETY_NOTICE =
  "This information is provided for educational purposes and is not a diagnosis or a substitute for professional medical advice.";
