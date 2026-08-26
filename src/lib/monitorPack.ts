import {
  getBartleyMonitorData,
  getChangeLog,
  getFeederSchoolsData,
  getPeerSchoolsData,
  getSipTargets,
} from "@/lib/data";
import { buildExecutiveSummary } from "@/lib/board";
import type { ChangeLog, ExecutiveSummary, SipTargetsBundle } from "@/lib/board";
import type {
  FeederSchoolsBundle,
  PeerSchoolsBundle,
  SchoolMonitorData,
} from "@/lib/types";

/**
 * School-agnostic monitor pack — one bundle per URN for dashboard rendering.
 * Bartley (116338) is the seed implementation; additional URNs can register loaders.
 */
export interface SchoolMonitorPack {
  urn: string;
  data: SchoolMonitorData;
  peers: PeerSchoolsBundle;
  feeders: FeederSchoolsBundle;
  changeLog: ChangeLog;
  sipTargets: SipTargetsBundle;
  summary: ExecutiveSummary;
}

const BARTLEY_URN = "116338";

function loadBartleyPack(): SchoolMonitorPack {
  const data = getBartleyMonitorData();
  const peers = getPeerSchoolsData();
  return {
    urn: BARTLEY_URN,
    data,
    peers,
    feeders: getFeederSchoolsData(),
    changeLog: getChangeLog(),
    sipTargets: getSipTargets(),
    summary: buildExecutiveSummary(data, peers),
  };
}

const PACK_LOADERS: Record<string, () => SchoolMonitorPack> = {
  [BARTLEY_URN]: loadBartleyPack,
};

/** Load a monitor pack for a URN. Falls back to Bartley when unknown. */
export function loadSchoolMonitorPack(urn = BARTLEY_URN): SchoolMonitorPack {
  const loader = PACK_LOADERS[urn] ?? PACK_LOADERS[BARTLEY_URN];
  return loader();
}

/** URNs with registered monitor packs (for future multi-school routing). */
export function listMonitorPackUrns(): string[] {
  return Object.keys(PACK_LOADERS);
}
