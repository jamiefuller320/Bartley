import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { buildMonitorPayload } from "../src/lib/build-monitor-payload";
import { buildChangeLog } from "../src/lib/board";
import { buildFindings } from "../src/lib/evaluate";
import type { PeerSchoolsBundle, SchoolMonitorData } from "../src/lib/types";

const seedUrl = new URL("../src/data/bartley-2024-25.json", import.meta.url);
const peersUrl = new URL("../src/data/peer-schools.json", import.meta.url);
const changeLogUrl = new URL("../src/data/change-log.json", import.meta.url);

function readJson<T>(url: URL): T | null {
  if (!existsSync(url)) return null;
  return JSON.parse(readFileSync(url, "utf8")) as T;
}

/** Prefer longer CSP-enriched series from the previous seed when the EES builder is thinner. */
function preferLongerHistory<T extends { period: string }>(
  previous: T[] | undefined,
  next: T[] | undefined,
): T[] | undefined {
  if (!previous?.length) return next;
  if (!next?.length) return previous;
  const prevPeriods = new Set(previous.map((r) => r.period));
  const nextPeriods = new Set(next.map((r) => r.period));
  return prevPeriods.size >= nextPeriods.size ? previous : next;
}

function mergePreservedFields(
  previous: SchoolMonitorData | null,
  next: SchoolMonitorData,
): SchoolMonitorData {
  if (!previous) return next;

  const merged: SchoolMonitorData = {
    ...next,
    history: preferLongerHistory(previous.history, next.history),
    equityHistory: preferLongerHistory(previous.equityHistory, next.equityHistory),
    progressHistory: previous.progressHistory ?? next.progressHistory,
    threeYear: next.threeYear?.length ? next.threeYear : previous.threeYear,
    threeYearComparisons: next.threeYearComparisons?.length
      ? next.threeYearComparisons
      : previous.threeYearComparisons,
    source: {
      ...next.source,
      compareDownloads:
        previous.source.compareDownloads ?? next.source.compareDownloads,
      historyCoverage:
        previous.source.historyCoverage ?? next.source.historyCoverage,
      note:
        previous.source.historyCoverage != null
          ? `${next.source.note} Rich multi-year subject history is preserved from Compare school performance KS2 CSV downloads where longer than the EES institution extract.`
          : next.source.note,
    },
    profile: {
      ...next.profile,
      threeYearEligible:
        next.profile.threeYearEligible ?? previous.profile.threeYearEligible,
      disadvantagedCount:
        next.profile.disadvantagedCount ?? previous.profile.disadvantagedCount,
      notDisadvantagedCount:
        next.profile.notDisadvantagedCount ??
        previous.profile.notDisadvantagedCount,
      senCombinedPercent:
        next.profile.senCombinedPercent ?? previous.profile.senCombinedPercent,
    },
  };

  merged.findings = buildFindings(merged);
  return merged;
}

const previous = readJson<SchoolMonitorData>(seedUrl);
const peers = readJson<PeerSchoolsBundle>(peersUrl);

const fresh = await buildMonitorPayload("116338");
fresh.source.refreshedAt = new Date().toISOString().slice(0, 10);
const data = mergePreservedFields(previous, fresh);

const changeLog = buildChangeLog(previous, data, peers, peers);
writeFileSync(changeLogUrl, `${JSON.stringify(changeLog, null, 2)}\n`);
writeFileSync(seedUrl, `${JSON.stringify(data, null, 2)}\n`);

console.log(
  `Updated src/data/bartley-2024-25.json (refreshedAt ${data.source.refreshedAt})`,
);
console.log(
  `threeYear subjects: ${data.threeYear?.length ?? 0}; comparisons: ${data.threeYearComparisons?.length ?? 0}; findings: ${data.findings.length}`,
);
console.log(
  `Updated src/data/change-log.json (${changeLog.items.length} moved figures)`,
);
