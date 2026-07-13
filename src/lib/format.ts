export function fmtPct(value: number | null | undefined, digits = 0): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `${value.toFixed(digits)}%`;
}

export function fmtNum(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return value.toFixed(digits);
}

export function fmtPp(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(0)} pp`;
}

export function shortSubject(subject: string): string {
  const map: Record<string, string> = {
    "Reading, writing and maths": "RWM",
    Reading: "Reading",
    Writing: "Writing",
    Maths: "Maths",
    "Grammar, punctuation and spelling": "GPS",
    Science: "Science",
  };
  return map[subject] ?? subject;
}

export function severityLabel(severity: string): string {
  if (severity === "positive") return "Strength";
  if (severity === "priority") return "Priority";
  return "Watch";
}
