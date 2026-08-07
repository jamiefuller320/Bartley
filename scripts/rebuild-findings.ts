/**
 * Rebuild automated findings (and attach threeYearComparisons) on the existing
 * enriched seed without calling the live DfE API.
 *
 * Usage: npx tsx scripts/rebuild-findings.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { buildFindings } from "../src/lib/evaluate";
import { ppDiff } from "../src/lib/three-year";
import type { SchoolMonitorData, ThreeYearComparison } from "../src/lib/types";

const seedUrl = new URL("../src/data/bartley-2024-25.json", import.meta.url);

const data = JSON.parse(readFileSync(seedUrl, "utf8")) as SchoolMonitorData;

/** Benchmarks from the DfE LA/national 3-year average extract (2023–2025). */
const OFFICIAL_BENCHMARKS: Record<
  string,
  {
    hampshireExpected: number | null;
    englandExpected: number | null;
    hampshireHigher: number | null;
    englandHigher: number | null;
    hampshireScaled: number | null;
    englandScaled: number | null;
  }
> = {
  "Reading, writing and maths": {
    hampshireExpected: 61,
    englandExpected: 61,
    hampshireHigher: 9,
    englandHigher: 8,
    hampshireScaled: null,
    englandScaled: null,
  },
  Reading: {
    hampshireExpected: null,
    englandExpected: null,
    hampshireHigher: null,
    englandHigher: null,
    hampshireScaled: 105,
    englandScaled: 105,
  },
  Maths: {
    hampshireExpected: null,
    englandExpected: null,
    hampshireHigher: null,
    englandHigher: null,
    hampshireScaled: 104,
    englandScaled: 104,
  },
};

function buildComparisons(seed: SchoolMonitorData): ThreeYearComparison[] {
  return (seed.threeYear ?? []).map((row) => {
    const bench = OFFICIAL_BENCHMARKS[row.subject] ?? {
      hampshireExpected: null,
      englandExpected: null,
      hampshireHigher: null,
      englandHigher: null,
      hampshireScaled: null,
      englandScaled: null,
    };
    const schoolExpected = row.values.expected_standard_pupil_percent ?? null;
    const schoolHigher = row.values.higher_standard_pupil_percent ?? null;
    const schoolScaled = row.values.average_scaled_score ?? null;
    return {
      subject: row.subject,
      topic: row.topic,
      schoolExpected,
      hampshireExpected: bench.hampshireExpected,
      englandExpected: bench.englandExpected,
      schoolHigher,
      hampshireHigher: bench.hampshireHigher,
      englandHigher: bench.englandHigher,
      schoolScaled,
      hampshireScaled: bench.hampshireScaled,
      englandScaled: bench.englandScaled,
      vsHampshire: ppDiff(schoolExpected, bench.hampshireExpected),
      vsEngland: ppDiff(schoolExpected, bench.englandExpected),
    };
  });
}

data.threeYearComparisons = buildComparisons(data);
data.findings = buildFindings(data);

if (!data.source.note?.includes("3-year")) {
  data.source.note = `${data.source.note ?? ""} Board findings use latest-year scores alongside DfE published 3-year averages (and local rolling means where official 3-year expected standards are unavailable.)`.trim();
}

writeFileSync(seedUrl, `${JSON.stringify(data, null, 2)}\n`);
console.log(
  `Updated findings (${data.findings.length}) and threeYearComparisons (${data.threeYearComparisons.length}) in seed.`,
);
for (const f of data.findings) {
  console.log(`- [${f.severity}] ${f.title}`);
}
