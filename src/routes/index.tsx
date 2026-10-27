import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";

import { StatusChip, useSyncStatus } from "@/components/chrome";
import type { RedFlag } from "@/lib/redflags";
import { nextSteps, scoreRun, verdictTone } from "@/lib/scoring";
import { getFlags, getTesterId, saveRecord } from "@/lib/storage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Quick-Vet an internship offer — Real or Ghost?" },
      {
        name: "description",
        content:
          "Answer a few yes/no questions about an internship offer and get a verdict in under 3 minutes: looks real, be careful, or likely scam.",
      },
      { property: "og:title", content: "Quick-Vet an internship offer — Real or Ghost?" },
      {
        property: "og:description",
        content:
          "Answer a few yes/no questions about an internship offer and get a verdict in under 3 minutes: looks real, be careful, or likely scam.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: QuickVet,
});

type Stage = "intro" | "questions" | "result";
type Answer = "yes" | "no" | "unsure";

const TIER_BADGE: Record<string, { label: string; className: string }> = {
  dealbreaker: { label: "Dealbreaker", className: "bg-verdict-bad/10 text-verdict-bad border-verdict-bad/30" },
  warning: { label: "Warning", className: "bg-verdict-warn/10 text-verdict-warn border-verdict-warn/30" },
  check: { label: "Good sign", className: "bg-verdict-good/10 text-verdict-good border-verdict-good/30" },
};

function QuickVet() {
  const [flags, setFlags] = useState<RedFlag[]>([]);
  const [stage, setStage] = useState<Stage>("intro");
  const [label, setLabel] = useState("");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [startedAt, setStartedAt] = useState(0);
  const [timeTaken, setTimeTaken] = useState(0);
  const sync = useSyncStatus();

  useEffect(() => {
    setFlags(getFlags());
  }, []);

  const current = flags[index];
  const answered = Object.keys(answers).length;

  function answer(value: Answer) {
    if (!current) return;
    const next = { ...answers, [current.id]: value };
    setAnswers(next);
    if (index + 1 >= flags.length) finish(next);
    else setIndex(index + 1);
  }

  function finish(all: Record<string, Answer>) {
    const score = scoreRun(flags, all);
    const seconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
    setTimeTaken(seconds);
    saveRecord("checks", {
      timestamp: new Date().toISOString(),
      tester_id: getTesterId(),
      listing_label: label.trim(),
      answers_json: JSON.stringify(all),
      risk_score: score.risk,
      verdict: score.verdict,
      dealbreaker_triggered: score.dealbreakerTriggered ? "yes" : "no",
      time_taken_sec: seconds,
    });
    setStage("result");
  }

  function restart() {
    setStage("intro");
    setIndex(0);
    setAnswers({});
    setLabel("");
    setStartedAt(0);
  }

  if (stage === "intro") {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold leading-tight">Quick-Vet: is this internship real?</h1>
        <p className="text-sm text-muted-foreground">
          Answer {flags.length || 16} quick yes/no questions about one offer and get a verdict
          in under 3 minutes.
        </p>
        <div className="rounded-2xl border border-border bg-card p-4">
          <label htmlFor="listing-label" className="text-sm font-semibold">
            Name this listing (optional)
          </label>
          <input
            id="listing-label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Marketing intern, offer via WhatsApp"
            className="mt-2 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Don't type real names or phone numbers.
          </p>
        </div>
        <button
          onClick={() => {
            setStartedAt(Date.now());
            setStage("questions");
          }}
          className="w-full rounded-xl bg-primary py-3.5 text-base font-semibold text-primary-foreground active:scale-[0.99]"
        >
          Start the check
        </button>
      </div>
    );
  }

  if (stage === "questions" && current) {
    const badge = TIER_BADGE[current.tier] ?? { label: current.tier, className: "" };
    return (
      <div className="space-y-5">
        <div>
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>
              Question {index + 1} of {flags.length}
            </span>
            <span>Tester {getTesterId()}</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${(answered / flags.length) * 100}%` }}
            />
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <span className={"inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-semibold " + badge.className}>
            {badge.label}
          </span>
          <p className="mt-3 text-lg font-semibold leading-snug">{current.text}</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => answer("yes")}
            className="rounded-xl border border-verdict-good/40 bg-verdict-good/10 py-3.5 text-sm font-semibold text-verdict-good active:scale-[0.98]"
          >
            Yes
          </button>
          <button
            onClick={() => answer("no")}
            className="rounded-xl border border-border bg-card py-3.5 text-sm font-semibold text-foreground active:scale-[0.98]"
          >
            No
          </button>
          <button
            onClick={() => answer("unsure")}
            className="rounded-xl border border-border bg-card py-3.5 text-sm font-semibold text-muted-foreground active:scale-[0.98]"
          >
            Not sure
          </button>
        </div>
        <div className="flex items-center justify-between">
          <button
            onClick={() => (index === 0 ? setStage("intro") : setIndex(index - 1))}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <span className="text-xs text-muted-foreground">Answer honestly — nothing is judged.</span>
        </div>
      </div>
    );
  }

  const score = scoreRun(flags, answers);
  return (
    <div className="space-y-4">
      <div className={"rounded-2xl border-2 p-5 text-center " + verdictTone(score.verdict)}>
        <p className="text-xs font-semibold uppercase tracking-wide opacity-80">Verdict</p>
        <p className="mt-1 text-2xl font-bold leading-tight">{score.verdict}</p>
        <p className="mt-1 text-xs opacity-80">Risk score: {score.risk}</p>
      </div>

      {score.triggeredFlags.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">Why — flags you triggered</h2>
          <ul className="mt-2 space-y-2">
            {score.triggeredFlags.map((flag) => (
              <li key={flag.id} className="flex gap-2 text-sm text-foreground">
                <span className="mt-0.5 text-verdict-bad">•</span>
                <span>{flag.text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {score.reassuringChecks.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">In your favour</h2>
          <ul className="mt-2 space-y-2">
            {score.reassuringChecks.map((flag) => (
              <li key={flag.id} className="flex gap-2 text-sm text-foreground">
                <span className="mt-0.5 text-verdict-good">✓</span>
                <span>{flag.text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
        <h2 className="text-sm font-semibold text-primary">What to do next</h2>
        <p className="mt-1.5 text-sm leading-snug text-foreground">{nextSteps(score.verdict)}</p>
      </div>

      <p className="text-center text-xs font-medium text-muted-foreground">
        This tool gives a signal, not proof.
      </p>

      <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-4">
        <StatusChip state={sync} />
        <p className="text-xs text-muted-foreground">
          Run saved ({timeTaken}s) · Tester {getTesterId()}
        </p>
        <button
          onClick={restart}
          className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground"
        >
          Check another offer
        </button>
      </div>
    </div>
  );
}
