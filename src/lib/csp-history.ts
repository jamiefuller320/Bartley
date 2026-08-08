import type {
  EquityHistoryRow,
  HistoryRow,
  ProgressRow,
} from "@/lib/types";

type CspMetrics = {
  rwmExpected?: number | null;
  rwmHigher?: number | null;
  readingExpected?: number | null;
  readingHigher?: number | null;
  readingScaled?: number | null;
  writingExpected?: number | null;
  writingHigher?: number | null;
  mathsExpected?: number | null;
  mathsHigher?: number | null;
  mathsScaled?: number | null;
  gpsExpected?: number | null;
  gpsHigher?: number | null;
  gpsScaled?: number | null;
  scienceExpected?: number | null;
  readingProgress?: number | null;
  writingProgress?: number | null;
  mathsProgress?: number | null;
  boysRwmExpected?: number | null;
  girlsRwmExpected?: number | null;
  disadvantagedRwmExpected?: number | null;
  notDisadvantagedRwmExpected?: number | null;
};

export type CspHistoryBundle = {
  source?: {
    name?: string;
    url?: string;
    note?: string;
    years?: string[];
  };
  history: Array<{
    period: string;
    label?: string;
    school: CspMetrics | null;
    hampshire: CspMetrics | null;
    england: CspMetrics | null;
  }>;
};

const SUBJECT_MAP: Array<{
  subject: string;
  expected: keyof CspMetrics;
  higher: keyof CspMetrics;
  scaled?: keyof CspMetrics;
  progress?: keyof CspMetrics;
}> = [
  {
    subject: "Reading, writing and maths",
    expected: "rwmExpected",
    higher: "rwmHigher",
  },
  {
    subject: "Reading",
    expected: "readingExpected",
    higher: "readingHigher",
    scaled: "readingScaled",
    progress: "readingProgress",
  },
  {
    subject: "Writing",
    expected: "writingExpected",
    higher: "writingHigher",
    progress: "writingProgress",
  },
  {
    subject: "Maths",
    expected: "mathsExpected",
    higher: "mathsHigher",
    scaled: "mathsScaled",
    progress: "mathsProgress",
  },
  {
    subject: "Grammar, punctuation and spelling",
    expected: "gpsExpected",
    higher: "gpsHigher",
    scaled: "gpsScaled",
  },
  {
    subject: "Science",
    expected: "scienceExpected",
    higher: "scienceExpected",
  },
];

function metric(
  row: CspMetrics | null | undefined,
  key: keyof CspMetrics,
): number | null {
  const value = row?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function historyFromCsp(bundle: CspHistoryBundle): HistoryRow[] {
  const rows: HistoryRow[] = [];
  for (const year of bundle.history) {
    for (const map of SUBJECT_MAP) {
      const schoolExpected = metric(year.school, map.expected);
      const schoolHigher =
        map.subject === "Science" ? null : metric(year.school, map.higher);
      const schoolScaled = map.scaled
        ? metric(year.school, map.scaled)
        : null;
      const hampshireExpected = metric(year.hampshire, map.expected);
      const englandExpected = metric(year.england, map.expected);
      if (
        schoolExpected == null &&
        schoolHigher == null &&
        schoolScaled == null &&
        hampshireExpected == null &&
        englandExpected == null
      ) {
        continue;
      }
      rows.push({
        period: year.period,
        label: year.label,
        subject: map.subject,
        schoolExpected,
        hampshireExpected,
        englandExpected,
        schoolHigher,
        hampshireHigher:
          map.subject === "Science" ? null : metric(year.hampshire, map.higher),
        englandHigher:
          map.subject === "Science" ? null : metric(year.england, map.higher),
        schoolScaled,
        hampshireScaled: map.scaled
          ? metric(year.hampshire, map.scaled)
          : null,
        englandScaled: map.scaled ? metric(year.england, map.scaled) : null,
        schoolProgress: map.progress
          ? metric(year.school, map.progress)
          : null,
      });
    }
  }
  return rows;
}

export function equityHistoryFromCsp(
  bundle: CspHistoryBundle,
): EquityHistoryRow[] {
  const rows: EquityHistoryRow[] = [];
  for (const year of bundle.history) {
    const groups: Array<[string, keyof CspMetrics]> = [
      ["Boys", "boysRwmExpected"],
      ["Girls", "girlsRwmExpected"],
      ["Disadvantaged", "disadvantagedRwmExpected"],
      ["Not disadvantaged", "notDisadvantagedRwmExpected"],
      ["All pupils", "rwmExpected"],
    ];
    for (const [group, key] of groups) {
      const expected = metric(year.school, key);
      if (expected == null) continue;
      rows.push({
        period: year.period,
        group,
        expected,
        higher: null,
      });
    }
  }
  return rows;
}

export function progressHistoryFromCsp(
  bundle: CspHistoryBundle,
): ProgressRow[] {
  const rows: ProgressRow[] = [];
  for (const year of bundle.history) {
    for (const subject of ["Reading", "Writing", "Maths"] as const) {
      const key =
        subject === "Reading"
          ? "readingProgress"
          : subject === "Writing"
            ? "writingProgress"
            : "mathsProgress";
      const score = metric(year.school, key);
      if (score == null) continue;
      rows.push({
        subject,
        score,
        lower: null,
        upper: null,
        period: year.period,
      });
    }
  }
  return rows;
}
