import { getBartleyMonitorData } from "@/lib/data";
import { scorecard } from "@/lib/evaluate";
import { fmtPct, fmtPp } from "@/lib/format";
import { FindingsList } from "@/components/FindingsList";
import { SubjectComparisonChart } from "@/components/SubjectComparisonChart";
import { EquityChart } from "@/components/EquityChart";
import { ProgressChart } from "@/components/ProgressChart";
import { ComparisonTable } from "@/components/ComparisonTable";
import { CohortProfile } from "@/components/CohortProfile";

export default function HomePage() {
  const data = getBartleyMonitorData();
  const score = scorecard(data.subjects);
  const rwm = data.subjects.find(
    (s) => s.subject === "Reading, writing and maths",
  );

  return (
    <main>
      <header className="site-header">
        <div className="shell header-inner">
          <p className="tool-mark">Bartley Insight</p>
          <nav className="header-nav" aria-label="Sections">
            <a href="#evaluation">Evaluation</a>
            <a href="#attainment">Attainment</a>
            <a href="#equity">Equity</a>
            <a href="#progress">Progress</a>
            <a href="#source">Source</a>
          </nav>
        </div>
      </header>

      <section className="hero">
        <div className="hero-atmosphere" aria-hidden="true" />
        <div className="shell hero-copy">
          <p className="hero-kicker">School performance monitor</p>
          <h1>{data.profile.name}</h1>
          <p className="hero-lede">
            Evaluate Key Stage 2 outcomes against Hampshire and England using
            the same DfE statistics published on Compare school and college
            performance.
          </p>
          <div className="hero-actions">
            <a className="btn-primary" href="#evaluation">
              View evaluation
            </a>
            <a
              className="btn-ghost"
              href={data.source.primarySite}
              target="_blank"
              rel="noreferrer"
            >
              Official school page
            </a>
          </div>
        </div>
      </section>

      <section className="section" id="evaluation">
        <div className="shell">
          <div className="section-intro">
            <h2>Evaluation snapshot</h2>
            <p>
              Academic year {data.period.replace("/", "–")}. Combined reading,
              writing and maths sits {fmtPp(score.vsEngland)} versus England.
            </p>
          </div>

          <div className="snapshot-row" role="list">
            <div className="snapshot-metric" role="listitem">
              <span className="snapshot-label">RWM expected</span>
              <strong>{fmtPct(score.rwmExpected)}</strong>
              <span className="snapshot-sub">
                England {fmtPct(rwm?.englandExpected)} · Hampshire{" "}
                {fmtPct(rwm?.hampshireExpected)}
              </span>
            </div>
            <div className="snapshot-metric" role="listitem">
              <span className="snapshot-label">vs England</span>
              <strong>{fmtPp(score.vsEngland)}</strong>
              <span className="snapshot-sub">Combined expected standard</span>
            </div>
            <div className="snapshot-metric" role="listitem">
              <span className="snapshot-label">Subjects ≥ England</span>
              <strong>
                {score.subjectsAtOrAboveEngland}/{score.subjectsCompared}
              </strong>
              <span className="snapshot-sub">Expected standard measures</span>
            </div>
            <div className="snapshot-metric" role="listitem">
              <span className="snapshot-label">Year 6 pupils</span>
              <strong>{data.profile.pupilsAged11 ?? "—"}</strong>
              <span className="snapshot-sub">
                {data.profile.localAuthority} · URN {data.profile.urn}
              </span>
            </div>
          </div>

          <FindingsList findings={data.findings} />
        </div>
      </section>

      <section className="section section-alt" id="attainment">
        <div className="shell">
          <div className="section-intro">
            <h2>Attainment by subject</h2>
            <p>
              Percentage of pupils meeting the expected standard, compared with
              Hampshire and England averages for state-funded schools.
            </p>
          </div>
          <SubjectComparisonChart subjects={data.subjects} metric="expected" />
          <ComparisonTable subjects={data.subjects} />

          <div className="section-intro stacked">
            <h3>Higher standard</h3>
            <p>
              Share of pupils working at greater depth / higher standard where
              published.
            </p>
          </div>
          <SubjectComparisonChart subjects={data.subjects} metric="higher" />
        </div>
      </section>

      <section className="section" id="equity">
        <div className="shell split">
          <div>
            <div className="section-intro">
              <h2>Pupil group gaps</h2>
              <p>
                Combined reading, writing and maths expected standard for key
                pupil groups at Bartley.
              </p>
            </div>
            <EquityChart equity={data.equity} />
          </div>
          <div>
            <div className="section-intro">
              <h2>Cohort context</h2>
              <p>
                Characteristics of the assessed cohort help interpret gaps and
                comparisons.
              </p>
            </div>
            <CohortProfile profile={data.profile} />
            <p className="profile-meta">
              {[
                data.profile.schoolTypeLabel,
                data.profile.religiousDenomination,
                data.profile.ageRange ? `Ages ${data.profile.ageRange}` : null,
                data.profile.address,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        </div>
      </section>

      <section className="section section-alt" id="progress">
        <div className="shell">
          <div className="section-intro">
            <h2>Progress measures</h2>
            <p>
              KS2 progress scores are unavailable for 2024 and 2025 because
              those cohorts did not sit KS1 tests. The chart shows the last
              published confidence intervals.
            </p>
          </div>
          <ProgressChart progress={data.progress} />
        </div>
      </section>

      <section className="section" id="source">
        <div className="shell source-block">
          <div className="section-intro">
            <h2>Data source</h2>
            <p>{data.source.note}</p>
          </div>
          <ul className="source-list">
            <li>
              <a href={data.source.primarySite} target="_blank" rel="noreferrer">
                Compare school and college performance — Bartley CofE Junior
              </a>
            </li>
            <li>
              <a
                href="https://explore-education-statistics.service.gov.uk/find-statistics/key-stage-2-attainment"
                target="_blank"
                rel="noreferrer"
              >
                {data.source.release}
              </a>
            </li>
            <li>
              <a href={data.source.api} target="_blank" rel="noreferrer">
                Explore education statistics API
              </a>
            </li>
          </ul>
          <p className="muted">
            This tool reads institution-level KS2 attainment via the DfE
            Explore education statistics API — the open data behind the Compare
            school performance service. Live refresh endpoint:{" "}
            <code>/api/school/116338</code>
          </p>
        </div>
      </section>

      <footer className="site-footer">
        <div className="shell footer-inner">
          <p>Bartley Insight · school performance evaluation</p>
          <p>URN {data.profile.urn} · Hampshire</p>
        </div>
      </footer>
    </main>
  );
}
