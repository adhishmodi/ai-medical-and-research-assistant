import { SAFETY_NOTICE } from "@/data/mockResponses";

export function SafetyNotice({ compact = false }: { compact?: boolean }) {
  return (
    <div
      role="note"
      className={`rounded-lg border border-notice-border bg-notice text-notice-foreground ${
        compact ? "px-4 py-3" : "p-4 sm:p-5"
      }`}
    >
      <p className="rule-label text-notice-foreground/80">Safety notice</p>
      <p className="mt-1.5 text-sm leading-relaxed">{SAFETY_NOTICE}</p>
    </div>
  );
}
