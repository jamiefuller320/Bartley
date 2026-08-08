"use client";

import { useEffect, useMemo, useState } from "react";
import type { FeederSchoolsBundle } from "@/lib/types";
import {
  FOCUS_GROUPS,
  KS1_FIELDS,
  SIP_METRICS,
  SIP_SUBJECTS,
  downloadJson,
  emptyPriority,
  emptyTarget,
  isFeederOverlay,
  isSipBundle,
  parseOptionalNumber,
  stampUpdated,
  type FeederAspOverlay,
  type SipBundle,
  type SipPriority,
} from "@/lib/manual-data";
import type { SipTarget } from "@/lib/board";

const SIP_DRAFT_KEY = "bartley-insight-sip-draft";
const KS1_DRAFT_KEY = "bartley-insight-ks1-draft";

export function DataEntryWorkbench({
  initialSip,
  initialKs1,
  feeders,
}: {
  initialSip: SipBundle;
  initialKs1: FeederAspOverlay;
  feeders: FeederSchoolsBundle;
}) {
  const [tab, setTab] = useState<"sip" | "ks1">("sip");
  const [sip, setSip] = useState<SipBundle>(initialSip);
  const [ks1, setKs1] = useState<FeederAspOverlay>(initialKs1);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    try {
      const sipDraft = localStorage.getItem(SIP_DRAFT_KEY);
      if (sipDraft) {
        const parsed = JSON.parse(sipDraft) as unknown;
        if (isSipBundle(parsed)) setSip(parsed);
      }
      const ks1Draft = localStorage.getItem(KS1_DRAFT_KEY);
      if (ks1Draft) {
        const parsed = JSON.parse(ks1Draft) as unknown;
        if (isFeederOverlay(parsed)) setKs1(parsed);
      }
    } catch {
      // ignore corrupt drafts
    }
  }, []);

  const feederMeta = useMemo(() => {
    const map = new Map(
      [...feeders.feeders, ...feeders.peers].map((school) => [
        school.urn,
        school,
      ]),
    );
    return map;
  }, [feeders]);

  const saveDrafts = () => {
    const nextSip = stampUpdated(sip);
    const nextKs1 = stampUpdated(ks1);
    setSip(nextSip);
    setKs1(nextKs1);
    localStorage.setItem(SIP_DRAFT_KEY, JSON.stringify(nextSip));
    localStorage.setItem(KS1_DRAFT_KEY, JSON.stringify(nextKs1));
    setStatus("Draft saved in this browser (localStorage).");
  };

  const clearDrafts = () => {
    localStorage.removeItem(SIP_DRAFT_KEY);
    localStorage.removeItem(KS1_DRAFT_KEY);
    setSip(initialSip);
    setKs1(initialKs1);
    setStatus("Browser draft cleared; form reset to repo seed values.");
  };

  const exportSip = () => {
    downloadJson("sip-targets.json", stampUpdated(sip));
    setStatus(
      "Downloaded sip-targets.json — replace src/data/sip-targets.json and commit.",
    );
  };

  const exportKs1 = () => {
    downloadJson("feeder-asp-overlay.json", stampUpdated(ks1));
    setStatus(
      "Downloaded feeder-asp-overlay.json — replace src/data/feeder-asp-overlay.json, run npm run refresh-feeders, then commit.",
    );
  };

  const importFile = async (
    file: File | null,
    kind: "sip" | "ks1",
  ) => {
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      if (kind === "sip") {
        if (!isSipBundle(parsed)) throw new Error("Invalid SIP JSON");
        setSip(parsed);
        setStatus(`Imported SIP JSON from ${file.name}.`);
      } else {
        if (!isFeederOverlay(parsed)) throw new Error("Invalid KS1 overlay JSON");
        setKs1(parsed);
        setStatus(`Imported KS1 overlay JSON from ${file.name}.`);
      }
    } catch (error) {
      setStatus(
        `Could not import ${file.name}: ${
          error instanceof Error ? error.message : "invalid JSON"
        }`,
      );
    }
  };

  const updatePriority = (index: number, patch: Partial<SipPriority>) => {
    setSip((prev) => {
      const priorities = [...(prev.priorities ?? [])];
      priorities[index] = { ...priorities[index], ...patch };
      return { ...prev, priorities };
    });
  };

  const updateTarget = (index: number, patch: Partial<SipTarget>) => {
    setSip((prev) => {
      const targets = [...prev.targets];
      targets[index] = { ...targets[index], ...patch };
      return { ...prev, targets };
    });
  };

  const updateKs1Field = (
    urn: string,
    key: keyof FeederAspOverlay["byUrn"][string],
    raw: string,
  ) => {
    setKs1((prev) => {
      const entry = prev.byUrn[urn];
      if (!entry) return prev;
      if (key === "short") {
        return {
          ...prev,
          byUrn: { ...prev.byUrn, [urn]: { ...entry, short: raw } },
        };
      }
      return {
        ...prev,
        byUrn: {
          ...prev.byUrn,
          [urn]: { ...entry, [key]: parseOptionalNumber(raw) },
        },
      };
    });
  };

  return (
    <div className="data-entry">
      <div className="data-entry-banner">
        <p>
          This site is a static GitHub Pages export — values typed here do{" "}
          <strong>not</strong> publish automatically. Save a browser draft,
          download JSON, replace the files under <code>src/data/</code>, then
          commit (and run <code>npm run refresh-feeders</code> after KS1
          changes).
        </p>
        {sip.sourceUrl ? (
          <p>
            Current SIP reference:{" "}
            <a href={sip.sourceUrl} target="_blank" rel="noreferrer">
              {sip.sourceTitle ?? "GovernorHub SIP"}
            </a>
            {sip.period ? ` (${sip.period.replace("/", "–")})` : ""}.
          </p>
        ) : null}
      </div>

      <div className="data-entry-toolbar" role="group" aria-label="Draft actions">
        <button type="button" className="btn-primary" onClick={saveDrafts}>
          Save browser draft
        </button>
        <button type="button" className="btn-ghost" onClick={exportSip}>
          Download SIP JSON
        </button>
        <button type="button" className="btn-ghost" onClick={exportKs1}>
          Download KS1 JSON
        </button>
        <button type="button" className="btn-ghost" onClick={clearDrafts}>
          Reset to seed
        </button>
        <label className="btn-ghost file-import">
          Import SIP JSON
          <input
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={(event) =>
              void importFile(event.target.files?.[0] ?? null, "sip")
            }
          />
        </label>
        <label className="btn-ghost file-import">
          Import KS1 JSON
          <input
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={(event) =>
              void importFile(event.target.files?.[0] ?? null, "ks1")
            }
          />
        </label>
      </div>

      {status ? <p className="data-entry-status" role="status">{status}</p> : null}

      <div className="chart-view-toggle" role="tablist" aria-label="Data entry section">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "sip"}
          className={tab === "sip" ? "history-tab active" : "history-tab"}
          onClick={() => setTab("sip")}
        >
          SIP priorities &amp; targets
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "ks1"}
          className={tab === "ks1" ? "history-tab active" : "history-tab"}
          onClick={() => setTab("ks1")}
        >
          Feeder KS1 / phonics
        </button>
      </div>

      {tab === "sip" ? (
        <div className="data-entry-panel">
          <section className="data-entry-block">
            <h2>Source &amp; vision</h2>
            <label className="field">
              <span>SIP period</span>
              <input
                value={sip.period ?? ""}
                onChange={(e) =>
                  setSip((prev) => ({ ...prev, period: e.target.value }))
                }
                placeholder="2025/2026"
              />
            </label>
            <label className="field">
              <span>Source title</span>
              <input
                value={sip.sourceTitle ?? ""}
                onChange={(e) =>
                  setSip((prev) => ({ ...prev, sourceTitle: e.target.value }))
                }
              />
            </label>
            <label className="field">
              <span>Source URL (GovernorHub)</span>
              <input
                value={sip.sourceUrl ?? ""}
                onChange={(e) =>
                  setSip((prev) => ({ ...prev, sourceUrl: e.target.value }))
                }
              />
            </label>
            <label className="field">
              <span>Vision</span>
              <textarea
                rows={3}
                value={sip.vision ?? ""}
                onChange={(e) =>
                  setSip((prev) => ({ ...prev, vision: e.target.value }))
                }
              />
            </label>
            <label className="field">
              <span>Note</span>
              <textarea
                rows={3}
                value={sip.note}
                onChange={(e) =>
                  setSip((prev) => ({ ...prev, note: e.target.value }))
                }
              />
            </label>
            <label className="field">
              <span>FGB meeting dates (YYYY-MM-DD, comma-separated)</span>
              <input
                value={(sip.calendar?.fgbMeetings ?? []).join(", ")}
                onChange={(e) =>
                  setSip((prev) => ({
                    ...prev,
                    calendar: {
                      ...prev.calendar,
                      fgbMeetings: e.target.value
                        .split(",")
                        .map((part) => part.trim())
                        .filter(Boolean),
                    },
                  }))
                }
              />
            </label>
            <label className="field">
              <span>INSET days (YYYY-MM-DD, comma-separated)</span>
              <input
                value={(sip.calendar?.insetDays ?? []).join(", ")}
                onChange={(e) =>
                  setSip((prev) => ({
                    ...prev,
                    calendar: {
                      ...prev.calendar,
                      insetDays: e.target.value
                        .split(",")
                        .map((part) => part.trim())
                        .filter(Boolean),
                    },
                  }))
                }
              />
            </label>
            <label className="overlay-check">
              <input
                type="checkbox"
                checked={sip.enabledByDefault}
                onChange={(e) =>
                  setSip((prev) => ({
                    ...prev,
                    enabledByDefault: e.target.checked,
                  }))
                }
              />
              <span>Show SIP target overlays on charts by default</span>
            </label>
          </section>

          <section className="data-entry-block">
            <div className="data-entry-block-head">
              <h2>Priorities</h2>
              <button
                type="button"
                className="btn-ghost"
                onClick={() =>
                  setSip((prev) => ({
                    ...prev,
                    priorities: [...(prev.priorities ?? []), emptyPriority()],
                  }))
                }
              >
                Add priority
              </button>
            </div>
            {(sip.priorities ?? []).map((priority, index) => (
              <article key={priority.id} className="data-entry-card">
                <label className="field">
                  <span>Title</span>
                  <input
                    value={priority.title}
                    onChange={(e) =>
                      updatePriority(index, { title: e.target.value })
                    }
                  />
                </label>
                <label className="field">
                  <span>Detail</span>
                  <textarea
                    rows={4}
                    value={priority.detail}
                    onChange={(e) =>
                      updatePriority(index, { detail: e.target.value })
                    }
                  />
                </label>
                <label className="field">
                  <span>By period</span>
                  <input
                    value={priority.byPeriod ?? ""}
                    onChange={(e) =>
                      updatePriority(index, { byPeriod: e.target.value })
                    }
                    placeholder="2026/2027"
                  />
                </label>
                <fieldset className="chip-fieldset">
                  <legend>Focus groups</legend>
                  {FOCUS_GROUPS.map((group) => {
                    const checked = priority.focusGroups.includes(group);
                    return (
                      <label key={group} className="overlay-check">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            const focusGroups = checked
                              ? priority.focusGroups.filter((g) => g !== group)
                              : [...priority.focusGroups, group];
                            updatePriority(index, { focusGroups });
                          }}
                        />
                        <span>{group}</span>
                      </label>
                    );
                  })}
                </fieldset>
                <fieldset className="chip-fieldset">
                  <legend>Subjects</legend>
                  {SIP_SUBJECTS.map((subject) => {
                    const checked = priority.subjects.includes(subject);
                    return (
                      <label key={subject} className="overlay-check">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            const subjects = checked
                              ? priority.subjects.filter((s) => s !== subject)
                              : [...priority.subjects, subject];
                            updatePriority(index, { subjects });
                          }}
                        />
                        <span>{subject}</span>
                      </label>
                    );
                  })}
                </fieldset>
                <button
                  type="button"
                  className="btn-ghost danger"
                  onClick={() =>
                    setSip((prev) => ({
                      ...prev,
                      priorities: (prev.priorities ?? []).filter(
                        (_, i) => i !== index,
                      ),
                    }))
                  }
                >
                  Remove priority
                </button>
              </article>
            ))}
          </section>

          <section className="data-entry-block">
            <div className="data-entry-block-head">
              <h2>Numeric chart targets</h2>
              <button
                type="button"
                className="btn-ghost"
                onClick={() =>
                  setSip((prev) => ({
                    ...prev,
                    targets: [...prev.targets, emptyTarget()],
                  }))
                }
              >
                Add target
              </button>
            </div>
            {sip.targets.map((target, index) => (
              <article key={`${target.label}-${index}`} className="data-entry-card">
                <div className="field-grid">
                  <label className="field">
                    <span>Subject</span>
                    <select
                      value={target.subject}
                      onChange={(e) =>
                        updateTarget(index, { subject: e.target.value })
                      }
                    >
                      {SIP_SUBJECTS.map((subject) => (
                        <option key={subject} value={subject}>
                          {subject}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>Metric</span>
                    <select
                      value={target.metric}
                      onChange={(e) =>
                        updateTarget(index, {
                          metric: e.target.value as SipTarget["metric"],
                        })
                      }
                    >
                      {SIP_METRICS.map((metric) => (
                        <option key={metric} value={metric}>
                          {metric}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>Value</span>
                    <input
                      type="number"
                      value={target.value}
                      onChange={(e) =>
                        updateTarget(index, {
                          value: Number(e.target.value) || 0,
                        })
                      }
                    />
                  </label>
                  <label className="field">
                    <span>By period</span>
                    <input
                      value={target.byPeriod ?? ""}
                      onChange={(e) =>
                        updateTarget(index, { byPeriod: e.target.value })
                      }
                    />
                  </label>
                </div>
                <label className="field">
                  <span>Label</span>
                  <input
                    value={target.label}
                    onChange={(e) =>
                      updateTarget(index, { label: e.target.value })
                    }
                  />
                </label>
                <button
                  type="button"
                  className="btn-ghost danger"
                  onClick={() =>
                    setSip((prev) => ({
                      ...prev,
                      targets: prev.targets.filter((_, i) => i !== index),
                    }))
                  }
                >
                  Remove target
                </button>
              </article>
            ))}
          </section>
        </div>
      ) : (
        <div className="data-entry-panel">
          <section className="data-entry-block">
            <h2>Feeder KS1 / phonics overlay</h2>
            <p className="muted">
              Percentages only. Leave blank for unknown. These merge into{" "}
              <code>feeder-schools.json</code> when you run{" "}
              <code>npm run refresh-feeders</code>.
            </p>
            <label className="field">
              <span>Period</span>
              <input
                value={ks1.period}
                onChange={(e) =>
                  setKs1((prev) => ({ ...prev, period: e.target.value }))
                }
              />
            </label>
            <label className="field">
              <span>Source (e.g. ASP extract date / school spreadsheet)</span>
              <input
                value={ks1.source ?? ""}
                onChange={(e) =>
                  setKs1((prev) => ({
                    ...prev,
                    source: e.target.value || null,
                  }))
                }
              />
            </label>
          </section>

          {Object.entries(ks1.byUrn).map(([urn, entry]) => {
            const meta = feederMeta.get(urn);
            return (
              <section key={urn} className="data-entry-card">
                <h3>
                  {entry.short || meta?.short || urn}
                  <span className="muted">
                    {" "}
                    · URN {urn}
                    {meta?.laEstab
                      ? ` · ${meta.laEstab.slice(0, 3)}/${meta.laEstab.slice(3)}`
                      : ""}
                  </span>
                </h3>
                <div className="field-grid">
                  {KS1_FIELDS.map((field) => (
                    <label key={field.key} className="field">
                      <span>{field.label}</span>
                      <input
                        inputMode="decimal"
                        placeholder="—"
                        value={
                          entry[field.key] == null ? "" : String(entry[field.key])
                        }
                        onChange={(e) =>
                          updateKs1Field(urn, field.key, e.target.value)
                        }
                      />
                    </label>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
