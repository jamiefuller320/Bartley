import type { Metadata } from "next";
import Link from "next/link";
import {
  getBartleyMonitorData,
  getChangeLog,
  getPeerSchoolsData,
} from "@/lib/data";
import { buildAnalysis } from "@/lib/analysis";
import { buildExecutiveSummary } from "@/lib/board";
import { SiteHeader } from "@/components/SiteHeader";
import { PrintButton } from "@/components/PrintButton";
import { MeetingPackCharts } from "@/components/MeetingPackCharts";
import { GlossaryPanel } from "@/components/GlossaryPanel";
import { ChangeLogCard } from "@/components/ChangeLogCard";

export const metadata: Metadata = {
  title: "Analysis & governor questions · Bartley Insight",
  description:
    "Written findings from published KS2 performance data for Bartley CofE Junior School, with strategic questions for the governing board.",
};

export default function AnalysisPage() {
  const data = getBartleyMonitorData();
  const peers = getPeerSchoolsData();
  const analysis = buildAnalysis(data, peers);
  const summary = buildExecutiveSummary(data, peers);
  const changeLog = getChangeLog();

  const themes = Array.from(
    new Set(analysis.questions.map((q) => q.theme)),
  );

  return (
    <main className="analysis-print-root">
      <SiteHeader active="analysis" />

      <section className="analysis-hero">
        <div className="shell">
          <p className="hero-kicker">Governing board briefing</p>
          <h1>{analysis.headline}</h1>
          <p className="analysis-lede">{analysis.summary}</p>
          <p className="analysis-meta">
            Based on published Compare school performance / DfE statistics for{" "}
            {data.period.replace("/", "–")}
            {data.source.refreshedAt
              ? ` (dataset refreshed ${data.source.refreshedAt})`
              : ""}
            . For interactive charts, see the{" "}
            <Link href="/">dashboard</Link>.
          </p>
          <div className="hero-actions analysis-actions no-print">
            <PrintButton />
            <Link className="btn-primary" href="/#summary">
              One-page summary
            </Link>
          </div>
        </div>
      </section>

      <section className="section print-pack-summary">
        <div className="shell">
          <div className="section-intro">
            <h2>Meeting pack snapshot</h2>
            <p>
              Print this page for a paper pack. Snapshot, glossary, narrative,
              and fixed charts below are designed to travel together.
            </p>
          </div>
          <div className="snapshot-row" role="list">
            {summary.headlineMetrics.map((metric) => (
              <div key={metric.label} className="snapshot-metric" role="listitem">
                <span className="snapshot-label">{metric.label}</span>
                <strong>{metric.value}</strong>
                {metric.delta ? (
                  <span
                    className={
                      metric.deltaTone === "up"
                        ? "metric-delta delta-up"
                        : metric.deltaTone === "down"
                          ? "metric-delta delta-down"
                          : "metric-delta delta-flat"
                    }
                  >
                    {metric.delta}
                  </span>
                ) : null}
                <span className="snapshot-sub">{metric.detail}</span>
              </div>
            ))}
          </div>
          {summary.volatilityNote ? (
            <p className="volatility-note">{summary.volatilityNote}</p>
          ) : null}
          <div className="exec-grid">
            <div className="exec-panel">
              <h3>Top risks</h3>
              <ol className="exec-list">
                {summary.risks.map((risk) => (
                  <li key={risk}>{risk}</li>
                ))}
              </ol>
            </div>
            <div className="exec-panel">
              <h3>Ask first</h3>
              <ol className="exec-list">
                {summary.questions.map((question) => (
                  <li key={question}>{question}</li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      <ChangeLogCard changeLog={changeLog} />
      <MeetingPackCharts data={data} peers={peers} />
      <GlossaryPanel />

      <section className="section">
        <div className="shell analysis-layout">
          <aside className="analysis-toc no-print" aria-label="On this page">
            <p className="analysis-toc-title">On this page</p>
            <ol>
              <li>
                <a href="#meeting-charts">Meeting pack charts</a>
              </li>
              <li>
                <a href="#glossary">Glossary</a>
              </li>
              {analysis.sections.map((section) => (
                <li key={section.id}>
                  <a href={`#${section.id}`}>{section.title}</a>
                </li>
              ))}
              <li>
                <a href="#questions">Strategic questions</a>
              </li>
              <li>
                <a href="#caveats">Caveats</a>
              </li>
            </ol>
          </aside>

          <div className="analysis-body">
            {analysis.sections.map((section) => (
              <article key={section.id} id={section.id} className="analysis-section">
                <h2>{section.title}</h2>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph.slice(0, 48)}>{paragraph}</p>
                ))}
                {section.bullets?.length ? (
                  <ul>
                    {section.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                ) : null}
              </article>
            ))}

            <article id="questions" className="analysis-section">
              <h2>Strategic questions for school leaders</h2>
              <p>
                These questions are designed for governing board discussion with
                the headteacher and senior leaders. Each is tied to a signal in
                the published data and asks for evidence, not reassurance alone.
              </p>

              {themes.map((theme) => (
                <div key={theme} className="question-theme">
                  <h3>{theme}</h3>
                  <ol className="question-list">
                    {analysis.questions
                      .filter((q) => q.theme === theme)
                      .map((q) => (
                        <li key={q.question}>
                          <p className="question-text">{q.question}</p>
                          <p className="question-why">
                            <span>Why ask this:</span> {q.why}
                          </p>
                          {q.chartHref ? (
                            <p className="question-chart-link no-print">
                              <Link href={q.chartHref}>Open related chart</Link>
                            </p>
                          ) : null}
                        </li>
                      ))}
                  </ol>
                </div>
              ))}
            </article>

            <article id="caveats" className="analysis-section">
              <h2>Caveats and automated signals</h2>
              <p>
                Use these as transparency notes when presenting to the full
                board or to Ofsted/parents alongside the public tables.
              </p>
              <ul>
                {analysis.caveats.map((caveat) => (
                  <li key={caveat}>{caveat}</li>
                ))}
              </ul>
            </article>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="shell footer-inner">
          <p>Bartley Insight · governor analysis</p>
          <p className="no-print">
            <Link href="/">Back to dashboard</Link>
          </p>
        </div>
      </footer>
    </main>
  );
}
