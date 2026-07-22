"use client";

import { Customized, ReferenceArea } from "recharts";
import { COVID_GAP_LABEL } from "@/lib/covid-gap";

function HatchPatternSvg({ patternId }: { patternId: string }) {
  return (
    <defs>
      <pattern
        id={patternId}
        width="7"
        height="7"
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(45)"
      >
        <rect width="7" height="7" fill="rgba(27, 67, 50, 0.05)" />
        <line
          x1="0"
          y1="0"
          x2="0"
          y2="7"
          stroke="rgba(27, 67, 50, 0.34)"
          strokeWidth="2"
        />
      </pattern>
    </defs>
  );
}

/** Injects the hatch <defs> into the chart SVG via Customized. */
export function CovidHatchDefs({ patternId = "covid-hatch" }: { patternId?: string }) {
  return (
    <Customized
      component={() => <HatchPatternSvg patternId={patternId} />}
    />
  );
}

/**
 * Hatched band over the single compressed COVID gap tick.
 * Same x1/x2 uses the category band width in Recharts.
 */
export function CovidGapReferenceArea({
  gapLabel = COVID_GAP_LABEL,
  patternId = "covid-hatch",
}: {
  gapLabel?: string;
  patternId?: string;
}) {
  return (
    <ReferenceArea
      x1={gapLabel}
      x2={gapLabel}
      fill={`url(#${patternId})`}
      fillOpacity={1}
      stroke="rgba(27, 67, 50, 0.28)"
      strokeWidth={1}
      strokeDasharray="2 2"
      label={{
        value: "gap",
        position: "insideTop",
        fill: "#5c6f65",
        fontSize: 10,
        fontStyle: "italic",
      }}
      ifOverflow="hidden"
    />
  );
}

/** Compact x-axis tick: quieter styling on the COVID gap category. */
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
      {value}
    </text>
  );
}
