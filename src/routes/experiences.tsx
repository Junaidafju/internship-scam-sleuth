import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";

import { StatusChip, useSyncStatus } from "@/components/chrome";
import { SEED_EXPERIENCES, type ExperienceEntry } from "@/lib/redflags";
import { getTesterId, listRecords, saveRecord, type SavedRecord } from "@/lib/storage";

export const Route = createFileRoute("/experiences")({
  head: () => ({
    meta: [
      { title: "Experience Bank — Real or Ghost?" },
      {
        name: "description",
        content:
          "Anonymised senior internship stories: which offers were real, which were scams or ghost listings, and the red flags to watch for.",
      },
      { property: "og:title", content: "Experience Bank — Real or Ghost?" },
      {
        property: "og:description",
        content:
          "Anonymised senior internship stories: which offers were real, which were scams or ghost listings, and the red flags to watch for.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ExperienceBank,
});

type Filter = "all" | "yes" | "no" | "unsure";

const WAS_REAL_LABEL = { yes: "Real", no: "Not real", unsure: "Unsure" } as const;
const WAS_REAL_CLASS = {
  yes: "bg-verdict-good/10 text-verdict-good border-verdict-good/30",
  no: "bg-verdict-bad/10 text-verdict-bad border-verdict-bad/30",
  unsure: "bg-verdict-warn/10 text-verdict-warn border-verdict-warn/30",
} as const;

function ExperienceBank() {
  const [entries, setEntries] = useState<SavedRecord<ExperienceEntry>[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [form, setForm] = useState<ExperienceEntry>({
    company: "",
    role: "",
    stipend_inr: "",
    was_real: "yes",
    red_flags: "",
    rating_1_5: 3,
    verified_by_tp: "no",
    source_type: "form",
  });
  const [showForm, setShowForm] = useState(false);
  const sync = useSyncStatus();

  const refresh = useCallback(() => {
    const saved = listRecords<ExperienceEntry>("experiences");
    setEntries(saved.reverse());
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener("rog:records", refresh);
    return () => window.removeEventListener("rog:records", refresh);
  }, [refresh]);

  function submit() {
    if (!form.role.trim()) return;
    saveRecord("experiences", {
      timestamp: new Date().toISOString(),
      tester_id: getTesterId(),
      company: form.company.trim(),
      role: form.role.trim(),
      stipend_inr: form.stipend_inr,
      was_real: form.was_real,
      red_flags: form.red_flags.trim(),
      rating_1_5: form.rating_1_5,
      verified_by_tp: form.verified_by_tp,
      source_type: "form",
    });
    setForm({ ...form, company: "", role: "", stipend_inr: "", red_flags: "" });
    setShowForm(false);
  }

  const queryLower = query.trim().toLowerCase();
  const seeds = SEED_EXPERIENCES.filter(
    (s) =>
      (filter === "all" || s.was_real === filter) &&
      (!queryLower ||
        s.company.toLowerCase().includes(queryLower) ||
        s.role.toLowerCase().includes(queryLower)),
  );
  const saved = entries.filter(
    (e) =>
      (filter === "all" || e.data.was_real === filter) &&
      (!queryLower ||
        (e.data.company + " " + e.data.role).toLowerCase().includes(queryLower)),
  );

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold leading-tight">Experience Bank</h1>
      <p className="text-sm text-muted-foreground">
        Anonymised stories from seniors: was the internship real, and what were the red flags?
      </p>

      <div className="flex flex-wrap gap-2">
        {(["all", "yes", "no", "unsure"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={
              "rounded-full border px-3 py-1.5 text-xs font-semibold " +
              (filter === f
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground")
            }
          >
            {f === "all" ? "All" : WAS_REAL_LABEL[f]}
          </button>
        ))}
      </div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by company or role"
        className="w-full rounded-xl border border-input bg-card px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
      />

      {seeds.map((seed, i) => (
        <StoryCard
          key={"seed-" + i}
          entry={seed}
          badge={{ label: "EXAMPLE / PLACEHOLDER", className: "bg-accent text-accent-foreground" }}
        />
      ))}

      {saved.map((record) => (
        <StoryCard
          key={record.id}
          entry={record.data}
          badge={{ label: "Unverified, student submitted", className: "bg-secondary text-secondary-foreground" }}
        />
      ))}

      {seeds.length === 0 && saved.length === 0 && (
        <p className="rounded-2xl border border-border bg-card p-4 text-center text-sm text-muted-foreground">
          No stories match. Try another filter.
        </p>
      )}

      {showForm ? (
        <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
          <h2 className="font-semibold">Share your experience</h2>
          <input
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
            placeholder="Company (optional — can be masked)"
            className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            placeholder="Role (e.g. Marketing intern)"
            className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            value={form.stipend_inr}
            onChange={(e) => setForm({ ...form, stipend_inr: e.target.value.replace(/[^0-9]/g, "") })}
            inputMode="numeric"
            placeholder="Stipend in ₹ per month (0 if unpaid)"
            className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <Field label="Was it real?">
            <ChoiceRow
              options={["yes", "no", "unsure"] as const}
              value={form.was_real}
              labels={WAS_REAL_LABEL}
              onChange={(v) => setForm({ ...form, was_real: v })}
            />
          </Field>
          <textarea
            value={form.red_flags}
            onChange={(e) => setForm({ ...form, red_flags: e.target.value })}
            placeholder="Red flags you noticed (or 'None')"
            rows={2}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <Field label="Rating (1–5)">
            <ChoiceRow
              options={[1, 2, 3, 4, 5]}
              value={form.rating_1_5}
              labels={{ 1: "1", 2: "2", 3: "3", 4: "4", 5: "5" }}
              onChange={(v) => setForm({ ...form, rating_1_5: v })}
            />
          </Field>
          <Field label="Confirmed by T&P?">
            <ChoiceRow
              options={["yes", "no"] as const}
              value={form.verified_by_tp}
              labels={{ yes: "Yes", no: "No" }}
              onChange={(v) => setForm({ ...form, verified_by_tp: v })}
            />
          </Field>
          <p className="text-xs text-muted-foreground">
            Privacy: no personal names or phone numbers.
          </p>
          <div className="flex gap-2">
            <button
              onClick={submit}
              className="flex-1 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground"
            >
              Save story
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="rounded-xl border border-border px-4 py-3 text-sm font-medium text-muted-foreground"
            >
              Cancel
            </button>
          </div>
          <StatusChip state={sync} />
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="w-full rounded-xl border-2 border-primary py-3.5 text-base font-semibold text-primary"
        >
          + Share your experience
        </button>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-semibold">{label}</p>
      {children}
    </div>
  );
}

function ChoiceRow<T extends string | number>({
  options,
  value,
  labels,
  onChange,
}: {
  options: readonly T[];
  value: T;
  labels: Record<T, string>;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={String(option)}
          onClick={() => onChange(option)}
          className={
            "rounded-xl border px-4 py-2 text-sm font-semibold " +
            (value === option
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background text-muted-foreground")
          }
        >
          {labels[option]}
        </button>
      ))}
    </div>
  );
}

function StoryCard({
  entry,
  badge,
}: {
  entry: ExperienceEntry & { seed?: boolean };
  badge: { label: string; className: string };
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <span className={"rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide " + badge.className}>
          {badge.label}
        </span>
        <span
          className={"rounded-full border px-2.5 py-0.5 text-[11px] font-semibold " + WAS_REAL_CLASS[entry.was_real]}
        >
          {WAS_REAL_LABEL[entry.was_real]}
        </span>
      </div>
      <h2 className="mt-2 font-semibold leading-snug">{entry.role}</h2>
      {entry.company && <p className="text-sm text-muted-foreground">{entry.company}</p>}
      <p className="mt-1 text-sm">
        Stipend: {entry.stipend_inr && entry.stipend_inr !== "0" ? "₹" + entry.stipend_inr + "/month" : "Unpaid"}
      </p>
      {entry.red_flags && (
        <p className="mt-2 text-sm leading-snug text-verdict-bad">Red flags: {entry.red_flags}</p>
      )}
      <p className="mt-2 text-xs text-muted-foreground">
        {"★".repeat(entry.rating_1_5)}
        {"☆".repeat(5 - entry.rating_1_5)} · T&P confirmed: {entry.verified_by_tp === "yes" ? "Yes" : "No"} ·
        source: {entry.source_type}
      </p>
    </div>
  );
}
