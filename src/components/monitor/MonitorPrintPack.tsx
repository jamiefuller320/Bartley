"use client";

import type { SchoolMonitorPack } from "@/lib/monitorPack";
import { HistoryTrendChart } from "@/components/HistoryTrendChart";
import { EquityChart } from "@/components/EquityChart";
import { PeerComparisonTable } from "@/components/PeerComparisonTable";
import { FindingsList } from "@/components/FindingsList";
import { peerMetricByPeriod, PEER_AVERAGE_LABEL } from "@/lib/peers";

/** Printable board pack — mirrors Comparison-tool visit pack layout. */
export function MonitorPrintPack({ pack }: { pack: SchoolMonitorPack }) {
  const { data, peers, summary } = pack;
  const peerByPeriod = peerMetricByPeriod(
    peers,
    "average",
    "Reading, writing and maths",
    "expected",
  );
  const period = data.period.replace("/", "–");

  return (
    <div
      className="monitor-print-pack-anchor"
      data-monitor-pack="board"
    >
      <div className="monitor-print-pack visit-pack">
        <div className="monitor-pack-sheet visit-pack-sheet">
          <header className="monitor-pack-head visit-pack-head">
            <p className="monitor-pack-kicker">Bartley Insight · board pack</p>
            <h2>{data.profile.name}</h2>
            <p>
              Key Stage 2 monitor · academic year {period}
              {data.source.refreshedAt
                ? ` · refreshed ${data.source.refreshedAt}`
                : ""}
            </p>
          </header>

          <section className="monitor-pack-section">
            <h3>Executive summary</h3>
            <div className="snapshot-row" role="list">
              {summary.headlineMetrics.map((metric) => (
                <div key={metric.label} className="snapshot-metric" role="listitem">
                  <span className="snapshot-label">{metric.label}</span>
                  <strong>{metric.value}</strong>
                  {metric.delta ? (
                    <span className="metric-delta">{metric.delta}</span>
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
                <h4>Top risks</h4>
                <ol className="exec-list">
                  {summary.risks.map((risk) => (
                    <li key={risk}>{risk}</li>
                  ))}
                </ol>
              </div>
              <div className="exec-panel">
                <h4>Ask first</h4>
                <ol className="exec-list">
                  {summary.questions.map((question) => (
                    <li key={question}>{question}</li>
                  ))}
                </ol>
              </div>
            </div>
          </section>

          <section className="monitor-pack-section">
            <h3>Evaluation findings</h3>
            <FindingsList findings={data.findings.slice(0, 6)} />
          </section>
        </div>

        <div className="monitor-pack-sheet visit-pack-sheet">
          <section className="monitor-pack-section print-chart-block">
            <h3>Combined RWM over time</h3>
            <HistoryTrendChart
              history={data.history ?? []}
              subject="Reading, writing and maths"
              metric="expected"
              seriesMode="bartley"
              showHampshire
              showEngland
              peerByPeriod={peerByPeriod}
              peerSeriesName={PEER_AVERAGE_LABEL}
            />
          </section>
        </div>

        <div className="monitor-pack-sheet visit-pack-sheet">
          <section className="monitor-pack-section print-chart-block">
            <h3>Latest equity gaps</h3>
            <EquityChart equity={data.equity} profile={data.profile} />
          </section>

          <section className="monitor-pack-section">
            <h3>Peer comparison</h3>
            <PeerComparisonTable peers={peers} bartley={data} />
          </section>
        </div>
      </div>
    </div>
  );
}
