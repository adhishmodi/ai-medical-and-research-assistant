AI Medical & Research Assistant — Prototype Specification

1.1 Project objective

Build a web-based AI Medical & Research Assistant that helps users explore medical and biomedical information through natural-language questions.

The prototype should provide:

1. A simple medical/research question interface.
2. AI-generated structured educational responses.
3. Supporting medical/research sources.
4. A visible safety disclaimer.
5. Appropriate handling of diagnosis, personalized treatment, and potentially urgent questions.

The prototype is intended for education and research assistance, not diagnosis or replacement of a healthcare professional.

1.2 Target users
Primary users
Students
Researchers
Healthcare-information seekers
General users looking for educational medical information
Example users

A student might ask:

"Explain insulin resistance."

A researcher might ask:

"What are the major risk factors associated with type 2 diabetes?"

A general user might ask:

"What are common symptoms of anemia?"

1.3 Core user flow
User opens application
↓
Reads application description
↓
Enters medical/research question
↓
Clicks "Ask Assistant"
↓
System processes question
↓
AI generates structured response
↓
Sources are displayed
↓
Safety/disclaimer displayed

1.4 Prototype features

Feature 1 — Medical question input

Large input box:

"Ask a medical or research question..."

Examples:

What is hypertension?
What are the symptoms of type 2 diabetes?
Explain insulin resistance.
What are the risk factors for cardiovascular disease?

Feature 2 — AI-generated answer

The response should be organized into:

Summary

Short explanation.

Key information

Important facts presented as bullets.

Important considerations

Relevant context, limitations, or distinctions.

When to seek medical care

Only when appropriate.

Sources

Relevant supporting sources.

Safety notice

Clearly visible disclaimer.

1.5 Medical safety behavior

The application should not:

Diagnose a user.
Claim certainty about an individual's medical condition.
Prescribe medication.
Tell users to start/stop/change prescription medication.
Pretend to be a doctor.
Invent sources.
Present unsupported medical claims as established facts.

For potentially urgent situations, the application should encourage appropriate professional or emergency medical care rather than attempting to diagnose the user.

1.6 Example interaction
User

What are the symptoms of type 2 diabetes?

AI

Summary

Type 2 diabetes can develop gradually and some people may have few noticeable symptoms initially.

Key information

Increased thirst
Frequent urination
Increased hunger
Fatigue
Blurred vision
Slow-healing wounds

Important considerations

Symptoms can have many causes and do not by themselves establish a diagnosis.

Sources

Relevant authoritative medical source
Relevant research source

Safety

This information is for educational purposes and is not a diagnosis or a substitute for professional medical advice.

1.7 Main screen

┌──────────────────────────────────────────────────────┐
│ │
│ AI Medical & Research Assistant │
│ │
│ Evidence-aware medical information │
│ │
│ Ask questions about diseases, symptoms, research, │
│ treatments, biology and medical concepts. │
│ │
│ ┌──────────────────────────────────────────────┐ │
│ │ Ask a medical or research question... │ │
│ │ │ │
│ └──────────────────────────────────────────────┘ │
│ │
│ [ Ask Assistant ] │
│ │
│ Try asking │
│ │
│ [What is hypertension?] │
│ [Explain insulin resistance] │
│ [Diabetes risk factors] │
│ │
└──────────────────────────────────────────────────────┘

1.8 Answer screen

Question
────────────────────────────

What are the symptoms of diabetes?

Answer
────────────────────────────

Summary
...

Key Information
• ...
• ...
• ...

Important Considerations
...

When to Seek Medical Care
...

Sources
────────────────────────────
[Source]
[Source]

⚠ Educational information only.
Not a diagnosis or substitute for professional care.

1.9 Error states

The application should handle:

Empty question

Please enter a medical or research question.

AI failure

We couldn't generate a response right now. Please try again.

Network failure

Unable to connect to the service. Please try again.

Unsupported question

Please enter a medical, biomedical, or research-related question.

1.10 Features explicitly excluded from the first prototype

Do not implement these initially:

User authentication
User profiles
Payment
Doctor consultation
Appointment booking
Mobile app
Complex admin dashboard
Fine-tuning
Multi-agent architecture
Voice assistant
Wearable integration
Automatic diagnosis
Personalized prescriptions

These can become future versions.

1.11 Implemented architecture and future scope

The current implementation now follows the evidence-aware architecture below. Future work can add authentication, persistent user history, rate limiting, and other product features without changing the core safety/retrieval flow.
User
│
▼
Web Interface
│
▼
API Backend
│
┌──────────┴──────────┐
│ │
▼ ▼
Safety Layer Retrieval/RAG
│
┌───────────┴───────────┐
│ │
PubMed Medical
Sources Documents
│ │
└───────────┬───────────┘
▼
LLM
│
▼
Structured Response
│
┌────────┴────────┐
▼ ▼
Answer Sources
