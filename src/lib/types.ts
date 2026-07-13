export type FindingSeverity = "positive" | "watch" | "priority";

export interface SchoolProfile {
  name: string;
  urn: string;
  laEstab: string;
  localAuthority: string;
  phase: string;
  address?: string | null;
  telephone?: string | null;
  schoolType?: string | null;
  schoolTypeLabel?: string | null;
  religiousDenomination?: string | null;
  ageRange?: string | null;
  closed?: string | null;
  pupilsAged11?: number | null;
  eligiblePupils?: number | null;
  disadvantagedPercent?: number | null;
  disadvantagedCount?: number | null;
  notDisadvantagedCount?: number | null;
  senSupportPercent?: number | null;
  ehcPercent?: number | null;
  senCombinedPercent?: number | null;
  ealPercent?: number | null;
  nonMobilePercent?: number | null;
  boysPercent?: number | null;
  girlsPercent?: number | null;
  boysCount?: number | null;
  girlsCount?: number | null;
  threeYearEligible?: number | null;
  period?: string | null;
}

export interface SubjectComparison {
  subject: string;
  schoolExpected: number | null;
  hampshireExpected: number | null;
  englandExpected: number | null;
  schoolHigher: number | null;
  hampshireHigher: number | null;
  englandHigher: number | null;
  schoolScaled: number | null;
  hampshireScaled: number | null;
  englandScaled: number | null;
  vsHampshire: number | null;
  vsEngland: number | null;
}

export interface EquityRow {
  group: string;
  expected: number | null;
  higher: number | null;
}

export interface ProgressRow {
  subject: string;
  score: number | null;
  lower: number | null;
  upper: number | null;
  breakdown?: string;
  topic?: string;
  period?: string;
}

export interface Finding {
  severity: FindingSeverity;
  title: string;
  detail: string;
}

export interface DataSource {
  primarySite: string;
  api: string;
  datasets: {
    schoolPerformance: string;
    schoolInformation: string;
    laPerformance: string;
  };
  release: string;
  note: string;
}

export interface HistoryRow {
  period: string;
  label?: string;
  subject: string;
  schoolExpected: number | null;
  hampshireExpected: number | null;
  englandExpected: number | null;
  schoolHigher: number | null;
  hampshireHigher?: number | null;
  englandHigher?: number | null;
  schoolScaled: number | null;
  hampshireScaled?: number | null;
  englandScaled?: number | null;
  schoolProgress?: number | null;
}

export interface EquityHistoryRow {
  period: string;
  group: string;
  expected: number | null;
  higher: number | null;
}

export interface SchoolMonitorData {
  source: DataSource;
  profile: SchoolProfile;
  period: string;
  periods?: string[];
  subjects: SubjectComparison[];
  progress: ProgressRow[];
  equity: EquityRow[];
  history?: HistoryRow[];
  equityHistory?: EquityHistoryRow[];
  findings: Finding[];
  threeYear?: unknown[];
}
