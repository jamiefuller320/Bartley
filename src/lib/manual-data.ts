import type { SipTarget, SipTargetsBundle } from "@/lib/board";

export type FeederAspOverlayEntry = {
  short: string;
  phonicsYear1Expected: number | null;
  phonicsByEndYear2Expected: number | null;
  ks1ReadingExpected: number | null;
  ks1WritingExpected: number | null;
  ks1MathsExpected: number | null;
  ks1ScienceExpected: number | null;
};

export type FeederAspOverlay = {
  note: string;
  confidentiality: string;
  period: string;
  updatedAt: string | null;
  source: string | null;
  byUrn: Record<string, FeederAspOverlayEntry>;
};

export type SipPriority = {
  id: string;
  title: string;
  detail: string;
  focusGroups: string[];
  subjects: string[];
  byPeriod?: string | null;
};

export type SipBundle = SipTargetsBundle & {
  sourceUrl?: string | null;
  sourceTitle?: string | null;
  updatedAt?: string | null;
  priorities?: SipPriority[];
};

export const SIP_SUBJECTS = [
  "Reading, writing and maths",
  "Reading",
  "Writing",
  "Maths",
  "Grammar, punctuation and spelling",
  "Science",
] as const;

export const SIP_METRICS = ["expected", "higher", "scaled"] as const;

export const FOCUS_GROUPS = [
  "All pupils",
  "Boys",
  "Girls",
  "Disadvantaged",
  "Not disadvantaged",
] as const;

export const KS1_FIELDS: Array<{
  key: keyof Omit<FeederAspOverlayEntry, "short">;
  label: string;
}> = [
  { key: "phonicsYear1Expected", label: "Phonics Year 1 expected %" },
  { key: "phonicsByEndYear2Expected", label: "Phonics by end of Year 2 %" },
  { key: "ks1ReadingExpected", label: "KS1 reading expected %" },
  { key: "ks1WritingExpected", label: "KS1 writing expected %" },
  { key: "ks1MathsExpected", label: "KS1 maths expected %" },
  { key: "ks1ScienceExpected", label: "KS1 science expected %" },
];

export function parseOptionalNumber(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

export function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([`${JSON.stringify(data, null, 2)}\n`], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function newPriorityId(): string {
  return `priority-${Date.now().toString(36)}`;
}

export function emptyPriority(): SipPriority {
  return {
    id: newPriorityId(),
    title: "",
    detail: "",
    focusGroups: [],
    subjects: [],
    byPeriod: "2026/2027",
  };
}

export function emptyTarget(): SipTarget {
  return {
    subject: "Reading, writing and maths",
    metric: "expected",
    label: "SIP ambition",
    value: 0,
    byPeriod: "2026/2027",
  };
}

export function stampUpdated<T extends { updatedAt?: string | null }>(
  data: T,
): T {
  return {
    ...data,
    updatedAt: new Date().toISOString().slice(0, 10),
  };
}

export function isSipBundle(value: unknown): value is SipBundle {
  if (!value || typeof value !== "object") return false;
  const v = value as SipBundle;
  return Array.isArray(v.targets);
}

export function isFeederOverlay(value: unknown): value is FeederAspOverlay {
  if (!value || typeof value !== "object") return false;
  const v = value as FeederAspOverlay;
  return Boolean(v.byUrn && typeof v.byUrn === "object");
}
