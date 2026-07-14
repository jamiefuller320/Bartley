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
import { domainValues, focusedDomain } from "@/lib/chart-scale";

export function SubjectComparisonChart({
  subjects,
  metric = "expected",
  focused = true,
  peerValue = null,
  peerSeriesName = null,
}: {
  subjects: SubjectComparison[];
  metric?: "expected" | "higher";
  focused?: boolean;
  peerValue?: number | null;
  peerSeriesName?: string | null;
}) {
  const peerKey = peerSeriesName ?? "Peer";
  const showPeer = Boolean(peerSeriesName && peerValue !== null);

  const data = subjects
    .filter((s) =>
      metric === "expected"
        ? s.schoolExpected !== null
        : s.schoolHigher !== null,
    )
    .map((s) => ({
      subject: shortSubject(s.subject),
      Bartley: metric === "expected" ? s.schoolExpected : s.schoolHigher,
      Hampshire:
        metric === "expected" ? s.hampshireExpected : s.hampshireHigher,
      England: metric === "expected" ? s.englandExpected : s.englandHigher,
      ...(showPeer ? { [peerKey]: peerValue } : {}),
    }));

  const keys = [
    "Bartley",
    "Hampshire",
    "England",
    ...(showPeer ? [peerKey] : []),
  ];
  const domain = focused
    ? focusedDomain(domainValues(data, keys), "percent")
    : ([0, 100] as [number, number]);

  return (
    <div className="chart-frame">
      <p className="chart-note">
        Axis range {domain[0]}–{domain[1]}% (zoomed to the values on display).
      </p>
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
            domain={domain}
            tickFormatter={(v) => `${v}%`}
            allowDataOverflow
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
          <Bar dataKey="Bartley" fill="#1b4332" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Hampshire" fill="#52796f" radius={[4, 4, 0, 0]} />
          <Bar dataKey="England" fill="#c9a227" radius={[4, 4, 0, 0]} />
          {showPeer ? (
            <Bar dataKey={peerKey} fill="#0e7490" radius={[4, 4, 0, 0]} />
          ) : null}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
