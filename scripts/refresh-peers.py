#!/usr/bin/env python3
"""Refresh peer-schools.json metrics for the curated peer URNs from CSP KS2 CSVs.

Does not re-select peers — updates latest snapshots, averages, and history for
the schools already listed in src/data/peer-schools.json.

Usage:
  python3 scripts/refresh-peers.py
"""

from __future__ import annotations

import csv
import json
import statistics
import urllib.request
from pathlib import Path

YEARS = [
    "2015-2016",
    "2016-2017",
    "2017-2018",
    "2018-2019",
    "2022-2023",
    "2023-2024",
    "2024-2025",
]
UA = "Mozilla/5.0 (compatible; BartleyInsight/1.0)"
ROOT = Path(__file__).resolve().parents[1]
CACHE = Path("/tmp/csp-ks2")
OUT = ROOT / "src/data/peer-schools.json"

SUBJECTS = [
    ("Reading, writing and maths", "rwm"),
    ("Reading", "reading"),
    ("Writing", "writing"),
    ("Maths", "maths"),
    ("Grammar, punctuation and spelling", "gps"),
    ("Science", "science"),
]


def download(year: str) -> Path:
    CACHE.mkdir(parents=True, exist_ok=True)
    path = CACHE / f"ks2-{year}.bin"
    if path.exists() and path.stat().st_size > 100_000:
        return path
    url = (
        "https://www.compare-school-performance.service.gov.uk/download-data"
        f"?download=true&regions=0&filters=KS2&fileformat=csv&year={year}&meta=false"
    )
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=120) as resp:
        path.write_bytes(resp.read())
    return path


def load(path: Path) -> list[dict[str, str]]:
    with path.open(encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def pct(v: str | None) -> float | None:
    if v is None:
        return None
    s = str(v).strip().replace("%", "")
    if s == "" or s.lower() in {
        "na",
        "n/a",
        "supp",
        "suppressed",
        "ne",
        "np",
        "low",
        ".",
        "z",
        "x",
        ":",
    }:
        return None
    try:
        return float(s)
    except ValueError:
        return None


def num(v: str | None) -> float | None:
    if v is None:
        return None
    s = str(v).strip()
    if s == "" or s.lower() in {
        "na",
        "n/a",
        "supp",
        "ne",
        "np",
        "low",
        ".",
        "z",
        "x",
        ":",
    }:
        return None
    try:
        return float(s)
    except ValueError:
        return None


def first(row: dict[str, str], *keys: str) -> str | None:
    for key in keys:
        if key in row and row[key] not in (None, ""):
            return row[key]
    return None


def find_school(rows: list[dict[str, str]], urn: str) -> dict[str, str] | None:
    for row in rows:
        if str(row.get("URN", "")).strip() == urn:
            return row
    return None


def metrics_from_row(row: dict[str, str]) -> dict:
    return {
        "rwmExpected": pct(first(row, "PTREADWRITMATSEX", "PTRWM_EXP")),
        "rwmHigher": pct(first(row, "PTREADWRITMATSHIGH", "PTRWM_HIGH")),
        "readingExpected": pct(first(row, "PTREADEX", "PTREAD_EXP")),
        "readingHigher": pct(first(row, "PTREADHIGH", "PTREAD_HIGH")),
        "readingScaled": num(first(row, "READAVG", "READSCR")),
        "writingExpected": pct(first(row, "PTWRITTAEX", "PTWRITEX", "PTWRIT_EXP")),
        "writingHigher": pct(first(row, "PTWRITTAHIGH", "PTWRITHIGH", "PTWRIT_HIGH")),
        "mathsExpected": pct(first(row, "PTMATSEX", "PTMATH_EXP")),
        "mathsHigher": pct(first(row, "PTMATSHIGH", "PTMATH_HIGH")),
        "mathsScaled": num(first(row, "MATSAVG", "MATSSCR")),
        "gpsExpected": pct(first(row, "PTGPSEX", "PTGPS_EXP")),
        "gpsHigher": pct(first(row, "PTGPSHIGH", "PTGPS_HIGH")),
        "gpsScaled": num(first(row, "GPSAVG", "GPSSCR")),
        "scienceExpected": pct(first(row, "PTSCITAEX", "PTSCIEX")),
        "readingProgress": num(first(row, "READPROG")),
        "writingProgress": num(first(row, "WRITPROG")),
        "mathsProgress": num(first(row, "MATSPROG")),
        "boysRwmExpected": pct(first(row, "PTREADWRITMATSEX_BOY", "PTRWM_EXP_BOY")),
        "girlsRwmExpected": pct(first(row, "PTREADWRITMATSEX_GIRL", "PTRWM_EXP_GIRL")),
        "disadvantagedRwmExpected": pct(
            first(row, "PTREADWRITMATSEX_FSM6CLA1A", "PTRWM_EXP_FSM6CLA1A", "PTREADWRITMATSEX_DIS")
        ),
        "notDisadvantagedRwmExpected": pct(
            first(row, "PTREADWRITMATSEX_NFSM6CLA1A", "PTRWM_EXP_NFSM6CLA1A", "PTREADWRITMATSEX_NOTDIS")
        ),
        "eligiblePupils": num(first(row, "TEALELIG", "TELIG")),
        "pupilsAged11": num(first(row, "TPUP11", "TPUP")),
        "disadvantagedPercent": pct(first(row, "PTFSM6CLA1A", "PFSM6CLA1A")),
    }


def avg(values: list[float | None]) -> float | None:
    clean = [v for v in values if v is not None]
    if not clean:
        return None
    return round(statistics.fmean(clean), 1)


def main() -> None:
    bundle = json.loads(OUT.read_text())
    urns = [p["urn"] for p in bundle["peers"]]
    by_year: dict[str, dict[str, dict]] = {}

    for year in YEARS:
        rows = load(download(year))
        by_year[year] = {}
        for urn in urns:
            school = find_school(rows, urn)
            if school:
                by_year[year][urn] = metrics_from_row(school)

    latest_year = YEARS[-1]
    for peer in bundle["peers"]:
        latest = by_year.get(latest_year, {}).get(peer["urn"])
        if latest:
            peer["latest"] = latest

    bundle["peerAverageLatest"] = {
        "rwmExpected": avg([p["latest"].get("rwmExpected") for p in bundle["peers"]]),
        "readingExpected": avg([p["latest"].get("readingExpected") for p in bundle["peers"]]),
        "writingExpected": avg([p["latest"].get("writingExpected") for p in bundle["peers"]]),
        "mathsExpected": avg([p["latest"].get("mathsExpected") for p in bundle["peers"]]),
        "gpsExpected": avg([p["latest"].get("gpsExpected") for p in bundle["peers"]]),
        "scienceExpected": avg([p["latest"].get("scienceExpected") for p in bundle["peers"]]),
    }

    history = []
    for year in YEARS:
        period = year.replace("-", "/")
        label = f"{year[:4]}/{year[7:]}" if len(year) >= 7 else year
        for subject, key in SUBJECTS:
            by_expected = {}
            by_higher = {}
            by_scaled = {}
            for urn in urns:
                metrics = by_year.get(year, {}).get(urn)
                if not metrics:
                    continue
                exp = metrics.get(f"{key}Expected")
                high = metrics.get(f"{key}Higher")
                scaled = metrics.get(f"{key}Scaled")
                if exp is not None:
                    by_expected[urn] = exp
                if high is not None:
                    by_higher[urn] = high
                if scaled is not None:
                    by_scaled[urn] = scaled
            history.append(
                {
                    "period": period,
                    "label": label,
                    "subject": subject,
                    "byUrnExpected": by_expected,
                    "byUrnHigher": by_higher,
                    "byUrnScaled": by_scaled,
                    "averageExpected": avg(list(by_expected.values())),
                    "averageHigher": avg(list(by_higher.values())),
                    "averageScaled": avg(list(by_scaled.values())),
                }
            )

    # Preserve richer byUrnYearMetrics if present; otherwise rebuild lightly.
    by_urn_year = {}
    for urn in urns:
        series = []
        for year in YEARS:
            metrics = by_year.get(year, {}).get(urn)
            if not metrics:
                continue
            series.append(
                {
                    "period": year.replace("-", "/"),
                    "label": f"{year[:4]}/{year[7:]}",
                    "metrics": metrics,
                }
            )
        by_urn_year[urn] = series

    bundle["history"] = history
    bundle["byUrnYearMetrics"] = by_urn_year
    bundle["selection"]["years"] = YEARS

    OUT.write_text(json.dumps(bundle, indent=2) + "\n")
    print(f"Updated {OUT} for peers {', '.join(urns)}")


if __name__ == "__main__":
    main()
