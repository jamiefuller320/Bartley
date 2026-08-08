import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildChangeLog,
  buildExecutiveSummary,
  fmtPctWithN,
  volatilityNote,
} from "./board";
import type { PeerSchoolsBundle, SchoolMonitorData } from "./types";

const sample: SchoolMonitorData = {
  source: {
    primarySite: "https://example.test",
    api: "https://api.example.test",
    datasets: {
      schoolPerformance: "x",
      schoolInformation: "y",
      laPerformance: "z",
    },
    release: "test",
    note: "test",
    refreshedAt: "2026-08-08",
  },
  profile: {
    name: "Bartley",
    urn: "116338",
    laEstab: "8503197",
    localAuthority: "Hampshire",
    phase: "Junior",
    eligiblePupils: 81,
    boysCount: 38,
    girlsCount: 43,
    disadvantagedCount: 18,
    threeYearEligible: 268,
  },
  period: "2024/2025",
  subjects: [
    {
      subject: "Reading, writing and maths",
      schoolExpected: 62,
      hampshireExpected: 63,
      englandExpected: 62,
      schoolHigher: 10,
      hampshireHigher: 9,
      englandHigher: 8,
      schoolScaled: null,
      hampshireScaled: null,
      englandScaled: null,
      vsHampshire: -1,
      vsEngland: 0,
    },
    {
      subject: "Reading",
      schoolExpected: 72,
      hampshireExpected: 76,
      englandExpected: 75,
      schoolHigher: 33,
      hampshireHigher: 34,
      englandHigher: 33,
      schoolScaled: 105,
      hampshireScaled: 106,
      englandScaled: 106,
      vsHampshire: -4,
      vsEngland: -3,
    },
    {
      subject: "Writing",
      schoolExpected: 78,
      hampshireExpected: 74,
      englandExpected: 72,
      schoolHigher: 15,
      hampshireHigher: 14,
      englandHigher: 13,
      schoolScaled: null,
      hampshireScaled: null,
      englandScaled: null,
      vsHampshire: 4,
      vsEngland: 6,
    },
    {
      subject: "Grammar, punctuation and spelling",
      schoolExpected: 70,
      hampshireExpected: 74,
      englandExpected: 75,
      schoolHigher: 30,
      hampshireHigher: 34,
      englandHigher: 33,
      schoolScaled: 104,
      hampshireScaled: 105,
      englandScaled: 105,
      vsHampshire: -4,
      vsEngland: -5,
    },
  ],
  progress: [],
  equity: [
    { group: "Boys", expected: 45, higher: 5 },
    { group: "Girls", expected: 77, higher: 14 },
    { group: "Disadvantaged", expected: 39, higher: 0 },
    { group: "Not disadvantaged", expected: 68, higher: 13 },
  ],
  history: [
    {
      period: "2023/2024",
      subject: "Reading, writing and maths",
      schoolExpected: 60,
      hampshireExpected: 60,
      englandExpected: 61,
      schoolHigher: 7,
      schoolScaled: null,
    },
    {
      period: "2024/2025",
      subject: "Reading, writing and maths",
      schoolExpected: 62,
      hampshireExpected: 63,
      englandExpected: 62,
      schoolHigher: 10,
      schoolScaled: null,
    },
  ],
  equityHistory: [
    { period: "2023/2024", group: "Boys", expected: 57, higher: null },
    { period: "2024/2025", group: "Boys", expected: 45, higher: null },
    { period: "2023/2024", group: "Girls", expected: 62, higher: null },
    { period: "2024/2025", group: "Girls", expected: 77, higher: null },
    { period: "2023/2024", group: "Disadvantaged", expected: 8, higher: null },
    { period: "2024/2025", group: "Disadvantaged", expected: 39, higher: null },
    {
      period: "2023/2024",
      group: "Not disadvantaged",
      expected: 68,
      higher: null,
    },
    {
      period: "2024/2025",
      group: "Not disadvantaged",
      expected: 68,
      higher: null,
    },
  ],
  findings: [],
  threeYear: [
    {
      subject: "Reading, writing and maths",
      breakdown: "3 year average",
      topic: "Average (2023 to 2025)",
      values: {
        expected_standard_pupil_percent: 62,
        higher_standard_pupil_percent: 8,
        average_scaled_score: null,
      },
    },
  ],
  threeYearComparisons: [
    {
      subject: "Reading, writing and maths",
      topic: "Average (2023 to 2025)",
      schoolExpected: 62,
      hampshireExpected: 61,
      englandExpected: 61,
      schoolHigher: 8,
      hampshireHigher: 9,
      englandHigher: 8,
      schoolScaled: null,
      hampshireScaled: null,
      englandScaled: null,
      vsHampshire: 1,
      vsEngland: 1,
    },
  ],
};

const peers = {
  selection: {
    method: "test",
    bartleyUrn: "116338",
    bartleyLatestEligible: 81,
    years: ["2024-2025"],
  },
  peers: [],
  peerAverageLatest: {
    rwmExpected: 81,
    readingExpected: 85,
    writingExpected: 86,
    mathsExpected: 87,
    gpsExpected: 88,
    scienceExpected: 90,
  },
  history: [],
} as unknown as PeerSchoolsBundle;

describe("fmtPctWithN", () => {
  it("uses of-N sample-size wording", () => {
    assert.equal(fmtPctWithN(62, 81), "62% (of 81)");
  });
});

describe("volatilityNote", () => {
  it("avoids n= wording", () => {
    const note = volatilityNote(81);
    assert.ok(note?.startsWith("With 81 pupils"));
    assert.ok(!note?.includes("n="));
  });
});

describe("buildExecutiveSummary", () => {
  it("surfaces 3-year metric and equity risks with rolling context", () => {
    const summary = buildExecutiveSummary(sample, peers);
    const three = summary.headlineMetrics.find((m) =>
      m.label.includes("3-year"),
    );
    assert.ok(three?.value.includes("62%"));
    assert.ok(summary.risks.some((r) => r.includes("Boys")));
    assert.ok(summary.risks.some((r) => r.toLowerCase().includes("three-year")));
  });
});

describe("buildChangeLog", () => {
  it("lists moved headline figures between seeds", () => {
    const previous = structuredClone(sample);
    previous.subjects[0].schoolExpected = 60;
    previous.source.refreshedAt = "2026-07-01";
    const log = buildChangeLog(previous, sample, peers, peers);
    assert.ok(log.items.some((item) => item.label === "RWM expected"));
    assert.equal(
      log.items.find((item) => item.label === "RWM expected")?.delta,
      "+2 pp",
    );
  });
});
