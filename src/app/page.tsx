import {
  getBartleyMonitorData,
  getChangeLog,
  getFeederSchoolsData,
  getPeerSchoolsData,
  getSipTargets,
} from "@/lib/data";
import { scorecard } from "@/lib/evaluate";
import {
  buildExecutiveSummary,
  fmtPctWithN,
  groupCount,
  threeYearRwm,
  volatilityNote,
  yearOnYear,
} from "@/lib/board";
import { fmtPct, fmtPp } from "@/lib/format";
import { FindingsList } from "@/components/FindingsList";
import { EquityChart } from "@/components/EquityChart";
import { EquityHistoryChart } from "@/components/EquityHistoryChart";
import { ProgressChart } from "@/components/ProgressChart";
import { CohortProfile } from "@/components/CohortProfile";
import { MetricsWorkbench } from "@/components/MetricsWorkbench";
import { PeerComparisonTable } from "@/components/PeerComparisonTable";
import { ExecutiveSummaryCard } from "@/components/ExecutiveSummaryCard";
import { ChangeLogCard } from "@/components/ChangeLogCard";
import { GlossaryPanel } from "@/components/GlossaryPanel";
import { FeederSchoolsSection } from "@/components/FeederSchoolsSection";
import { SipPrioritiesCard } from "@/components/SipPrioritiesCard";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { DashboardChapterNav } from "@/components/DashboardChapterNav";
import Link from "next/link";

export default function HomePage() {
  const data = getBartleyMonitorData();
  const peers = getPeerSchoolsData();
  const feeders = getFeederSchoolsData();
  const sipTargets = getSipTargets();
  const changeLog = getChangeLog();
  const score = scorecard(data.subjects);
  const summary = buildExecutiveSummary(data, peers);
  const rwm = data.subjects.find(
    (s) => s.subject === "Reading, writing and maths",
  );
  const history = data.history ?? [];
  const progressHistory = data.progressHistory ?? [];
  const rolling = threeYearRwm(data.threeYear);
  const cohortN = groupCount(data.profile, "All pupils");
  const yoy = yearOnYear(history, "Reading, writing and maths");
  const volatility = volatilityNote(cohortN);

  return (
    <main id="main">
      <SiteHeader active="home" />

      <section className="hero area-hero">
        <div className="hero-atmosphere" aria-hidden="true" />
        <div className="shell hero-copy">
          <p className="hero-kicker">Bartley Insight</p>
          <h1>{data.profile.name}</h1>
          <p className="hero-lede">
            Key Stage 2 outcomes against Hampshire and England, using the same
            DfE statistics published on Compare school and college performance —
            laid out in short sections that match the School Compass visual
            system.
          </p>
          <div className="hero-actions">
            <a className="btn btn-primary" href="#summary">
              Board summary
            </a>
            <Link className="btn btn-ghost" href="/analysis">
              Governor analysis
            </Link>
          </div>
        </div>
      </section>

      <DashboardChapterNav />

      <ExecutiveSummaryCard summary={summary} period={data.period} />

      <section className="section section-alt" id="findings">
        <div className="shell">
          <div className="section-head">
            <h2>Evaluation findings</h2>
            <p>
              Academic year {data.period.replace("/", "–")}. Findings pair the
              latest cohort with DfE 3-year averages for smoothing. Combined
              reading, writing and maths sits {fmtPp(score.vsEngland)} versus
              England
              {rolling.expected != null
                ? `; three-year average ${fmtPct(rolling.expected)}`
                : ""}
              {yoy.delta != null
                ? `; ${fmtPp(yoy.delta)} versus prior published year`
                : ""}
              .
            </p>
          </div>

          <div className="snapshot-row" role="list">
            <div className="snapshot-metric" role="listitem">
              <span className="snapshot-label">RWM expected</span>
              <strong>{fmtPctWithN(score.rwmExpected, cohortN)}</strong>
              {yoy.delta != null ? (
                <span
                  className={
                    yoy.delta >= 1
                      ? "metric-delta delta-up"
                      : yoy.delta <= -1
                        ? "metric-delta delta-down"
                        : "metric-delta delta-flat"
                  }
                >
                  {fmtPp(yoy.delta)} vs prior year
                </span>
              ) : null}
              <span className="snapshot-sub">
                England {fmtPct(rwm?.englandExpected)} · Hampshire{" "}
                {fmtPct(rwm?.hampshireExpected)}
              </span>
            </div>
            <div className="snapshot-metric" role="listitem">
              <span className="snapshot-label">RWM higher standard</span>
              <strong>{fmtPctWithN(rwm?.schoolHigher, cohortN)}</strong>
              <span className="snapshot-sub">
                England {fmtPct(rwm?.englandHigher)} · Hampshire{" "}
                {fmtPct(rwm?.hampshireHigher)}
              </span>
            </div>
            <div className="snapshot-metric" role="listitem">
              <span className="snapshot-label">3-year RWM average</span>
              <strong>{fmtPct(rolling.expected)}</strong>
              <span className="snapshot-sub">
                {rolling.topic ?? "DfE published 3-year average"}
                {data.profile.threeYearEligible != null
                  ? ` · of ${data.profile.threeYearEligible}`
                  : ""}
              </span>
            </div>
            <div className="snapshot-metric" role="listitem">
              <span className="snapshot-label">Year 6 pupils</span>
              <strong>{data.profile.pupilsAged11 ?? "—"}</strong>
              <span className="snapshot-sub">
                {data.profile.localAuthority} · URN {data.profile.urn}
              </span>
            </div>
          </div>

          {volatility ? <p className="volatility-note">{volatility}</p> : null}

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
        data={data}
        sipTargets={sipTargets}
      />

      <section className="section" id="peers">
        <div className="shell">
          <div className="section-head">
            <h2>Peer comparison</h2>
            <p>
              Latest expected-standard figures for Bartley and the top three
              similar-size local juniors, with links to Compare school
              performance.
            </p>
          </div>
          <div className="peer-strip" aria-label="Similar top-performing peers">
            <p className="peer-strip-lead">
              Top 3 similar-size juniors nearby (2024/25 RWM):{" "}
              {peers.peers
                .map(
                  (p) =>
                    `${p.short} ${fmtPct(p.latest.rwmExpected)} (of ${p.latest.eligiblePupils ?? "—"})`,
                )
                .join(" · ")}
              . Peer average {fmtPct(peers.peerAverageLatest.rwmExpected)}.
            </p>
            <p className="peer-strip-note muted">{peers.selection.method}</p>
            {peers.selection.sectorNote ? (
              <p className="peer-strip-note muted">{peers.selection.sectorNote}</p>
            ) : null}
          </div>
          <PeerComparisonTable peers={peers} bartley={data} />
        </div>
      </section>

      <section className="section section-alt" id="equity">
        <div className="shell">
          <div className="section-head">
            <h2>KS2 pupil group gaps</h2>
            <p>
              Combined reading, writing and maths expected standard for key
              pupil groups at Bartley, with pupil counts for the latest Year 6
              cohort.
            </p>
          </div>
          <EquityChart equity={data.equity} profile={data.profile} />
        </div>
      </section>

      <section className="section" id="cohort">
        <div className="shell">
          <div className="section-head">
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
      </section>

      {(data.equityHistory?.length ?? 0) > 0 ? (
        <section className="section section-alt" id="equity-history">
          <div className="shell">
            <div className="section-head">
              <h2>Equity over time</h2>
              <p>
                Boys, girls, and disadvantage gaps across published years — with
                a compressed hatched band for the COVID performance-table gap.
              </p>
            </div>
            <EquityHistoryChart equityHistory={data.equityHistory ?? []} />
          </div>
        </section>
      ) : null}

      <section className="section" id="progress">
        <div className="shell">
          <div className="section-head">
            <h2>KS2 progress measures</h2>
            <p>
              Key Stage 1 to Key Stage 2 progress scores are unavailable for
              2024 and 2025 because those cohorts did not sit KS1 tests. The
              chart shows the last published confidence intervals.
            </p>
          </div>
          <ProgressChart progress={data.progress} />
        </div>
      </section>

      <FeederSchoolsSection feeders={feeders} />
      <SipPrioritiesCard sip={sipTargets} />
      <ChangeLogCard changeLog={changeLog} />
      <GlossaryPanel />

      <section className="section section-alt" id="source">
        <div className="shell source-block">
          <div className="section-head">
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
            Dataset last refreshed:{" "}
            {data.source.refreshedAt
              ? new Date(data.source.refreshedAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : "date not recorded"}
            . SIP priorities and chart ambitions are edited on the{" "}
            <Link href="/data-entry">manual data entry</Link> page. Peer
            overlays compare Bartley with the top three similar-size local
            juniors. Feeder KS1/phonics come from the same data entry page.
          </p>
        </div>
      </section>

      <SiteFooter
        urn={data.profile.urn}
        refreshedAt={data.source.refreshedAt}
      />
    </main>
  );
}
