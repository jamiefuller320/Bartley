"use client";

import { useId } from "react";
import { ReferenceArea } from "recharts";
import { COVID_GAP_LABEL } from "@/lib/covid-gap";

type AreaShapeProps = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
};

function HatchedGapShape({
  x,
  y,
  width,
  height,
  label,
  clipId,
}: AreaShapeProps & { label: string; clipId: string }) {
  if (
    x == null ||
    y == null ||
    width == null ||
    height == null ||
    width <= 0 ||
    height <= 0
  ) {
    return null;
  }

  const spacing = 7;
  const lines: React.ReactNode[] = [];
  // Diagonal strokes clipped to the category band (same width as other years).
  for (let i = -height; i < width + height; i += spacing) {
    lines.push(
      <line
        key={i}
        x1={x + i}
        y1={y + height}
        x2={x + i + height}
        y2={y}
        stroke="rgba(27, 67, 50, 0.38)"
        strokeWidth={1.75}
      />,
    );
  }

  return (
    <g className="covid-gap-hatch" aria-label={label}>
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
        fill="rgba(27, 67, 50, 0.07)"
        stroke="rgba(27, 67, 50, 0.35)"
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
        {label}
      </text>
    </g>
  );
}

/**
 * One category-wide hatched band (same spacing as other year ticks)
 * with the label centred in the area.
 */
export function CovidGapReferenceArea({
  gapLabel = COVID_GAP_LABEL,
  areaLabel = "COVID gap",
}: {
  gapLabel?: string;
  areaLabel?: string;
}) {
  const clipId = useId().replace(/:/g, "");

  return (
    <ReferenceArea
      x1={gapLabel}
      x2={gapLabel}
      ifOverflow="visible"
      stroke="none"
      fill="none"
      fillOpacity={1}
      label={false}
      shape={(props: AreaShapeProps) => (
        <HatchedGapShape
          {...props}
          label={areaLabel}
          clipId={`covid-gap-clip-${clipId}`}
        />
      )}
    />
  );
}

/** X-axis tick: gap category uses the same slot; quieter label under the band. */
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
      {/* Keep a short axis label so the category retains equal year spacing. */}
      {isGap ? "…" : value}
    </text>
  );
}
