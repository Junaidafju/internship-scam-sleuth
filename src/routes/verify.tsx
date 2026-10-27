import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";

import { StatusChip, useSyncStatus } from "@/components/chrome";
import { getTesterId, saveRecord } from "@/lib/storage";

export const Route = createFileRoute("/verify")({
  head: () => ({
    meta: [
      { title: "Verify the company — Real or Ghost?" },
      {
        name: "description",
        content:
          "Five checks that turn a feeling into facts: MCA21 registration, LinkedIn footprint, website and domain age, reviews, and a T&P or senior confirmation.",
      },
      { property: "og:title", content: "Verify the company — Real or Ghost?" },
      {
        property: "og:description",
        content:
          "Five checks that turn a feeling into facts: MCA21 registration, LinkedIn footprint, website and domain age, reviews, and a T&P or senior confirmation.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VerifyCompany,
});

const STEPS = [
  {
    title: "Check MCA21 registration",
    how: "Search the company or LLP name in the Ministry of Corporate Affairs master data.",
    url: "https://www.mca.gov.in",
    label: "Open mca.gov.in",
  },
  {
    title: "Check the LinkedIn footprint",
    how: "Look at the company page: how old is it, how many employees, do real people list working there?",
    url: "https://www.linkedin.com",
    label: "Open linkedin.com",
  },
  {
    title: "Check the website and domain age",
    how: "Visit the company website, then look up how old the domain is and whether the text looks copied.",
    url: "https://who.is",
    label: "Open who.is",
  },
  {
    title: "Check reviews",
    how: "Search the company on AmbitionBox or Glassdoor for intern and employee reviews.",
    url: "https://www.ambitionbox.com",
    label: "Open ambitionbox.com",
  },
  {
    title: "Ask T&P or a senior",
    how: "Ask your Training & Placement cell, or a senior who has worked there, whether the company and offer are genuine.",
    url: "",
    label: "",
  },
];

function VerifyCompany() {
  const [label, setLabel] = useState("");
  const [done, setDone] = useState<boolean[]>(STEPS.map(() => false));
  const [notes, setNotes] = useState<string[]>(STEPS.map(() => ""));
  const [saved, setSaved] = useState(false);
  const sync = useSyncStatus();

  useEffect(() => {
    setSaved(false);
  }, [done, notes]);

  const stepsDone = done.filter(Boolean).length;

  function toggle(index: number) {
    setDone(done.map((d, i) => (i === index ? !d : d)));
  }

  function setNote(index: number, value: string) {
    setNotes(notes.map((n, i) => (i === index ? value : n)));
  }

  function saveRun() {
    saveRecord("verification", {
      timestamp: new Date().toISOString(),
      tester_id: getTesterId(),
      listing_label: label.trim(),
      steps_done: String(stepsDone),
      notes_json: JSON.stringify(notes.filter(Boolean)),
    });
    setSaved(true);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold leading-tight">Verify the company</h1>
      <p className="text-sm text-muted-foreground">
        Five checks that turn "feels off" into checked facts. Tick each step as you finish it.
      </p>

      <div className="rounded-2xl border border-border bg-card p-4">
        <label htmlFor="verify-label" className="text-sm font-semibold">
          Which listing are you verifying? (optional)
        </label>
        <input
          id="verify-label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Sales intern, found on Telegram"
          className="mt-2 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <p className="mt-2 text-xs text-muted-foreground">No real names or phone numbers.</p>
      </div>

      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 text-center">
        <p className="text-3xl font-bold text-primary">
          {stepsDone} of 5
        </p>
        <p className="text-xs font-medium text-primary">steps done</p>
      </div>

      <div className="space-y-3">
        {STEPS.map((step, i) => (
          <div key={step.title} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-start gap-3">
              <button
                onClick={() => toggle(i)}
                aria-pressed={done[i]}
                className={
                  "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-sm font-bold " +
                  (done[i]
                    ? "border-verdict-good bg-verdict-good text-white"
                    : "border-input bg-background text-transparent")
                }
              >
                ✓
              </button>
              <div className="min-w-0 flex-1">
                <p className={"font-semibold " + (done[i] ? "line-through opacity-60" : "")}>
                  {i + 1}. {step.title}
                </p>
                <p className="mt-1 text-sm leading-snug text-muted-foreground">{step.how}</p>
                {step.url && (
                  <a
                    href={step.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary underline underline-offset-2"
                  >
                    {step.label} <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
                <textarea
                  value={notes[i]}
                  onChange={(e) => setNote(i, e.target.value)}
                  placeholder="Notes (what did you find?)"
                  rows={2}
                  className="mt-2 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={saveRun}
        className="w-full rounded-xl bg-primary py-3.5 text-base font-semibold text-primary-foreground active:scale-[0.99]"
      >
        Save this verification run
      </button>

      {saved && (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4">
          <StatusChip state={sync} />
          <p className="text-xs text-muted-foreground">Run saved · Tester {getTesterId()}</p>
        </div>
      )}
    </div>
  );
}
