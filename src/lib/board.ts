import type {
  EquityRow,
  Finding,
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

export type ExecutiveSummary = {
  headlineMetrics: Array<{ label: string; value: string; detail: string }>;
  risks: string[];
  questions: string[];
  chartLinks: ChartDeepLink[];
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
        label: "RWM latest",
        value: fmtPctWithN(
          rwm?.schoolExpected,
          groupCount(data.profile, "All pupils"),
        ),
        detail: `England ${fmtPct(rwm?.englandExpected)} · Hampshire ${fmtPct(rwm?.hampshireExpected)}`,
      },
      {
        label: "3-year RWM average",
        value: fmtPct(rolling.expected),
        detail: rolling.topic ?? "Rolling average across recent published years",
      },
      {
        label: "vs peer average",
        value: fmtPp(peerGap),
        detail: `Top-three local peers average ${fmtPct(peerAvg)}`,
      },
      {
        label: "Year 6 cohort",
        value: String(data.profile.pupilsAged11 ?? "—"),
        detail: `Disadvantaged ${fmtPct(data.profile.disadvantagedPercent)} · SEN ${fmtPct(data.profile.senCombinedPercent)}`,
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
