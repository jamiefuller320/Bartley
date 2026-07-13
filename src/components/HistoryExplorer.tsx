"use client";

import { useState } from "react";
import type { HistoryRow, ProgressRow } from "@/lib/types";
import { HistoryTrendChart } from "@/components/HistoryTrendChart";
import { HistoryTable } from "@/components/HistoryTable";
import { ProgressChart } from "@/components/ProgressChart";

const SUBJECTS = [
  "Reading, writing and maths",
  "Reading",
  "Writing",
  "Maths",
  "Grammar, punctuation and spelling",
  "Science",
] as const;

export function HistoryExplorer({
  history,
  progressHistory = [],
}: {
  history: HistoryRow[];
  progressHistory?: ProgressRow[];
}) {
  const [subject, setSubject] =
    useState<(typeof SUBJECTS)[number]>("Reading, writing and maths");

  const subjectHistory = history.filter((h) => h.subject === subject);
  const hasScaled = subjectHistory.some((h) => h.schoolScaled !== null);
  const progressForSubject = progressHistory.filter((p) => p.subject === subject);

  return (
    <div>
      <div className="history-tabs" role="tablist" aria-label="Subject history">
        {SUBJECTS.map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={subject === item}
            className={subject === item ? "history-tab active" : "history-tab"}
            onClick={() => setSubject(item)}
          >
            {shortLabel(item)}
          </button>
        ))}
      </div>

      <HistoryTrendChart history={history} subject={subject} metric="expected" />
      <HistoryTable history={history} subject={subject} />

      {hasScaled ? (
        <>
          <div className="section-intro stacked">
            <h3>Average scaled score</h3>
            <p>Published scaled scores for {shortLabel(subject)} over time.</p>
          </div>
          <HistoryTrendChart history={history} subject={subject} metric="scaled" />
        </>
      ) : null}

      {progressForSubject.length ? (
        <>
          <div className="section-intro stacked">
            <h3>Progress scores by year</h3>
            <p>
              KS1–KS2 progress where published. Missing for cohorts without KS1
              baselines.
            </p>
          </div>
          <ProgressByYearChart rows={progressForSubject} />
        </>
      ) : null}
    </div>
  );
}

function shortLabel(subject: string): string {
  const map: Record<string, string> = {
    "Reading, writing and maths": "RWM",
    Reading: "Reading",
    Writing: "Writing",
    Maths: "Maths",
    "Grammar, punctuation and spelling": "GPS",
    Science: "Science",
  };
  return map[subject] ?? subject;
}

function ProgressByYearChart({ rows }: { rows: ProgressRow[] }) {
  // Reuse ProgressChart shape by mapping year into subject label
  const adapted = [...rows]
    .sort((a, b) => (a.period ?? "").localeCompare(b.period ?? ""))
    .map((r) => ({
      subject: (r.period ?? "").replace("/20", "/"),
      score: r.score,
      lower: r.lower,
      upper: r.upper,
      period: r.period,
    }));
  return <ProgressChart progress={adapted} />;
}
