import { getBartleyMonitorData, getPeerSchoolsData } from "@/lib/data";
import { scorecard } from "@/lib/evaluate";
import { fmtPct, fmtPp } from "@/lib/format";
import { FindingsList } from "@/components/FindingsList";
import { EquityChart } from "@/components/EquityChart";
import { ProgressChart } from "@/components/ProgressChart";
import { CohortProfile } from "@/components/CohortProfile";
import { MetricsWorkbench } from "@/components/MetricsWorkbench";
import { SiteHeader } from "@/components/SiteHeader";
import Link from "next/link";

export default function HomePage() {
  const data = getBartleyMonitorData();
  const peers = getPeerSchoolsData();
  const score = scorecard(data.subjects);
  const rwm = data.subjects.find(
    (s) => s.subject === "Reading, writing and maths",
  );
  const history = data.history ?? [];
  const progressHistory = data.progressHistory ?? [];

  return (
    <main>
      <SiteHeader active="home" />

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
            <a className="btn-primary" href="#charts">
              Open charts
            </a>
            <Link className="btn-ghost" href="/analysis">
              Governor analysis
            </Link>
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
          <p className="analysis-cta">
            Prefer a written briefing for the board?{" "}
            <Link href="/analysis">Open the governor analysis and question set</Link>
            .
          </p>
        </div>
      </section>

      <MetricsWorkbench
        subjects={data.subjects}
        history={history}
        progressHistory={progressHistory}
        period={data.period}
        peers={peers}
      />

      <section className="section" id="equity">
        <div className="shell split">
          <div>
            <div className="section-intro">
              <h2>Pupil group gaps</h2>
              <p>
                Combined reading, writing and maths expected standard for key
                pupil groups at Bartley. The axis is zoomed to the group range.
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
            Use the floating slider on the charts to switch between Bartley /
            Hampshire / England and Bartley year-on-year history. Peer overlays
            compare Bartley with the top three similar-size local juniors.
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
