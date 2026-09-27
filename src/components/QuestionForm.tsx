import { EXAMPLE_QUESTIONS } from "@/data/mockResponses";

type Props = {
  question: string;
  onQuestionChange: (value: string) => void;
  onSubmit: () => void;
  onClear: () => void;
  isLoading: boolean;
  validationError: string | null;
  hasAnswer: boolean;
};

export function QuestionForm({
  question,
  onQuestionChange,
  onSubmit,
  onClear,
  isLoading,
  validationError,
  hasAnswer,
}: Props) {
  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-7">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <label htmlFor="question" className="rule-label block">
          Your question
        </label>
        <textarea
          id="question"
          value={question}
          onChange={(e) => onQuestionChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              onSubmit();
            }
          }}
          rows={3}
          placeholder="Ask a medical or research question..."
          aria-invalid={Boolean(validationError)}
          aria-describedby={validationError ? "question-error" : undefined}
          className="mt-3 w-full resize-y rounded-lg border border-input bg-background px-4 py-3 text-base leading-relaxed text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
        />

        {validationError ? (
          <p id="question-error" role="alert" className="mt-2 text-sm text-destructive">
            {validationError}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <span
                  aria-hidden
                  className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                />
                Searching references…
              </>
            ) : (
              "Ask Assistant"
            )}
          </button>

          {(hasAnswer || question.length > 0) && !isLoading ? (
            <button
              type="button"
              onClick={onClear}
              className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              New question
            </button>
          ) : null}

          <span className="hidden text-xs text-muted-foreground sm:inline">
            Press ⌘/Ctrl + Enter to submit
          </span>
        </div>
      </form>

      <div className="mt-7 border-t border-border pt-5">
        <h2 className="rule-label">Example questions</h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {EXAMPLE_QUESTIONS.map((example) => (
            <li key={example}>
              <button
                type="button"
                onClick={() => onQuestionChange(example)}
                className="rounded-full border border-border bg-surface px-3.5 py-1.5 text-sm text-secondary-foreground transition-colors hover:border-ring hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                {example}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
