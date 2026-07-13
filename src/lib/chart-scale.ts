/**
 * Build a tight axis domain that magnifies differences between nearby values.
 * Keeps percentage axes within 0–100 and uses "nice" tick steps.
 */

export type AxisKind = "percent" | "scaled" | "progress";

function compact(values: Array<number | null | undefined>): number[] {
  return values.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
}

function niceStep(raw: number): number {
  if (raw <= 0) return 1;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / pow;
  if (norm <= 1) return 1 * pow;
  if (norm <= 2) return 2 * pow;
  if (norm <= 5) return 5 * pow;
  return 10 * pow;
}

function snapDown(value: number, step: number): number {
  return Math.floor(value / step) * step;
}

function snapUp(value: number, step: number): number {
  return Math.ceil(value / step) * step;
}

export function focusedDomain(
  values: Array<number | null | undefined>,
  kind: AxisKind = "percent",
): [number, number] {
  const nums = compact(values);
  if (!nums.length) {
    if (kind === "percent") return [0, 100];
    if (kind === "scaled") return [80, 120];
    return [-3, 3];
  }

  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const span = Math.max(max - min, kind === "percent" ? 6 : kind === "scaled" ? 2 : 0.6);
  const pad = span * 0.35;
  let low = min - pad;
  let high = max + pad;

  if (kind === "percent") {
    // Prefer a zoomed band; only fall back toward 0–100 when the spread is huge.
    if (span >= 45) {
      low = 0;
      high = 100;
    } else {
      low = Math.max(0, low);
      high = Math.min(100, high);
      // Ensure at least ~8pp visible window for small gaps.
      if (high - low < 8) {
        const mid = (min + max) / 2;
        low = Math.max(0, mid - 4);
        high = Math.min(100, mid + 4);
      }
    }
    const step = niceStep((high - low) / 4);
    low = Math.max(0, snapDown(low, step));
    high = Math.min(100, snapUp(high, step));
    if (low === high) {
      low = Math.max(0, low - step);
      high = Math.min(100, high + step);
    }
    return [low, high];
  }

  if (kind === "scaled") {
    const step = niceStep(Math.max((high - low) / 4, 1));
    low = snapDown(low, step);
    high = snapUp(high, step);
    if (low === high) {
      low -= step;
      high += step;
    }
    return [low, high];
  }

  // progress
  const step = niceStep(Math.max((high - low) / 4, 0.5));
  low = snapDown(low, step);
  high = snapUp(high, step);
  if (low === high) {
    low -= step;
    high += step;
  }
  return [low, high];
}

export function domainValues(
  rows: Array<Record<string, unknown>>,
  keys: string[],
): number[] {
  const out: number[] = [];
  for (const row of rows) {
    for (const key of keys) {
      const value = row[key];
      if (typeof value === "number" && Number.isFinite(value)) out.push(value);
    }
  }
  return out;
}
