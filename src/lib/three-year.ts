import type {
  EquityHistoryRow,
  HistoryRow,
  ThreeYearComparison,
  ThreeYearRow,
} from "@/lib/types";

export function mean(
  values: Array<number | null | undefined>,
): number | null {
  const nums = values.filter(
    (v): v is number => v !== null && v !== undefined && Number.isFinite(v),
  );
  if (!nums.length) return null;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}

export function ppDiff(
  a: number | null | undefined,
  b: number | null | undefined,
): number | null {
  if (a == null || b == null) return null;
  return Math.round((a - b) * 10) / 10;
}

/** Official DfE 3-year row for a subject, if present. */
export function officialThreeYear(
  threeYear: ThreeYearRow[] | undefined,
  subject: string,
): ThreeYearRow | undefined {
  return threeYear?.find((row) => row.subject === subject);
}

export function officialThreeYearExpected(
  threeYear: ThreeYearRow[] | undefined,
  subject: string,
): number | null {
  return (
    officialThreeYear(threeYear, subject)?.values
      .expected_standard_pupil_percent ?? null
  );
}

export function threeYearComparison(
  rows: ThreeYearComparison[] | undefined,
  subject: string,
): ThreeYearComparison | undefined {
  return rows?.find((row) => row.subject === subject);
}

/**
 * Unweighted mean of the latest `window` published years for a subject metric.
 * Distinct from DfE's pupil-weighted "3 year average" publication.
 */
export function localRollingFromHistory(
  history: HistoryRow[] | undefined,
  subject: string,
  field:
    | "schoolExpected"
    | "englandExpected"
    | "hampshireExpected"
    | "schoolHigher"
    | "schoolScaled" = "schoolExpected",
  window = 3,
): { value: number | null; periods: string[] } {
  const rows = (history ?? [])
    .filter((h) => h.subject === subject && h[field] != null)
    .sort((a, b) => a.period.localeCompare(b.period))
    .slice(-window);
  return {
    value: mean(rows.map((r) => r[field] as number | null)),
    periods: rows.map((r) => r.period),
  };
}

export function localRollingEquity(
  equityHistory: EquityHistoryRow[] | undefined,
  group: string,
  field: "expected" | "higher" = "expected",
  window = 3,
): { value: number | null; periods: string[] } {
  const rows = (equityHistory ?? [])
    .filter((e) => e.group === group && e[field] != null)
    .sort((a, b) => a.period.localeCompare(b.period))
    .slice(-window);
  return {
    value: mean(rows.map((r) => r[field])),
    periods: rows.map((r) => r.period),
  };
}

export function localRollingEquityGap(
  equityHistory: EquityHistoryRow[] | undefined,
  higherGroup: string,
  lowerGroup: string,
  window = 3,
): { gap: number | null; higher: number | null; lower: number | null; periods: string[] } {
  const higher = localRollingEquity(equityHistory, higherGroup, "expected", window);
  const lower = localRollingEquity(equityHistory, lowerGroup, "expected", window);
  const periods = Array.from(
    new Set([...higher.periods, ...lower.periods]),
  ).sort();
  return {
    gap: ppDiff(higher.value, lower.value),
    higher: higher.value,
    lower: lower.value,
    periods,
  };
}

export type DualSignal = {
  severity: "positive" | "watch" | "priority";
  latestGap: number;
  rollingGap: number | null;
};

/**
 * Combine latest vs-benchmark gap with a rolling/3yr gap.
 * Priority when both are clearly soft; watch when either is soft;
 * positive only when latest is non-negative (rolling noted separately in copy).
 */
export function dualSignalVsBenchmark(
  latestGap: number,
  rollingGap: number | null,
  soft = -5,
  severe = -5,
): DualSignal {
  if (rollingGap == null) {
    if (latestGap >= 0) return { severity: "positive", latestGap, rollingGap };
    if (latestGap >= soft) return { severity: "watch", latestGap, rollingGap };
    return { severity: "priority", latestGap, rollingGap };
  }
  if (latestGap < severe && rollingGap < soft) {
    return { severity: "priority", latestGap, rollingGap };
  }
  if (latestGap >= 0 && rollingGap >= soft) {
    return { severity: "positive", latestGap, rollingGap };
  }
  return { severity: "watch", latestGap, rollingGap };
}

export function formatPeriods(periods: string[]): string {
  if (!periods.length) return "recent years";
  const short = periods.map((period) => {
    const [a, b] = period.split("/");
    return b && b.length === 4 ? `${a}/${b.slice(2)}` : period;
  });
  if (short.length === 1) return short[0];
  return `${short[0]}–${short[short.length - 1]}`;
}
