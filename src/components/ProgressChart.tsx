"use client";

import {
  CartesianGrid,
  ErrorBar,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts";
import type { ProgressRow } from "@/lib/types";
import { focusedDomain } from "@/lib/chart-scale";

export function ProgressChart({ progress }: { progress: ProgressRow[] }) {
  if (!progress.length) {
    return (
      <p className="muted">
        Progress measures are not available for recent cohorts because KS1
        baselines were disrupted by COVID-19.
      </p>
    );
  }

  const data = progress.map((p) => ({
    subject: p.subject,
    score: p.score,
    error:
      p.lower !== null && p.upper !== null && p.score !== null
        ? [p.score - p.lower, p.upper - p.score]
        : [0, 0],
    period: p.period,
  }));

  const domain = focusedDomain(
    progress.flatMap((p) => [p.score, p.lower, p.upper]),
    "progress",
  );

  return (
    <div className="chart-frame">
      <p className="chart-note">
        Axis range {domain[0]} to {domain[1]} (zoomed around published scores).
      </p>
      <ResponsiveContainer width="100%" height={280}>
        <ScatterChart margin={{ top: 16, right: 16, left: 8, bottom: 8 }}>
          <CartesianGrid stroke="rgba(27, 67, 50, 0.08)" />
          <XAxis
            type="category"
            dataKey="subject"
            allowDuplicatedCategory={false}
            tick={{ fill: "#3d5248", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="number"
            dataKey="score"
            domain={domain}
            allowDataOverflow
            tick={{ fill: "#3d5248", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <ReferenceLine y={0} stroke="#c9a227" strokeDasharray="4 4" />
          <Tooltip
            formatter={(value) =>
              typeof value === "number" ? value.toFixed(1) : "—"
            }
            contentStyle={{
              background: "#f4f8f5",
              border: "1px solid rgba(27,67,50,0.12)",
              borderRadius: 8,
            }}
          />
          <Scatter data={data} fill="#1b4332">
            <ErrorBar dataKey="error" width={6} stroke="#52796f" />
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      <p className="chart-note">
        Last published progress scores ({data[0]?.period ?? "prior year"}) with
        95% confidence intervals. Scores around zero are broadly average.
      </p>
    </div>
  );
}
