import { fetchSchoolBundle, parseMetric, BARTLEY } from "@/lib/dfe-api";
import { buildFindings } from "@/lib/evaluate";
import type {
  EquityRow,
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

  const info = bundle.info[0];
  const nft: Record<string, string> = {
    VC: "Voluntary controlled school",
    VA: "Voluntary aided school",
    CY: "Community school",
  };

  const boys = parseMetric(info?.values.belig);
  const girls = parseMetric(info?.values.gelig);

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
      note: "School-level figures mirror Compare school and college performance via the DfE Explore education statistics API.",
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
      boysCount: boys,
      girlsCount: girls,
      eligiblePupils:
        boys !== null || girls !== null ? (boys ?? 0) + (girls ?? 0) : null,
      period: info?.period,
    },
    period,
    subjects,
    progress,
    equity,
    findings: buildFindings({ subjects, equity }),
  };
}
