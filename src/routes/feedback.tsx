import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { StatusChip, useSyncStatus } from "@/components/chrome";
import { getTesterId, saveRecord } from "@/lib/storage";

export const Route = createFileRoute("/feedback")({
  head: () => ({
    meta: [
      { title: "Feedback — Real or Ghost?" },
      {
        name: "description",
        content:
          "Rate the tool and tell us what confused you or what is missing. Anonymous, one minute.",
      },
      { property: "og:title", content: "Feedback — Real or Ghost?" },
      {
        property: "og:description",
        content: "Rate the tool and tell us what confused you or what is missing. Anonymous, one minute.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Feedback,
});

function Feedback() {
  const [clarity, setClarity] = useState(0);
  const [wouldUse, setWouldUse] = useState<"yes" | "no" | "">("");
  const [confusing, setConfusing] = useState("");
  const [missing, setMissing] = useState("");
  const [saved, setSaved] = useState(false);
  const sync = useSyncStatus();

  function submit() {
    if (!clarity || !wouldUse) return;
    saveRecord("feedback", {
      timestamp: new Date().toISOString(),
      tester_id: getTesterId(),
      clarity_1_5: String(clarity),
      would_use: wouldUse,
      confusing_part: confusing.trim(),
      missing_part: missing.trim(),
    });
    setSaved(true);
  }

  if (saved) {
    return (
      <div className="space-y-4 pt-8 text-center">
        <p className="text-5xl">🙏</p>
        <h1 className="text-2xl font-bold">Thank you!</h1>
        <p className="text-sm text-muted-foreground">
          Your feedback is saved anonymously. It goes straight into our iteration record.
        </p>
        <StatusChip state={sync} />
        <button
          onClick={() => {
            setSaved(false);
            setClarity(0);
            setWouldUse("");
            setConfusing("");
            setMissing("");
          }}
          className="w-full rounded-xl border border-border bg-card py-3 text-sm font-semibold text-foreground"
        >
          Send another response
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold leading-tight">Feedback</h1>
      <p className="text-sm text-muted-foreground">
        One minute, fully anonymous. It shapes the next version of this tool.
      </p>

      <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
        <div>
          <p className="text-sm font-semibold">How clear was the tool?</p>
          <p className="text-xs text-muted-foreground">1 = very confusing, 5 = very clear</p>
          <div className="mt-2 flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setClarity(n)}
                className={
                  "h-11 flex-1 rounded-xl border text-sm font-bold " +
                  (clarity >= n
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground")
                }
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold">Would you use this before accepting an offer?</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              onClick={() => setWouldUse("yes")}
              className={
                "rounded-xl border py-3 text-sm font-semibold " +
                (wouldUse === "yes"
                  ? "border-verdict-good bg-verdict-good/10 text-verdict-good"
                  : "border-border bg-background text-muted-foreground")
              }
            >
              Yes
            </button>
            <button
              onClick={() => setWouldUse("no")}
              className={
                "rounded-xl border py-3 text-sm font-semibold " +
                (wouldUse === "no"
                  ? "border-verdict-bad bg-verdict-bad/10 text-verdict-bad"
                  : "border-border bg-background text-muted-foreground")
              }
            >
              No
            </button>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold">What confused you?</p>
          <textarea
            value={confusing}
            onChange={(e) => setConfusing(e.target.value)}
            rows={3}
            placeholder="Anything unclear, misleading or hard to use…"
            className="mt-2 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <p className="text-sm font-semibold">What is missing?</p>
          <textarea
            value={missing}
            onChange={(e) => setMissing(e.target.value)}
            rows={3}
            placeholder="A feature, a check, an answer you needed…"
            className="mt-2 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <button
        onClick={submit}
        disabled={!clarity || !wouldUse}
        className="w-full rounded-xl bg-primary py-3.5 text-base font-semibold text-primary-foreground disabled:opacity-40"
      >
        Send feedback
      </button>
    </div>
  );
}
