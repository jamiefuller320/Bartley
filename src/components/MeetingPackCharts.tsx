"use client";

import type { PeerSchoolsBundle, SchoolMonitorData } from "@/lib/types";
import { HistoryTrendChart } from "@/components/HistoryTrendChart";
import { EquityChart } from "@/components/EquityChart";
import { PeerComparisonTable } from "@/components/PeerComparisonTable";
import { peerMetricByPeriod, PEER_AVERAGE_LABEL } from "@/lib/peers";

/** Fixed chart set for printed governor packs (also visible on screen). */
export function MeetingPackCharts({
  data,
  peers,
}: {
  data: SchoolMonitorData;
  peers: PeerSchoolsBundle;
}) {
  const peerByPeriod = peerMetricByPeriod(
    peers,
    "average",
    "Reading, writing and maths",
    "expected",
  );

  return (
    <section className="section meeting-pack-charts" id="meeting-charts">
      <div className="shell">
        <div className="section-intro">
          <h2>Meeting pack charts</h2>
          <p>
            Fixed evidence pages for board packs: RWM trend (with peer average),
            latest equity gaps, and the peer comparison table.
          </p>
        </div>

        <div className="print-chart-block">
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
        </div>

        <div className="print-chart-block">
          <h3>Latest equity gaps</h3>
          <EquityChart equity={data.equity} profile={data.profile} />
        </div>

        <div className="print-chart-block">
          <h3>Peer comparison</h3>
          <PeerComparisonTable peers={peers} bartley={data} />
        </div>
      </div>
    </section>
  );
}
