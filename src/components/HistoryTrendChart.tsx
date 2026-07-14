"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { HistoryRow } from "@/lib/types";
import type { SipTarget } from "@/lib/board";
import { domainValues, focusedDomain } from "@/lib/chart-scale";

function periodLabel(period: string): string {
  const [a, b] = period.split("/");
  return b && b.length === 4 ? `${a}/${b.slice(2)}` : period;
}

type ChartPoint = {
  year: string;
  Bartley: number | null;
  Hampshire: number | null;
  England: number | null;
  [key: string]: string | number | null | boolean | undefined;
};

/** Insert a labelled COVID gap between published years so lines do not imply continuity. */
function withCovidGap(rows: ChartPoint[]): ChartPoint[] {
  const out: ChartPoint[] = [];
  for (let i = 0; i < rows.length; i += 1) {
    out.push(rows[i]);
    const next = rows[i + 1];
    if (!next) continue;
    const a = parseInt(String(rows[i].year).split("/")[0], 10);
    const b = parseInt(String(next.year).split("/")[0], 10);
    if (!Number.isNaN(a) && !Number.isNaN(b) && b - a > 1) {
      out.push({
        year: "19–22*",
        Bartley: null,
        Hampshire: null,
        England: null,
        gap: true,
      });
    }
  }
  return out;
}

export function HistoryTrendChart({
  history,
  subject = "Reading, writing and maths",
  metric = "expected",
  seriesMode = "compare",
  showHampshire = true,
  showEngland = true,
  peerByPeriod,
  peerSeriesName,
  sipTargets = [],
  showSipTargets = false,
}: {
  history: HistoryRow[];
  subject?: string;
  metric?: "expected" | "scaled" | "higher";
  seriesMode?: "compare" | "bartley";
  showHampshire?: boolean;
  showEngland?: boolean;
  peerByPeriod?: Map<string, number | null>;
  peerSeriesName?: string | null;
  sipTargets?: SipTarget[];
  showSipTargets?: boolean;
}) {
  const overlayHampshire = seriesMode === "compare" || showHampshire;
  const overlayEngland = seriesMode === "compare" || showEngland;
  const overlayPeer = Boolean(peerSeriesName && peerByPeriod);
  const peerKey = peerSeriesName ?? "Peer";
  const activeTargets = showSipTargets
    ? sipTargets.filter((t) => t.subject === subject && t.metric === metric)
    : [];

  const baseRows = history
    .filter((h) => h.subject === subject)
    .sort((a, b) => a.period.localeCompare(b.period))
    .map((h) => {
      const point: ChartPoint = {
        year: periodLabel(h.period),
        Bartley:
          metric === "expected"
            ? h.schoolExpected
            : metric === "higher"
              ? h.schoolHigher
              : h.schoolScaled,
        Hampshire:
          metric === "expected"
            ? h.hampshireExpected
            : metric === "higher"
              ? (h.hampshireHigher ?? null)
              : (h.hampshireScaled ?? null),
        England:
          metric === "expected"
            ? h.englandExpected
            : metric === "higher"
              ? (h.englandHigher ?? null)
              : (h.englandScaled ?? null),
      };
      if (overlayPeer) {
        point[peerKey] = peerByPeriod?.get(h.period) ?? null;
      }
      return point;
    })
    .filter((r) => {
      if (r.Bartley !== null) return true;
      if (overlayHampshire && r.Hampshire !== null) return true;
      if (overlayEngland && r.England !== null) return true;
      if (overlayPeer && r[peerKey] !== null && r[peerKey] !== undefined) {
        return true;
      }
      return false;
    });

  const rows = withCovidGap(baseRows);

  if (!baseRows.length) {
    return (
      <p className="muted">
        No published {metric} figures for {subject} across recent years.
      </p>
    );
  }

  const kind = metric === "scaled" ? "scaled" : "percent";
  const keys = [
    "Bartley",
    ...(overlayHampshire ? ["Hampshire"] : []),
    ...(overlayEngland ? ["England"] : []),
    ...(overlayPeer ? [peerKey] : []),
  ];
  const targetValues = activeTargets.map((t) => t.value);
  const domain = focusedDomain(
    [...domainValues(rows, keys), ...targetValues],
    kind,
  );
  const isPct = metric !== "scaled";
  const hasGap = rows.some((row) => row.gap);

  return (
    <div className="chart-frame">
      <p className="chart-note">
        Axis range {domain[0]}
        {isPct ? "%" : ""}–{domain[1]}
        {isPct ? "%" : ""} (zoomed to the values on display).
        {hasGap
          ? " Break at 19–22* marks COVID years with no performance-table KS2 files — lines do not connect across that gap."
          : ""}
        {activeTargets.length
          ? ` SIP target line${activeTargets.length > 1 ? "s" : ""} shown for board ambition.`
          : ""}
      </p>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={rows} margin={{ top: 8, right: 12, left: -8, bottom: 8 }}>
          <CartesianGrid stroke="rgba(27, 67, 50, 0.08)" vertical={false} />
          <XAxis
            dataKey="year"
            tick={{ fill: "#3d5248", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#3d5248", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            domain={domain}
            allowDataOverflow
            tickFormatter={(v) => (isPct ? `${v}%` : String(v))}
          />
          <Tooltip
            formatter={(value) =>
              typeof value === "number"
                ? isPct
                  ? `${value}%`
                  : value.toFixed(0)
                : "—"
            }
            contentStyle={{
              background: "#f4f8f5",
              border: "1px solid rgba(27,67,50,0.12)",
              borderRadius: 8,
            }}
          />
          <Legend />
          {activeTargets.map((target) => (
            <ReferenceLine
              key={`${target.label}-${target.value}`}
              y={target.value}
              stroke="#9b2c2c"
              strokeDasharray="2 4"
              label={{
                value: `${target.label}${target.byPeriod ? ` (${periodLabel(target.byPeriod)})` : ""}`,
                fill: "#9b2c2c",
                fontSize: 11,
                position: "insideTopRight",
              }}
            />
          ))}
          <Line
            type="monotone"
            dataKey="Bartley"
            stroke="#1b4332"
            strokeWidth={3}
            dot={{ r: 4, fill: "#1b4332" }}
            connectNulls={false}
          />
          {overlayHampshire ? (
            <Line
              type="monotone"
              dataKey="Hampshire"
              stroke="#52796f"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={{ r: 3, fill: "#52796f" }}
              connectNulls={false}
            />
          ) : null}
          {overlayEngland ? (
            <Line
              type="monotone"
              dataKey="England"
              stroke="#c9a227"
              strokeWidth={2}
              dot={{ r: 3, fill: "#c9a227" }}
              connectNulls={false}
            />
          ) : null}
          {overlayPeer ? (
            <Line
              type="monotone"
              dataKey={peerKey}
              stroke="#0e7490"
              strokeWidth={2.5}
              strokeDasharray="6 3"
              dot={{ r: 3.5, fill: "#0e7490" }}
              connectNulls={false}
            />
          ) : null}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
