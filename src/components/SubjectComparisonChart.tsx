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
import type { SubjectComparison } from "@/lib/types";
import { shortSubject } from "@/lib/format";

export function SubjectComparisonChart({
  subjects,
  metric = "expected",
}: {
  subjects: SubjectComparison[];
  metric?: "expected" | "higher";
}) {
  const data = subjects
    .filter((s) =>
      metric === "expected"
        ? s.schoolExpected !== null
        : s.schoolHigher !== null,
    )
    .map((s) => ({
      subject: shortSubject(s.subject),
      School:
        metric === "expected" ? s.schoolExpected : s.schoolHigher,
      Hampshire:
        metric === "expected" ? s.hampshireExpected : s.hampshireHigher,
      England:
        metric === "expected" ? s.englandExpected : s.englandHigher,
    }));

  return (
    <div className="chart-frame">
      <ResponsiveContainer width="100%" height={340}>
        <BarChart
          data={data}
          margin={{ top: 8, right: 8, left: -8, bottom: 8 }}
          barCategoryGap="18%"
        >
          <CartesianGrid stroke="rgba(27, 67, 50, 0.08)" vertical={false} />
          <XAxis
            dataKey="subject"
            tick={{ fill: "#3d5248", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#3d5248", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            domain={[0, 100]}
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
              color: "#14261d",
            }}
          />
          <Legend />
          <Bar dataKey="School" fill="#1b4332" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Hampshire" fill="#52796f" radius={[4, 4, 0, 0]} />
          <Bar dataKey="England" fill="#c9a227" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
