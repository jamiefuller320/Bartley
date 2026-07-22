const TERMS = [
  {
    term: "RWM",
    definition:
      "Reading, writing and maths combined — the share of pupils meeting the expected standard in all three.",
  },
  {
    term: "Expected standard",
    definition:
      "The attainment threshold DfE publishes for each subject (and for RWM combined).",
  },
  {
    term: "Higher standard",
    definition:
      "A higher attainment threshold — useful for excellence and high-attaining disadvantaged scrutiny.",
  },
  {
    term: "GPS",
    definition: "Grammar, punctuation and spelling test outcome.",
  },
  {
    term: "pp",
    definition:
      "Percentage points — the arithmetic difference between two percentages (not a relative % change).",
  },
  {
    term: "Progress score",
    definition:
      "KS1–KS2 value-added estimate with confidence intervals; around zero is broadly average. Missing for recent cohorts without KS1 baselines.",
  },
  {
    term: "COVID gap (hatched)",
    definition:
      "Performance-table KS2 files were not published for 2019/20–2021/22. Charts keep one year-slot for that stretch (same spacing as other years), hatched with a centred label, so lines break without implying continuity.",
  },
  {
    term: "Disadvantaged",
    definition:
      "Pupils known to be eligible for free school meals in the last 6 years (and some other groups) — the pupil premium cohort definition used in tables.",
  },
] as const;

export function GlossaryPanel() {
  return (
    <section className="section" id="glossary">
      <div className="shell">
        <div className="section-intro">
          <h2>60-second KS2 glossary</h2>
          <p>
            Quick definitions for governors who do not live in performance
            tables every week.
          </p>
        </div>
        <dl className="glossary-grid">
          {TERMS.map((item) => (
            <div key={item.term} className="glossary-item">
              <dt>{item.term}</dt>
              <dd>{item.definition}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
