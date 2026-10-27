import { describe, expect, it } from "vitest";

import { DEFAULT_REDFLAGS } from "@/lib/redflags";
import { scoreRun, type RunAnswers } from "@/lib/scoring";

const allNo = (): RunAnswers => Object.fromEntries(DEFAULT_REDFLAGS.map((f) => [f.id, "no"]));

describe("Quick-Vet scoring", () => {
  it("any dealbreaker Yes gives Likely scam", () => {
    const a = allNo();
    a.D2 = "yes";
    expect(scoreRun(DEFAULT_REDFLAGS, a).verdict).toBe("Likely scam");
  });

  it("all warnings No and all checks Yes gives Looks real", () => {
    const a = allNo();
    for (const f of DEFAULT_REDFLAGS) if (f.tier === "check") a[f.id] = "yes";
    const s = scoreRun(DEFAULT_REDFLAGS, a);
    expect(s.risk).toBe(0);
    expect(s.verdict).toBe("Looks real (still verify)");
  });

  it("three weight-2 warnings plus three Not sure gives Be careful", () => {
    const a = allNo();
    a.W2 = a.W3 = a.W4 = "yes";
    a.W5 = a.W6 = a.W8 = "unsure";
    const s = scoreRun(DEFAULT_REDFLAGS, a);
    expect(s.risk).toBe(9 - 0); // 6 + 3
    expect(s.verdict).toBe("Likely scam");
  });

  it("risk 4-7 is Be careful", () => {
    const a = allNo();
    a.W2 = a.W3 = "yes";
    a.W5 = "unsure";
    expect(scoreRun(DEFAULT_REDFLAGS, a).verdict).toBe("Be careful");
  });

  it("risk never goes below 0", () => {
    const a = allNo();
    for (const f of DEFAULT_REDFLAGS) if (f.tier === "check") a[f.id] = "yes";
    expect(scoreRun(DEFAULT_REDFLAGS, a).risk).toBe(0);
  });
});
