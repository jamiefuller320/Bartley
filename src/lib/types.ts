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
  refreshedAt?: string | null;
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
  source: DataSource & {
    compareDownloads?: string;
    historyCoverage?: unknown;
  };
  profile: SchoolProfile;
  period: string;
  periods?: string[];
  subjects: SubjectComparison[];
  progress: ProgressRow[];
  progressHistory?: ProgressRow[];
  equity: EquityRow[];
  history?: HistoryRow[];
  equityHistory?: EquityHistoryRow[];
  findings: Finding[];
  threeYear?: ThreeYearRow[];
}

export interface ThreeYearRow {
  subject: string;
  breakdown: string;
  topic: string;
  values: {
    expected_standard_pupil_percent: number | null;
    higher_standard_pupil_percent: number | null;
    average_scaled_score: number | null;
    progress_measure_score?: number | null;
    [key: string]: number | null | undefined;
  };
}

export interface PeerLatestSnapshot {
  rwmExpected: number | null;
  rwmHigher: number | null;
  readingExpected: number | null;
  readingHigher: number | null;
  readingScaled: number | null;
  writingExpected: number | null;
  writingHigher: number | null;
  mathsExpected: number | null;
  mathsHigher: number | null;
  mathsScaled: number | null;
  gpsExpected: number | null;
  gpsHigher: number | null;
  gpsScaled: number | null;
  scienceExpected: number | null;
  readingProgress: number | null;
  writingProgress: number | null;
  mathsProgress: number | null;
  boysRwmExpected: number | null;
  girlsRwmExpected: number | null;
  disadvantagedRwmExpected: number | null;
  notDisadvantagedRwmExpected: number | null;
  eligiblePupils: number | null;
  pupilsAged11: number | null;
  disadvantagedPercent: number | null;
}

export interface PeerSchool {
  urn: string;
  name: string;
  short: string;
  postcode: string;
  reason: string;
  town: string;
  ageRange: string;
  laEstab: string;
  latest: PeerLatestSnapshot;
  compareUrl: string;
}

export interface PeerHistoryRow {
  period: string;
  label: string;
  subject: string;
  byUrnExpected: Record<string, number | null>;
  byUrnHigher: Record<string, number | null>;
  byUrnScaled: Record<string, number | null>;
  averageExpected: number | null;
  averageHigher: number | null;
  averageScaled: number | null;
}

export interface PeerSchoolsBundle {
  selection: {
    method: string;
    bartleyUrn: string;
    bartleyLatestEligible: number;
    years: string[];
  };
  peers: PeerSchool[];
  peerAverageLatest: {
    rwmExpected: number | null;
    readingExpected: number | null;
    writingExpected: number | null;
    mathsExpected: number | null;
    gpsExpected: number | null;
    scienceExpected: number | null;
  };
  history: PeerHistoryRow[];
}
