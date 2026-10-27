export type Tier = "dealbreaker" | "warning" | "check";
export type Polarity = "flag" | "good";
export type FlagSource = "assumption" | "interview" | "listing";

export interface RedFlag {
  id: string;
  text: string;
  tier: Tier;
  weight: number;
  polarity: Polarity;
  source: FlagSource;
  evidence_count: number;
}

export interface ExperienceEntry {
  company: string;
  role: string;
  stipend_inr: string;
  was_real: "yes" | "no" | "unsure";
  red_flags: string;
  rating_1_5: number;
  verified_by_tp: "yes" | "no";
  source_type: string;
}

/**
 * Seed red-flag rules. These are a HYPOTHESIS from commonly reported scam
 * patterns — interviews are what turn them into evidence. Editable in Admin.
 */
export const DEFAULT_REDFLAGS: RedFlag[] = [
  {
    id: "D1",
    text: "They asked me to pay money for registration, training, a kit, a laptop, a security deposit or \"refundable\" fees.",
    tier: "dealbreaker",
    weight: 10,
    polarity: "flag",
    source: "assumption",
    evidence_count: 0,
  },
  {
    id: "D2",
    text: "They asked for Aadhaar, PAN, bank details or an OTP before giving a signed offer letter.",
    tier: "dealbreaker",
    weight: 10,
    polarity: "flag",
    source: "assumption",
    evidence_count: 0,
  },
  {
    id: "D3",
    text: "A certificate or placement is \"guaranteed\" if I pay.",
    tier: "dealbreaker",
    weight: 10,
    polarity: "flag",
    source: "assumption",
    evidence_count: 0,
  },
  { id: "W1", text: "I got an offer with no interview or test.", tier: "warning", weight: 3, polarity: "flag", source: "assumption", evidence_count: 0 },
  { id: "W2", text: "All contact is through Gmail/Yahoo, WhatsApp or Telegram, with no company email domain.", tier: "warning", weight: 2, polarity: "flag", source: "assumption", evidence_count: 0 },
  { id: "W3", text: "The role description is vague (no tasks, tools or a named supervisor).", tier: "warning", weight: 2, polarity: "flag", source: "assumption", evidence_count: 0 },
  { id: "W4", text: "I am being rushed (\"accept within 24 hours\").", tier: "warning", weight: 2, polarity: "flag", source: "assumption", evidence_count: 0 },
  { id: "W5", text: "The stipend or perks sound too good for a student intern.", tier: "warning", weight: 2, polarity: "flag", source: "assumption", evidence_count: 0 },
  { id: "W6", text: "The message is generic (\"Dear candidate\") or mass-sent.", tier: "warning", weight: 2, polarity: "flag", source: "assumption", evidence_count: 0 },
  { id: "W7", text: "I am asked to refer or recruit other students.", tier: "warning", weight: 3, polarity: "flag", source: "assumption", evidence_count: 0 },
  { id: "W8", text: "The offer letter has no company address, letterhead or named signatory.", tier: "warning", weight: 2, polarity: "flag", source: "assumption", evidence_count: 0 },
  { id: "C1", text: "The company has a working website with real product or service details.", tier: "check", weight: 1, polarity: "good", source: "assumption", evidence_count: 0 },
  { id: "C2", text: "The company has a LinkedIn page with employees who list working there.", tier: "check", weight: 1, polarity: "good", source: "assumption", evidence_count: 0 },
  { id: "C3", text: "A senior or someone I know has interned there.", tier: "check", weight: 1, polarity: "good", source: "assumption", evidence_count: 0 },
  { id: "C4", text: "My T&P cell has heard of or confirmed this company.", tier: "check", weight: 1, polarity: "good", source: "assumption", evidence_count: 0 },
  { id: "C5", text: "The company is registered (I found it on the MCA21 company search).", tier: "check", weight: 1, polarity: "good", source: "assumption", evidence_count: 0 },
];

/**
 * Fictional seed stories for the Experience Bank. Every one carries a clear
 * EXAMPLE / PLACEHOLDER badge until real, anonymised senior stories replace
 * them. Company names do not exist.
 */
export const SEED_EXPERIENCES: (ExperienceEntry & { seed: boolean })[] = [
  {
    company: "Skyline Craft Labs",
    role: "Content Writing Intern",
    stipend_inr: "8000",
    was_real: "yes",
    red_flags: "None — offer came after two interviews, on company letterhead.",
    rating_1_5: 4,
    verified_by_tp: "yes",
    source_type: "interview",
    seed: true,
  },
  {
    company: "GreenLeaf Media",
    role: "Graphic Design Intern",
    stipend_inr: "6000",
    was_real: "yes",
    red_flags: "Onboarding was slow, but stipend was paid on time every month.",
    rating_1_5: 5,
    verified_by_tp: "yes",
    source_type: "interview",
    seed: true,
  },
  {
    company: "Nimbus Analytics",
    role: "Data Entry Intern",
    stipend_inr: "15000",
    was_real: "no",
    red_flags: "Asked for a ₹2,499 \"registration kit\" fee before the offer letter. Too-good stipend for data entry.",
    rating_1_5: 1,
    verified_by_tp: "no",
    source_type: "interview",
    seed: true,
  },
  {
    company: "TechnoVista Solutions",
    role: "HR Intern (work from home)",
    stipend_inr: "12000",
    was_real: "no",
    red_flags: "\"Guaranteed certificate\" if I paid a security deposit. Contact was WhatsApp-only from a Gmail address.",
    rating_1_5: 1,
    verified_by_tp: "no",
    source_type: "interview",
    seed: true,
  },
  {
    company: "CloudPeek Systems",
    role: "Business Development Intern",
    stipend_inr: "0",
    was_real: "unsure",
    red_flags: "One rushed interview, \"stipend after a 3-month trial\", then no reply ever again. Ghost listing.",
    rating_1_5: 2,
    verified_by_tp: "no",
    source_type: "interview",
    seed: true,
  },
];
