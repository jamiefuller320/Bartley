import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  dualSignalVsBenchmark,
  formatPeriods,
  localRollingEquityGap,
  mean,
  ppDiff,
} from "./three-year";

describe("mean", () => {
  it("averages finite numbers and ignores nulls", () => {
    assert.equal(mean([60, null, 62, undefined, 63]), 61.7);
  });
});

describe("ppDiff", () => {
  it("returns signed one-decimal gap", () => {
    assert.equal(ppDiff(62, 61), 1);
    assert.equal(ppDiff(60, 62), -2);
    assert.equal(ppDiff(null, 61), null);
  });
});

describe("dualSignalVsBenchmark", () => {
  it("marks positive when latest is non-negative and rolling is not soft", () => {
    assert.equal(dualSignalVsBenchmark(0, 1).severity, "positive");
  });

  it("marks priority when latest and rolling are both soft", () => {
    assert.equal(dualSignalVsBenchmark(-6, -6).severity, "priority");
  });

  it("marks watch when only latest dips", () => {
    assert.equal(dualSignalVsBenchmark(-6, -2).severity, "watch");
  });
});

describe("localRollingEquityGap", () => {
  it("uses the latest three published years", () => {
    const history = [
      { period: "2021/2022", group: "Girls", expected: 80, higher: null },
      { period: "2022/2023", group: "Girls", expected: 68, higher: null },
      { period: "2023/2024", group: "Girls", expected: 62, higher: null },
      { period: "2024/2025", group: "Girls", expected: 77, higher: null },
      { period: "2022/2023", group: "Boys", expected: 59, higher: null },
      { period: "2023/2024", group: "Boys", expected: 57, higher: null },
      { period: "2024/2025", group: "Boys", expected: 45, higher: null },
    ];
    const gap = localRollingEquityGap(history, "Girls", "Boys");
    assert.equal(gap.higher, 69);
    assert.equal(gap.lower, 53.7);
    assert.equal(gap.gap, 15.3);
    assert.equal(formatPeriods(gap.periods), "2022/23–2024/25");
  });
});
