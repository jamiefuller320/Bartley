import seed from "@/data/bartley-2024-25.json";
import peerSeed from "@/data/peer-schools.json";
import type { PeerSchoolsBundle, SchoolMonitorData } from "@/lib/types";

export function getBartleyMonitorData(): SchoolMonitorData {
  return seed as SchoolMonitorData;
}

export function getPeerSchoolsData(): PeerSchoolsBundle {
  return peerSeed as PeerSchoolsBundle;
}
