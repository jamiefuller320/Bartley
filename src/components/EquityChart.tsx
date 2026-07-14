"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { EquityRow, SchoolProfile } from "@/lib/types";
import { domainValues, focusedDomain } from "@/lib/chart-scale";
import { groupCount } from "@/lib/board";

export function EquityChart({
  equity,
  profile,
}: {
  equity: EquityRow[];
  profile?: SchoolProfile;
}) {
  const data = equity
    .filter((e) => e.expected !== null)
    .map((e) => {
      const count = profile ? groupCount(profile, e.group) : null;
      return {
        group: count != null ? `${e.group} (n=${count})` : e.group,
        expected: e.expected,
        higher: e.higher,
      };
    });

  const domain = focusedDomain(domainValues(data, ["expected"]), "percent");

  return (
    <div className="chart-frame">
      <p className="chart-note">
        Axis range {domain[0]}–{domain[1]}% (zoomed to group differences).
        Pupil counts (n) are the latest assessed cohort denominators.
      </p>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
        >
          <CartesianGrid stroke="rgba(27, 67, 50, 0.08)" horizontal={false} />
          <XAxis
            type="number"
            domain={domain}
            allowDataOverflow
            tickFormatter={(v) => `${v}%`}
            tick={{ fill: "#3d5248", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="group"
            width={148}
            tick={{ fill: "#14261d", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
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
          <Bar
            dataKey="expected"
            name="Expected standard"
            fill="#2d6a4f"
            radius={[0, 4, 4, 0]}
            barSize={22}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
