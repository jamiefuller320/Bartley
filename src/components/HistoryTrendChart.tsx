"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { HistoryRow } from "@/lib/types";
import { domainValues, focusedDomain } from "@/lib/chart-scale";

function periodLabel(period: string): string {
  const [a, b] = period.split("/");
  return b && b.length === 4 ? `${a}/${b.slice(2)}` : period;
}

export function HistoryTrendChart({
  history,
  subject = "Reading, writing and maths",
  metric = "expected",
  seriesMode = "compare",
  showHampshire = true,
  showEngland = true,
}: {
  history: HistoryRow[];
  subject?: string;
  metric?: "expected" | "scaled" | "higher";
  seriesMode?: "compare" | "bartley";
  showHampshire?: boolean;
  showEngland?: boolean;
}) {
  const overlayHampshire = seriesMode === "compare" || showHampshire;
  const overlayEngland = seriesMode === "compare" || showEngland;

  const rows = history
    .filter((h) => h.subject === subject)
    .sort((a, b) => a.period.localeCompare(b.period))
    .map((h) => ({
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
            ? h.hampshireHigher
            : h.hampshireScaled,
      England:
        metric === "expected"
          ? h.englandExpected
          : metric === "higher"
            ? h.englandHigher
            : h.englandScaled,
    }))
    .filter((r) => {
      if (r.Bartley !== null) return true;
      if (overlayHampshire && r.Hampshire !== null) return true;
      if (overlayEngland && r.England !== null) return true;
      return false;
    });

  if (!rows.length) {
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
  ];
  const domain = focusedDomain(domainValues(rows, keys), kind);
  const isPct = metric !== "scaled";

  return (
    <div className="chart-frame">
      <p className="chart-note">
        Axis range {domain[0]}
        {isPct ? "%" : ""}–{domain[1]}
        {isPct ? "%" : ""} (zoomed to the values on display).
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
          <Line
            type="monotone"
            dataKey="Bartley"
            stroke="#1b4332"
            strokeWidth={3}
            dot={{ r: 4, fill: "#1b4332" }}
            connectNulls
          />
          {overlayHampshire ? (
            <Line
              type="monotone"
              dataKey="Hampshire"
              stroke="#52796f"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={{ r: 3, fill: "#52796f" }}
              connectNulls
            />
          ) : null}
          {overlayEngland ? (
            <Line
              type="monotone"
              dataKey="England"
              stroke="#c9a227"
              strokeWidth={2}
              dot={{ r: 3, fill: "#c9a227" }}
              connectNulls
            />
          ) : null}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
