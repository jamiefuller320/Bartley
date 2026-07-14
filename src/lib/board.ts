import type {
  EquityRow,
  Finding,
  HistoryRow,
  PeerSchoolsBundle,
  SchoolMonitorData,
  SchoolProfile,
  ThreeYearRow,
} from "@/lib/types";
import { fmtPct, fmtPp, shortSubject } from "@/lib/format";
import { ppGap } from "@/lib/peers";

export type ChartDeepLink = {
  href: string;
  label: string;
};

export type HeadlineMetric = {
  label: string;
  value: string;
  detail: string;
  delta?: string | null;
  deltaTone?: "up" | "down" | "flat" | null;
};

export type ExecutiveSummary = {
  headlineMetrics: HeadlineMetric[];
  risks: string[];
  questions: string[];
  chartLinks: ChartDeepLink[];
  volatilityNote: string | null;
};

export type ChangeItem = {
  label: string;
  previous: string;
  current: string;
  delta: string;
  tone: "up" | "down" | "flat";
};

export type ChangeLog = {
  generatedAt: string;
  previousRefreshedAt: string | null;
  currentRefreshedAt: string | null;
  summary: string;
  items: ChangeItem[];
};

export type SipTarget = {
  subject: string;
  metric: "expected" | "higher" | "scaled";
  label: string;
  value: number;
  byPeriod?: string | null;
};

export type SipTargetsBundle = {
  note: string;
  enabledByDefault: boolean;
  targets: SipTarget[];
};

export function groupCount(
  profile: SchoolProfile,
  group: string,
): number | null {
  switch (group) {
    case "All pupils":
      return profile.eligiblePupils ?? profile.pupilsAged11 ?? null;
    case "Boys":
      return profile.boysCount ?? null;
    case "Girls":
      return profile.girlsCount ?? null;
    case "Disadvantaged":
      return profile.disadvantagedCount ?? null;
    case "Not disadvantaged":
      return profile.notDisadvantagedCount ?? null;
    default:
      return null;
  }
}

export function fmtPctWithN(
  value: number | null | undefined,
  n: number | null | undefined,
): string {
  const pct = fmtPct(value);
  if (n == null) return pct;
  return `${pct} (n=${n})`;
}

export function ppPerPupil(n: number | null | undefined): number | null {
  if (n == null || n <= 0) return null;
  return Math.round((100 / n) * 10) / 10;
}

export function volatilityNote(n: number | null | undefined): string | null {
  const pp = ppPerPupil(n);
  if (pp == null || n == null) return null;
  return `At n=${n}, one pupil ≈ ${pp} pp on percentages — treat single-year swings smaller than ~${(pp * 2).toFixed(1)} pp with caution.`;
}

export function threeYearRwm(
  threeYear: ThreeYearRow[] | undefined,
): { expected: number | null; higher: number | null; topic: string | null } {
  const row = threeYear?.find(
    (item) => item.subject === "Reading, writing and maths",
  );
  return {
    expected: row?.values.expected_standard_pupil_percent ?? null,
    higher: row?.values.higher_standard_pupil_percent ?? null,
    topic: row?.topic ?? null,
  };
}

function periodShort(period: string): string {
  const [a, b] = period.split("/");
  return b && b.length === 4 ? `${a}/${b.slice(2)}` : period;
}

export function yearOnYear(
  history: HistoryRow[] | undefined,
  subject: string,
  field: "schoolExpected" | "schoolHigher" = "schoolExpected",
): {
  latest: number | null;
  previous: number | null;
  delta: number | null;
  latestPeriod: string | null;
  previousPeriod: string | null;
} {
  const rows = (history ?? [])
    .filter((h) => h.subject === subject && h[field] != null)
    .sort((a, b) => a.period.localeCompare(b.period));
  if (rows.length < 1) {
    return {
      latest: null,
      previous: null,
      delta: null,
      latestPeriod: null,
      previousPeriod: null,
    };
  }
  const last = rows[rows.length - 1];
  const prev = rows.length > 1 ? rows[rows.length - 2] : null;
  const latest = last[field] ?? null;
  const previous = prev ? (prev[field] ?? null) : null;
  return {
    latest,
    previous,
    delta:
      latest != null && previous != null
        ? Math.round((latest - previous) * 10) / 10
        : null,
    latestPeriod: last.period,
    previousPeriod: prev?.period ?? null,
  };
}

function deltaTone(delta: number | null): "up" | "down" | "flat" | null {
  if (delta == null) return null;
  if (delta >= 1) return "up";
  if (delta <= -1) return "down";
  return "flat";
}

function deltaLabel(delta: number | null, previousPeriod: string | null): string | null {
  if (delta == null) return null;
  const vs = previousPeriod ? ` vs ${periodShort(previousPeriod)}` : " vs prior year";
  return `${fmtPp(delta)}${vs}`;
}

export function buildExecutiveSummary(
  data: SchoolMonitorData,
  peers?: PeerSchoolsBundle,
): ExecutiveSummary {
  const rwm = data.subjects.find(
    (s) => s.subject === "Reading, writing and maths",
  );
  const reading = data.subjects.find((s) => s.subject === "Reading");
  const writing = data.subjects.find((s) => s.subject === "Writing");
  const gps = data.subjects.find(
    (s) => s.subject === "Grammar, punctuation and spelling",
  );
  const boys = data.equity.find((e) => e.group === "Boys");
  const girls = data.equity.find((e) => e.group === "Girls");
  const dis = data.equity.find((e) => e.group === "Disadvantaged");
  const notDis = data.equity.find((e) => e.group === "Not disadvantaged");
  const rolling = threeYearRwm(data.threeYear as ThreeYearRow[] | undefined);
  const peerAvg = peers?.peerAverageLatest.rwmExpected ?? null;
  const peerGap = ppGap(rwm?.schoolExpected, peerAvg);
  const cohortN = groupCount(data.profile, "All pupils");
  const yoyExpected = yearOnYear(data.history, "Reading, writing and maths");
  const yoyHigher = yearOnYear(
    data.history,
    "Reading, writing and maths",
    "schoolHigher",
  );
  const genderGap =
    girls?.expected != null && boys?.expected != null
      ? girls.expected - boys.expected
      : null;
  const disGap =
    notDis?.expected != null && dis?.expected != null
      ? notDis.expected - dis.expected
      : null;

  const risks: string[] = [];
  if (genderGap != null && genderGap >= 15) {
    risks.push(
      `Boys’ combined RWM (${fmtPctWithN(boys?.expected, groupCount(data.profile, "Boys"))}) trails girls (${fmtPctWithN(girls?.expected, groupCount(data.profile, "Girls"))}) by ${genderGap.toFixed(0)} pp.`,
    );
  }
  if (disGap != null && disGap >= 15) {
    risks.push(
      `Disadvantaged pupils (${fmtPctWithN(dis?.expected, groupCount(data.profile, "Disadvantaged"))}) trail other pupils by ${disGap.toFixed(0)} pp; none reached the higher standard.`,
    );
  }
  if (peerGap != null && peerGap <= -10) {
    risks.push(
      `Combined RWM sits ${Math.abs(peerGap).toFixed(0)} pp below the top-three similar local peer average (${fmtPct(peerAvg)}).`,
    );
  }
  if ((reading?.vsEngland ?? 0) <= -3 || (gps?.vsEngland ?? 0) <= -3) {
    risks.push(
      `Reading (${fmtPct(reading?.schoolExpected)}) and GPS (${fmtPct(gps?.schoolExpected)}) are below England; writing (${fmtPct(writing?.schoolExpected)}) is the relative strength.`,
    );
  }
  while (risks.length < 3) {
    const extras = data.findings
      .filter((f) => f.severity !== "positive")
      .map((f: Finding) => f.detail);
    for (const item of extras) {
      if (risks.length >= 3) break;
      if (!risks.includes(item)) risks.push(item);
    }
    break;
  }

  return {
    headlineMetrics: [
      {
        label: "RWM expected",
        value: fmtPctWithN(rwm?.schoolExpected, cohortN),
        detail: `England ${fmtPct(rwm?.englandExpected)} · Hampshire ${fmtPct(rwm?.hampshireExpected)}`,
        delta: deltaLabel(yoyExpected.delta, yoyExpected.previousPeriod),
        deltaTone: deltaTone(yoyExpected.delta),
      },
      {
        label: "RWM higher standard",
        value: fmtPctWithN(rwm?.schoolHigher, cohortN),
        detail: `England ${fmtPct(rwm?.englandHigher)} · Hampshire ${fmtPct(rwm?.hampshireHigher)}`,
        delta: deltaLabel(yoyHigher.delta, yoyHigher.previousPeriod),
        deltaTone: deltaTone(yoyHigher.delta),
      },
      {
        label: "3-year RWM average",
        value: fmtPct(rolling.expected),
        detail:
          rolling.topic ??
          "Rolling average across recent published years (expected)",
        delta:
          rolling.higher != null
            ? `Higher-standard 3yr ${fmtPct(rolling.higher)}`
            : null,
        deltaTone: "flat",
      },
      {
        label: "vs peer average",
        value: fmtPp(peerGap),
        detail: `Top-three local peers average ${fmtPct(peerAvg)}`,
        delta: null,
        deltaTone: null,
      },
    ],
    risks: risks.slice(0, 3),
    questions: [
      "What forensic analysis explains the boys who missed combined RWM, and which barriers are most causal?",
      "How is pupil premium mapped to current disadvantaged pupils below expected standard, with termly checkpoints?",
      peerGap != null
        ? `What would close even half the ${Math.abs(peerGap).toFixed(0)} pp gap to the top-three local peer average within three years?`
        : "Which similar Hampshire schools are practical benchmarks for the next three years?",
    ],
    chartLinks: [
      {
        href: "/?view=history&subject=rwm#charts",
        label: "RWM year-on-year",
      },
      {
        href: "/#equity",
        label: "Equity gaps",
      },
      {
        href: "/?view=compare&subject=reading&peer=average#charts",
        label: "Reading vs peer average",
      },
      {
        href: "/?view=history&subject=gps&peer=average#charts",
        label: "GPS vs peer average",
      },
    ],
    volatilityNote: volatilityNote(cohortN),
  };
}

export function equityWithCounts(
  equity: EquityRow[],
  profile: SchoolProfile,
): Array<EquityRow & { count: number | null }> {
  return equity.map((row) => ({
    ...row,
    count: groupCount(profile, row.group),
  }));
}

export function subjectSlug(subject: string): string {
  const map: Record<string, string> = {
    "Reading, writing and maths": "rwm",
    Reading: "reading",
    Writing: "writing",
    Maths: "maths",
    "Grammar, punctuation and spelling": "gps",
    Science: "science",
  };
  return map[subject] ?? shortSubject(subject).toLowerCase();
}

export function subjectFromSlug(slug: string | null | undefined): string | null {
  if (!slug) return null;
  const map: Record<string, string> = {
    rwm: "Reading, writing and maths",
    reading: "Reading",
    writing: "Writing",
    maths: "Maths",
    gps: "Grammar, punctuation and spelling",
    science: "Science",
  };
  return map[slug.toLowerCase()] ?? null;
}

function snapshotKeyMetrics(data: SchoolMonitorData, peers?: PeerSchoolsBundle) {
  const rwm = data.subjects.find(
    (s) => s.subject === "Reading, writing and maths",
  );
  const boys = data.equity.find((e) => e.group === "Boys");
  const girls = data.equity.find((e) => e.group === "Girls");
  const dis = data.equity.find((e) => e.group === "Disadvantaged");
  return {
    rwmExpected: rwm?.schoolExpected ?? null,
    rwmHigher: rwm?.schoolHigher ?? null,
    readingExpected:
      data.subjects.find((s) => s.subject === "Reading")?.schoolExpected ?? null,
    gpsExpected:
      data.subjects.find(
        (s) => s.subject === "Grammar, punctuation and spelling",
      )?.schoolExpected ?? null,
    genderGap:
      girls?.expected != null && boys?.expected != null
        ? Math.round((girls.expected - boys.expected) * 10) / 10
        : null,
    disadvantagedExpected: dis?.expected ?? null,
    peerAverageRwm: peers?.peerAverageLatest.rwmExpected ?? null,
  };
}

export function buildChangeLog(
  previous: SchoolMonitorData | null,
  current: SchoolMonitorData,
  previousPeers: PeerSchoolsBundle | null,
  currentPeers: PeerSchoolsBundle | null,
): ChangeLog {
  const prev = previous ? snapshotKeyMetrics(previous, previousPeers ?? undefined) : null;
  const next = snapshotKeyMetrics(current, currentPeers ?? undefined);
  const labels: Array<{ key: keyof typeof next; label: string; unit: "pct" | "pp" }> = [
    { key: "rwmExpected", label: "RWM expected", unit: "pct" },
    { key: "rwmHigher", label: "RWM higher standard", unit: "pct" },
    { key: "readingExpected", label: "Reading expected", unit: "pct" },
    { key: "gpsExpected", label: "GPS expected", unit: "pct" },
    { key: "genderGap", label: "Girls–boys RWM gap", unit: "pp" },
    { key: "disadvantagedExpected", label: "Disadvantaged RWM", unit: "pct" },
    { key: "peerAverageRwm", label: "Peer-average RWM", unit: "pct" },
  ];

  const items: ChangeItem[] = [];
  for (const row of labels) {
    const before = prev?.[row.key] ?? null;
    const after = next[row.key];
    if (before == null || after == null) continue;
    if (before === after) continue;
    const delta = Math.round((after - before) * 10) / 10;
    items.push({
      label: row.label,
      previous: row.unit === "pct" ? fmtPct(before) : `${before} pp`,
      current: row.unit === "pct" ? fmtPct(after) : `${after} pp`,
      delta: fmtPp(delta),
      tone: deltaTone(delta) ?? "flat",
    });
  }

  return {
    generatedAt: new Date().toISOString().slice(0, 10),
    previousRefreshedAt: previous?.source.refreshedAt ?? null,
    currentRefreshedAt: current.source.refreshedAt ?? null,
    summary: items.length
      ? `${items.length} key figure${items.length === 1 ? "" : "s"} moved since the previous refresh.`
      : "No key headline figures changed since the previous refresh.",
    items,
  };
}

/** Fallback changelog derived from published year-on-year history when no refresh diff exists. */
export function buildPublishedYearChangeLog(
  data: SchoolMonitorData,
  peers?: PeerSchoolsBundle,
): ChangeLog {
  const yoy = yearOnYear(data.history, "Reading, writing and maths");
  const yoyHigher = yearOnYear(
    data.history,
    "Reading, writing and maths",
    "schoolHigher",
  );
  const reading = yearOnYear(data.history, "Reading");
  const gps = yearOnYear(data.history, "Grammar, punctuation and spelling");
  const items: ChangeItem[] = [];

  const push = (
    label: string,
    series: ReturnType<typeof yearOnYear>,
  ) => {
    if (series.delta == null || series.latest == null || series.previous == null) {
      return;
    }
    items.push({
      label,
      previous: fmtPct(series.previous),
      current: fmtPct(series.latest),
      delta: fmtPp(series.delta),
      tone: deltaTone(series.delta) ?? "flat",
    });
  };

  push("RWM expected", yoy);
  push("RWM higher standard", yoyHigher);
  push("Reading expected", reading);
  push("GPS expected", gps);

  if (peers?.peerAverageLatest.rwmExpected != null && yoy.latest != null) {
    const gap = ppGap(yoy.latest, peers.peerAverageLatest.rwmExpected);
    if (gap != null) {
      items.push({
        label: "Gap to peer-average RWM",
        previous: "—",
        current: fmtPp(gap),
        delta: fmtPp(gap),
        tone: deltaTone(gap) ?? "flat",
      });
    }
  }

  return {
    generatedAt: data.source.refreshedAt ?? data.period,
    previousRefreshedAt: yoy.previousPeriod,
    currentRefreshedAt: yoy.latestPeriod,
    summary: items.length
      ? `Published-year movement from ${periodShort(yoy.previousPeriod ?? "")} to ${periodShort(yoy.latestPeriod ?? "")}.`
      : "No year-on-year movement available.",
    items,
  };
}
