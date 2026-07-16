"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PhonicsBenchmarkRow } from "@/lib/types";

export function PhonicsBenchmarksChart({
  rows,
}: {
  rows: PhonicsBenchmarkRow[];
}) {
  const data = rows.map((r) => ({
    label: r.label,
    "Hampshire Y1": r.hampshireYear1,
    "England Y1": r.englandYear1,
    "Hampshire by end Y2": r.hampshireByEndYear2,
    "England by end Y2": r.englandByEndYear2,
  }));

  return (
    <div className="chart-frame" style={{ width: "100%", height: 300 }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(27, 67, 50, 0.12)" />
          <XAxis dataKey="label" tick={{ fill: "#3d5348", fontSize: 12 }} />
          <YAxis
            domain={[70, 100]}
            tick={{ fill: "#3d5348", fontSize: 12 }}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            formatter={(value) =>
              value == null ? "—" : `${Number(value).toFixed(0)}%`
            }
          />
          <Legend />
          <Bar dataKey="Hampshire Y1" fill="#1b4332" radius={[2, 2, 0, 0]} />
          <Bar dataKey="England Y1" fill="#95a99a" radius={[2, 2, 0, 0]} />
          <Bar
            dataKey="Hampshire by end Y2"
            fill="#c9a227"
            radius={[2, 2, 0, 0]}
          />
          <Bar
            dataKey="England by end Y2"
            fill="#d4c4a8"
            radius={[2, 2, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
