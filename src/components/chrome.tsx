import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BookOpen, ClipboardCheck, MessageSquare, ShieldCheck } from "lucide-react";

import { getOutbox, getSheetUrl } from "@/lib/storage";

export function AppBanner() {
  return (
    <div className="border-b border-border bg-secondary text-secondary-foreground">
      <p className="mx-auto w-full max-w-md px-4 py-2 text-[11px] leading-snug">
        Prototype v0. The red-flag rules are a hypothesis from commonly reported scam
        patterns and are being validated through interviews.
      </p>
    </div>
  );
}

export function PrivacyNotice() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(!window.localStorage.getItem("rog_privacy_seen"));
  }, []);

  if (!show) return null;
  return (
    <div className="mx-auto w-full max-w-md px-4 pt-3">
      <div className="flex items-start justify-between gap-3 rounded-2xl border border-border bg-card p-3 text-xs leading-snug text-foreground">
        <p>
          Anonymous answers are stored on this device for a college project. No names,
          phone numbers or emails are collected.
        </p>
        <button
          onClick={() => {
            window.localStorage.setItem("rog_privacy_seen", "1");
            setShow(false);
          }}
          className="shrink-0 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-semibold text-primary-foreground"
        >
          Got it
        </button>
      </div>
    </div>
  );
}

const TABS = [
  { to: "/", label: "Quick-Vet", icon: ClipboardCheck },
  { to: "/verify", label: "Verify Co.", icon: ShieldCheck },
  { to: "/experiences", label: "Stories", icon: BookOpen },
  { to: "/feedback", label: "Feedback", icon: MessageSquare },
];

export function TabBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card/95 backdrop-blur">
      <div className="mx-auto w-full max-w-md">
        <div className="grid grid-cols-4">
          {TABS.map((tab) => {
            const active = tab.to === "/" ? pathname === "/" : pathname.startsWith(tab.to);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.to}
                to={tab.to}
                className={
                  "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium " +
                  (active ? "text-primary" : "text-muted-foreground")
                }
              >
                <Icon className="h-5 w-5" />
                {tab.label}
              </Link>
            );
          })}
      </div>
      </div>
    </nav>
  );
}

export type SyncState = { kind: "local" | "synced" | "waiting"; count: number };

export function useSyncStatus(): SyncState {
  const [state, setState] = useState<SyncState>({ kind: "local", count: 0 });

  useEffect(() => {
    const update = () => {
      const url = getSheetUrl();
      const count = getOutbox().length;
      if (!url) setState({ kind: "local", count: 0 });
      else if (count > 0) setState({ kind: "waiting", count });
      else setState({ kind: "synced", count: 0 });
    };
    update();
    window.addEventListener("rog:sync", update);
    const timer = window.setInterval(update, 3000);
    return () => {
      window.removeEventListener("rog:sync", update);
      window.clearInterval(timer);
    };
  }, []);

  return state;
}

export function StatusChip({ state }: { state: SyncState }) {
  const dot =
    state.kind === "synced"
      ? "bg-verdict-good"
      : state.kind === "waiting"
        ? "bg-verdict-warn"
        : "bg-muted-foreground";
  const label =
    state.kind === "waiting"
      ? state.count + " waiting to sync"
      : state.kind === "synced"
        ? "Synced"
        : "Saved on device";
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
      <span className={"h-2 w-2 rounded-full " + dot} />
      {label}
    </span>
  );
}
