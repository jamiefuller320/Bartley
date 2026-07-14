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
import type { EquityHistoryRow } from "@/lib/types";
import { domainValues, focusedDomain } from "@/lib/chart-scale";

function periodLabel(period: string): string {
  const [a, b] = period.split("/");
  return b && b.length === 4 ? `${a}/${b.slice(2)}` : period;
}

const GROUPS = ["Boys", "Girls", "Disadvantaged", "Not disadvantaged"] as const;
const COLORS: Record<(typeof GROUPS)[number], string> = {
  Boys: "#1b4332",
  Girls: "#2d6a4f",
  Disadvantaged: "#9b2c2c",
  "Not disadvantaged": "#0e7490",
};

export function EquityHistoryChart({
  equityHistory,
}: {
  equityHistory: EquityHistoryRow[];
}) {
  const periods = [
    ...new Set(
      equityHistory
        .filter((row) => GROUPS.includes(row.group as (typeof GROUPS)[number]))
        .map((row) => row.period),
    ),
  ].sort();

  const withGap: string[] = [];
  for (let i = 0; i < periods.length; i += 1) {
    withGap.push(periods[i]);
    const year = Number(periods[i].slice(0, 4));
    const next = periods[i + 1];
    if (next && Number(next.slice(0, 4)) - year > 1) {
      withGap.push("__covid_gap__");
    }
  }

  const rows = withGap.map((period) => {
    if (period === "__covid_gap__") {
      return {
        year: "19–22*",
        Boys: null,
        Girls: null,
        Disadvantaged: null,
        "Not disadvantaged": null,
        gap: true,
      };
    }
    const point: Record<string, string | number | boolean | null> = {
      year: periodLabel(period),
      gap: false,
    };
    for (const group of GROUPS) {
      point[group] =
        equityHistory.find((row) => row.period === period && row.group === group)
          ?.expected ?? null;
    }
    return point;
  });

  if (!rows.some((row) => GROUPS.some((group) => row[group] != null))) {
    return <p className="muted">No published equity history available.</p>;
  }

  const domain = focusedDomain(domainValues(rows, [...GROUPS]), "percent");

  return (
    <div className="chart-frame">
      <p className="chart-note">
        Combined RWM expected standard by pupil group. Axis {domain[0]}–
        {domain[1]}%. Gap marker 19–22* = COVID years not published in
        performance tables.
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
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            formatter={(value) =>
              typeof value === "number" ? `${value}%` : "—"
            }
            contentStyle={{
              background: "#f4f8f5",
              border: "1px solid rgba(27,67,50,0.12)",
              borderRadius: 8,
            }}
          />
          <Legend />
          {GROUPS.map((group) => (
            <Line
              key={group}
              type="monotone"
              dataKey={group}
              stroke={COLORS[group]}
              strokeWidth={group === "Boys" || group === "Disadvantaged" ? 3 : 2}
              strokeDasharray={
                group === "Disadvantaged" || group === "Not disadvantaged"
                  ? "5 4"
                  : undefined
              }
              dot={{ r: 3, fill: COLORS[group] }}
              connectNulls={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
