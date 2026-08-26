/** Parse GIAS-style age range strings such as "7-11" or "4 – 11". */
export function parseAgeBounds(
  ageRange?: string | null,
): { lo: number; hi: number } | null {
  if (!ageRange) return null;
  const nums = ageRange.match(/\d+/g)?.map((n) => Number(n)) ?? [];
  if (nums.length < 2) return null;
  const lo = nums[0];
  const hi = nums[1];
  if (!Number.isFinite(lo) || !Number.isFinite(hi) || lo > hi) return null;
  return { lo, hi };
}

/**
 * Human-readable offering for governor comparisons — primary vs junior, KS bands.
 * Mirrors School Compass phase vocabulary for merge compatibility.
 */
export function schoolOfferingLabel(ageRange?: string | null): string {
  const bounds = parseAgeBounds(ageRange);
  if (!bounds) return "—";
  const { lo, hi } = bounds;

  if (lo >= 7 && hi <= 11) return "Junior · KS2";
  if (lo >= 7 && hi >= 11) return "Junior · KS2";
  if (lo <= 4 && hi >= 11) return "Primary · KS1+KS2";
  if (lo <= 5 && hi >= 11) return "Primary · KS1+KS2";
  if (lo <= 3 && hi <= 7) return "Infant · KS1";
  if (lo <= 4 && hi <= 9) return "Primary · KS1+KS2";
  if (hi <= 7) return "Infant · KS1";
  if (lo >= 11) return "Secondary · KS3+";

  return `Ages ${lo}–${hi}`;
}

/** Compact secondary line for tables: offering plus optional establishment type. */
export function schoolOfferingMeta(
  ageRange?: string | null,
  schoolType?: string | null,
): string {
  const offering = schoolOfferingLabel(ageRange);
  if (!schoolType || schoolType === "—") return offering;
  if (offering === "—") return schoolType;
  return `${offering} · ${schoolType}`;
}
