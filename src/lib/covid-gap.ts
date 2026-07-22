/** Shared COVID performance-table gap helpers for year-on-year charts. */

export const COVID_GAP_LABEL = "COVID";

export const COVID_GAP_NOTE =
  "Hatched band = continuous COVID gap (2019/20–2021/22 unpublished in performance tables).";

export type CovidGapPoint = {
  year: string;
  gap: true;
};

/** True when consecutive published years skip one or more academic years. */
export function hasYearSkip(
  currentYearLabel: string,
  nextYearLabel: string,
): boolean {
  const a = parseInt(String(currentYearLabel).split("/")[0], 10);
  const b = parseInt(String(nextYearLabel).split("/")[0], 10);
  return !Number.isNaN(a) && !Number.isNaN(b) && b - a > 1;
}

/**
 * Insert a single compressed COVID gap category between published years
 * so lines break without spending three category slots on 2019–22.
 */
export function insertCovidGapCategory<T extends { year: string }>(
  rows: T[],
  makeGap: () => T & CovidGapPoint,
): Array<T | (T & CovidGapPoint)> {
  const out: Array<T | (T & CovidGapPoint)> = [];
  for (let i = 0; i < rows.length; i += 1) {
    out.push(rows[i]);
    const next = rows[i + 1];
    if (!next) continue;
    if (hasYearSkip(rows[i].year, next.year)) {
      out.push(makeGap());
    }
  }
  return out;
}

export function findCovidGapBounds(
  rows: Array<{ year: string; gap?: boolean }>,
): { gapLabel: string; before: string | null; after: string | null } | null {
  const idx = rows.findIndex((row) => row.gap);
  if (idx < 0) return null;
  return {
    gapLabel: rows[idx].year,
    before: idx > 0 ? rows[idx - 1].year : null,
    after: idx < rows.length - 1 ? rows[idx + 1].year : null,
  };
}
