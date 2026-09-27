import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";

import { AnswerPanel, AnswerSkeleton } from "@/components/AnswerPanel";
import { QuestionForm } from "@/components/QuestionForm";
import { SafetyNotice } from "@/components/SafetyNotice";
import { getMockAnswer, type AssistantAnswer } from "@/data/mockResponses";

const TITLE = "AI Medical & Research Assistant";
const DESCRIPTION =
  "Explore medical and biomedical information with an AI-powered research assistant. Educational use only — not a diagnosis.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [question, setQuestion] = useState("");
  const [askedQuestion, setAskedQuestion] = useState("");
  const [answer, setAnswer] = useState<AssistantAnswer | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const answerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSubmit = () => {
    const trimmed = question.trim();
    if (trimmed.length === 0) {
      setValidationError("Please enter a question before asking the assistant.");
      return;
    }
    if (trimmed.length < 6) {
      setValidationError("Please write a slightly longer question so the assistant can respond usefully.");
      return;
    }

    setValidationError(null);
    setRequestError(null);
    setAnswer(null);
    setAskedQuestion(trimmed);
    setIsLoading(true);

    window.setTimeout(() => {
      answerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      try {
        setAnswer(getMockAnswer(trimmed));
      } catch {
        setRequestError("Something went wrong while preparing the answer. Please try asking again.");
      } finally {
        setIsLoading(false);
      }
    }, 1200);
  };

  const handleClear = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setQuestion("");
    setAskedQuestion("");
    setAnswer(null);
    setIsLoading(false);
    setValidationError(null);
    setRequestError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
          <p className="rule-label">Educational research tool</p>
          <h1 className="mt-3 font-display text-3xl leading-tight text-foreground sm:text-[2.6rem]">
            AI Medical &amp; Research Assistant
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Explore medical and biomedical information with an AI-powered research assistant.
          </p>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            The assistant explains concepts, summarises what the literature reports, and points to
            reference sources. It does not diagnose conditions, interpret personal test results, or
            advise on medication.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-8 px-5 py-8 sm:px-8 sm:py-12">
        <QuestionForm
          question={question}
          onQuestionChange={(value) => {
            setQuestion(value);
            if (validationError) setValidationError(null);
          }}
          onSubmit={handleSubmit}
          onClear={handleClear}
          isLoading={isLoading}
          validationError={validationError}
          hasAnswer={Boolean(answer) || isLoading}
        />

        <div ref={answerRef} className="scroll-mt-6">
          {isLoading ? <AnswerSkeleton /> : null}

          {!isLoading && requestError ? (
            <div
              role="alert"
              className="rounded-xl border border-destructive/40 bg-card p-5 sm:p-7"
            >
              <h2 className="font-display text-lg text-foreground">The answer could not be loaded</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{requestError}</p>
              <button
                type="button"
                onClick={handleSubmit}
                className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Try again
              </button>
            </div>
          ) : null}

          {!isLoading && !requestError && answer ? (
            <AnswerPanel answer={answer} question={askedQuestion} />
          ) : null}

          {!isLoading && !requestError && !answer ? <SafetyNotice compact /> : null}
        </div>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-3xl px-5 py-8 text-xs leading-relaxed text-muted-foreground sm:px-8">
          Prototype using a curated offline reference set. Always consult a qualified healthcare
          professional for personal medical questions, and call your local emergency number for
          urgent symptoms.
        </div>
      </footer>
    </div>
  );
}
