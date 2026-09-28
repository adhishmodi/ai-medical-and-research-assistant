import { useEffect, useState } from "react";
import type { AssistantAnswer } from "@/data/mockResponses";

export type ResearchSession = {
  id: string;
  question: string;
  answer: AssistantAnswer;
  createdAt: string;
};

const STORAGE_KEY = "ai-medical-research-sessions-v1";

function readSessions(): ResearchSession[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeSessions(sessions: ResearchSession[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export function useResearchHistory() {
  const [sessions, setSessions] = useState<ResearchSession[]>([]);

  useEffect(() => {
    setSessions(readSessions());
  }, []);

  const saveSession = (question: string, answer: AssistantAnswer) => {
    const session: ResearchSession = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      question,
      answer,
      createdAt: new Date().toISOString(),
    };
    setSessions((current) => {
      const next = [session, ...current.filter((item) => item.question !== question)].slice(0, 20);
      writeSessions(next);
      return next;
    });
  };

  const deleteSession = (id: string) => {
    setSessions((current) => {
      const next = current.filter((item) => item.id !== id);
      writeSessions(next);
      return next;
    });
  };

  const clearHistory = () => {
    writeSessions([]);
    setSessions([]);
  };

  return { sessions, saveSession, deleteSession, clearHistory };
}

export function ResearchHistory({
  sessions,
  onOpen,
  onDelete,
  onClear,
}: {
  sessions: ResearchSession[];
  onOpen: (session: ResearchSession) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  if (sessions.length === 0) return null;

  return (
    <section className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6">
        <div>
          <p className="rule-label">Research workspace</p>
          <h2 className="mt-1 font-display text-lg text-foreground">Research history</h2>
          <p className="mt-1 text-xs text-muted-foreground">Saved locally in this browser · {sessions.length} session{sessions.length === 1 ? "" : "s"}</p>
        </div>
        <button type="button" onClick={() => setOpen((value) => !value)} className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-surface">
          {open ? "Hide" : "Open"}
        </button>
      </div>
      {open ? (
        <div className="border-t border-border">
          <div className="divide-y divide-border">
            {sessions.map((session) => (
              <div key={session.id} className="flex items-start gap-3 px-5 py-4 sm:px-6">
                <button type="button" onClick={() => onOpen(session)} className="min-w-0 flex-1 text-left">
                  <p className="font-medium leading-snug text-foreground hover:text-primary">{session.question}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{new Date(session.createdAt).toLocaleString()} · {session.answer.sources.length} sources</p>
                </button>
                <button type="button" onClick={() => onDelete(session.id)} className="shrink-0 text-xs text-muted-foreground hover:text-destructive">Delete</button>
              </div>
            ))}
          </div>
          <div className="border-t border-border px-5 py-3 sm:px-6">
            <button type="button" onClick={onClear} className="text-xs text-muted-foreground hover:text-destructive">Clear all history</button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
