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
      "A higher attainment threshold for reading, writing, maths and GPS — useful for excellence and high-attaining disadvantaged scrutiny. Science has no higher-standard measure.",
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
      "Performance-table KS2 files were not published for 2019/20–2021/22. Charts keep a half-width hatched band for that stretch (half the spacing of a normal year-to-year step), with a centred label, so lines break without implying continuity.",
  },
  {
    term: "Disadvantaged",
    definition:
      "Pupils known to be eligible for free school meals in the last 6 years (and some other groups) — the pupil premium cohort definition used in tables.",
  },
  {
    term: "Phonics (LA / national)",
    definition:
      "Year 1 / end of Year 2 phonics screening check. Open data publishes Hampshire and England rates only; school-level feeder phonics needs ASP.",
  },
  {
    term: "KS1 (infant)",
    definition:
      "End of Year 2 teacher assessment. Non-statutory from 2023/24 and no longer collected in performance-table downloads, so feeder tables do not show blank school-level KS1 columns unless ASP figures are supplied.",
  },
  {
    term: "Absence proxy (feeders)",
    definition:
      "For infant feeders, the local ‘top 3’ benchmark is ranked by published persistent absence — an attendance signal, not a phonics or KS1 attainment league table.",
  },
  {
    term: "State-funded vs independent",
    definition:
      "State-funded schools (maintained and academies) publish Compare school performance KS2 tables. Independent schools (also called private or public schools) do not report the same statutory measures, so Bartley Insight peer and feeder benchmarks exclude them to keep comparisons like-for-like.",
  },
  {
    term: "KS3 / KS4 / KS5",
    definition:
      "Secondary and post-16 stages. Bartley is a junior school (ages 7–11), so this monitor does not use KS3, KS4 or KS5 datasets.",
  },
] as const;

export function GlossaryPanel() {
  return (
    <section className="section" id="glossary">
      <div className="shell">
        <div className="section-intro">
          <h2>60-second stage glossary</h2>
          <p>
            Quick definitions for governors — mainly KS2 for Bartley, plus
            infant feeder context where published.
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
