"use client";

import Link from "next/link";
import type { SchoolMonitorPack } from "@/lib/monitorPack";
import type { MonitorPanelId } from "@/lib/monitorSections";
import { scorecard } from "@/lib/evaluate";
import {
  fmtPctWithN,
  groupCount,
  threeYearRwm,
  volatilityNote,
  yearOnYear,
} from "@/lib/board";
import { fmtPct, fmtPp } from "@/lib/format";
import { schoolOfferingLabel } from "@/lib/schoolOffering";
import { FindingsList } from "@/components/FindingsList";
import { EquityChart } from "@/components/EquityChart";
import { EquityHistoryChart } from "@/components/EquityHistoryChart";
import { ProgressChart } from "@/components/ProgressChart";
import { CohortProfile } from "@/components/CohortProfile";
import { MetricsWorkbench } from "@/components/MetricsWorkbench";
import { PeerComparisonTable } from "@/components/PeerComparisonTable";
import { ChangeLogCard } from "@/components/ChangeLogCard";
import { SipPrioritiesCard } from "@/components/SipPrioritiesCard";
import { FeederSchoolsSection } from "@/components/FeederSchoolsSection";
import { GlossaryPanel } from "@/components/GlossaryPanel";

export function MonitorPanelContent({
  panel,
  pack,
}: {
  panel: MonitorPanelId;
  pack: SchoolMonitorPack;
}) {
  const { data, peers, feeders, changeLog, sipTargets, summary } = pack;
  const score = scorecard(data.subjects);
  const rwm = data.subjects.find(
    (s) => s.subject === "Reading, writing and maths",
  );
  const history = data.history ?? [];
  const progressHistory = data.progressHistory ?? [];
  const rolling = threeYearRwm(data.threeYear);
  const cohortN = groupCount(data.profile, "All pupils");
  const yoy = yearOnYear(history, "Reading, writing and maths");
  const volatility = volatilityNote(cohortN);

  switch (panel) {
    case "summary-overview":
      return (
        <div className="monitor-panel-body">
          <div className="snapshot-row" role="list">
            {summary.headlineMetrics.map((metric) => (
              <div key={metric.label} className="snapshot-metric" role="listitem">
                <span className="snapshot-label">{metric.label}</span>
                <strong>{metric.value}</strong>
                {metric.delta ? (
                  <span
                    className={
                      metric.deltaTone === "up"
                        ? "metric-delta delta-up"
                        : metric.deltaTone === "down"
                          ? "metric-delta delta-down"
                          : "metric-delta delta-flat"
                    }
                  >
                    {metric.delta}
                  </span>
                ) : null}
                <span className="snapshot-sub">{metric.detail}</span>
              </div>
            ))}
          </div>
          {summary.volatilityNote ? (
            <p className="volatility-note">{summary.volatilityNote}</p>
          ) : null}
          <div className="exec-grid">
            <div className="exec-panel">
              <h3>Top risks</h3>
              <ol className="exec-list">
                {summary.risks.map((risk) => (
                  <li key={risk}>{risk}</li>
                ))}
              </ol>
            </div>
            <div className="exec-panel">
              <h3>Ask first</h3>
              <ol className="exec-list">
                {summary.questions.map((question) => (
                  <li key={question}>{question}</li>
                ))}
              </ol>
            </div>
          </div>
          <p className="exec-links">
            Jump to evidence:{" "}
            {summary.chartLinks.map((link, index) => (
              <span key={link.href}>
                {index > 0 ? " · " : null}
                <Link href={link.href}>{link.label}</Link>
              </span>
            ))}
            {" · "}
            <Link href="/analysis">Full governor analysis</Link>
          </p>
        </div>
      );

    case "summary-changes":
      return <ChangeLogCard changeLog={changeLog} embedded />;

    case "summary-sip":
      return <SipPrioritiesCard sip={sipTargets} embedded />;

    case "findings-snapshot":
      return (
        <div className="monitor-panel-body">
          <div className="snapshot-row" role="list">
            <div className="snapshot-metric" role="listitem">
              <span className="snapshot-label">RWM expected</span>
              <strong>{fmtPctWithN(score.rwmExpected, cohortN)}</strong>
              {yoy.delta != null ? (
                <span
                  className={
                    yoy.delta >= 1
                      ? "metric-delta delta-up"
                      : yoy.delta <= -1
                        ? "metric-delta delta-down"
                        : "metric-delta delta-flat"
                  }
                >
                  {fmtPp(yoy.delta)} vs prior year
                </span>
              ) : null}
              <span className="snapshot-sub">
                England {fmtPct(rwm?.englandExpected)} · Hampshire{" "}
                {fmtPct(rwm?.hampshireExpected)}
              </span>
            </div>
            <div className="snapshot-metric" role="listitem">
              <span className="snapshot-label">RWM higher standard</span>
              <strong>{fmtPctWithN(rwm?.schoolHigher, cohortN)}</strong>
              <span className="snapshot-sub">
                England {fmtPct(rwm?.englandHigher)} · Hampshire{" "}
                {fmtPct(rwm?.hampshireHigher)}
              </span>
            </div>
            <div className="snapshot-metric" role="listitem">
              <span className="snapshot-label">3-year RWM average</span>
              <strong>{fmtPct(rolling.expected)}</strong>
              <span className="snapshot-sub">
                {rolling.topic ?? "DfE published 3-year average"}
                {data.profile.threeYearEligible != null
                  ? ` · of ${data.profile.threeYearEligible}`
                  : ""}
              </span>
            </div>
            <div className="snapshot-metric" role="listitem">
              <span className="snapshot-label">Year 6 pupils</span>
              <strong>{data.profile.pupilsAged11 ?? "—"}</strong>
              <span className="snapshot-sub">
                {data.profile.localAuthority} · URN {data.profile.urn}
              </span>
            </div>
          </div>
          {volatility ? <p className="volatility-note">{volatility}</p> : null}
        </div>
      );

    case "findings-list":
      return (
        <div className="monitor-panel-body">
          <FindingsList findings={data.findings} />
          <p className="analysis-cta">
            Prefer a written briefing for the board?{" "}
            <Link href="/analysis">Open the governor analysis and question set</Link>
            .
          </p>
        </div>
      );

    case "charts-latest":
      return (
        <MetricsWorkbench
          embedded
          forcedMode="compare"
          subjects={data.subjects}
          history={history}
          progressHistory={progressHistory}
          period={data.period}
          peers={peers}
          data={data}
          sipTargets={sipTargets}
        />
      );

    case "charts-history":
      return (
        <MetricsWorkbench
          embedded
          forcedMode="history"
          subjects={data.subjects}
          history={history}
          progressHistory={progressHistory}
          period={data.period}
          peers={peers}
          data={data}
          sipTargets={sipTargets}
        />
      );

    case "comparison-peers":
      return (
        <div className="monitor-panel-body">
          <div className="peer-strip" aria-label="Similar top-performing peers">
            <p className="peer-strip-lead">
              Top 3 similar-size juniors nearby (2024/25 RWM):{" "}
              {peers.peers
                .map(
                  (p) =>
                    `${p.short} (${schoolOfferingLabel(p.ageRange)}) ${fmtPct(p.latest.rwmExpected)} (of ${p.latest.eligiblePupils ?? "—"})`,
                )
                .join(" · ")}
              . Peer average {fmtPct(peers.peerAverageLatest.rwmExpected)}.
            </p>
            <p className="peer-strip-note muted">{peers.selection.method}</p>
            {peers.selection.sectorNote ? (
              <p className="peer-strip-note muted">{peers.selection.sectorNote}</p>
            ) : null}
          </div>
          <PeerComparisonTable peers={peers} bartley={data} />
        </div>
      );

    case "comparison-equity":
      return (
        <div className="monitor-panel-body">
          <EquityChart equity={data.equity} profile={data.profile} />
        </div>
      );

    case "comparison-equity-history":
      return (
        <div className="monitor-panel-body">
          <EquityHistoryChart equityHistory={data.equityHistory ?? []} />
        </div>
      );

    case "comparison-cohort":
      return (
        <div className="monitor-panel-body">
          <CohortProfile profile={data.profile} />
          <p className="profile-meta">
            {[
              data.profile.schoolTypeLabel,
              data.profile.religiousDenomination,
              data.profile.ageRange ? `Ages ${data.profile.ageRange}` : null,
              data.profile.address,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
      );

    case "comparison-progress":
      return (
        <div className="monitor-panel-body">
          <ProgressChart progress={data.progress} />
        </div>
      );

    case "comparison-feeders":
      return <FeederSchoolsSection feeders={feeders} embedded />;

    case "reference-glossary":
      return <GlossaryPanel embedded />;

    case "reference-source":
      return (
        <div className="monitor-panel-body source-block">
          <p>{data.source.note}</p>
          <ul className="source-list">
            <li>
              <a href={data.source.primarySite} target="_blank" rel="noreferrer">
                Compare school and college performance — {data.profile.name}
              </a>
            </li>
            <li>
              <a
                href="https://explore-education-statistics.service.gov.uk/find-statistics/key-stage-2-attainment"
                target="_blank"
                rel="noreferrer"
              >
                {data.source.release}
              </a>
            </li>
            <li>
              <a href={data.source.api} target="_blank" rel="noreferrer">
                Explore education statistics API
              </a>
            </li>
          </ul>
          <p className="muted">
            Dataset last refreshed:{" "}
            {data.source.refreshedAt
              ? new Date(data.source.refreshedAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : "date not recorded"}
            . SIP priorities and chart ambitions are edited on the{" "}
            <Link href="/data-entry">manual data entry</Link> page.
          </p>
        </div>
      );

    default:
      return null;
  }
}
