import seed from "@/data/bartley-2024-25.json";
import peerSeed from "@/data/peer-schools.json";
import changeLogSeed from "@/data/change-log.json";
import sipSeed from "@/data/sip-targets.json";
import type {
  PeerSchoolsBundle,
  SchoolMonitorData,
} from "@/lib/types";
import type { ChangeLog, SipTargetsBundle } from "@/lib/board";

export function getBartleyMonitorData(): SchoolMonitorData {
  return seed as SchoolMonitorData;
}

export function getPeerSchoolsData(): PeerSchoolsBundle {
  return peerSeed as PeerSchoolsBundle;
}

export function getChangeLog(): ChangeLog {
  return changeLogSeed as ChangeLog;
}

export function getSipTargets(): SipTargetsBundle {
  return sipSeed as SipTargetsBundle;
}
