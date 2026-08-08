import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildFindings } from "./evaluate";
import type { SchoolMonitorData } from "./types";

function baseData(
  overrides: Partial<SchoolMonitorData> = {},
): Pick<
  SchoolMonitorData,
  | "subjects"
  | "equity"
  | "history"
  | "equityHistory"
  | "threeYear"
  | "threeYearComparisons"
> {
  return {
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
    ],
    equity: [
      { group: "Boys", expected: 45, higher: 5 },
      { group: "Girls", expected: 77, higher: 14 },
      { group: "Disadvantaged", expected: 39, higher: 0 },
      { group: "Not disadvantaged", expected: 68, higher: 13 },
    ],
    history: [
      {
        period: "2022/2023",
        subject: "Reading, writing and maths",
        schoolExpected: 63,
        hampshireExpected: 61,
        englandExpected: 60,
        schoolHigher: 8,
        schoolScaled: null,
      },
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
      { period: "2022/2023", group: "Boys", expected: 59, higher: null },
      { period: "2023/2024", group: "Boys", expected: 57, higher: null },
      { period: "2024/2025", group: "Boys", expected: 45, higher: null },
      { period: "2022/2023", group: "Girls", expected: 68, higher: null },
      { period: "2023/2024", group: "Girls", expected: 62, higher: null },
      { period: "2024/2025", group: "Girls", expected: 77, higher: null },
      { period: "2022/2023", group: "Disadvantaged", expected: 31, higher: null },
      { period: "2023/2024", group: "Disadvantaged", expected: 8, higher: null },
      { period: "2024/2025", group: "Disadvantaged", expected: 39, higher: null },
      {
        period: "2022/2023",
        group: "Not disadvantaged",
        expected: 68,
        higher: null,
      },
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
    ...overrides,
  };
}

describe("buildFindings", () => {
  it("includes GPS in subject findings and dual-signal RWM detail", () => {
    const findings = buildFindings(baseData());
    const titles = findings.map((f) => f.title);
    assert.ok(titles.some((t) => t.includes("Grammar, punctuation and spelling") || t.includes("GPS") || t.includes("below England")));
    const gps = findings.find((f) =>
      f.detail.includes("Grammar, punctuation and spelling"),
    );
    assert.ok(gps);
    assert.equal(gps?.severity, "watch");

    const rwm = findings.find((f) => f.title.includes("Combined RWM"));
    assert.ok(rwm?.detail.includes("3-year average"));
    assert.equal(rwm?.severity, "positive");
  });

  it("flags gender and disadvantage gaps as priorities with rolling context", () => {
    const findings = buildFindings(baseData());
    const gender = findings.find((f) => f.title.includes("Gender"));
    const dis = findings.find((f) => f.title.includes("Disadvantage"));
    assert.equal(gender?.severity, "priority");
    assert.ok(gender?.detail.includes("Three-year local average gap"));
    assert.equal(dis?.severity, "priority");
    assert.ok(dis?.detail.includes("Three-year local average gap"));
  });
});
