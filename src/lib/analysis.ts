import type {
  EquityHistoryRow,
  FeederSchoolsBundle,
  HistoryRow,
  PeerSchoolsBundle,
  SchoolMonitorData,
} from "@/lib/types";
import { fmtNum, fmtPct, fmtPp, shortSubject } from "@/lib/format";
import { ppGap } from "@/lib/peers";

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
  chartHref?: string;
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

export function buildAnalysis(
  data: SchoolMonitorData,
  peers?: PeerSchoolsBundle,
  feeders?: FeederSchoolsBundle,
): {
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

  if (peers?.peers?.length) {
    const peerAvg = peers.peerAverageLatest.rwmExpected;
    const gapVsAvg = ppGap(latest?.schoolExpected, peerAvg);
    const ranked = [...peers.peers].sort(
      (a, b) =>
        (b.latest.rwmExpected ?? 0) - (a.latest.rwmExpected ?? 0),
    );
    const top = ranked[0];
    const gapVsTop = ppGap(latest?.schoolExpected, top?.latest.rwmExpected);
    const readingGap = ppGap(
      reading?.schoolExpected,
      peers.peerAverageLatest.readingExpected,
    );
    const writingGap = ppGap(
      writing?.schoolExpected,
      peers.peerAverageLatest.writingExpected,
    );
    const mathsGap = ppGap(
      maths?.schoolExpected,
      peers.peerAverageLatest.mathsExpected,
    );
    const gpsGap = ppGap(
      gps?.schoolExpected,
      peers.peerAverageLatest.gpsExpected,
    );

    const peerNames = ranked
      .map(
        (p) =>
          `${p.name} (${fmtPct(p.latest.rwmExpected)} RWM, ${p.latest.eligiblePupils ?? "—"} eligible, ${p.postcode})`,
      )
      .join("; ");

    sections.splice(1, 0, {
      id: "peers",
      title: "Where Bartley sits versus strong local peers",
      paragraphs: [
        `To set a practical ambition beyond LA and national averages, the dashboard compares Bartley with the three highest-performing similar-size state-funded junior schools nearby: ${peerNames}. Selection used Hampshire maintained and academy juniors (ages 7–11) with a Year 6 cohort within about 40% of Bartley’s ${peers.selection.bartleyLatestEligible} eligible pupils, in the SO40–SO53 / BH24 / SP6 vicinity, ranked by 2024/25 combined RWM. Independent (private/public) schools are excluded because they do not publish the same statutory KS2 performance-table measures.`,
        gapVsAvg !== null && gapVsTop !== null
          ? `On the latest combined measure, Bartley at ${fmtPct(latest?.schoolExpected)} sits ${Math.abs(gapVsAvg).toFixed(0)} pp ${gapVsAvg < 0 ? "below" : "above"} the top-three peer average (${fmtPct(peerAvg)}) and ${Math.abs(gapVsTop).toFixed(0)} pp ${gapVsTop < 0 ? "below" : "above"} the strongest peer (${top.short} at ${fmtPct(top.latest.rwmExpected)}). That is a clearer gap than the near-parity with England: Bartley is broadly average nationally, but not yet performing like the best local schools of a similar size.`
          : "Peer comparison figures are incomplete for the latest year.",
        `Subject gaps versus the peer average explain much of the combined shortfall: reading ${fmtPp(readingGap)}, writing ${fmtPp(writingGap)}, maths ${fmtPp(mathsGap)}, and GPS ${fmtPp(gpsGap)} relative to the top-three mean. Writing is Bartley’s closest subject to the peer pack; reading and GPS are the largest shortfalls — the same pattern as versus England, but amplified against high-performing neighbours.`,
        `Equity context also differs. Peer disadvantaged RWM results (${ranked.map((p) => `${p.short} ${fmtPct(p.latest.disadvantagedRwmExpected)}`).join(", ")}) are generally higher than Bartley’s ${fmtPct(dis?.expected)}, while peer gender gaps are narrower than Bartley’s latest boys–girls split. Closing toward peer performance is therefore not only about whole-cohort attainment: it implies stronger outcomes for boys and disadvantaged pupils as well.`,
      ],
      bullets: [
        `Peer average latest RWM: ${fmtPct(peerAvg)} versus Bartley ${fmtPct(latest?.schoolExpected)} (${fmtPp(gapVsAvg)}).`,
        ...ranked.map(
          (p) =>
            `${p.short}: RWM ${fmtPct(p.latest.rwmExpected)}, reading ${fmtPct(p.latest.readingExpected)}, writing ${fmtPct(p.latest.writingExpected)}, maths ${fmtPct(p.latest.mathsExpected)}, GPS ${fmtPct(p.latest.gpsExpected)}; disadvantaged share ${fmtPct(p.latest.disadvantagedPercent)}.`,
        ),
        "Use the chart peer overlay (one school at a time, or peer average) to see how far Bartley’s year-on-year line sits from these benchmarks.",
      ],
    });
  }

  if (feeders?.feeders?.length) {
    const feederNames = feeders.feeders
      .map(
        (f) =>
          `${f.name} (${f.laEstab.slice(0, 3)}/${f.laEstab.slice(3)}, NOR ${fmtNum(f.latest.pupilsOnRoll, 0)}, persistent absence ${fmtPct(f.latest.persistentAbsencePercent, 1)})`,
      )
      .join("; ");
    const peerNamesInfant = feeders.peers
      .map(
        (p) =>
          `${p.short} (NOR ${fmtNum(p.latest.pupilsOnRoll, 0)}, PA ${fmtPct(p.latest.persistentAbsencePercent, 1)})`,
      )
      .join("; ");
    const latestPhonics =
      feeders.phonicsBenchmarks[feeders.phonicsBenchmarks.length - 1];
    const ctx = feeders.bartleyPriorLearningContext;
    const absGap =
      feeders.feederAverage.absencePercent != null &&
      feeders.peerAverage.absencePercent != null
        ? feeders.feederAverage.absencePercent -
          feeders.peerAverage.absencePercent
        : null;
    const paGap =
      feeders.feederAverage.persistentAbsencePercent != null &&
      feeders.peerAverage.persistentAbsencePercent != null
        ? feeders.feederAverage.persistentAbsencePercent -
          feeders.peerAverage.persistentAbsencePercent
        : null;

    sections.push({
      id: "prior-learning",
      title: "Prior learning from feeder infants",
      paragraphs: [
        `Bartley’s intake is shaped by three named Church of England infant feeders: ${feederNames}. Together they average about ${fmtNum(feeders.feederAverage.pupilsOnRoll, 0)} pupils on roll, with FSM ever ${fmtPct(feeders.feederAverage.fsmEverPercent)}, overall absence ${fmtPct(feeders.feederAverage.absencePercent, 1)}, and persistent absence ${fmtPct(feeders.feederAverage.persistentAbsencePercent, 1)} in ${periodShort(feeders.period)}.`,
        `School-level KS1 teacher assessment and phonics results are no longer published in Compare school performance open downloads, so governors cannot yet read feeder attainment from public tables. The dashboard therefore benchmarks feeders against the three strongest similar-size local state-funded Hampshire infants (independents excluded) on the best published school-level quality signal — attendance: ${peerNamesInfant}. That peer pack averages absence ${fmtPct(feeders.peerAverage.absencePercent, 1)} and persistent absence ${fmtPct(feeders.peerAverage.persistentAbsencePercent, 1)}.`,
        absGap != null && paGap != null
          ? `On those published signals the named feeders currently look stronger than the local infant peer average (overall absence ${fmtPp(absGap)}; persistent absence ${fmtPp(paGap)}). That is useful context for intake stability, but it is not a substitute for phonics or KS1 attainment. Hampshire Year 1 phonics sits at ${fmtPct(latestPhonics?.hampshireYear1)} versus England ${fmtPct(latestPhonics?.englandYear1)}; by end of Year 2, ${fmtPct(latestPhonics?.hampshireByEndYear2)} / ${fmtPct(latestPhonics?.englandByEndYear2)}. Asking for feeder ASP phonics/KS1 would let the board judge whether prior learning is genuinely high-quality before Bartley.`
          : "Attendance comparisons between feeders and local infant peers are incomplete for the latest year.",
        `${ctx.note} Last published scores: reading ${fmtNum(ctx.readingProgress)}, writing ${fmtNum(ctx.writingProgress)}, maths ${fmtNum(ctx.mathsProgress)} (${periodShort(ctx.progressPeriod)}). If feeder prior learning is strong, near-zero or negative junior progress would raise sharper questions about value-added in Years 3–6; if feeder baselines are weaker than assumed, Bartley’s KS2 position may understate the school’s contribution.`,
      ],
      bullets: [
        ...feeders.feeders.map(
          (f) =>
            `${f.short}: NOR ${fmtNum(f.latest.pupilsOnRoll, 0)}, FSM ever ${fmtPct(f.latest.fsmEverPercent)}, SEN support ${fmtPct(f.latest.senSupportPercent)}, EHC ${fmtPct(f.latest.ehcPercent)}, absence ${fmtPct(f.latest.absencePercent, 1)}, persistent absence ${fmtPct(f.latest.persistentAbsencePercent, 1)}.`,
        ),
        `Infant peer average (top 3 by absence): NOR ${fmtNum(feeders.peerAverage.pupilsOnRoll, 0)}, FSM ${fmtPct(feeders.peerAverage.fsmEverPercent)}, absence ${fmtPct(feeders.peerAverage.absencePercent, 1)}, PA ${fmtPct(feeders.peerAverage.persistentAbsencePercent, 1)}.`,
        "Fill phonics Y1 / by end Y2 and KS1 reading–writing–maths columns from ASP or local authority extracts when available.",
      ],
    });
  }

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
      chartHref: "/#equity",
    },
    {
      theme: "Boys’ achievement",
      question:
        "Which current Year 5/6 boy-specific interventions are in place, how is impact measured within the year, and what will stop if they are not working?",
      why: "The gender gap widened sharply versus 2023/24 and versus several pre-pandemic years.",
      chartHref: "/#equity",
    },
    {
      theme: "Disadvantaged pupils",
      question:
        "How is pupil premium funding mapped line-by-line to the disadvantaged pupils currently below expected standard, and what attainment/progress checkpoints will be reported to governors each term?",
      why: `Disadvantaged combined RWM is ${fmtPct(dis?.expected)} against ${fmtPct(notDis?.expected)} for other pupils.`,
      chartHref: "/#equity",
    },
    {
      theme: "Disadvantaged pupils",
      question:
        "Why did no disadvantaged pupil reach the higher standard in the latest year, and what pathway exists for high-attaining disadvantaged pupils?",
      why: "Higher-standard representation is an inclusion as well as excellence issue.",
      chartHref: "/?view=compare&subject=rwm&metric=higher#charts",
    },
    {
      theme: "Curriculum & assessment",
      question:
        "What explains reading and GPS lagging England while writing is above — and how aligned are reading fluency, phonics catch-up (where relevant), vocabulary and GPS teaching across Years 3–6?",
      why: `Reading ${fmtPp(reading?.vsEngland)} and GPS ${fmtPp(gps?.vsEngland)} vs England; writing ${fmtPp(writing?.vsEngland)}.`,
      chartHref: "/?view=compare&subject=reading&peer=average#charts",
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
        "Which similar Hampshire schools or strong historical Bartley cohorts are we using as practical benchmarks, and why is matching 2017/18 combined RWM — or today’s top local peers — no longer (or still) a realistic ambition?",
      why: `Peak combined RWM was ${fmtPct(peak?.schoolExpected)} in ${peak ? periodShort(peak.period) : "—"}${peers?.peerAverageLatest.rwmExpected != null ? `; current top-three peer average is ${fmtPct(peers.peerAverageLatest.rwmExpected)}` : ""}.`,
      chartHref: "/?view=history&subject=rwm&peer=average#charts",
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

  if (peers?.peers?.length) {
    const peerAvg = peers.peerAverageLatest.rwmExpected;
    const gapVsAvg = ppGap(
      data.subjects.find((s) => s.subject === "Reading, writing and maths")
        ?.schoolExpected,
      peerAvg,
    );
    const top = [...peers.peers].sort(
      (a, b) =>
        (b.latest.rwmExpected ?? 0) - (a.latest.rwmExpected ?? 0),
    )[0];
    questions.splice(1, 0, {
      theme: "Comparison & ambition",
      question: `What would it take for Bartley to close even half the ${gapVsAvg !== null ? `${Math.abs(gapVsAvg).toFixed(0)} pp` : ""} gap to the top-three local peer average on combined RWM within three years, and which peer practices (curriculum, intervention, assessment) are we actively learning from?`,
      why: `Bartley ${fmtPct(latest?.schoolExpected)} vs peer average ${fmtPct(peerAvg)}; strongest peer ${top?.short} at ${fmtPct(top?.latest.rwmExpected)}.`,
      chartHref: "/?view=compare&subject=rwm&peer=average#charts",
    });
  }

  if (feeders?.feeders?.length) {
    const feederList = feeders.feeders.map((f) => f.short).join(", ");
    const infantPeers = feeders.peers.map((p) => p.short).join(", ");
    questions.push(
      {
        theme: "Prior learning & feeders",
        question: `What Year 1 and end-of-Year 2 phonics expected-standard figures (and historical trend) do Netley Marsh, St Michael and All Angels, and Copythorne show in ASP, and how do those compare with Hampshire (${fmtPct(feeders.phonicsBenchmarks.at(-1)?.hampshireYear1)} Y1 / ${fmtPct(feeders.phonicsBenchmarks.at(-1)?.hampshireByEndYear2)} by end Y2) and with the local infant peer pack (${infantPeers})?`,
        why: "School-level phonics is not in CSP open downloads; ASP is required to judge prior reading foundations before Bartley.",
        chartHref: "/#feeders",
      },
      {
        theme: "Prior learning & feeders",
        question:
          "Where KS1 teacher assessment is still held locally (even if non-statutory nationally), what proportion of each feeder’s leavers were at expected standard in reading, writing and maths — and how does that map onto Bartley’s current Year 3 baseline assessments?",
        why: "KS1 school-level results were removed from performance-table downloads after 2022/23; governors still need an intake attainment picture.",
        chartHref: "/#feeders",
      },
      {
        theme: "Prior learning & feeders",
        question: `Given that the named feeders currently show stronger published attendance than the similar-size local infant average (feeder PA ${fmtPct(feeders.feederAverage.persistentAbsencePercent, 1)} vs peer ${fmtPct(feeders.peerAverage.persistentAbsencePercent, 1)}), how does leadership separate “strong infant schooling” from “advantageous intake” when explaining Bartley’s KS2 position?`,
        why: `${feederList} are the named feeders; peer ranking used absence as a proxy because KS1 attainment is unpublished.`,
        chartHref: "/#feeders",
      },
      {
        theme: "Prior learning & feeders",
        question:
          "What joint transition work with the three feeders (curriculum, phonics fidelity, writing expectations, attendance) is in place, and which Year 3 gaps most often reflect incomplete prior learning rather than junior provision?",
        why: "Demonstrating the impact of prior learning requires a shared picture of what children can do on entry — not only end-of-KS2 tables.",
        chartHref: "/#feeders",
      },
      {
        theme: "Prior learning & feeders",
        question: `If feeder prior learning is as strong as attendance and LA phonics context suggest, what does Bartley’s last published progress (reading ${fmtNum(feeders.bartleyPriorLearningContext.readingProgress)}, writing ${fmtNum(feeders.bartleyPriorLearningContext.writingProgress)}, maths ${fmtNum(feeders.bartleyPriorLearningContext.mathsProgress)}) imply about value-added in Years 3–6 — and what internal tracking replaces missing progress measures for recent cohorts?`,
        why: "Progress scores are the published bridge from KS1 baselines to junior outcomes; they are unavailable for the newest cohorts.",
        chartHref: "/#progress",
      },
    );
  }

  // Fold automated findings into a short appendix list via returned sections already; keep caveats separate.
  const caveats = [
    "Published performance-table KS2 files are unavailable for 2019/20–2021/22 (COVID cancellation / not published in tables), so trend lines skip those years.",
    "Progress measures are missing for recent cohorts without KS1 baselines.",
    "With a single junior-school Year 6 cohort, percentage-point swings can reflect a small number of pupils; always ask for pupil counts behind the percentages.",
    "This analysis uses DfE Compare school performance / Explore education statistics published figures only — it does not include internal tracking, Ofsted judgement text, or confidential ASP/IDSR detail.",
    "Peer schools were selected as open state-funded Hampshire juniors (maintained / academy) of similar cohort size in the local postcode band, ranked by latest combined RWM — not by Ofsted grade, progress, or exact distance. Vicinity is approximate (postcode band), not crow-flies metres.",
    "Independent (private/public) schools are excluded from peer and feeder benchmarks because they do not publish the same statutory KS2 / performance-table measures as state-funded schools; mixing sectors would not be like-for-like with Bartley.",
    ...(feeders?.feeders?.length
      ? [
          "School-level KS1 and phonics attainment are no longer in CSP open downloads; feeder/peer attainment columns are null until ASP or local figures are supplied. Infant “top 3” peers are ranked by published absence within a similar NOR band among state-funded schools only — a proxy, not an attainment league table.",
        ]
      : []),
  ];

  return { headline, summary, sections, questions, caveats };
}
