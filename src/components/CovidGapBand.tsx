"use client";

import { useId } from "react";
import { usePlotArea, useXAxisScale } from "recharts";
import { COVID_GAP_LABEL } from "@/lib/covid-gap";

/**
 * Draws a hatched band over the single COVID gap category.
 * Uses Recharts 3 scale hooks so the band spans exactly one year-slot
 * (same spacing as neighbouring year ticks) and always paints.
 */
export function CovidGapBand({
  gapLabel = COVID_GAP_LABEL,
  areaLabel = "COVID gap",
}: {
  gapLabel?: string;
  areaLabel?: string;
}) {
  const plotArea = usePlotArea();
  const xScale = useXAxisScale();
  const reactId = useId().replace(/:/g, "");
  const clipId = `covid-gap-clip-${reactId}`;

  if (!plotArea || !xScale) return null;

  const xStart = xScale(gapLabel, { position: "start" });
  const xEnd = xScale(gapLabel, { position: "end" });
  if (xStart == null || xEnd == null) return null;

  const x = Math.min(xStart, xEnd);
  const width = Math.abs(xEnd - xStart);
  if (width <= 0) return null;

  const y = plotArea.y;
  const height = plotArea.height;
  const spacing = 7;
  const lines: React.ReactNode[] = [];
  for (let i = -height; i < width + height; i += spacing) {
    lines.push(
      <line
        key={i}
        x1={x + i}
        y1={y + height}
        x2={x + i + height}
        y2={y}
        stroke="rgba(27, 67, 50, 0.4)"
        strokeWidth={1.75}
      />,
    );
  }

  return (
    <g className="covid-gap-hatch" aria-label={areaLabel}>
      <defs>
        <clipPath id={clipId}>
          <rect x={x} y={y} width={width} height={height} />
        </clipPath>
      </defs>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill="rgba(27, 67, 50, 0.08)"
        stroke="rgba(27, 67, 50, 0.4)"
        strokeWidth={1}
        strokeDasharray="3 2"
      />
      <g clipPath={`url(#${clipId})`}>{lines}</g>
      <text
        x={x + width / 2}
        y={y + height / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#3d5248"
        fontSize={11}
        fontStyle="italic"
        fontWeight={600}
        style={{ pointerEvents: "none" }}
      >
        {areaLabel}
      </text>
    </g>
  );
}

/** X-axis tick: gap category keeps equal spacing; quiet mark under the band. */
export function CovidAwareYearTick(props: {
  x?: number;
  y?: number;
  payload?: { value?: string };
  gapLabel?: string;
}) {
  const { x = 0, y = 0, payload, gapLabel = COVID_GAP_LABEL } = props;
  const value = payload?.value ?? "";
  const isGap = value === gapLabel;
  return (
    <text
      x={x}
      y={y + 12}
      textAnchor="middle"
      fill={isGap ? "#6b7f74" : "#3d5248"}
      fontSize={isGap ? 10 : 12}
      fontStyle={isGap ? "italic" : undefined}
    >
      {isGap ? "…" : value}
    </text>
  );
}
