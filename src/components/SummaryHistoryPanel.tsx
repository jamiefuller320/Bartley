"use client";

import Link from "next/link";
import { buildPublishedYearChangeLog } from "@/lib/board";
import type { PeerSchoolsBundle, SchoolMonitorData } from "@/lib/types";
import { ChangeLogTable } from "@/components/ChangeLogTable";
import { HistoryTrendChart } from "@/components/HistoryTrendChart";
import { HistoryTable } from "@/components/HistoryTable";
import { peerMetricByPeriod, PEER_AVERAGE_LABEL } from "@/lib/peers";

export function SummaryHistoryPanel({
  data,
  peers,
}: {
  data: SchoolMonitorData;
  peers: PeerSchoolsBundle;
}) {
  const history = data.history ?? [];
  const publishedChanges = buildPublishedYearChangeLog(data, peers);
  const peerByPeriod = peerMetricByPeriod(
    peers,
    "average",
    "Reading, writing and maths",
    "expected",
  );

  return (
    <div className="monitor-panel-body">
      <div className="summary-history-section">
        <div className="section-head stacked">
          <h3>Latest year-on-year changes</h3>
          {publishedChanges.summary ? <p>{publishedChanges.summary}</p> : null}
        </div>
        {publishedChanges.items.length ? (
          <ChangeLogTable changeLog={publishedChanges} />
        ) : (
          <p className="muted">No year-on-year movement available.</p>
        )}
      </div>

      {history.length ? (
        <div className="summary-history-section">
          <div className="section-head stacked">
            <h3>Performance trends</h3>
            <p>
              Combined RWM expected standard over published performance-table
              years, with Hampshire, England, and peer-average overlays. The
              hatched COVID band marks unpublished 2019/20–2021/22 years.
            </p>
          </div>
          <HistoryTrendChart
            history={history}
            subject="Reading, writing and maths"
            metric="expected"
            seriesMode="bartley"
            showHampshire
            showEngland
            peerByPeriod={peerByPeriod}
            peerSeriesName={PEER_AVERAGE_LABEL}
          />
          <HistoryTable
            history={history}
            subject="Reading, writing and maths"
          />
        </div>
      ) : null}

      <p className="exec-links">
        Explore interactively:{" "}
        <Link href="/?chapter=charts&panel=charts-history">
          Full year-on-year charts
        </Link>
      </p>
    </div>
  );
}
