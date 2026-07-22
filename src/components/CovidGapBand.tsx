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
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width < 2 ||
    height < 2
  ) {
    return null;
  }

  const spacing = 6;
  const lines: React.ReactNode[] = [];
  for (let i = -height; i < width + height; i += spacing) {
    lines.push(
      <line
        key={i}
        x1={x + i}
        y1={y + height}
        x2={x + i + height}
        y2={y}
        stroke="rgba(27, 67, 50, 0.45)"
        strokeWidth={2}
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
        fill="rgba(27, 67, 50, 0.12)"
        stroke="rgba(27, 67, 50, 0.45)"
        strokeWidth={1.25}
        strokeDasharray="4 2"
      />
      <g clipPath={`url(#${clipId})`}>{lines}</g>
      <text
        x={x + width / 2}
        y={y + height / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#1b4332"
        fontSize={11}
        fontStyle="italic"
        fontWeight={700}
        style={{ pointerEvents: "none" }}
      >
        {label}
      </text>
    </g>
  );
}

/**
 * Hatched band between numeric x0→x1 (½ of a normal year step).
 * Uses ReferenceArea so Recharts resolves pixel width on a number axis
 * (line-chart category scales have no bandwidth, which previously hid the hatch).
 */
export function CovidGapBand({
  x0,
  x1,
  areaLabel = "COVID gap",
}: {
  x0: number;
  x1: number;
  areaLabel?: string;
}) {
  const reactId = useId().replace(/:/g, "");
  const clipId = `covid-gap-clip-${reactId}`;

  return (
    <ReferenceArea
      x1={x0}
      x2={x1}
      ifOverflow="visible"
      stroke="none"
      fill="none"
      fillOpacity={1}
      label={false}
      shape={(props: AreaShapeProps) => (
        <HatchedGapShape
          {...props}
          label={areaLabel}
          clipId={clipId}
        />
      )}
    />
  );
}

/** Numeric X tick: map value → year label; quiet mark under the COVID band. */
export function CovidAwareYearTick(props: {
  x?: number;
  y?: number;
  payload?: { value?: number | string };
  tickLabels?: Map<number, string>;
}) {
  const { x = 0, y = 0, payload, tickLabels } = props;
  const raw = payload?.value;
  const numeric = typeof raw === "number" ? raw : Number(raw);
  const label =
    tickLabels?.get(numeric) ??
    (typeof raw === "string" ? raw : String(raw ?? ""));
  const isGap = label === COVID_GAP_LABEL;
  return (
    <text
      x={x}
      y={y + 12}
      textAnchor="middle"
      fill={isGap ? "#6b7f74" : "#3d5248"}
      fontSize={isGap ? 10 : 12}
      fontStyle={isGap ? "italic" : undefined}
    >
      {isGap ? "…" : label}
    </text>
  );
}
