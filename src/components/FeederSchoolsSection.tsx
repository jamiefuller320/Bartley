import type { FeederSchoolsBundle, FeederSchool } from "@/lib/types";
import { fmtNum, fmtPct } from "@/lib/format";
import { PhonicsBenchmarksChart } from "@/components/PhonicsBenchmarksChart";
import Link from "next/link";

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
  return (
    <div className="table-wrap">
      <table className="data-table peer-table feeder-table">
        <thead>
          <tr>
            <th>School</th>
            <th>DfE</th>
            <th>NOR</th>
            <th>FSM ever</th>
            <th>SEN support</th>
            <th>EHC</th>
            <th>Absence</th>
            <th>Pers. abs.</th>
            <th>Phonics Y1</th>
            <th>KS1 R/W/M</th>
          </tr>
        </thead>
        <tbody>
          {schools.map((school) => (
            <tr key={school.urn}>
              <td>
                <a href={school.compareUrl} target="_blank" rel="noreferrer">
                  {school.short}
                </a>
                <span className="feeder-meta">
                  {school.postcode}
                  {showReason && school.reason ? (
                    <>
                      <br />
                      <span className="muted feeder-reason">{school.reason}</span>
                    </>
                  ) : null}
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
              <td>{fmtPct(school.latest.phonicsYear1Expected)}</td>
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
            </tr>
          ))}
          <tr className="row-focus">
            <td colSpan={2}>{averageLabel}</td>
            <td>{fmtNum(average.pupilsOnRoll, 0)}</td>
            <td>{fmtPct(average.fsmEverPercent)}</td>
            <td>{fmtPct(average.senSupportPercent)}</td>
            <td>{fmtPct(average.ehcPercent)}</td>
            <td>{fmtPct(average.absencePercent, 1)}</td>
            <td>{fmtPct(average.persistentAbsencePercent, 1)}</td>
            <td>—</td>
            <td>—</td>
          </tr>
        </tbody>
      </table>
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
        <div className="section-intro">
          <h2>Feeder schools &amp; prior learning</h2>
          <p>
            Context on the quality of learning children bring into Bartley from
            the three named infant feeders — Netley Marsh, St Michael and All
            Angels, and Copythorne — with a benchmark against the three
            strongest similar-size local infant schools on published signals.
          </p>
        </div>

        <div className="snapshot-row" role="list">
          <div className="snapshot-metric" role="listitem">
            <span className="snapshot-label">Feeder average NOR</span>
            <strong>{fmtNum(feeders.feederAverage.pupilsOnRoll, 0)}</strong>
            <span className="muted">3 named infants · {feeders.period.replace("/", "–")}</span>
          </div>
          <div className="snapshot-metric" role="listitem">
            <span className="snapshot-label">Feeder FSM ever</span>
            <strong>{fmtPct(feeders.feederAverage.fsmEverPercent)}</strong>
            <span className="muted">
              Peer avg {fmtPct(feeders.peerAverage.fsmEverPercent)}
            </span>
          </div>
          <div className="snapshot-metric" role="listitem">
            <span className="snapshot-label">Feeder absence</span>
            <strong>{fmtPct(feeders.feederAverage.absencePercent, 1)}</strong>
            <span className="muted">
              Peer avg {fmtPct(feeders.peerAverage.absencePercent, 1)}
            </span>
          </div>
          <div className="snapshot-metric" role="listitem">
            <span className="snapshot-label">Feeder persistent absence</span>
            <strong>
              {fmtPct(feeders.feederAverage.persistentAbsencePercent, 1)}
            </strong>
            <span className="muted">
              Peer avg {fmtPct(feeders.peerAverage.persistentAbsencePercent, 1)}
            </span>
          </div>
        </div>

        <div className="section-intro stacked">
          <h3>Named Bartley feeders</h3>
          <p>
            Census and absence from Compare school performance ({feeders.period.replace("/", "–")}).
            School-level phonics and KS1 attainment are no longer in open CSP
            downloads — columns remain ready for ASP or local figures.
          </p>
        </div>
        <SchoolTable
          schools={feeders.feeders}
          averageLabel="Feeder average"
          average={feeders.feederAverage}
        />

        <div className="section-intro stacked">
          <h3>Local infant benchmark (top 3 similar size)</h3>
          <p>{feeders.selection.peers}</p>
        </div>
        <SchoolTable
          schools={feeders.peers}
          averageLabel="Peer average"
          average={feeders.peerAverage}
          showReason
        />

        <div className="section-intro stacked">
          <h3>Phonics context (Hampshire &amp; England)</h3>
          <p>
            Open data still publishes LA and national phonics. In{" "}
            {latestPhonics?.label ?? "the latest year"}, Hampshire Year 1
            expected standard was {fmtPct(latestPhonics?.hampshireYear1)}{" "}
            (England {fmtPct(latestPhonics?.englandYear1)}); by end of Year 2,{" "}
            {fmtPct(latestPhonics?.hampshireByEndYear2)} Hampshire /{" "}
            {fmtPct(latestPhonics?.englandByEndYear2)} England. Request feeder
            school phonics from ASP to sit these beside intake quality.
          </p>
        </div>
        <PhonicsBenchmarksChart rows={feeders.phonicsBenchmarks} />

        <div className="feeder-callout">
          <h3>Why this matters for Bartley</h3>
          <p>
            {ctx.note} Last published progress ({ctx.progressPeriod.replace("/", "–")}
            ): reading {fmtNum(ctx.readingProgress)}, writing{" "}
            {fmtNum(ctx.writingProgress)}, maths {fmtNum(ctx.mathsProgress)}.
            On published absence, the named feeders currently look stronger than
            the local similar-size infant peer pack — but without school-level
            phonics/KS1 the board cannot yet quantify prior-learning attainment
            directly.
          </p>
          <p className="analysis-cta">
            Board questions on prior learning are in the{" "}
            <Link href="/analysis#prior-learning">governor analysis</Link>.
          </p>
        </div>

        <p className="chart-note muted">{feeders.selection.ks1Note}</p>
      </div>
    </section>
  );
}
