import type { SchoolMonitorPack } from "@/lib/monitorPack";

/** Top-level board chapters — order is the tab strip left-to-right. */
export type MonitorChapterId =
  | "summary"
  | "findings"
  | "charts"
  | "comparison"
  | "reference";

export type MonitorPanelId =
  | "summary-overview"
  | "summary-changes"
  | "summary-sip"
  | "findings-snapshot"
  | "findings-list"
  | "charts-latest"
  | "charts-history"
  | "comparison-peers"
  | "comparison-equity"
  | "comparison-equity-history"
  | "comparison-cohort"
  | "comparison-progress"
  | "comparison-feeders"
  | "reference-glossary"
  | "reference-source";

export const MONITOR_CHAPTER_ORDER: MonitorChapterId[] = [
  "summary",
  "findings",
  "charts",
  "comparison",
  "reference",
];

export const MONITOR_CHAPTER_META: Record<
  MonitorChapterId,
  { label: string; short: string; step: number; lead: string }
> = {
  summary: {
    label: "Summary",
    short: "Summary",
    step: 1,
    lead:
      "One-page board snapshot, refresh diff, and SIP priorities for the current academic year.",
  },
  findings: {
    label: "Findings",
    short: "Findings",
    step: 2,
    lead:
      "Latest cohort metrics and automated evaluation findings from published DfE statistics.",
  },
  charts: {
    label: "Performance charts",
    short: "Charts",
    step: 3,
    lead:
      "Interactive Key Stage 2 charts — latest benchmarks or year-on-year history with overlays.",
  },
  comparison: {
    label: "Comparison data",
    short: "Compare",
    step: 4,
    lead:
      "Peers, pupil-group gaps, cohort context, progress measures, and feeder KS1/phonics.",
  },
  reference: {
    label: "Reference",
    short: "Ref",
    step: 5,
    lead: "Glossary of terms and official data sources for this monitor pack.",
  },
};

export const MONITOR_PANELS_BY_CHAPTER: Record<
  MonitorChapterId,
  MonitorPanelId[]
> = {
  summary: ["summary-overview", "summary-changes", "summary-sip"],
  findings: ["findings-snapshot", "findings-list"],
  charts: ["charts-latest", "charts-history"],
  comparison: [
    "comparison-peers",
    "comparison-equity",
    "comparison-equity-history",
    "comparison-cohort",
    "comparison-progress",
    "comparison-feeders",
  ],
  reference: ["reference-glossary", "reference-source"],
};

export const MONITOR_PANEL_META: Record<
  MonitorPanelId,
  { label: string; short: string; step: number; lead: string }
> = {
  "summary-overview": {
    label: "Board overview",
    short: "Overview",
    step: 1,
    lead: "Headline metrics, top risks, and questions to ask first.",
  },
  "summary-changes": {
    label: "What changed",
    short: "Changes",
    step: 2,
    lead: "Diff since the previous dataset refresh in this repo.",
  },
  "summary-sip": {
    label: "SIP priorities",
    short: "SIP",
    step: 3,
    lead: "School improvement plan vision, priorities, and calendar.",
  },
  "findings-snapshot": {
    label: "Cohort snapshot",
    short: "Snapshot",
    step: 1,
    lead: "Latest-year RWM and cohort size versus benchmarks.",
  },
  "findings-list": {
    label: "Evaluation findings",
    short: "Findings",
    step: 2,
    lead: "Automated strengths, watch points, and priorities.",
  },
  "charts-latest": {
    label: "Latest vs benchmarks",
    short: "Latest",
    step: 1,
    lead: "Bartley against Hampshire and England for the selected subject.",
  },
  "charts-history": {
    label: "Year-on-year history",
    short: "History",
    step: 2,
    lead: "Trend lines with optional peer, LA, England, and SIP overlays.",
  },
  "comparison-peers": {
    label: "Peer schools",
    short: "Peers",
    step: 1,
    lead: "Top similar-size local juniors and the peer comparison table.",
  },
  "comparison-equity": {
    label: "Pupil group gaps",
    short: "Equity",
    step: 2,
    lead: "Latest KS2 RWM gaps for key pupil groups.",
  },
  "comparison-equity-history": {
    label: "Equity over time",
    short: "Trend",
    step: 3,
    lead: "Boys, girls, and disadvantage gaps across published years.",
  },
  "comparison-cohort": {
    label: "Cohort context",
    short: "Cohort",
    step: 4,
    lead: "Characteristics of the assessed Year 6 cohort.",
  },
  "comparison-progress": {
    label: "KS2 progress",
    short: "Progress",
    step: 5,
    lead: "Last published KS1–KS2 progress confidence intervals.",
  },
  "comparison-feeders": {
    label: "Feeder schools",
    short: "Feeders",
    step: 6,
    lead: "Infant feeders, phonics, and KS1 overlay data.",
  },
  "reference-glossary": {
    label: "Glossary",
    short: "Terms",
    step: 1,
    lead: "Short definitions for board pack terminology.",
  },
  "reference-source": {
    label: "Data source",
    short: "Source",
    step: 2,
    lead: "Official tables, API links, and refresh notes.",
  },
};

export function monitorChapterPanels(
  chapter: MonitorChapterId,
  pack: SchoolMonitorPack,
): MonitorPanelId[] {
  const base = MONITOR_PANELS_BY_CHAPTER[chapter];
  if (chapter === "summary") {
    return base.filter((id) => {
      if (id === "summary-changes") return pack.changeLog.items.length > 0;
      if (id === "summary-sip") {
        return Boolean(
          pack.sipTargets.vision ||
            (pack.sipTargets.priorities?.length ?? 0) > 0,
        );
      }
      return true;
    });
  }
  if (chapter !== "comparison") return base;
  return base.filter((id) => {
    if (id === "comparison-equity-history") {
      return (pack.data.equityHistory?.length ?? 0) > 0;
    }
    return true;
  });
}

export function monitorChapterSummary(
  chapter: MonitorChapterId,
  pack: SchoolMonitorPack,
): string | undefined {
  const period = pack.data.period.replace("/", "–");
  switch (chapter) {
    case "summary":
      return `${period} board pack`;
    case "findings":
      return `${pack.data.findings.length} automated finding${
        pack.data.findings.length === 1 ? "" : "s"
      }`;
    case "charts":
      return `KS2 · ${period}`;
    case "comparison":
      return `${pack.peers.peers.length} peer${
        pack.peers.peers.length === 1 ? "" : "s"
      } · ${pack.feeders.feeders.length} feeder${
        pack.feeders.feeders.length === 1 ? "" : "s"
      }`;
    case "reference":
      return "Glossary and sources";
    default:
      return undefined;
  }
}

export function monitorPanelSummary(
  panel: MonitorPanelId,
  pack: SchoolMonitorPack,
): string | undefined {
  switch (panel) {
    case "summary-changes":
      return pack.changeLog.items.length
        ? `${pack.changeLog.items.length} row${
            pack.changeLog.items.length === 1 ? "" : "s"
          } changed`
        : "No refresh diff recorded";
    case "summary-sip":
      return pack.sipTargets.priorities?.length
        ? `${pack.sipTargets.priorities.length} priorit${
            pack.sipTargets.priorities.length === 1 ? "y" : "ies"
          }`
        : "No SIP loaded";
    case "findings-list":
      return `${pack.data.findings.length} finding${
        pack.data.findings.length === 1 ? "" : "s"
      }`;
    case "comparison-peers":
      return `${pack.peers.peers.length} similar juniors`;
    case "comparison-feeders":
      return `${pack.feeders.feeders.length} feeder${
        pack.feeders.feeders.length === 1 ? "" : "s"
      }`;
    default:
      return undefined;
  }
}

export function defaultPanelForChapter(
  chapter: MonitorChapterId,
  pack: SchoolMonitorPack,
): MonitorPanelId {
  return monitorChapterPanels(chapter, pack)[0] ?? MONITOR_PANELS_BY_CHAPTER[chapter][0];
}

export function isMonitorChapterId(value: string): value is MonitorChapterId {
  return (MONITOR_CHAPTER_ORDER as string[]).includes(value);
}

export function isMonitorPanelId(value: string): value is MonitorPanelId {
  return value in MONITOR_PANEL_META;
}
