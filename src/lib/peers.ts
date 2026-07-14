import type { PeerSchoolsBundle } from "@/lib/types";

/** Overlay: none, peer average of the top 3, or a single peer URN. */
export type PeerOverlaySelection = "none" | "average" | string;

export const PEER_AVERAGE_LABEL = "Peer average (top 3)";

export function peerOverlayLabel(
  peers: PeerSchoolsBundle,
  selection: PeerOverlaySelection,
): string | null {
  if (selection === "none") return null;
  if (selection === "average") return PEER_AVERAGE_LABEL;
  const school = peers.peers.find((s) => s.urn === selection);
  return school?.short ?? school?.name ?? null;
}

export function peerMetricByPeriod(
  peers: PeerSchoolsBundle,
  selection: PeerOverlaySelection,
  subject: string,
  metric: "expected" | "higher" | "scaled",
): Map<string, number | null> {
  const map = new Map<string, number | null>();
  if (selection === "none") return map;

  for (const row of peers.history.filter((h) => h.subject === subject)) {
    let value: number | null = null;
    if (selection === "average") {
      value =
        metric === "expected"
          ? row.averageExpected
          : metric === "higher"
            ? row.averageHigher
            : row.averageScaled;
    } else {
      const bag =
        metric === "expected"
          ? row.byUrnExpected
          : metric === "higher"
            ? row.byUrnHigher
            : row.byUrnScaled;
      value = bag[selection] ?? null;
    }
    map.set(row.period, value);
  }
  return map;
}

const SUBJECT_LATEST_KEY: Record<
  string,
  {
    expected: keyof PeerSchoolsBundle["peerAverageLatest"];
    peerExpected: keyof PeerSchoolsBundle["peers"][number]["latest"];
    peerHigher: keyof PeerSchoolsBundle["peers"][number]["latest"];
  }
> = {
  "Reading, writing and maths": {
    expected: "rwmExpected",
    peerExpected: "rwmExpected",
    peerHigher: "rwmHigher",
  },
  Reading: {
    expected: "readingExpected",
    peerExpected: "readingExpected",
    peerHigher: "readingHigher",
  },
  Writing: {
    expected: "writingExpected",
    peerExpected: "writingExpected",
    peerHigher: "writingHigher",
  },
  Maths: {
    expected: "mathsExpected",
    peerExpected: "mathsExpected",
    peerHigher: "mathsHigher",
  },
  "Grammar, punctuation and spelling": {
    expected: "gpsExpected",
    peerExpected: "gpsExpected",
    peerHigher: "gpsHigher",
  },
  Science: {
    expected: "scienceExpected",
    peerExpected: "scienceExpected",
    peerHigher: "scienceExpected",
  },
};

export function peerLatestValue(
  peers: PeerSchoolsBundle,
  selection: PeerOverlaySelection,
  subject: string,
  metric: "expected" | "higher" | "scaled",
): number | null {
  if (selection === "none") return null;

  if (selection === "average") {
    if (metric === "scaled") {
      const byPeriod = peerMetricByPeriod(peers, selection, subject, metric);
      const periods = [...byPeriod.keys()].sort();
      const latest = periods[periods.length - 1];
      return latest ? (byPeriod.get(latest) ?? null) : null;
    }
    if (metric === "higher") {
      const byPeriod = peerMetricByPeriod(peers, selection, subject, metric);
      const periods = [...byPeriod.keys()].sort();
      const latest = periods[periods.length - 1];
      return latest ? (byPeriod.get(latest) ?? null) : null;
    }
    const key = SUBJECT_LATEST_KEY[subject]?.expected;
    return key ? (peers.peerAverageLatest[key] ?? null) : null;
  }

  const school = peers.peers.find((s) => s.urn === selection);
  if (!school) return null;
  const keys = SUBJECT_LATEST_KEY[subject];
  if (!keys) return null;

  if (metric === "scaled") {
    if (subject === "Reading") return school.latest.readingScaled;
    if (subject === "Maths") return school.latest.mathsScaled;
    if (subject === "Grammar, punctuation and spelling") {
      return school.latest.gpsScaled;
    }
    return null;
  }
  if (metric === "higher") {
    return (school.latest[keys.peerHigher] as number | null) ?? null;
  }
  return (school.latest[keys.peerExpected] as number | null) ?? null;
}

export function ppGap(
  bartley: number | null | undefined,
  peer: number | null | undefined,
): number | null {
  if (bartley == null || peer == null) return null;
  return Math.round((bartley - peer) * 10) / 10;
}
