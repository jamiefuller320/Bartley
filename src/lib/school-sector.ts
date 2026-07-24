/** Classify state-funded vs independent schools for like-for-like comparisons. */

export type SchoolSector = "state-funded" | "independent" | "other";

const STATE_MINOR_GROUPS = new Set([
  "maintained school",
  "academy",
  "free school",
  "sponsored academy",
  "converter academy",
]);

const INDEPENDENT_HINTS = [
  "independent",
  "private",
  "non-maintained",
  "other independent",
];

/**
 * Map GIAS MINORGROUP / SCHOOLTYPE (and similar labels) to a reporting sector.
 * Independent / private schools do not publish the same KS2 performance-table
 * measures as state-funded schools, so board comparisons should stay separate.
 */
export function classifySchoolSector(
  minorGroup?: string | null,
  schoolType?: string | null,
): SchoolSector {
  const minor = (minorGroup ?? "").trim().toLowerCase();
  const type = (schoolType ?? "").trim().toLowerCase();
  const blob = `${minor} ${type}`;

  if (INDEPENDENT_HINTS.some((hint) => blob.includes(hint))) {
    return "independent";
  }
  if (STATE_MINOR_GROUPS.has(minor) || minor.includes("academy") || minor.includes("maintained")) {
    return "state-funded";
  }
  if (
    type.includes("community school") ||
    type.includes("voluntary") ||
    type.includes("foundation school") ||
    type.includes("academy") ||
    type.includes("free school")
  ) {
    return "state-funded";
  }
  if (!minor && !type) return "other";
  return "other";
}

export function schoolSectorLabel(sector: SchoolSector): string {
  if (sector === "state-funded") return "State-funded";
  if (sector === "independent") return "Independent";
  return "Other";
}

export function schoolSectorNote(sector: SchoolSector): string {
  if (sector === "state-funded") {
    return "State-funded (maintained / academy) — publishes Compare school performance KS2 tables.";
  }
  if (sector === "independent") {
    return "Independent (private / public school) — does not publish the same statutory KS2 performance-table measures as state-funded schools; not like-for-like.";
  }
  return "School sector unclear from published type labels.";
}
