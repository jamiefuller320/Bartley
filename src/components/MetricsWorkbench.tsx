"use client";

import { useMemo, useState } from "react";
import type {
  HistoryRow,
  ProgressRow,
  SubjectComparison,
} from "@/lib/types";
import { ViewModeDock, type ChartViewMode } from "@/components/ViewModeDock";
import { SubjectComparisonChart } from "@/components/SubjectComparisonChart";
import { ComparisonTable } from "@/components/ComparisonTable";
import { HistoryTrendChart } from "@/components/HistoryTrendChart";
import { HistoryTable } from "@/components/HistoryTable";
import { ProgressChart } from "@/components/ProgressChart";
import { shortSubject } from "@/lib/format";

const SUBJECTS = [
  "Reading, writing and maths",
  "Reading",
  "Writing",
  "Maths",
  "Grammar, punctuation and spelling",
  "Science",
] as const;

export function MetricsWorkbench({
  subjects,
  history,
  progressHistory = [],
  period,
}: {
  subjects: SubjectComparison[];
  history: HistoryRow[];
  progressHistory?: ProgressRow[];
  period: string;
}) {
  const [mode, setMode] = useState<ChartViewMode>("compare");
  const [subject, setSubject] =
    useState<(typeof SUBJECTS)[number]>("Reading, writing and maths");
  const [metric, setMetric] = useState<"expected" | "higher">("expected");
  const [showHampshire, setShowHampshire] = useState(true);
  const [showEngland, setShowEngland] = useState(true);

  const subjectHistory = useMemo(
    () => history.filter((row) => row.subject === subject),
    [history, subject],
  );
  const hasScaled = subjectHistory.some((row) => row.schoolScaled !== null);
  const progressForSubject = progressHistory.filter((row) => row.subject === subject);

  return (
    <section className="section section-alt" id="charts">
      <div className="shell">
        <div className="section-intro">
          <h2>Performance charts</h2>
          <p>
            {mode === "compare"
              ? `Latest year (${period.replace("/", "–")}) — Bartley against Hampshire and England. Axis ranges zoom to the data band so small gaps are easier to see.`
              : "Bartley year-on-year history. Optionally overlay Hampshire and England with the checkboxes below."}
          </p>
        </div>

        <div className="history-tabs" role="tablist" aria-label="Subject">
          {SUBJECTS.map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={subject === item}
              className={subject === item ? "history-tab active" : "history-tab"}
              onClick={() => setSubject(item)}
            >
              {shortSubject(item)}
            </button>
          ))}
        </div>

        <div className="metric-toggle" role="group" aria-label="Metric">
          <button
            type="button"
            className={metric === "expected" ? "history-tab active" : "history-tab"}
            onClick={() => setMetric("expected")}
          >
            Expected standard
          </button>
          <button
            type="button"
            className={metric === "higher" ? "history-tab active" : "history-tab"}
            onClick={() => setMetric("higher")}
          >
            Higher standard
          </button>
        </div>

        {mode === "compare" ? (
          <>
            <SubjectComparisonChart
              subjects={subjects.filter((row) => row.subject === subject)}
              metric={metric}
              focused
            />
            <ComparisonTable
              subjects={subjects.filter((row) => row.subject === subject)}
            />
          </>
        ) : (
          <>
            <div className="overlay-toggles" role="group" aria-label="Overlay benchmarks">
              <label className="overlay-check">
                <input
                  type="checkbox"
                  checked={showHampshire}
                  onChange={(event) => setShowHampshire(event.target.checked)}
                />
                <span>Overlay Hampshire</span>
              </label>
              <label className="overlay-check">
                <input
                  type="checkbox"
                  checked={showEngland}
                  onChange={(event) => setShowEngland(event.target.checked)}
                />
                <span>Overlay England</span>
              </label>
            </div>

            <HistoryTrendChart
              history={history}
              subject={subject}
              metric={metric === "higher" ? "higher" : "expected"}
              seriesMode="bartley"
              showHampshire={showHampshire}
              showEngland={showEngland}
            />
            <HistoryTable history={history} subject={subject} />

            {hasScaled ? (
              <>
                <div className="section-intro stacked">
                  <h3>Average scaled score</h3>
                  <p>
                    Bartley scaled scores over time for {shortSubject(subject)}
                    {showHampshire || showEngland
                      ? ", with selected overlays"
                      : ""}
                    .
                  </p>
                </div>
                <HistoryTrendChart
                  history={history}
                  subject={subject}
                  metric="scaled"
                  seriesMode="bartley"
                  showHampshire={showHampshire}
                  showEngland={showEngland}
                />
              </>
            ) : null}

            {progressForSubject.length ? (
              <>
                <div className="section-intro stacked">
                  <h3>Progress by year</h3>
                  <p>Published KS1–KS2 progress scores for Bartley.</p>
                </div>
                <ProgressChart
                  progress={[...progressForSubject]
                    .sort((a, b) => (a.period ?? "").localeCompare(b.period ?? ""))
                    .map((row) => ({
                      subject: (row.period ?? "").replace("/20", "/"),
                      score: row.score,
                      lower: row.lower,
                      upper: row.upper,
                      period: row.period,
                    }))}
                />
              </>
            ) : null}
          </>
        )}
      </div>

      <ViewModeDock mode={mode} onChange={setMode} />
    </section>
  );
}
