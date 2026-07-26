import type { PeerSchoolsBundle, SchoolMonitorData } from "@/lib/types";
import { fmtPct, fmtPp } from "@/lib/format";
import { ppGap } from "@/lib/peers";
import {
  classifySchoolSector,
  schoolSectorLabel,
} from "@/lib/school-sector";

export function PeerComparisonTable({
  peers,
  bartley,
}: {
  peers: PeerSchoolsBundle;
  bartley: SchoolMonitorData;
}) {
  const rwm = bartley.subjects.find(
    (s) => s.subject === "Reading, writing and maths",
  );
  const reading = bartley.subjects.find((s) => s.subject === "Reading");
  const writing = bartley.subjects.find((s) => s.subject === "Writing");
  const maths = bartley.subjects.find((s) => s.subject === "Maths");
  const gps = bartley.subjects.find(
    (s) => s.subject === "Grammar, punctuation and spelling",
  );

  const bartleySector = classifySchoolSector(
    undefined,
    bartley.profile.schoolTypeLabel ?? bartley.profile.schoolType,
  );

  const rows = [
    {
      name: "Bartley",
      short: "Bartley",
      url: bartley.source.primarySite,
      n: bartley.profile.eligiblePupils,
      rwm: rwm?.schoolExpected ?? null,
      reading: reading?.schoolExpected ?? null,
      writing: writing?.schoolExpected ?? null,
      maths: maths?.schoolExpected ?? null,
      gps: gps?.schoolExpected ?? null,
      disPct: bartley.profile.disadvantagedPercent ?? null,
      sectorLabel: schoolSectorLabel(bartleySector),
      schoolType:
        bartley.profile.schoolTypeLabel ?? bartley.profile.schoolType ?? "—",
      highlight: true,
    },
    ...peers.peers.map((peer) => ({
      name: peer.name,
      short: peer.short,
      url: peer.compareUrl,
      n: peer.latest.eligiblePupils,
      rwm: peer.latest.rwmExpected,
      reading: peer.latest.readingExpected,
      writing: peer.latest.writingExpected,
      maths: peer.latest.mathsExpected,
      gps: peer.latest.gpsExpected,
      disPct: peer.latest.disadvantagedPercent,
      sectorLabel:
        peer.sectorLabel ??
        schoolSectorLabel(
          peer.sector ??
            classifySchoolSector(peer.minorGroup, peer.schoolType),
        ),
      schoolType: peer.schoolType ?? "—",
      highlight: false,
    })),
    {
      name: "Peer average (top 3)",
      short: "Peer avg",
      url: null as string | null,
      n: null as number | null,
      rwm: peers.peerAverageLatest.rwmExpected,
      reading: peers.peerAverageLatest.readingExpected,
      writing: peers.peerAverageLatest.writingExpected,
      maths: peers.peerAverageLatest.mathsExpected,
      gps: peers.peerAverageLatest.gpsExpected,
      disPct: null as number | null,
      sectorLabel: "State-funded",
      schoolType: "—",
      highlight: false,
    },
  ];

  return (
    <div className="table-wrap" id="peers">
      <table className="data-table peer-table">
        <thead>
          <tr>
            <th>School</th>
            <th>Sector</th>
            <th>n</th>
            <th>RWM</th>
            <th>Reading</th>
            <th>Writing</th>
            <th>Maths</th>
            <th>GPS</th>
            <th>vs Bartley RWM</th>
            <th>Disadv. %</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const vsBartley = ppGap(row.rwm, rwm?.schoolExpected);
            return (
              <tr
                key={row.name}
                className={row.highlight ? "row-focus" : undefined}
              >
                <td>
                  {row.url ? (
                    <a href={row.url} target="_blank" rel="noreferrer">
                      {row.short}
                    </a>
                  ) : (
                    row.short
                  )}
                  {row.schoolType && row.schoolType !== "—" ? (
                    <span className="feeder-meta">{row.schoolType}</span>
                  ) : null}
                </td>
                <td>
                  <span className="sector-pill sector-state">
                    {row.sectorLabel}
                  </span>
                </td>
                <td>{row.n ?? "—"}</td>
                <td>{fmtPct(row.rwm)}</td>
                <td>{fmtPct(row.reading)}</td>
                <td>{fmtPct(row.writing)}</td>
                <td>{fmtPct(row.maths)}</td>
                <td>{fmtPct(row.gps)}</td>
                <td className={deltaClass(vsBartley)}>
                  {row.highlight ? "—" : fmtPp(vsBartley)}
                </td>
                <td>{fmtPct(row.disPct)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="chart-note">
        Latest published expected standard (%). Peer links open Compare school
        performance. {peers.selection.method}
        {peers.selection.sectorNote
          ? ` ${peers.selection.sectorNote}`
          : ""}
      </p>
    </div>
  );
}

function deltaClass(value: number | null): string {
  if (value === null || value === undefined) return "";
  if (value >= 2) return "delta-up";
  if (value <= -2) return "delta-down";
  return "delta-flat";
}
