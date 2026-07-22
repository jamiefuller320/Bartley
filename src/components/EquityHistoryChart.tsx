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
import {
  COVID_GAP_LABEL,
  COVID_GAP_NOTE,
  withHalfWidthCovidGap,
} from "@/lib/covid-gap";
import {
  CovidAwareYearTick,
  CovidGapBand,
} from "@/components/CovidGapBand";

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

type EquityPoint = {
  year: string;
  Boys: number | null;
  Girls: number | null;
  Disadvantaged: number | null;
  "Not disadvantaged": number | null;
  gap?: boolean;
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

  const baseRows: EquityPoint[] = periods.map((period) => {
    const point: EquityPoint = {
      year: periodLabel(period),
      Boys: null,
      Girls: null,
      Disadvantaged: null,
      "Not disadvantaged": null,
      gap: false,
    };
    for (const group of GROUPS) {
      point[group] =
        equityHistory.find((row) => row.period === period && row.group === group)
          ?.expected ?? null;
    }
    return point;
  });

  const { rows, gapRange, tickLabels } = withHalfWidthCovidGap(
    baseRows,
    () => ({
      year: COVID_GAP_LABEL,
      Boys: null,
      Girls: null,
      Disadvantaged: null,
      "Not disadvantaged": null,
      gap: true as const,
    }),
  );

  if (!rows.some((row) => GROUPS.some((group) => row[group] != null))) {
    return <p className="muted">No published equity history available.</p>;
  }

  const domain = focusedDomain(domainValues(rows, [...GROUPS]), "percent");
  const xTicks = rows.map((row) => row.x);

  return (
    <div className="chart-frame">
      <p className="chart-note">
        Combined RWM by pupil group · axis {domain[0]}–{domain[1]}%
        {gapRange ? ` · ${COVID_GAP_NOTE}` : ""}
      </p>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={rows} margin={{ top: 8, right: 12, left: -8, bottom: 4 }}>
          <CartesianGrid stroke="rgba(27, 67, 50, 0.08)" vertical={false} />
          <XAxis
            type="number"
            dataKey="x"
            ticks={xTicks}
            domain={["dataMin", "dataMax"]}
            tick={<CovidAwareYearTick tickLabels={tickLabels} />}
            axisLine={false}
            tickLine={false}
            height={28}
            padding={{ left: 12, right: 12 }}
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
            labelFormatter={(label) => {
              const numeric = typeof label === "number" ? label : Number(label);
              const name = tickLabels.get(numeric);
              if (name === COVID_GAP_LABEL) {
                return "COVID gap (2019/20–2021/22)";
              }
              return name ?? String(label);
            }}
            contentStyle={{
              background: "#f4f8f5",
              border: "1px solid rgba(27,67,50,0.12)",
              borderRadius: 8,
            }}
          />
          <Legend />
          {gapRange ? (
            <CovidGapBand x0={gapRange.x0} x1={gapRange.x1} />
          ) : null}
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
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
