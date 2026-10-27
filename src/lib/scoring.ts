import type { RedFlag } from "./redflags";

export type Answer = "yes" | "no" | "unsure";
export type RunAnswers = Record<string, Answer>;
export type Verdict = "Looks real (still verify)" | "Be careful" | "Likely scam";

export interface RunScore {
  risk: number;
  verdict: Verdict;
  dealbreakerTriggered: boolean;
  triggeredFlags: RedFlag[];
  reassuringChecks: RedFlag[];
}

/**
 * Scoring rules (from the build spec):
 * - Dealbreaker answered Yes -> "Likely scam" immediately, regardless of score.
 * - risk = sum of weights of "flag" items answered Yes
 *        + 1 for every "Not sure" on a dealbreaker or warning item
 *        - 1 for every "good" item answered Yes
 * - risk never goes below 0.
 * - Verdict: 0-3 Looks real (still verify), 4-7 Be careful, 8+ Likely scam.
 */
export function scoreRun(flags: RedFlag[], answers: RunAnswers): RunScore {
  let risk = 0;
  let dealbreakerTriggered = false;
  const triggeredFlags: RedFlag[] = [];
  const reassuringChecks: RedFlag[] = [];

  for (const flag of flags) {
    const answer = answers[flag.id];
    if (!answer) continue;
    if (flag.polarity === "flag") {
      if (answer === "yes") {
        triggeredFlags.push(flag);
        if (flag.tier === "dealbreaker") {
          dealbreakerTriggered = true;
        } else {
          risk += flag.weight;
        }
      } else if (answer === "unsure" && flag.tier !== "check") {
        risk += 1;
      }
    } else if (answer === "yes") {
      risk -= 1;
      reassuringChecks.push(flag);
    }
  }

  risk = Math.max(0, risk);
  return {
    risk,
    verdict: verdictFor(risk, dealbreakerTriggered),
    dealbreakerTriggered,
    triggeredFlags,
    reassuringChecks,
  };
}

export function verdictFor(risk: number, dealbreakerTriggered: boolean): Verdict {
  if (dealbreakerTriggered || risk >= 8) return "Likely scam";
  if (risk >= 4) return "Be careful";
  return "Looks real (still verify)";
}

export function verdictTone(verdict: Verdict): string {
  switch (verdict) {
    case "Looks real (still verify)":
      return "border-verdict-good/40 bg-verdict-good/10 text-verdict-good";
    case "Be careful":
      return "border-verdict-warn/50 bg-verdict-warn/10 text-verdict-warn";
    default:
      return "border-verdict-bad/40 bg-verdict-bad/10 text-verdict-bad";
  }
}

export function nextSteps(verdict: Verdict): string {
  switch (verdict) {
    case "Looks real (still verify)":
      return "Good signal — but still verify before you accept. Run the 5 checks in the Verify Company tab. Remember: a real internship pays you; you never pay it.";
    case "Be careful":
      return "Do not pay anything or share bank details yet. Ask for a signed offer letter on company letterhead, then confirm with your T&P cell or a senior (Use the Verify Company tab).";
    default:
      return "Do not pay anything and do not share documents like Aadhaar or bank details. Stop replying, block the contact, and report it to your T&P cell. You can use the Verify Company tab to gather proof.";
  }
}
