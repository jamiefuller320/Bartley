import type {
  Finding,
  HistoryRow,
  SchoolMonitorData,
  SubjectComparison,
} from "./types";
import {
  dualSignalVsBenchmark,
  formatPeriods,
  localRollingEquityGap,
  localRollingFromHistory,
  ppDiff,
  threeYearComparison,
} from "./three-year";

function gap(
  a: number | null | undefined,
  b: number | null | undefined,
): number | null {
  if (a === null || a === undefined || b === null || b === undefined) return null;
  return a - b;
}

function periodShort(period: string): string {
  const [a, b] = period.split("/");
  return b && b.length === 4 ? `${a}/${b.slice(2)}` : period;
}

function fmtSigned(n: number): string {
  return `${n >= 0 ? "+" : ""}${n}`;
}

export function buildFindings(
  data: Pick<
    SchoolMonitorData,
    | "subjects"
    | "equity"
    | "history"
    | "equityHistory"
    | "threeYear"
    | "threeYearComparisons"
  >,
): Finding[] {
  const findings: Finding[] = [];
  const rwm = data.subjects.find((s) => s.subject === "Reading, writing and maths");
  const rwm3 = threeYearComparison(
    data.threeYearComparisons,
    "Reading, writing and maths",
  );
  const localRwm = localRollingFromHistory(
    data.history,
    "Reading, writing and maths",
    "schoolExpected",
  );
  const localEng = localRollingFromHistory(
    data.history,
    "Reading, writing and maths",
    "englandExpected",
  );
  const rollingVsEngland =
    rwm3?.vsEngland ??
    ppDiff(localRwm.value, localEng.value);

  if (rwm?.vsEngland !== null && rwm?.vsEngland !== undefined) {
    const dual = dualSignalVsBenchmark(rwm.vsEngland, rollingVsEngland);
    const rollingNote =
      rwm3?.schoolExpected != null && rwm3.englandExpected != null
        ? ` DfE 3-year average is ${rwm3.schoolExpected}% vs England ${rwm3.englandExpected}% (${fmtSigned(rwm3.vsEngland ?? 0)} pp; ${rwm3.topic}).`
        : localRwm.value != null && localEng.value != null
          ? ` Local mean of latest ${localRwm.periods.length} published years is ${localRwm.value}% vs England ${localEng.value}% (${fmtSigned(rollingVsEngland ?? 0)} pp; ${formatPeriods(localRwm.periods)}).`
          : "";

    if (dual.severity === "positive") {
      findings.push({
        severity: "positive",
        title: "Combined RWM in line with England",
        detail: `Latest combined expected standard is ${rwm.schoolExpected}% versus England ${rwm.englandExpected}% (${fmtSigned(rwm.vsEngland)} pp) and Hampshire ${rwm.hampshireExpected}%.${rollingNote}`,
      });
    } else if (dual.severity === "watch") {
      findings.push({
        severity: "watch",
        title:
          rwm.vsEngland < -5 && (rollingVsEngland ?? 0) >= -5
            ? "Combined RWM latest year soft; 3-year steadier"
            : "Combined RWM close to / below national",
        detail: `Latest combined expected standard is ${rwm.schoolExpected}% versus England ${rwm.englandExpected}% (${rwm.vsEngland} pp). Hampshire is ${rwm.hampshireExpected}%.${rollingNote}`,
      });
    } else {
      findings.push({
        severity: "priority",
        title: "Combined RWM below national on latest and 3-year view",
        detail: `Latest combined expected standard is ${rwm.schoolExpected}% versus England ${rwm.englandExpected}% (${rwm.vsEngland} pp).${rollingNote}`,
      });
    }
  }

  const trend = trendFinding(data.history);
  if (trend) findings.push(trend);

  const belowPeak = belowPeakFinding(data.history);
  if (belowPeak) findings.push(belowPeak);

  const boys = data.equity.find((e) => e.group === "Boys");
  const girls = data.equity.find((e) => e.group === "Girls");
  const genderGap = gap(girls?.expected, boys?.expected);
  const genderRoll = localRollingEquityGap(
    data.equityHistory,
    "Girls",
    "Boys",
  );
  if (genderGap !== null) {
    const sustained =
      genderRoll.gap != null && genderRoll.gap >= 15 ? "priority" : null;
    const severity =
      genderGap >= 20 || sustained === "priority" ? "priority" : "watch";
    const rollNote =
      genderRoll.gap != null
        ? ` Three-year local average gap is ${genderRoll.gap.toFixed(0)} pp (girls ${genderRoll.higher}% vs boys ${genderRoll.lower}% over ${formatPeriods(genderRoll.periods)}).`
        : "";
    findings.push({
      severity,
      title: "Gender gap in combined RWM",
      detail: `Latest: girls ${girls?.expected}% vs boys ${boys?.expected}% at expected standard (gap ${genderGap.toFixed(0)} pp).${rollNote}`,
    });
  }

  const dis = data.equity.find((e) => e.group === "Disadvantaged");
  const notDis = data.equity.find((e) => e.group === "Not disadvantaged");
  const disGap = gap(notDis?.expected, dis?.expected);
  const disRoll = localRollingEquityGap(
    data.equityHistory,
    "Not disadvantaged",
    "Disadvantaged",
  );
  if (disGap !== null) {
    const severity =
      disGap >= 20 || (disRoll.gap != null && disRoll.gap >= 20)
        ? "priority"
        : "watch";
    const rollNote =
      disRoll.gap != null
        ? ` Three-year local average gap is ${disRoll.gap.toFixed(0)} pp (disadvantaged ${disRoll.lower}% vs others ${disRoll.higher}% over ${formatPeriods(disRoll.periods)}).`
        : "";
    findings.push({
      severity,
      title: "Disadvantage gap in combined RWM",
      detail: `Latest: disadvantaged pupils ${dis?.expected}% vs not disadvantaged ${notDis?.expected}% (gap ${disGap.toFixed(0)} pp).${rollNote}`,
    });
  }

  for (const subject of ["Writing", "Maths", "Reading", "Science"] as const) {
    const row = data.subjects.find((s) => s.subject === subject);
    const roll = threeYearComparison(data.threeYearComparisons, subject);
    const localSchool = localRollingFromHistory(
      data.history,
      subject,
      "schoolExpected",
    );
    const localEngSub = localRollingFromHistory(
      data.history,
      subject,
      "englandExpected",
    );
    const rollingVsEng =
      roll?.vsEngland ?? ppDiff(localSchool.value, localEngSub.value);

    if (
      row?.vsHampshire !== null &&
      row?.vsHampshire !== undefined &&
      row.vsHampshire >= 2
    ) {
      findings.push({
        severity: "positive",
        title: `${subject} above Hampshire`,
        detail: `Latest ${subject} expected standard ${row.schoolExpected}% vs Hampshire ${row.hampshireExpected}% (+${row.vsHampshire} pp).`,
      });
    }
    if (
      row?.vsEngland !== null &&
      row?.vsEngland !== undefined &&
      row.vsEngland <= -5
    ) {
      const dual = dualSignalVsBenchmark(row.vsEngland, rollingVsEng);
      const rollNote =
        roll?.schoolExpected != null && roll.englandExpected != null
          ? ` DfE 3-year expected is ${roll.schoolExpected}% vs England ${roll.englandExpected}% (${fmtSigned(roll.vsEngland ?? 0)} pp).`
          : roll?.schoolScaled != null && roll.englandScaled != null
            ? ` DfE 3-year average scaled score is ${roll.schoolScaled} vs England ${roll.englandScaled}.`
            : localSchool.value != null && localEngSub.value != null
              ? ` Local ${localSchool.periods.length}-year mean is ${localSchool.value}% vs England ${localEngSub.value}% (${fmtSigned(rollingVsEng ?? 0)} pp).`
              : "";
      findings.push({
        severity: dual.severity === "priority" ? "priority" : "watch",
        title:
          dual.severity === "priority"
            ? `${subject} below England on latest and smoothed view`
            : `${subject} below England`,
        detail: `Latest ${subject} expected standard ${row.schoolExpected}% vs England ${row.englandExpected}% (${row.vsEngland} pp).${rollNote}`,
      });
    } else if (
      row?.vsEngland !== null &&
      row?.vsEngland !== undefined &&
      row.vsEngland < 0 &&
      rollingVsEng != null &&
      rollingVsEng <= -3
    ) {
      findings.push({
        severity: "watch",
        title: `${subject} soft on smoothed view`,
        detail: `Latest ${subject} is ${row.schoolExpected}% vs England ${row.englandExpected}% (${row.vsEngland} pp); smoothed gap remains ${fmtSigned(rollingVsEng)} pp.`,
      });
    }
  }

  return findings;
}

function trendFinding(history: HistoryRow[] | undefined): Finding | null {
  if (!history?.length) return null;
  const rwm = history
    .filter((h) => h.subject === "Reading, writing and maths")
    .filter((h) => h.schoolExpected !== null)
    .sort((a, b) => a.period.localeCompare(b.period));
  if (rwm.length < 2) return null;
  const first = rwm[0];
  const last = rwm[rwm.length - 1];
  const delta = (last.schoolExpected ?? 0) - (first.schoolExpected ?? 0);
  const recent = rwm.slice(-3);
  const recentDelta =
    recent.length >= 2
      ? (recent[recent.length - 1].schoolExpected ?? 0) -
        (recent[0].schoolExpected ?? 0)
      : null;
  const recentNote =
    recentDelta != null
      ? ` Over the latest ${recent.length} published years (${periodShort(recent[0].period)}–${periodShort(recent[recent.length - 1].period)}) the school moved ${fmtSigned(recentDelta)} pp.`
      : "";
  return {
    severity: delta >= 0 ? "positive" : "watch",
    title: "Long-run RWM trend",
    detail: `Combined expected standard moved from ${first.schoolExpected}% in ${periodShort(first.period)} to ${last.schoolExpected}% in ${periodShort(last.period)} (${fmtSigned(delta)} pp). England moved from ${first.englandExpected}% to ${last.englandExpected}% over the published years.${recentNote}`,
  };
}

function belowPeakFinding(history: HistoryRow[] | undefined): Finding | null {
  if (!history?.length) return null;
  const rwm = history
    .filter((h) => h.subject === "Reading, writing and maths")
    .filter((h) => h.schoolExpected !== null)
    .sort((a, b) => a.period.localeCompare(b.period));
  if (rwm.length < 2) return null;
  const last = rwm[rwm.length - 1];
  const peak = rwm.reduce((best, row) =>
    (row.schoolExpected ?? 0) > (best.schoolExpected ?? 0) ? row : best,
  );
  const gapToPeak = (peak.schoolExpected ?? 0) - (last.schoolExpected ?? 0);
  if (gapToPeak < 5) return null;
  const recent = localRollingFromHistory(
    history,
    "Reading, writing and maths",
    "schoolExpected",
  );
  const rollNote =
    recent.value != null
      ? ` The local three-year mean (${fmtPctish(recent.value)} over ${formatPeriods(recent.periods)}) is also below that peak.`
      : "";
  return {
    severity: "watch",
    title: "Below recent peak",
    detail: `Latest combined RWM (${last.schoolExpected}% in ${periodShort(last.period)}) is below the school’s published peak of ${peak.schoolExpected}% in ${periodShort(peak.period)}.${rollNote}`,
  };
}

function fmtPctish(n: number): string {
  return Number.isInteger(n) ? `${n}%` : `${n}%`;
}

export function scorecard(subjects: SubjectComparison[]) {
  const rwm = subjects.find((s) => s.subject === "Reading, writing and maths");
  const aboveOrEqual = subjects.filter(
    (s) => s.vsEngland !== null && s.vsEngland !== undefined && s.vsEngland >= 0,
  ).length;
  return {
    rwmExpected: rwm?.schoolExpected ?? null,
    vsEngland: rwm?.vsEngland ?? null,
    subjectsAtOrAboveEngland: aboveOrEqual,
    subjectsCompared: subjects.filter((s) => s.schoolExpected !== null).length,
  };
}
