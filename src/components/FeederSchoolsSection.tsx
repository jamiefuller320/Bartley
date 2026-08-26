import type { FeederSchoolsBundle, FeederSchool } from "@/lib/types";
import { fmtNum, fmtPct } from "@/lib/format";
import { PhonicsBenchmarksChart } from "@/components/PhonicsBenchmarksChart";
import {
  classifySchoolSector,
  schoolSectorLabel,
} from "@/lib/school-sector";
import Link from "next/link";

function hasPhonicsData(schools: FeederSchool[]): boolean {
  return schools.some(
    (s) =>
      s.latest.phonicsYear1Expected != null ||
      s.latest.phonicsByEndYear2Expected != null,
  );
}

function hasKs1Data(schools: FeederSchool[]): boolean {
  return schools.some(
    (s) =>
      s.latest.ks1ReadingExpected != null ||
      s.latest.ks1WritingExpected != null ||
      s.latest.ks1MathsExpected != null ||
      s.latest.ks1ScienceExpected != null,
  );
}

function sectorClass(sector?: FeederSchool["sector"]): string {
  if (sector === "independent") return "sector-pill sector-independent";
  if (sector === "state-funded") return "sector-pill sector-state";
  return "sector-pill sector-other";
}

function SchoolTable({
  schools,
  averageLabel,
  average,
  showReason,
}: {
  schools: FeederSchool[];
  averageLabel: string;
  average: FeederSchoolsBundle["feederAverage"];
  showReason?: boolean;
}) {
  const showPhonics = hasPhonicsData(schools);
  const showKs1 = hasKs1Data(schools);

  return (
    <div className="table-wrap">
      <p className="table-scroll-hint muted">
        Scroll sideways on smaller screens to see all columns.
      </p>
      <table className="data-table peer-table feeder-table">
        <caption className="sr-only">
          Feeder infant schools and local infant peers with census, absence, and
          optional ASP phonics or KS1 attainment overlays.
        </caption>
        <thead>
          <tr>
            <th>School</th>
            <th>Sector</th>
            <th>DfE</th>
            <th>NOR</th>
            <th>FSM ever</th>
            <th>SEN support</th>
            <th>EHC</th>
            <th>Absence</th>
            <th>Pers. abs.</th>
            {showPhonics ? <th>Phonics Y1</th> : null}
            {showKs1 ? <th>KS1 R/W/M</th> : null}
          </tr>
        </thead>
        <tbody>
          {schools.map((school) => {
            const sector =
              school.sector ??
              classifySchoolSector(school.minorGroup, school.schoolType);
            return (
              <tr key={school.urn}>
                <td>
                  <a href={school.compareUrl} target="_blank" rel="noreferrer">
                    {school.short}
                  </a>
                  <span className="feeder-meta">
                    {school.schoolType ? `${school.schoolType} · ` : ""}
                    {school.postcode}
                    {showReason && school.reason ? (
                      <>
                        <br />
                        <span className="muted feeder-reason">
                          {school.reason}
                        </span>
                      </>
                    ) : null}
                  </span>
                </td>
                <td>
                  <span className={sectorClass(sector)}>
                    {school.sectorLabel ?? schoolSectorLabel(sector)}
                  </span>
                </td>
                <td>
                  {school.laEstab.slice(0, 3)}/{school.laEstab.slice(3)}
                </td>
                <td>{fmtNum(school.latest.pupilsOnRoll, 0)}</td>
                <td>{fmtPct(school.latest.fsmEverPercent)}</td>
                <td>{fmtPct(school.latest.senSupportPercent)}</td>
                <td>{fmtPct(school.latest.ehcPercent)}</td>
                <td>{fmtPct(school.latest.absencePercent, 1)}</td>
                <td>{fmtPct(school.latest.persistentAbsencePercent, 1)}</td>
                {showPhonics ? (
                  <td>{fmtPct(school.latest.phonicsYear1Expected)}</td>
                ) : null}
                {showKs1 ? (
                  <td>
                    {[
                      school.latest.ks1ReadingExpected,
                      school.latest.ks1WritingExpected,
                      school.latest.ks1MathsExpected,
                    ].every((v) => v == null)
                      ? "—"
                      : [
                          fmtPct(school.latest.ks1ReadingExpected),
                          fmtPct(school.latest.ks1WritingExpected),
                          fmtPct(school.latest.ks1MathsExpected),
                        ].join(" / ")}
                  </td>
                ) : null}
              </tr>
            );
          })}
          <tr className="row-focus">
            <td colSpan={3}>{averageLabel}</td>
            <td>{fmtNum(average.pupilsOnRoll, 0)}</td>
            <td>{fmtPct(average.fsmEverPercent)}</td>
            <td>{fmtPct(average.senSupportPercent)}</td>
            <td>{fmtPct(average.ehcPercent)}</td>
            <td>{fmtPct(average.absencePercent, 1)}</td>
            <td>{fmtPct(average.persistentAbsencePercent, 1)}</td>
            {showPhonics ? <td>—</td> : null}
            {showKs1 ? <td>—</td> : null}
          </tr>
        </tbody>
      </table>
      {!showPhonics && !showKs1 ? (
        <p className="chart-note muted">
          School-level phonics and KS1 attainment are not in Compare school
          performance open downloads (KS1 is non-statutory and no longer
          collected centrally). Request ASP or local figures to add those
          columns.
        </p>
      ) : null}
    </div>
  );
}

export function FeederSchoolsSection({
  feeders,
}: {
  feeders: FeederSchoolsBundle;
}) {
  const latestPhonics = feeders.phonicsBenchmarks[feeders.phonicsBenchmarks.length - 1];
  const ctx = feeders.bartleyPriorLearningContext;

  return (
    <section className="section" id="feeders">
      <div className="shell">
        <div className="section-head">
          <h2>Feeder schools &amp; prior learning</h2>
          <p>
            Infant-stage context (ages 4–7) for the quality of learning children
            bring into Bartley from the three named state-funded infant feeders
            — Netley Marsh, St Michael and All Angels, and Copythorne — with a
            benchmark against the three strongest similar-size local{" "}
            <em>state-funded</em> infant schools on published signals. Published
            school-level signals here are <strong>census and absence</strong>,
            not KS2 attainment. Independent (private/public) schools are
            excluded because they do not report the same performance data.
          </p>
        </div>

        <div className="snapshot-row" role="list">
          <div className="snapshot-metric" role="listitem">
            <span className="snapshot-label">Feeder average NOR</span>
            <strong>{fmtNum(feeders.feederAverage.pupilsOnRoll, 0)}</strong>
            <span className="muted">
              Census · 3 named infants · {feeders.period.replace("/", "–")}
            </span>
          </div>
          <div className="snapshot-metric" role="listitem">
            <span className="snapshot-label">Feeder FSM ever</span>
            <strong>{fmtPct(feeders.feederAverage.fsmEverPercent)}</strong>
            <span className="muted">
              Census · peer avg {fmtPct(feeders.peerAverage.fsmEverPercent)}
            </span>
          </div>
          <div className="snapshot-metric" role="listitem">
            <span className="snapshot-label">Feeder absence</span>
            <strong>{fmtPct(feeders.feederAverage.absencePercent, 1)}</strong>
            <span className="muted">
              Attendance · peer avg {fmtPct(feeders.peerAverage.absencePercent, 1)}
            </span>
          </div>
          <div className="snapshot-metric" role="listitem">
            <span className="snapshot-label">Feeder persistent absence</span>
            <strong>
              {fmtPct(feeders.feederAverage.persistentAbsencePercent, 1)}
            </strong>
            <span className="muted">
              Attendance · peer avg{" "}
              {fmtPct(feeders.peerAverage.persistentAbsencePercent, 1)}
            </span>
          </div>
        </div>

        <div className="section-head stacked">
          <h3>Named Bartley feeders</h3>
          <p>
            Infant census and absence from Compare school performance (
            {feeders.period.replace("/", "–")}). These are not KS2 performance
            tables.
          </p>
        </div>
        <SchoolTable
          schools={feeders.feeders}
          averageLabel="Feeder average"
          average={feeders.feederAverage}
        />

        <div className="section-head stacked">
          <h3>
            Local infant attendance benchmark (top 3 similar size)
          </h3>
          <p>
            Ranked by lowest persistent absence then overall absence among
            similar-size local infants — an attendance proxy for intake
            stability, not an attainment league table.{" "}
            {feeders.selection.peers}
          </p>
        </div>
        <SchoolTable
          schools={feeders.peers}
          averageLabel="Attendance peer average"
          average={feeders.peerAverage}
          showReason
        />

        <div className="section-head stacked">
          <h3>Phonics context (Hampshire &amp; England)</h3>
          <p>
            Open data still publishes LA and national phonics only — not
            school-level feeder results. In{" "}
            {latestPhonics?.label ?? "the latest year"}, Hampshire Year 1
            expected standard was {fmtPct(latestPhonics?.hampshireYear1)}{" "}
            (England {fmtPct(latestPhonics?.englandYear1)}); by end of Year 2,{" "}
            {fmtPct(latestPhonics?.hampshireByEndYear2)} Hampshire /{" "}
            {fmtPct(latestPhonics?.englandByEndYear2)} England. Request feeder
            school phonics from ASP for intake attainment.
          </p>
        </div>
        <PhonicsBenchmarksChart rows={feeders.phonicsBenchmarks} />

        <div className="feeder-callout">
          <h3>Junior value-added context (KS2)</h3>
          <p>
            {ctx.note} Last published Bartley KS2 progress (
            {ctx.progressPeriod.replace("/", "–")}
            ): reading {fmtNum(ctx.readingProgress)}, writing{" "}
            {fmtNum(ctx.writingProgress)}, maths {fmtNum(ctx.mathsProgress)}.
            See also the{" "}
            <a href="#progress">progress measures</a> chart. On published
            absence, the named feeders currently look stronger than the local
            similar-size infant attendance peer pack — but without school-level
            phonics/KS1 the board cannot yet quantify prior-learning attainment
            directly.
          </p>
          <p className="analysis-cta">
            Board questions on prior learning are in the{" "}
            <Link href="/analysis#prior-learning">governor analysis</Link>.
          </p>
        </div>

        <p className="chart-note muted">{feeders.selection.ks1Note}</p>
        {feeders.selection.sectorNote ? (
          <p className="chart-note muted">{feeders.selection.sectorNote}</p>
        ) : null}
      </div>
    </section>
  );
}
