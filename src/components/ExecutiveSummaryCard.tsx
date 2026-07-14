import Link from "next/link";
import type { ExecutiveSummary } from "@/lib/board";

export function ExecutiveSummaryCard({
  summary,
  period,
}: {
  summary: ExecutiveSummary;
  period: string;
}) {
  return (
    <section className="section" id="summary">
      <div className="shell">
        <div className="section-intro">
          <h2>Executive summary</h2>
          <p>
            One-page board pack for {period.replace("/", "–")}: headline
            metrics (including year-on-year movement and higher standard), top
            risks, and the questions worth asking first.
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

        <p className="exec-links">
          Jump to evidence:{" "}
          {summary.chartLinks.map((link, index) => (
            <span key={link.href}>
              {index > 0 ? " · " : null}
              <Link href={link.href}>{link.label}</Link>
            </span>
          ))}
          {" · "}
          <Link href="/analysis">Full governor analysis</Link>
        </p>
      </div>
    </section>
  );
}
