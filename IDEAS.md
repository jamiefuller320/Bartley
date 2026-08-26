# Bartley Insight — ideas backlog

Living list of product ideas and improvement work. Status: `open` · `in progress` · `done` · `parked`.

## Active / done

| ID | Idea | Status | Notes |
|----|------|--------|-------|
| I01 | Fail weekly refresh loudly; prove what refreshed | done | Refresh workflow fails on any step; outcomes in PR body / summary |
| I02 | Include GPS in automated findings | done | GPS added to `evaluate.ts` subject loop |
| I03 | Chart deep links stick (URL sync for view/subject/metric/peer) | done | `MetricsWorkbench` syncs URL for all chart controls |
| I04 | Fold CSP multi-year history into `refresh-all` | done | `refresh-csp-history` + merge via `csp-history.ts` |
| I05 | Feeder ASP / phonics–KS1 import path | done | `feeder-asp-overlay.json` merged by feeder refresh |
| I06 | Re-select peer juniors each refresh cycle | done | `refresh-peers.py` re-ranks top 3 each run |
| I07 | Unit tests for findings / 3-year / change-log | done | `npm test` via `tsx --test` |
| I08 | Depersonalize hard-coded analysis year deltas | done | YoY / equity history derived from data |
| I09 | CI quality gate (`tsc`) before Pages deploy | done | `ci.yml` + deploy typecheck/tests |
| I10 | Mobile / a11y pass | done | Peer Pupils label, captions, scroll hints, chart sr-only summaries |
| I11 | Sample-size labels as “of N” not “n=N” | done | PR #19 |
| I12 | Peer table school type on separate line | done | PR #20 |
| I13 | Dual-signal findings (latest + DfE 3-year) | done | PR #18 |
| I14 | Manual data-entry page for KS1 + SIP | done | `/data-entry` with localStorage draft + JSON download/import; SIP priorities on dashboard/analysis |
| I15 | Align Pages UI with School Compass layout | done | Harbour tokens, Figtree, shorter sections, chapter nav — merge-ready visual system |

## Parked / open follow-ups

| ID | Idea | Status | Notes |
|----|------|--------|-------|
| P01 | IDSR / confidential Ofsted data integration | parked | Useful for inspection prep; keep out of public Pages feed |
| P02 | Academic-year rollover automation (filename, dataset UUID discovery) | parked | Next DfE release will need period constants + dataset IDs revisited |
| P03 | SIP targets ownership / board review workflow | done | SIP 2025–26 vision, priorities, calendar loaded; editable via /data-entry |
| P04 | Auto-import SIP from GovernorHub | parked | Document is behind auth; manual paste remains the path |
| P05 | SLT excellence criteria → exact % chart targets (SIP 1.2) | open | Numeric overlays are provisional until SLT define excellence vs national/local |

## How to use

- Add new ideas as rows with status `open`.
- When starting work, set `in progress` and link the PR.
- When shipping, set `done` and note the PR.
- Confidential / out-of-scope ideas go under **Parked**, not deleted.
