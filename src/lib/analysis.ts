import type {
  EquityHistoryRow,
  HistoryRow,
  SchoolMonitorData,
} from "@/lib/types";
import { fmtPct, fmtPp, shortSubject } from "@/lib/format";

export type AnalysisSection = {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

export type StrategicQuestion = {
  theme: string;
  question: string;
  why: string;
};

function periodShort(period: string): string {
  const [a, b] = period.split("/");
  return b && b.length === 4 ? `${a}/${b.slice(2)}` : period;
}

function series(
  history: HistoryRow[],
  subject: string,
): HistoryRow[] {
  return history
    .filter((h) => h.subject === subject && h.schoolExpected !== null)
    .sort((a, b) => a.period.localeCompare(b.period));
}

function equitySeries(
  equityHistory: EquityHistoryRow[] | undefined,
  group: string,
): EquityHistoryRow[] {
  return (equityHistory ?? [])
    .filter((e) => e.group === group && e.expected !== null)
    .sort((a, b) => a.period.localeCompare(b.period));
}

export function buildAnalysis(data: SchoolMonitorData): {
  headline: string;
  summary: string;
  sections: AnalysisSection[];
  questions: StrategicQuestion[];
  caveats: string[];
} {
  const history = data.history ?? [];
  const rwm = series(history, "Reading, writing and maths");
  const latest = data.subjects.find(
    (s) => s.subject === "Reading, writing and maths",
  );
  const reading = data.subjects.find((s) => s.subject === "Reading");
  const writing = data.subjects.find((s) => s.subject === "Writing");
  const maths = data.subjects.find((s) => s.subject === "Maths");
  const gps = data.subjects.find(
    (s) => s.subject === "Grammar, punctuation and spelling",
  );
  const science = data.subjects.find((s) => s.subject === "Science");

  const boys = data.equity.find((e) => e.group === "Boys");
  const girls = data.equity.find((e) => e.group === "Girls");
  const dis = data.equity.find((e) => e.group === "Disadvantaged");
  const notDis = data.equity.find((e) => e.group === "Not disadvantaged");

  const peak = rwm.length
    ? rwm.reduce((best, row) =>
        (row.schoolExpected ?? 0) > (best.schoolExpected ?? 0) ? row : best,
      )
    : null;
  const first = rwm[0];
  const last = rwm[rwm.length - 1];

  const boysHist = equitySeries(data.equityHistory, "Boys");
  const girlsHist = equitySeries(data.equityHistory, "Girls");
  const disHist = equitySeries(data.equityHistory, "Disadvantaged");

  const genderGap =
    girls?.expected !== null &&
    girls?.expected !== undefined &&
    boys?.expected !== null &&
    boys?.expected !== undefined
      ? girls.expected - boys.expected
      : null;
  const disGap =
    notDis?.expected !== null &&
    notDis?.expected !== undefined &&
    dis?.expected !== null &&
    dis?.expected !== undefined
      ? notDis.expected - dis.expected
      : null;

  const strengths = data.subjects.filter(
    (s) => s.vsEngland !== null && s.vsEngland !== undefined && s.vsEngland >= 1,
  );
  const watchSubjects = data.subjects.filter(
    (s) => s.vsEngland !== null && s.vsEngland !== undefined && s.vsEngland <= -3,
  );

  const headline = `${data.profile.name}: governing board analysis`;
  const summary = `In ${periodShort(data.period)}, ${fmtPct(latest?.schoolExpected)} of pupils met the expected standard in reading, writing and maths combined — in line with England (${fmtPct(latest?.englandExpected)}) and ${fmtPp(latest?.vsHampshire)} versus Hampshire. The sharper story sits beneath that headline: a wide gender gap, a persistent disadvantage gap, writing as a relative strength, and combined attainment still below the school’s pre-pandemic peak.`;

  const sections: AnalysisSection[] = [
    {
      id: "overall",
      title: "Overall attainment position",
      paragraphs: [
        `The school’s published combined RWM result of ${fmtPct(latest?.schoolExpected)} places Bartley with the national average and just below Hampshire (${fmtPct(latest?.hampshireExpected)}). That is a stable, not dramatic, headline: the school is neither an outlier of concern on the overall measure nor currently matching its strongest published years.`,
        peak && last
          ? `Across the published performance-table years, combined RWM moved from ${fmtPct(first?.schoolExpected)} in ${periodShort(first?.period ?? "")} to ${fmtPct(last.schoolExpected)} in ${periodShort(last.period)}. The peak remains ${fmtPct(peak.schoolExpected)} in ${periodShort(peak.period)}. Recovery since 2022/23 has been modest (+2 pp from 2023/24 to 2024/25), while England has risen more steadily over the long run.`
          : "Longer-run published history shows combined attainment below the school’s strongest pre-pandemic years.",
      ],
      bullets: [
        `Higher-standard combined RWM: ${fmtPct(latest?.schoolHigher)} (Hampshire ${fmtPct(latest?.hampshireHigher)}, England ${fmtPct(latest?.englandHigher)}).`,
        `Year 6 cohort size: ${data.profile.pupilsAged11 ?? data.profile.eligiblePupils ?? "—"} eligible pupils — single-year percentages can move sharply with small numbers.`,
        `Disadvantaged share of the cohort: ${fmtPct(data.profile.disadvantagedPercent)}; SEN (EHC or support): ${fmtPct(data.profile.senCombinedPercent)}; EAL: ${fmtPct(data.profile.ealPercent)}.`,
      ],
    },
    {
      id: "subjects",
      title: "Subject pattern",
      paragraphs: [
        `Subject results are uneven. Writing is the clearest strength at ${fmtPct(writing?.schoolExpected)} expected standard (${fmtPp(writing?.vsEngland)} vs England, ${fmtPp(writing?.vsHampshire)} vs Hampshire). Maths is broadly in line with benchmarks at ${fmtPct(maths?.schoolExpected)}.`,
        `Reading (${fmtPct(reading?.schoolExpected)}) and GPS (${fmtPct(gps?.schoolExpected)}) sit below national and local averages. Science teacher assessment (${fmtPct(science?.schoolExpected)}) is close to national. The pattern suggests the combined RWM figure is being held up by writing and maths more than by reading and GPS.`,
      ],
      bullets: [
        ...strengths.map(
          (s) =>
            `${shortSubject(s.subject)} above England by ${fmtPp(s.vsEngland)} (${fmtPct(s.schoolExpected)}).`,
        ),
        ...watchSubjects.map(
          (s) =>
            `${shortSubject(s.subject)} below England by ${fmtPp(s.vsEngland)} (${fmtPct(s.schoolExpected)}).`,
        ),
      ],
    },
    {
      id: "equity",
      title: "Equity and inclusion",
      paragraphs: [
        genderGap !== null
          ? `The gender gap is the most urgent equity signal in the latest data: girls ${fmtPct(girls?.expected)} versus boys ${fmtPct(boys?.expected)} at combined expected standard (gap ${genderGap.toFixed(0)} pp). That is substantially wider than in several earlier published years — for example boys and girls were level at 70% in 2018/19, and the 2023/24 gap was only 5 pp.`
          : "Gender comparison data is limited in the latest extract.",
        disGap !== null
          ? `Disadvantaged pupils reached ${fmtPct(dis?.expected)} combined expected standard versus ${fmtPct(notDis?.expected)} for pupils not known to be disadvantaged (gap ${disGap.toFixed(0)} pp). No disadvantaged pupils reached the higher standard in the latest year. The 2023/24 disadvantaged figure (${fmtPct(disHist.find((d) => d.period === "2023/2024")?.expected)}) was especially low, with partial recovery in 2024/25 — still well below the 2018/19 disadvantaged result of ${fmtPct(disHist.find((d) => d.period === "2018/2019")?.expected)}.`
          : "Disadvantage comparison data is limited in the latest extract.",
        `With roughly one in five pupils disadvantaged and one in five identified with SEN, equity outcomes are not a marginal issue: they are central to whether the school’s published profile is socially just as well as statistically average.`,
      ],
      bullets: [
        boysHist.length && girlsHist.length
          ? `Boys RWM expected across published years: ${boysHist.map((b) => `${periodShort(b.period)} ${fmtPct(b.expected)}`).join("; ")}.`
          : undefined,
        disHist.length
          ? `Disadvantaged RWM expected across published years: ${disHist.map((b) => `${periodShort(b.period)} ${fmtPct(b.expected)}`).join("; ")}.`
          : undefined,
      ].filter(Boolean) as string[],
    },
    {
      id: "progress",
      title: "Progress context",
      paragraphs: [
        "Progress scores are only available for cohorts with KS1 baselines. For 2024 and 2025 leavers they are not published because those pupils did not sit KS1 tests during COVID disruption.",
        data.progress.length
          ? `The last published progress scores (${periodShort(data.progress[0]?.period ?? "prior year")}) were broadly average in reading (${data.progress.find((p) => p.subject === "Reading")?.score ?? "—"}) and writing (${data.progress.find((p) => p.subject === "Writing")?.score ?? "—"}), with maths weaker (${data.progress.find((p) => p.subject === "Maths")?.score ?? "—"}). Governors should treat progress as historical context, not a current accountability score.`
          : "No progress scores are attached to the latest displayed cohort.",
      ],
    },
    {
      id: "priorities",
      title: "Priorities suggested by the data",
      paragraphs: [
        "Taken together, the published evidence points to three board-level priorities rather than a general attainment crisis:",
      ],
      bullets: [
        "Close the boys’ combined RWM gap without lowering girls’ strong outcomes — especially in reading and writing pathways that feed the combined measure.",
        "Sustain and deepen the recovery for disadvantaged pupils so that 2023/24 does not become a repeated pattern; aim for higher-standard representation as well as expected standard.",
        "Raise reading and GPS toward Hampshire/England while protecting writing strength and securing maths consistency.",
      ],
    },
  ];

  const questions: StrategicQuestion[] = [
    {
      theme: "Outcomes strategy",
      question:
        "What is the school’s explicit three-year ambition for combined RWM, reading, GPS and higher-standard outcomes — and how will governors know mid-year whether the school is on track?",
      why: "Headline RWM is average, but below the school’s own peak and held up unevenly by subjects.",
    },
    {
      theme: "Boys’ achievement",
      question:
        "What forensic analysis has leadership completed on the boys who did not meet combined RWM in 2024/25, and which barriers (attendance, behaviour, reading fluency, writing stamina, SEND) appear most causal?",
      why: `Boys’ combined expected standard is ${fmtPct(boys?.expected)} versus ${fmtPct(girls?.expected)} for girls.`,
    },
    {
      theme: "Boys’ achievement",
      question:
        "Which current Year 5/6 boy-specific interventions are in place, how is impact measured within the year, and what will stop if they are not working?",
      why: "The gender gap widened sharply versus 2023/24 and versus several pre-pandemic years.",
    },
    {
      theme: "Disadvantaged pupils",
      question:
        "How is pupil premium funding mapped line-by-line to the disadvantaged pupils currently below expected standard, and what attainment/progress checkpoints will be reported to governors each term?",
      why: `Disadvantaged combined RWM is ${fmtPct(dis?.expected)} against ${fmtPct(notDis?.expected)} for other pupils.`,
    },
    {
      theme: "Disadvantaged pupils",
      question:
        "Why did no disadvantaged pupil reach the higher standard in the latest year, and what pathway exists for high-attaining disadvantaged pupils?",
      why: "Higher-standard representation is an inclusion as well as excellence issue.",
    },
    {
      theme: "Curriculum & assessment",
      question:
        "What explains reading and GPS lagging England while writing is above — and how aligned are reading fluency, phonics catch-up (where relevant), vocabulary and GPS teaching across Years 3–6?",
      why: `Reading ${fmtPp(reading?.vsEngland)} and GPS ${fmtPp(gps?.vsEngland)} vs England; writing ${fmtPp(writing?.vsEngland)}.`,
    },
    {
      theme: "Curriculum & assessment",
      question:
        "How reliable are teacher assessments and test preparation practices in writing and science, and what external moderation/benchmarking reassures the board about validity?",
      why: "Writing and science are relative strengths; governors need confidence the strength is secure.",
    },
    {
      theme: "Cohort & inclusion",
      question:
        "Given cohort size and the mix of disadvantage/SEN/EAL, how does leadership distinguish one-year volatility from a genuine decline or recovery when presenting results to the board?",
      why: `About ${data.profile.pupilsAged11 ?? "—"} Year 6 pupils; disadvantaged ${fmtPct(data.profile.disadvantagedPercent)}; SEN ${fmtPct(data.profile.senCombinedPercent)}.`,
    },
    {
      theme: "Targeting & intervention",
      question:
        "Which pupils currently in Year 5 are projected not to meet combined RWM, what is the intervention offer for each, and what capacity/timetable protects quality first teaching while interventions run?",
      why: "Governors need prospective assurance, not only retrospective published tables.",
    },
    {
      theme: "Comparison & ambition",
      question:
        "Which similar Hampshire schools or strong historical Bartley cohorts are we using as practical benchmarks, and why is matching 2017/18 combined RWM no longer (or still) a realistic ambition?",
      why: `Peak combined RWM was ${fmtPct(peak?.schoolExpected)} in ${peak ? periodShort(peak.period) : "—"}.`,
    },
    {
      theme: "Staffing & professional development",
      question:
        "Where is CPD and leadership time concentrated this year — reading, GPS, boys’ engagement, or disadvantage — and what evidence of classroom impact will be shared with governors before the next results cycle?",
      why: "Priorities in the data need matching resource, not only narrative.",
    },
    {
      theme: "Safeguards & wellbeing",
      question:
        "How are attendance, behaviour and pastoral support for boys and disadvantaged pupils connected to the attainment plan, and are any pupils missing substantial learning time before tests?",
      why: "Published attainment gaps often have attendance and engagement roots.",
    },
  ];

  // Fold automated findings into a short appendix list via returned sections already; keep caveats separate.
  const caveats = [
    "Published performance-table KS2 files are unavailable for 2019/20–2021/22 (COVID cancellation / not published in tables), so trend lines skip those years.",
    "Progress measures are missing for recent cohorts without KS1 baselines.",
    "With a single junior-school Year 6 cohort, percentage-point swings can reflect a small number of pupils; always ask for pupil counts behind the percentages.",
    "This analysis uses DfE Compare school performance / Explore education statistics published figures only — it does not include internal tracking, Ofsted judgement text, or confidential ASP/IDSR detail.",
  ];

  return { headline, summary, sections, questions, caveats };
}
