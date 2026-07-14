import type { Metadata } from "next";
import Link from "next/link";
import { getBartleyMonitorData } from "@/lib/data";
import { buildAnalysis } from "@/lib/analysis";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Analysis & governor questions · Bartley Insight",
  description:
    "Written findings from published KS2 performance data for Bartley CofE Junior School, with strategic questions for the governing board.",
};

export default function AnalysisPage() {
  const data = getBartleyMonitorData();
  const analysis = buildAnalysis(data);

  const themes = Array.from(
    new Set(analysis.questions.map((q) => q.theme)),
  );

  return (
    <main>
      <SiteHeader active="analysis" />

      <section className="analysis-hero">
        <div className="shell">
          <p className="hero-kicker">Governing board briefing</p>
          <h1>{analysis.headline}</h1>
          <p className="analysis-lede">{analysis.summary}</p>
          <p className="analysis-meta">
            Based on published Compare school performance / DfE statistics for{" "}
            {data.period.replace("/", "–")}. For charts and source detail, see
            the <Link href="/">dashboard</Link>.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="shell analysis-layout">
          <aside className="analysis-toc" aria-label="On this page">
            <p className="analysis-toc-title">On this page</p>
            <ol>
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
          <p>
            <Link href="/">Back to dashboard</Link>
          </p>
        </div>
      </footer>
    </main>
  );
}
