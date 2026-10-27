# Real or Ghost? — Is This Internship Real?

A lightweight, mobile-first web app that helps college students judge, in under three minutes, whether an off-campus internship offer is real, risky or a scam. Built as a prototype for project **P24 · Discovering and Vetting Off-Campus Internships**.

> **Prototype v0.** The red-flag rules are a hypothesis based on commonly reported scam patterns and are being validated through student, senior and T&P interviews. The tool gives a signal, not proof.

## Problem

Students hunting for off-campus internships wade through spam, fee-charging scams and ghost listings, with no trusted way to verify a company or learn from seniors' actual experiences. The same scam patterns (registration fees, instant offers) recur every cycle and catch first-timers.

**How might we help a student judge quickly whether an internship opportunity is real and worth it?**

## Features

| Module | What it does |
| --- | --- |
| **Quick-Vet checklist** | About 15 yes / no / not-sure questions. Returns a verdict (*Looks real*, *Be careful*, *Likely scam*) with the exact flags that triggered it. Any dealbreaker (e.g. asked to pay money) overrides the score. |
| **Verify the Company** | A 5-step walkthrough: MCA21 registration, LinkedIn footprint, website and domain age, AmbitionBox / Glassdoor reviews, T&P confirmation. |
| **Experience Bank** | Anonymised senior stories (role, stipend, real or not, red flags). Students can add their own. Seeded entries are clearly marked as placeholders. |
| **Feedback** | Collects clarity ratings and what confused or is missing, feeding the iteration record. |
| **Admin** | View and export all data (CSV / JSON), edit the red-flag list, and log changes. |

## How scoring works

- **Dealbreaker** answered *Yes* → *Likely scam* immediately.
- Otherwise: risk = sum of weights of flags answered *Yes*, +1 for each *Not sure* on a dealbreaker/warning, −1 for each reassuring check answered *Yes* (minimum 0).
- **0–3** Looks real (still verify) · **4–7** Be careful · **8+** Likely scam.

Red flags live in one editable array (and in the Admin screen), each tagged with a source (`assumption`, `interview` or `listing`) so you can show which rules are evidence-backed.

## Data storage

Nothing the user does is lost:

1. Every record is saved to **localStorage** on the device.
2. It is also POSTed to a **Google Sheet** through a Google Apps Script web app. If offline, records wait in an outbox and sync automatically later.
3. **CSV / JSON export** is available in Admin as a last-resort backup.

Sheet tabs: `checks`, `verification`, `experiences`, `feedback`, `redflags`, `changelog`.

**Privacy:** no names, phone numbers or emails are collected. Testers get a random ID (e.g. `T-4821`). Company names in the experience bank are optional and can be masked.

## Project structure

```
.
├── index.html     # The whole app (HTML + CSS + vanilla JS, no build step)
├── Code.gs        # Google Apps Script that appends records to the Sheet
├── SETUP.md       # Step-by-step setup for non-programmers
└── README.md
```

## Quick start

1. Create a Google Sheet and open **Extensions → Apps Script**.
2. Paste the contents of `Code.gs`, then **Deploy → New deployment → Web app** (Execute as: *Me*, Access: *Anyone*). Copy the `/exec` URL.
3. In `index.html`, set `CONFIG.SHEET_URL` to that URL.
4. Open `index.html` locally to try it, or host it free on **GitHub Pages** (Settings → Pages → deploy from `main`) or **Netlify Drop**.

See `SETUP.md` for the detailed walkthrough.

## Testing

Run these before inviting testers:

1. Any *Yes* on a dealbreaker gives *Likely scam*.
2. All *No* on warnings and all *Yes* on checks gives *Looks real*.
3. Three weight-2 warnings plus three *Not sure* answers gives *Be careful*.
4. A run completed offline appears in the outbox and syncs after reconnecting.
5. CSV export for each record type has the right headers.
6. Editing a red flag in Admin changes the next Quick-Vet run.
7. No console errors; layout works at 360px width.

Then test with 3–5 students who are mid-search, log reactions in the Feedback tab, and record each fix in the changelog.

## Known limitations

- Red flags are assumptions until validated by interviews.
- Seeded experiences are fictional placeholders.
- Admin has no real authentication (prototype only).
- A verdict is a signal, not proof. Always confirm with your T&P cell.

## Roadmap

- Replace seeded stories with real, anonymised senior experiences.
- Add 10+ real (anonymised) listings as test cases and tune weights from evidence.
- Seek T&P cell endorsement and a verified-company list.
- Improve fidelity (Figma designs, accessibility pass, regional-language support).

## Contributing

Students and seniors can help by sharing anonymised scam patterns or internship experiences. Please never include personal names, phone numbers or emails.

## License

Choose a license before publishing (e.g. MIT) and add a `LICENSE` file.
