import { DEFAULT_REDFLAGS, type RedFlag } from "./redflags";

export const APP_VERSION = "v0.1";
export const DEFAULT_SHEET_URL = "";

export type RecordType =
  | "checks"
  | "verification"
  | "experiences"
  | "feedback"
  | "redflags"
  | "changelog";

export const RECORD_TYPES: RecordType[] = [
  "checks",
  "verification",
  "experiences",
  "feedback",
  "redflags",
  "changelog",
];

/** Sheet column layout — the Apps Script (Code.gs) uses the same headers. */
export const COLUMNS: Record<RecordType, string[]> = {
  checks: ["timestamp", "tester_id", "listing_label", "answers_json", "risk_score", "verdict", "dealbreaker_triggered", "time_taken_sec"],
  verification: ["timestamp", "tester_id", "listing_label", "steps_done", "notes_json"],
  experiences: ["timestamp", "tester_id", "company", "role", "stipend_inr", "was_real", "red_flags", "rating_1_5", "verified_by_tp", "source_type"],
  feedback: ["timestamp", "tester_id", "clarity_1_5", "would_use", "confusing_part", "missing_part"],
  redflags: ["id", "text", "tier", "weight", "polarity", "source", "evidence_count"],
  changelog: ["date", "version", "what_changed", "why"],
};

export interface SavedRecord<T = Record<string, unknown>> {
  id: string;
  timestamp: string;
  version: string;
  tester_id: string;
  data: T;
}

const PREFIX = "rog_";

function readList<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(PREFIX + key) || "[]") as T[];
  } catch {
    return [];
  }
}

function writeList<T>(key: string, list: T[]) {
  window.localStorage.setItem(PREFIX + key, JSON.stringify(list));
}

function notify() {
  window.dispatchEvent(new Event("rog:sync"));
  window.dispatchEvent(new Event("rog:records"));
}

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "r-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
}

export function getTesterId(): string {
  let id = window.localStorage.getItem(PREFIX + "tester_id");
  if (!id) {
    id = "T-" + Math.floor(1000 + Math.random() * 9000);
    window.localStorage.setItem(PREFIX + "tester_id", id);
  }
  return id;
}

export function getSheetUrl(): string {
  return window.localStorage.getItem(PREFIX + "sheet_url") ?? DEFAULT_SHEET_URL;
}

export function setSheetUrl(url: string) {
  window.localStorage.setItem(PREFIX + "sheet_url", url.trim());
  notify();
}

export function listRecords<T = Record<string, unknown>>(type: RecordType): SavedRecord<T>[] {
  return readList<SavedRecord<T>>(type);
}

export function loadAllRecords(): Record<RecordType, SavedRecord[]> {
  const out = {} as Record<RecordType, SavedRecord[]>;
  for (const type of RECORD_TYPES) out[type] = listRecords(type);
  return out;
}

export function saveRecord<T extends Record<string, unknown>>(type: RecordType, data: T): SavedRecord<T> {
  const record: SavedRecord<T> = {
    id: uid(),
    timestamp: new Date().toISOString(),
    version: APP_VERSION,
    tester_id: getTesterId(),
    data,
  };
  const list = readList<SavedRecord<T>>(type);
  list.push(record);
  writeList(type, list);
  enqueue(type, record);
  void flushOutbox();
  notify();
  return record;
}

interface OutboxItem {
  type: RecordType;
  record: SavedRecord;
}

export function getOutbox(): OutboxItem[] {
  return readList<OutboxItem>("outbox");
}

function enqueue(type: RecordType, record: SavedRecord) {
  if (!getSheetUrl()) return;
  const outbox = getOutbox();
  outbox.push({ type, record });
  writeList("outbox", outbox);
}

/** Sends queued records to the Google Sheet (Apps Script /exec URL), if configured. */
export async function flushOutbox(): Promise<boolean> {
  const url = getSheetUrl();
  if (!url) return false;
  if (typeof navigator !== "undefined" && navigator.onLine === false) return false;
  const outbox = getOutbox();
  if (outbox.length === 0) return true;
  const remaining: OutboxItem[] = [];
  for (const item of outbox) {
    try {
      await fetch(url, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          type: item.type,
          version: item.record.version,
          tester_id: item.record.tester_id,
          timestamp: item.record.timestamp,
          data: item.record.data,
        }),
      });
    } catch {
      remaining.push(item);
    }
  }
  writeList("outbox", remaining);
  if (remaining.length < outbox.length) {
    window.localStorage.setItem(PREFIX + "last_sync", new Date().toISOString());
  }
  notify();
  return remaining.length === 0;
}

export function getFlags(): RedFlag[] {
  const stored = readList<RedFlag>("flags");
  if (stored.length === 0) return DEFAULT_REDFLAGS;
  return stored;
}

export function saveFlags(flags: RedFlag[]) {
  writeList("flags", flags);
  notify();
}

function csvEscape(value: unknown): string {
  const s = value === undefined || value === null ? "" : String(value);
  if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

export function toCsv(type: RecordType, records: SavedRecord[]): string {
  const headers = COLUMNS[type];
  const lines = [headers.join(",")];
  for (const record of records) {
    lines.push(headers.map((h) => csvEscape((record.data as Record<string, unknown>)[h])).join(","));
  }
  return lines.join("\n");
}

export function downloadText(filename: string, text: string, mime = "text/csv") {
  const blob = new Blob([text], { type: mime + ";charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function downloadCsv(type: RecordType, records: SavedRecord[]) {
  downloadText("real-or-ghost-" + type + ".csv", toCsv(type, records));
}

export function downloadAllJson() {
  const all: Record<string, SavedRecord[]> = {};
  for (const type of RECORD_TYPES) all[type] = listRecords(type);
  downloadText(
    "real-or-ghost-all-data.json",
    JSON.stringify({ exported_at: new Date().toISOString(), data: all }, null, 2),
    "application/json",
  );
}
