"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type {
  HistoryRow,
  PeerSchoolsBundle,
  ProgressRow,
  SubjectComparison,
} from "@/lib/types";
import { ViewModeDock, type ChartViewMode } from "@/components/ViewModeDock";
import { SubjectComparisonChart } from "@/components/SubjectComparisonChart";
import { ComparisonTable } from "@/components/ComparisonTable";
import { HistoryTrendChart } from "@/components/HistoryTrendChart";
import { HistoryTable } from "@/components/HistoryTable";
import { ProgressChart } from "@/components/ProgressChart";
import { PeerComparisonTable } from "@/components/PeerComparisonTable";
import { shortSubject, fmtPct } from "@/lib/format";
import {
  peerLatestValue,
  peerMetricByPeriod,
  peerOverlayLabel,
  type PeerOverlaySelection,
} from "@/lib/peers";
import { subjectFromSlug } from "@/lib/board";
import type { SchoolMonitorData } from "@/lib/types";

const SUBJECTS = [
  "Reading, writing and maths",
  "Reading",
  "Writing",
  "Maths",
  "Grammar, punctuation and spelling",
  "Science",
] as const;

type SubjectOption = (typeof SUBJECTS)[number];

function MetricsWorkbenchInner({
  subjects,
  history,
  progressHistory = [],
  period,
  peers,
  data,
}: {
  subjects: SubjectComparison[];
  history: HistoryRow[];
  progressHistory?: ProgressRow[];
  period: string;
  peers: PeerSchoolsBundle;
  data: SchoolMonitorData;
}) {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<ChartViewMode>("compare");
  const [subject, setSubject] = useState<SubjectOption>(
    "Reading, writing and maths",
  );
  const [metric, setMetric] = useState<"expected" | "higher">("expected");
  const [showHampshire, setShowHampshire] = useState(true);
  const [showEngland, setShowEngland] = useState(true);
  const [peerOverlay, setPeerOverlay] =
    useState<PeerOverlaySelection>("none");

  useEffect(() => {
    const view = searchParams.get("view");
    if (view === "history" || view === "compare") setMode(view);

    const subjectParam = subjectFromSlug(searchParams.get("subject"));
    if (subjectParam && SUBJECTS.includes(subjectParam as SubjectOption)) {
      setSubject(subjectParam as SubjectOption);
    }

    const metricParam = searchParams.get("metric");
    if (metricParam === "higher" || metricParam === "expected") {
      setMetric(metricParam);
    }

    const peerParam = searchParams.get("peer");
    if (peerParam === "average" || peerParam === "none") {
      setPeerOverlay(peerParam);
    } else if (peerParam && peers.peers.some((p) => p.urn === peerParam || p.short.toLowerCase() === peerParam.toLowerCase())) {
      const match = peers.peers.find(
        (p) =>
          p.urn === peerParam ||
          p.short.toLowerCase() === peerParam.toLowerCase(),
      );
      if (match) setPeerOverlay(match.urn);
    }
  }, [searchParams, peers.peers]);

  const subjectHistory = useMemo(
    () => history.filter((row) => row.subject === subject),
    [history, subject],
  );
  const hasScaled = subjectHistory.some((row) => row.schoolScaled !== null);
  const progressForSubject = progressHistory.filter(
    (row) => row.subject === subject,
  );

  const peerLabel = peerOverlayLabel(peers, peerOverlay);
  const peerByPeriod = useMemo(
    () =>
      peerMetricByPeriod(
        peers,
        peerOverlay,
        subject,
        metric === "higher" ? "higher" : "expected",
      ),
    [peers, peerOverlay, subject, metric],
  );
  const peerScaledByPeriod = useMemo(
    () => peerMetricByPeriod(peers, peerOverlay, subject, "scaled"),
    [peers, peerOverlay, subject],
  );
  const peerCompareValue = peerLatestValue(
    peers,
    peerOverlay,
    subject,
    metric === "higher" ? "higher" : "expected",
  );

  return (
    <section className="section section-alt" id="charts">
      <div className="shell">
        <div className="section-intro">
          <h2>Performance charts</h2>
          <p>
            {mode === "compare"
              ? `Latest year (${period.replace("/", "–")}) — Bartley against Hampshire and England. Optionally overlay a top local peer or the peer average.`
              : "Bartley year-on-year history. Overlay Hampshire, England, and a selected peer school or peer average with the controls below."}
          </p>
        </div>

        <div className="peer-strip" aria-label="Similar top-performing peers">
          <p className="peer-strip-lead">
            Top 3 similar-size juniors nearby (2024/25 RWM):{" "}
            {peers.peers
              .map(
                (p) =>
                  `${p.short} ${fmtPct(p.latest.rwmExpected)} (n=${p.latest.eligiblePupils ?? "—"})`,
              )
              .join(" · ")}
            . Peer average {fmtPct(peers.peerAverageLatest.rwmExpected)}.
          </p>
          <p className="peer-strip-note muted">{peers.selection.method}</p>
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

        <div
          className="overlay-toggles peer-overlay-panel"
          role="group"
          aria-label="Peer overlay"
        >
          <span className="overlay-label">Peer overlay</span>
          <label className="overlay-check">
            <input
              type="radio"
              name="peer-overlay"
              checked={peerOverlay === "none"}
              onChange={() => setPeerOverlay("none")}
            />
            <span>None</span>
          </label>
          <label className="overlay-check">
            <input
              type="radio"
              name="peer-overlay"
              checked={peerOverlay === "average"}
              onChange={() => setPeerOverlay("average")}
            />
            <span>Peer average</span>
          </label>
          {peers.peers.map((school) => (
            <label key={school.urn} className="overlay-check">
              <input
                type="radio"
                name="peer-overlay"
                checked={peerOverlay === school.urn}
                onChange={() => setPeerOverlay(school.urn)}
              />
              <span>{school.short}</span>
            </label>
          ))}
        </div>

        {mode === "compare" ? (
          <>
            <SubjectComparisonChart
              subjects={subjects.filter((row) => row.subject === subject)}
              metric={metric}
              focused
              peerValue={peerCompareValue}
              peerSeriesName={peerLabel}
            />
            <ComparisonTable
              subjects={subjects.filter((row) => row.subject === subject)}
              metric={metric}
              cohortSize={data.profile.eligiblePupils}
            />
          </>
        ) : (
          <>
            <div
              className="overlay-toggles"
              role="group"
              aria-label="Overlay benchmarks"
            >
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
              peerByPeriod={peerOverlay === "none" ? undefined : peerByPeriod}
              peerSeriesName={peerLabel}
            />
            <HistoryTable history={history} subject={subject} />

            {hasScaled ? (
              <>
                <div className="section-intro stacked">
                  <h3>Average scaled score</h3>
                  <p>
                    Bartley scaled scores over time for {shortSubject(subject)}
                    {showHampshire || showEngland || peerLabel
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
                  peerByPeriod={
                    peerOverlay === "none" ? undefined : peerScaledByPeriod
                  }
                  peerSeriesName={peerLabel}
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
                    .sort((a, b) =>
                      (a.period ?? "").localeCompare(b.period ?? ""),
                    )
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

        <div className="section-intro stacked">
          <h3>Peer comparison table</h3>
          <p>
            Latest expected-standard figures for Bartley and the top three
            similar-size local juniors, with links to Compare school
            performance.
          </p>
        </div>
        <PeerComparisonTable peers={peers} bartley={data} />
      </div>

      <ViewModeDock mode={mode} onChange={setMode} />
    </section>
  );
}

export function MetricsWorkbench(props: {
  subjects: SubjectComparison[];
  history: HistoryRow[];
  progressHistory?: ProgressRow[];
  period: string;
  peers: PeerSchoolsBundle;
  data: SchoolMonitorData;
}) {
  return (
    <Suspense
      fallback={
        <section className="section section-alt" id="charts">
          <div className="shell">
            <p className="muted">Loading charts…</p>
          </div>
        </section>
      }
    >
      <MetricsWorkbenchInner {...props} />
    </Suspense>
  );
}
