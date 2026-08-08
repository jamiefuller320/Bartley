import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { buildMonitorPayload } from "../src/lib/build-monitor-payload";
import { buildChangeLog } from "../src/lib/board";
import {
  equityHistoryFromCsp,
  historyFromCsp,
  progressHistoryFromCsp,
  type CspHistoryBundle,
} from "../src/lib/csp-history";
import { buildFindings } from "../src/lib/evaluate";
import type { PeerSchoolsBundle, SchoolMonitorData } from "../src/lib/types";

const seedUrl = new URL("../src/data/bartley-2024-25.json", import.meta.url);
const peersUrl = new URL("../src/data/peer-schools.json", import.meta.url);
const changeLogUrl = new URL("../src/data/change-log.json", import.meta.url);
const cspUrl = new URL("../src/data/bartley-csp-history.json", import.meta.url);

function readJson<T>(url: URL): T | null {
  if (!existsSync(url)) return null;
  return JSON.parse(readFileSync(url, "utf8")) as T;
}

/** Prefer longer CSP-enriched series when the EES builder is thinner. */
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

function mergeCspHistory(
  data: SchoolMonitorData,
  csp: CspHistoryBundle | null,
): SchoolMonitorData {
  if (!csp?.history?.length) return data;
  const cspHistory = historyFromCsp(csp);
  const cspEquity = equityHistoryFromCsp(csp);
  const cspProgress = progressHistoryFromCsp(csp);
  return {
    ...data,
    history: preferLongerHistory(cspHistory, data.history) ?? data.history,
    equityHistory:
      preferLongerHistory(cspEquity, data.equityHistory) ?? data.equityHistory,
    progressHistory: cspProgress.length
      ? cspProgress
      : data.progressHistory,
    periods: Array.from(
      new Set([
        ...(data.periods ?? []),
        ...csp.history.map((h) => h.period),
      ]),
    ).sort(),
    source: {
      ...data.source,
      compareDownloads:
        csp.source?.url ??
        data.source.compareDownloads ??
        "https://www.compare-school-performance.service.gov.uk/download-data",
      historyCoverage: csp.source ?? data.source.historyCoverage,
      note: `${data.source.note} Rich multi-year subject history is merged from Compare school performance KS2 CSV downloads (${csp.source?.years?.join(", ") ?? "multi-year"}).`,
    },
  };
}

function mergePreservedFields(
  previous: SchoolMonitorData | null,
  next: SchoolMonitorData,
): SchoolMonitorData {
  if (!previous) return next;

  return {
    ...next,
    history: preferLongerHistory(previous.history, next.history),
    equityHistory: preferLongerHistory(previous.equityHistory, next.equityHistory),
    progressHistory: next.progressHistory?.length
      ? next.progressHistory
      : previous.progressHistory,
    threeYear: next.threeYear?.length ? next.threeYear : previous.threeYear,
    threeYearComparisons: next.threeYearComparisons?.length
      ? next.threeYearComparisons
      : previous.threeYearComparisons,
    source: {
      ...next.source,
      compareDownloads:
        next.source.compareDownloads ?? previous.source.compareDownloads,
      historyCoverage:
        next.source.historyCoverage ?? previous.source.historyCoverage,
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
}

const previous = readJson<SchoolMonitorData>(seedUrl);
const peers = readJson<PeerSchoolsBundle>(peersUrl);
const csp = readJson<CspHistoryBundle>(cspUrl);

const fresh = await buildMonitorPayload("116338");
fresh.source.refreshedAt = new Date().toISOString().slice(0, 10);
const withCsp = mergeCspHistory(fresh, csp);
const data = mergePreservedFields(previous, withCsp);
data.findings = buildFindings(data);

const changeLog = buildChangeLog(previous, data, peers, peers);
writeFileSync(changeLogUrl, `${JSON.stringify(changeLog, null, 2)}\n`);
writeFileSync(seedUrl, `${JSON.stringify(data, null, 2)}\n`);

console.log(
  `Updated src/data/bartley-2024-25.json (refreshedAt ${data.source.refreshedAt})`,
);
console.log(
  `history periods: ${new Set((data.history ?? []).map((h) => h.period)).size}; findings: ${data.findings.length}`,
);
console.log(
  `Updated src/data/change-log.json (${changeLog.items.length} moved figures)`,
);
