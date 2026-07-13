import type { Finding, SchoolMonitorData, SubjectComparison } from "./types";

function gap(
  a: number | null | undefined,
  b: number | null | undefined,
): number | null {
  if (a === null || a === undefined || b === null || b === undefined) return null;
  return a - b;
}

export function buildFindings(data: Pick<SchoolMonitorData, "subjects" | "equity">): Finding[] {
  const findings: Finding[] = [];
  const rwm = data.subjects.find((s) => s.subject === "Reading, writing and maths");
  if (rwm?.vsEngland !== null && rwm?.vsEngland !== undefined) {
    if (rwm.vsEngland >= 0) {
      findings.push({
        severity: "positive",
        title: "Combined RWM in line with England",
        detail: `Combined expected standard is ${rwm.schoolExpected}% versus England ${rwm.englandExpected}% (${rwm.vsEngland >= 0 ? "+" : ""}${rwm.vsEngland} pp) and Hampshire ${rwm.hampshireExpected}%.`,
      });
    } else if (rwm.vsEngland >= -5) {
      findings.push({
        severity: "watch",
        title: "Combined RWM close to national",
        detail: `Combined expected standard is ${rwm.schoolExpected}% versus England ${rwm.englandExpected}% (${rwm.vsEngland} pp). Hampshire is ${rwm.hampshireExpected}%.`,
      });
    } else {
      findings.push({
        severity: "priority",
        title: "Combined RWM below national",
        detail: `Combined expected standard is ${rwm.schoolExpected}% versus England ${rwm.englandExpected}% (${rwm.vsEngland} pp).`,
      });
    }
  }

  const boys = data.equity.find((e) => e.group === "Boys");
  const girls = data.equity.find((e) => e.group === "Girls");
  const genderGap = gap(girls?.expected, boys?.expected);
  if (genderGap !== null) {
    findings.push({
      severity: genderGap >= 20 ? "priority" : "watch",
      title: "Gender gap in combined RWM",
      detail: `Girls ${girls?.expected}% vs boys ${boys?.expected}% at expected standard (gap ${genderGap.toFixed(0)} pp).`,
    });
  }

  const dis = data.equity.find((e) => e.group === "Disadvantaged");
  const notDis = data.equity.find((e) => e.group === "Not disadvantaged");
  const disGap = gap(notDis?.expected, dis?.expected);
  if (disGap !== null) {
    findings.push({
      severity: disGap >= 20 ? "priority" : "watch",
      title: "Disadvantage gap in combined RWM",
      detail: `Disadvantaged pupils ${dis?.expected}% vs not disadvantaged ${notDis?.expected}% (gap ${disGap.toFixed(0)} pp).`,
    });
  }

  for (const subject of ["Writing", "Maths", "Reading", "Science"] as const) {
    const row = data.subjects.find((s) => s.subject === subject);
    if (row?.vsHampshire !== null && row?.vsHampshire !== undefined && row.vsHampshire >= 2) {
      findings.push({
        severity: "positive",
        title: `${subject} above Hampshire`,
        detail: `${subject} expected standard ${row.schoolExpected}% vs Hampshire ${row.hampshireExpected}% (+${row.vsHampshire} pp).`,
      });
    }
    if (row?.vsEngland !== null && row?.vsEngland !== undefined && row.vsEngland <= -5) {
      findings.push({
        severity: "watch",
        title: `${subject} below England`,
        detail: `${subject} expected standard ${row.schoolExpected}% vs England ${row.englandExpected}% (${row.vsEngland} pp).`,
      });
    }
  }

  return findings;
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
