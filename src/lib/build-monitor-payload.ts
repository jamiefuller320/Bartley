import { fetchSchoolBundle, parseMetric, BARTLEY } from "@/lib/dfe-api";
import { buildFindings } from "@/lib/evaluate";
import type {
  EquityHistoryRow,
  EquityRow,
  HistoryRow,
  SchoolMonitorData,
  SubjectComparison,
} from "@/lib/types";

const SUBJECTS = [
  "Reading, writing and maths",
  "Reading",
  "Writing",
  "Maths",
  "Grammar, punctuation and spelling",
  "Science",
] as const;

const PERIODS = ["2022/2023", "2023/2024", "2024/2025"] as const;

type Decoded = {
  period: string;
  filters: Record<string, string>;
  values: Record<string, string>;
};

function pick(
  rows: Decoded[],
  subject: string,
  breakdown: string,
  period: string,
  establishment?: string,
) {
  for (const row of rows) {
    if (row.period !== period) continue;
    const f = row.filters;
    if (f.subject !== subject) continue;
    if (f.breakdown !== breakdown) continue;
    if (establishment && f.establishment_type_group !== establishment) continue;
    if (
      breakdown === "Total" &&
      f.breakdown_topic &&
      f.breakdown_topic !== "All pupils"
    ) {
      continue;
    }
    return Object.fromEntries(
      Object.entries(row.values).map(([k, v]) => [k, parseMetric(v)]),
    );
  }
  return {} as Record<string, number | null>;
}

function pickAny(
  rows: Decoded[],
  subject: string,
  breakdown: string,
  period: string,
) {
  for (const row of rows) {
    if (row.period !== period) continue;
    if (row.filters.subject === subject && row.filters.breakdown === breakdown) {
      return Object.fromEntries(
        Object.entries(row.values).map(([k, v]) => [k, parseMetric(v)]),
      );
    }
  }
  return {} as Record<string, number | null>;
}

function pickBench(
  rows: Decoded[],
  subject: string,
  period: string,
): Record<string, number | null> {
  let values = pick(rows, subject, "Total", period, "All state funded");
  if (values.expected_standard_pupil_percent == null) {
    values = pick(rows, subject, "Total", period, "All schools");
  }
  return values;
}

function buildHistory(
  school: Decoded[],
  hampshire: Decoded[],
  england: Decoded[],
): HistoryRow[] {
  const history: HistoryRow[] = [];
  for (const period of PERIODS) {
    for (const subject of SUBJECTS) {
      const s = pick(school, subject, "Total", period);
      const h = pickBench(hampshire, subject, period);
      const e = pickBench(england, subject, period);
      if (
        s.expected_standard_pupil_percent == null &&
        s.higher_standard_pupil_percent == null &&
        s.average_scaled_score == null &&
        h.expected_standard_pupil_percent == null &&
        e.expected_standard_pupil_percent == null
      ) {
        continue;
      }
      history.push({
        period,
        label: period.replace("/20", "/"),
        subject,
        schoolExpected: s.expected_standard_pupil_percent ?? null,
        hampshireExpected: h.expected_standard_pupil_percent ?? null,
        englandExpected: e.expected_standard_pupil_percent ?? null,
        schoolHigher: s.higher_standard_pupil_percent ?? null,
        hampshireHigher: h.higher_standard_pupil_percent ?? null,
        englandHigher: e.higher_standard_pupil_percent ?? null,
        schoolScaled: s.average_scaled_score ?? null,
        hampshireScaled: h.average_scaled_score ?? null,
        englandScaled: e.average_scaled_score ?? null,
        schoolProgress: s.progress_measure_score ?? null,
      });
    }
  }
  return history;
}

function buildEquityHistory(school: Decoded[]): EquityHistoryRow[] {
  const groups: Array<[string, string]> = [
    ["Total", "All pupils"],
    ["Boys", "Boys"],
    ["Girls", "Girls"],
    ["Disadvantaged", "Disadvantaged"],
    ["Not known to be disadvantaged", "Not disadvantaged"],
  ];
  const rows: EquityHistoryRow[] = [];
  for (const period of PERIODS) {
    for (const [breakdown, group] of groups) {
      const values = pickAny(
        school,
        "Reading, writing and maths",
        breakdown,
        period,
      );
      if (
        values.expected_standard_pupil_percent == null &&
        values.higher_standard_pupil_percent == null
      ) {
        continue;
      }
      rows.push({
        period,
        group,
        expected: values.expected_standard_pupil_percent ?? null,
        higher: values.higher_standard_pupil_percent ?? null,
      });
    }
  }
  return rows;
}

export async function buildMonitorPayload(
  urn = BARTLEY.urn,
): Promise<SchoolMonitorData> {
  if (urn !== BARTLEY.urn) {
    throw new Error(
      "This builder currently supports Bartley CofE Junior School (URN 116338).",
    );
  }

  const bundle = await fetchSchoolBundle(urn);
  const period =
    bundle.perf.find((r) => r.filters.breakdown === "Total")?.period ??
    "2024/2025";

  const subjects: SubjectComparison[] = SUBJECTS.map((subject) => {
    const school = pick(bundle.perf, subject, "Total", period);
    let hampshire = pick(
      bundle.hampshire,
      subject,
      "Total",
      period,
      "All state funded",
    );
    if (hampshire.expected_standard_pupil_percent == null) {
      hampshire = pick(bundle.hampshire, subject, "Total", period, "All schools");
    }
    let england = pick(
      bundle.england,
      subject,
      "Total",
      period,
      "All state funded",
    );
    if (england.expected_standard_pupil_percent == null) {
      england = pick(bundle.england, subject, "Total", period, "All schools");
    }
    const schoolExpected = school.expected_standard_pupil_percent ?? null;
    const hampshireExpected = hampshire.expected_standard_pupil_percent ?? null;
    const englandExpected = england.expected_standard_pupil_percent ?? null;
    return {
      subject,
      schoolExpected,
      hampshireExpected,
      englandExpected,
      schoolHigher: school.higher_standard_pupil_percent ?? null,
      hampshireHigher: hampshire.higher_standard_pupil_percent ?? null,
      englandHigher: england.higher_standard_pupil_percent ?? null,
      schoolScaled: school.average_scaled_score ?? null,
      hampshireScaled: hampshire.average_scaled_score ?? null,
      englandScaled: england.average_scaled_score ?? null,
      vsHampshire:
        schoolExpected !== null && hampshireExpected !== null
          ? Number((schoolExpected - hampshireExpected).toFixed(1))
          : null,
      vsEngland:
        schoolExpected !== null && englandExpected !== null
          ? Number((schoolExpected - englandExpected).toFixed(1))
          : null,
    };
  });

  const equity: EquityRow[] = [
    {
      group: "All pupils",
      expected:
        pickAny(bundle.perf, "Reading, writing and maths", "Total", period)
          .expected_standard_pupil_percent ?? null,
      higher:
        pickAny(bundle.perf, "Reading, writing and maths", "Total", period)
          .higher_standard_pupil_percent ?? null,
    },
    {
      group: "Boys",
      expected:
        pickAny(bundle.perf, "Reading, writing and maths", "Boys", period)
          .expected_standard_pupil_percent ?? null,
      higher:
        pickAny(bundle.perf, "Reading, writing and maths", "Boys", period)
          .higher_standard_pupil_percent ?? null,
    },
    {
      group: "Girls",
      expected:
        pickAny(bundle.perf, "Reading, writing and maths", "Girls", period)
          .expected_standard_pupil_percent ?? null,
      higher:
        pickAny(bundle.perf, "Reading, writing and maths", "Girls", period)
          .higher_standard_pupil_percent ?? null,
    },
    {
      group: "Disadvantaged",
      expected:
        pickAny(bundle.perf, "Reading, writing and maths", "Disadvantaged", period)
          .expected_standard_pupil_percent ?? null,
      higher:
        pickAny(bundle.perf, "Reading, writing and maths", "Disadvantaged", period)
          .higher_standard_pupil_percent ?? null,
    },
    {
      group: "Not disadvantaged",
      expected:
        pickAny(
          bundle.perf,
          "Reading, writing and maths",
          "Not known to be disadvantaged",
          period,
        ).expected_standard_pupil_percent ?? null,
      higher:
        pickAny(
          bundle.perf,
          "Reading, writing and maths",
          "Not known to be disadvantaged",
          period,
        ).higher_standard_pupil_percent ?? null,
    },
  ];

  const progress = ["Reading", "Writing", "Maths"].flatMap((subject) => {
    const row = bundle.perf.find(
      (r) =>
        r.filters.subject === subject &&
        parseMetric(r.values.progress_measure_score) !== null,
    );
    if (!row) return [];
    return [
      {
        subject,
        score: parseMetric(row.values.progress_measure_score),
        lower: parseMetric(row.values.progress_measure_lower_conf_interval),
        upper: parseMetric(row.values.progress_measure_upper_conf_interval),
        period: row.period,
      },
    ];
  });

  const history = buildHistory(bundle.perf, bundle.hampshire, bundle.england);
  const equityHistory = buildEquityHistory(bundle.perf);

  const info = bundle.info[0];
  const nft: Record<string, string> = {
    VC: "Voluntary controlled school",
    VA: "Voluntary aided school",
    CY: "Community school",
  };

  const boysCount = parseMetric(info?.values.belig);
  const girlsCount = parseMetric(info?.values.gelig);

  return {
    source: {
      primarySite: `https://www.compare-school-performance.service.gov.uk/school/${urn}/bartley-church-of-england-junior-school`,
      api: "https://api.education.gov.uk/statistics",
      datasets: {
        schoolPerformance: "019afee4-e5d0-72f9-9a8f-d7a1a56eac1d",
        schoolInformation: "019afee4-ba17-73cb-85e0-f88c101bb734",
        laPerformance: "019afee5-4791-7467-a788-c163fd9b57de",
      },
      release: "Key stage 2 attainment (Explore Education Statistics)",
      note: "School-level figures mirror Compare school and college performance via the DfE Explore education statistics API. Institution-level history currently covers 2022/23 to 2024/25.",
    },
    profile: {
      name: BARTLEY.name,
      urn,
      laEstab: BARTLEY.laEstab,
      localAuthority: "Hampshire",
      phase: "Junior (ages 7–11)",
      address: info?.filters.full_address?.replace(", z,", ","),
      telephone: info?.filters.telnum,
      schoolType: info?.filters.nftype,
      schoolTypeLabel: nft[info?.filters.nftype ?? ""] ?? info?.filters.nftype,
      religiousDenomination: info?.filters.reldenom,
      ageRange: info?.filters.agerange,
      pupilsAged11: parseMetric(info?.values.tpupyear),
      disadvantagedPercent: parseMetric(info?.values.ptfsm6cla1a),
      senSupportPercent: parseMetric(info?.values.psenelk),
      ehcPercent: parseMetric(info?.values.psenele),
      ealPercent: parseMetric(info?.values.ptealgrp2),
      nonMobilePercent: parseMetric(info?.values.ptmobn),
      boysPercent: parseMetric(info?.values.pbelig),
      girlsPercent: parseMetric(info?.values.pgelig),
      boysCount,
      girlsCount,
      eligiblePupils:
        boysCount !== null || girlsCount !== null
          ? (boysCount ?? 0) + (girlsCount ?? 0)
          : null,
      period: info?.period,
    },
    period,
    periods: [...PERIODS],
    subjects,
    progress,
    equity,
    history,
    equityHistory,
    findings: buildFindings({ subjects, equity, history }),
  };
}
