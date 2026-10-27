import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { StatusChip, useSyncStatus } from "@/components/chrome";
import { DEFAULT_REDFLAGS, type RedFlag } from "@/lib/redflags";
import {
  APP_VERSION,
  COLUMNS,
  RECORD_TYPES,
  downloadAllJson,
  downloadCsv,
  flushOutbox,
  getFlags,
  getSheetUrl,
  listRecords,
  saveFlags,
  saveRecord,
  setSheetUrl,
  type RecordType,
  type SavedRecord,
} from "@/lib/storage";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Real or Ghost?" },
      { name: "description", content: "Project admin: saved records, CSV export, red-flag rules and changelog." },
      { property: "og:title", content: "Admin — Real or Ghost?" },
      { property: "og:description", content: "Project admin: saved records, CSV export, red-flag rules and changelog." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Admin,
});

const input =
  "w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

const ADMIN_USER = "abdkadir2006@gmail.com";
const ADMIN_PASS = "Abdul@123";
const AUTH_KEY = "rog_admin_ok";

function readAuthed(): boolean {
  try {
    return window.localStorage.getItem(AUTH_KEY) === "1";
  } catch {
    return false;
  }
}

function LoginScreen({ onOk }: { onOk: () => void }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (user.trim().toLowerCase() === ADMIN_USER && pass === ADMIN_PASS) {
      window.localStorage.setItem(AUTH_KEY, "1");
      onOk();
    } else {
      setError("Wrong user ID or password.");
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-2xl border border-border bg-card p-4">
      <h1 className="text-2xl font-bold">Admin login</h1>
      <p className="text-xs text-muted-foreground">Only the project admin can open this page.</p>
      <input value={user} onChange={(e) => setUser(e.target.value)} placeholder="User ID" autoComplete="username" className={input} />
      <input value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Password" type="password" autoComplete="current-password" className={input} />
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
      <button type="submit" className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground">
        Sign in
      </button>
    </form>
  );
}

function Admin() {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState(false);
  const [type, setType] = useState<RecordType>("checks");
  const [records, setRecords] = useState<SavedRecord[]>([]);
  const [flags, setFlags] = useState<RedFlag[]>([]);
  const [url, setUrl] = useState("");
  const [log, setLog] = useState({ version: APP_VERSION, what_changed: "", why: "" });
  const sync = useSyncStatus();

  useEffect(() => {
    setAuthed(readAuthed());
    setFlags(getFlags());
    setUrl(getSheetUrl());
  }, []);

  useEffect(() => {
    const refresh = () => setRecords(listRecords(type));
    refresh();
    window.addEventListener("rog:records", refresh);
    return () => window.removeEventListener("rog:records", refresh);
  }, [type]);

  function updateFlag(i: number, patch: Partial<RedFlag>) {
    setFlags(flags.map((f, j) => (j === i ? { ...f, ...patch } : f)));
  }

  function persistFlags() {
    saveFlags(flags);
    for (const f of flags) saveRecord("redflags", { ...f });
  }

  function addFlag() {
    setFlags([
      ...flags,
      { id: "N" + (flags.length + 1), text: "", tier: "warning", weight: 2, polarity: "flag", source: "interview", evidence_count: 0 },
    ]);
  }

  const cols = COLUMNS[type];

  if (!authed) return <LoginScreen onOk={() => setAuthed(true)} />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin</h1>
        <div className="flex items-center gap-2">
          <StatusChip state={sync} />
          <button
            onClick={() => {
              window.localStorage.removeItem(AUTH_KEY);
              setAuthed(false);
              void navigate({ to: "/" });
            }}
            className="rounded-xl border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground"
          >
            Sign out
          </button>
        </div>
      </div>

      <section className="space-y-2 rounded-2xl border border-border bg-card p-4">
        <h2 className="font-semibold">Google Sheet link</h2>
        <p className="text-xs text-muted-foreground">Paste the Apps Script "/exec" link. Leave empty to save on device only.</p>
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://script.google.com/macros/s/.../exec" className={input} />
        <div className="flex gap-2">
          <button onClick={() => { setSheetUrl(url); void flushOutbox(); }} className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground">Save link</button>
          <button onClick={() => void flushOutbox()} className="rounded-xl border border-border px-4 text-sm font-medium">Sync now</button>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
        <h2 className="font-semibold">Saved records</h2>
        <div className="flex flex-wrap gap-1.5">
          {RECORD_TYPES.map((t) => (
            <button key={t} onClick={() => setType(t)} className={"rounded-full border px-3 py-1 text-xs font-semibold " + (t === type ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground")}>{t}</button>
          ))}
        </div>
        <div className="max-h-72 overflow-auto rounded-xl border border-border">
          <table className="w-full text-left text-[11px]">
            <thead className="sticky top-0 bg-muted">
              <tr>{cols.map((c) => <th key={c} className="whitespace-nowrap px-2 py-1.5 font-semibold">{c}</th>)}</tr>
            </thead>
            <tbody>
              {records.length === 0 && <tr><td colSpan={cols.length} className="px-2 py-3 text-muted-foreground">No records yet.</td></tr>}
              {records.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  {cols.map((c) => <td key={c} className="max-w-40 truncate px-2 py-1.5">{String((r.data as Record<string, unknown>)[c] ?? "")}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex gap-2">
          <button onClick={() => downloadCsv(type, records)} className="flex-1 rounded-xl border border-primary py-2.5 text-sm font-semibold text-primary">Download {type} CSV</button>
          <button onClick={downloadAllJson} className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground">Download ALL</button>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
        <h2 className="font-semibold">Red-flag rules</h2>
        <p className="text-xs text-muted-foreground">Changes apply to the next Quick-Vet run.</p>
        {flags.map((f, i) => (
          <div key={i} className="space-y-2 rounded-xl border border-border p-3">
            <div className="flex gap-2">
              <input value={f.id} onChange={(e) => updateFlag(i, { id: e.target.value })} className={input + " w-16"} aria-label="id" />
              <select value={f.tier} onChange={(e) => updateFlag(i, { tier: e.target.value as RedFlag["tier"] })} className={input}>
                <option value="dealbreaker">dealbreaker</option><option value="warning">warning</option><option value="check">check</option>
              </select>
              <input type="number" value={f.weight} onChange={(e) => updateFlag(i, { weight: Number(e.target.value) })} className={input + " w-16"} aria-label="weight" />
            </div>
            <textarea value={f.text} onChange={(e) => updateFlag(i, { text: e.target.value })} rows={2} className={input} aria-label="question text" />
            <div className="flex gap-2">
              <select value={f.polarity} onChange={(e) => updateFlag(i, { polarity: e.target.value as RedFlag["polarity"] })} className={input}>
                <option value="flag">Yes is bad</option><option value="good">Yes is good</option>
              </select>
              <select value={f.source} onChange={(e) => updateFlag(i, { source: e.target.value as RedFlag["source"] })} className={input}>
                <option value="assumption">assumption</option><option value="interview">interview</option><option value="listing">listing</option>
              </select>
              <input type="number" value={f.evidence_count} onChange={(e) => updateFlag(i, { evidence_count: Number(e.target.value) })} className={input + " w-16"} aria-label="evidence count" />
            </div>
            <button onClick={() => setFlags(flags.filter((_, j) => j !== i))} className="text-xs font-semibold text-destructive">Delete</button>
          </div>
        ))}
        <div className="flex flex-wrap gap-2">
          <button onClick={addFlag} className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium">+ Add rule</button>
          <button onClick={persistFlags} className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground">Save rules</button>
          <button onClick={() => setFlags(DEFAULT_REDFLAGS)} className="rounded-xl border border-border px-4 py-2.5 text-sm text-muted-foreground">Reset</button>
        </div>
      </section>

      <section className="space-y-2 rounded-2xl border border-border bg-card p-4">
        <h2 className="font-semibold">Changelog</h2>
        <input value={log.version} onChange={(e) => setLog({ ...log, version: e.target.value })} placeholder="Version" className={input} />
        <textarea value={log.what_changed} onChange={(e) => setLog({ ...log, what_changed: e.target.value })} placeholder="What changed" rows={2} className={input} />
        <textarea value={log.why} onChange={(e) => setLog({ ...log, why: e.target.value })} placeholder="Why (link to feedback rows)" rows={2} className={input} />
        <button
          onClick={() => {
            if (!log.what_changed.trim()) return;
            saveRecord("changelog", { date: new Date().toISOString().slice(0, 10), ...log });
            setLog({ ...log, what_changed: "", why: "" });
          }}
          className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground"
        >
          Add changelog entry
        </button>
      </section>
    </div>
  );
}
