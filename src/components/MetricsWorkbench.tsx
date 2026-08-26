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
import { shortSubject } from "@/lib/format";
import {
  peerLatestValue,
  peerMetricByPeriod,
  peerOverlayLabel,
  type PeerOverlaySelection,
} from "@/lib/peers";
import {
  subjectFromSlug,
  subjectSlug,
  type SipTargetsBundle,
} from "@/lib/board";
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
  sipTargets,
  embedded = false,
  forcedMode,
}: {
  subjects: SubjectComparison[];
  history: HistoryRow[];
  progressHistory?: ProgressRow[];
  period: string;
  peers: PeerSchoolsBundle;
  data: SchoolMonitorData;
  sipTargets: SipTargetsBundle;
  embedded?: boolean;
  forcedMode?: ChartViewMode;
}) {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<ChartViewMode>(forcedMode ?? "compare");
  const [subject, setSubject] = useState<SubjectOption>(
    "Reading, writing and maths",
  );
  const [metric, setMetric] = useState<"expected" | "higher">("expected");
  const [showHampshire, setShowHampshire] = useState(true);
  const [showEngland, setShowEngland] = useState(true);
  const [showSipTargets, setShowSipTargets] = useState(
    sipTargets.enabledByDefault,
  );
  const [peerOverlay, setPeerOverlay] =
    useState<PeerOverlaySelection>("none");

  useEffect(() => {
    if (forcedMode) {
      setMode(forcedMode);
      return;
    }
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
    } else if (
      peerParam &&
      peers.peers.some(
        (p) =>
          p.urn === peerParam ||
          p.short.toLowerCase() === peerParam.toLowerCase(),
      )
    ) {
      const match = peers.peers.find(
        (p) =>
          p.urn === peerParam ||
          p.short.toLowerCase() === peerParam.toLowerCase(),
      );
      if (match) setPeerOverlay(match.urn);
    }
  }, [searchParams, peers.peers, forcedMode]);

  // Science teacher assessment has no higher-standard measure in KS2 tables.
  const higherAvailable = subject !== "Science";
  useEffect(() => {
    if (!higherAvailable && metric === "higher") {
      setMetric("expected");
    }
  }, [higherAvailable, metric]);

  const syncUrl = (next: {
    mode?: ChartViewMode;
    subject?: SubjectOption;
    metric?: "expected" | "higher";
    peerOverlay?: PeerOverlaySelection;
  }) => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const nextMode = next.mode ?? mode;
    const nextSubject = next.subject ?? subject;
    const nextMetric = next.metric ?? metric;
    const nextPeer = next.peerOverlay ?? peerOverlay;
    url.searchParams.set("view", nextMode);
    url.searchParams.set("subject", subjectSlug(nextSubject));
    url.searchParams.set("metric", nextMetric);
    if (nextPeer === "none") url.searchParams.delete("peer");
    else url.searchParams.set("peer", nextPeer);
    window.history.replaceState(
      {},
      "",
      `${url.pathname}${url.search}${url.hash || "#charts"}`,
    );
  };

  const changeMode = (next: ChartViewMode) => {
    setMode(next);
    syncUrl({ mode: next });
  };

  const changeSubject = (next: SubjectOption) => {
    setSubject(next);
    syncUrl({ subject: next });
  };

  const changeMetric = (next: "expected" | "higher") => {
    setMetric(next);
    syncUrl({ metric: next });
  };

  const changePeerOverlay = (next: PeerOverlaySelection) => {
    setPeerOverlay(next);
    syncUrl({ peerOverlay: next });
  };

  const subjectHistory = useMemo(
    () => history.filter((row) => row.subject === subject),
    [history, subject],
  );
  const hasScaled = subjectHistory.some((row) => row.schoolScaled !== null);
  const activeMetric = higherAvailable ? metric : "expected";
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
        activeMetric === "higher" ? "higher" : "expected",
      ),
    [peers, peerOverlay, subject, activeMetric],
  );
  const peerScaledByPeriod = useMemo(
    () => peerMetricByPeriod(peers, peerOverlay, subject, "scaled"),
    [peers, peerOverlay, subject],
  );
  const peerCompareValue = peerLatestValue(
    peers,
    peerOverlay,
    subject,
    activeMetric === "higher" ? "higher" : "expected",
  );

  const body = (
    <>
      {!embedded ? (
        <div className="section-head">
          <h2>KS2 performance charts</h2>
          <p>
            {mode === "compare"
              ? `Key Stage 2 · latest year (${period.replace("/", "–")}) — Bartley against Hampshire and England. Optionally overlay a top local junior peer or the peer average.`
              : "Key Stage 2 year-on-year history. Overlay Hampshire, England, and a selected junior peer school or peer average with the controls below. The hatched COVID band marks unpublished 2019/20–2021/22 performance-table years."}
          </p>
        </div>
      ) : null}

      {!embedded && !forcedMode ? (
        <div className="chart-view-toggle" role="group" aria-label="Chart view">
          <button
            type="button"
            className={mode === "compare" ? "history-tab active" : "history-tab"}
            onClick={() => changeMode("compare")}
            aria-pressed={mode === "compare"}
          >
            Latest vs Hampshire / England
          </button>
          <button
            type="button"
            className={mode === "history" ? "history-tab active" : "history-tab"}
            onClick={() => changeMode("history")}
            aria-pressed={mode === "history"}
          >
            Year-on-year history
          </button>
        </div>
      ) : null}

        <div className="history-tabs" role="tablist" aria-label="Subject">
          {SUBJECTS.map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={subject === item}
              className={subject === item ? "history-tab active" : "history-tab"}
              onClick={() => changeSubject(item)}
            >
              {shortSubject(item)}
            </button>
          ))}
        </div>

        <div className="metric-toggle" role="group" aria-label="Metric">
          <button
            type="button"
            className={
              activeMetric === "expected" ? "history-tab active" : "history-tab"
            }
            onClick={() => changeMetric("expected")}
          >
            Expected standard
          </button>
          <button
            type="button"
            className={
              activeMetric === "higher" ? "history-tab active" : "history-tab"
            }
            onClick={() => changeMetric("higher")}
            disabled={!higherAvailable}
            title={
              higherAvailable
                ? "Show higher standard"
                : "Science has no higher-standard measure in KS2 tables"
            }
          >
            Higher standard
          </button>
        </div>
        {!higherAvailable ? (
          <p className="chart-note muted">
            Science is teacher assessment at the expected standard only — there
            is no higher-standard measure to chart.
          </p>
        ) : null}

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
              onChange={() => changePeerOverlay("none")}
            />
            <span>None</span>
          </label>
          <label className="overlay-check">
            <input
              type="radio"
              name="peer-overlay"
              checked={peerOverlay === "average"}
              onChange={() => changePeerOverlay("average")}
            />
            <span>Peer average</span>
          </label>
          {peers.peers.map((school) => (
            <label key={school.urn} className="overlay-check">
              <input
                type="radio"
                name="peer-overlay"
                checked={peerOverlay === school.urn}
                onChange={() => changePeerOverlay(school.urn)}
              />
              <span>{school.short}</span>
            </label>
          ))}
        </div>

        {mode === "compare" ? (
          <>
            <SubjectComparisonChart
              subjects={subjects.filter((row) => row.subject === subject)}
              metric={activeMetric}
              focused
              peerValue={peerCompareValue}
              peerSeriesName={peerLabel}
            />
            <ComparisonTable
              subjects={subjects.filter((row) => row.subject === subject)}
              metric={activeMetric}
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
              {sipTargets.targets.some(
                (t) => t.subject === subject && t.metric === activeMetric,
              ) ? (
                <label className="overlay-check">
                  <input
                    type="checkbox"
                    checked={showSipTargets}
                    onChange={(event) =>
                      setShowSipTargets(event.target.checked)
                    }
                  />
                  <span>Overlay SIP target</span>
                </label>
              ) : null}
            </div>

            <HistoryTrendChart
              history={history}
              subject={subject}
              metric={activeMetric === "higher" ? "higher" : "expected"}
              seriesMode="bartley"
              showHampshire={showHampshire}
              showEngland={showEngland}
              peerByPeriod={peerOverlay === "none" ? undefined : peerByPeriod}
              peerSeriesName={peerLabel}
              sipTargets={sipTargets.targets}
              showSipTargets={showSipTargets}
            />
            <HistoryTable history={history} subject={subject} />

            {hasScaled ? (
              <>
                <div className="section-head stacked">
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
                  sipTargets={sipTargets.targets}
                  showSipTargets={showSipTargets}
                />
              </>
            ) : null}

            {progressForSubject.length ? (
              <>
                <div className="section-head stacked">
                  <h3>Junior value-added (KS1–KS2 progress)</h3>
                  <p>
                    Published KS1–KS2 progress scores for Bartley — junior
                    school value-added, not infant or secondary measures.
                  </p>
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
    </>
  );

  if (embedded) {
    return (
      <div className="monitor-panel-body monitor-charts-panel">
        {body}
        {!forcedMode ? (
          <ViewModeDock mode={mode} onChange={changeMode} />
        ) : null}
      </div>
    );
  }

  return (
    <section className="section section-alt" id="charts">
      <div className="shell">
        {body}
      </div>
      <ViewModeDock mode={mode} onChange={changeMode} />
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
  sipTargets: SipTargetsBundle;
  embedded?: boolean;
  forcedMode?: ChartViewMode;
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
