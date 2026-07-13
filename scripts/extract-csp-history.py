#!/usr/bin/env python3
"""Download Compare School Performance KS2 CSVs and rebuild bartley-csp-history.json.

Usage:
  python3 scripts/extract-csp-history.py
"""

from __future__ import annotations

import csv
import json
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
URN = "116338"
LEA = "850"
UA = "Mozilla/5.0 (compatible; BartleyInsight/1.0)"
ROOT = Path(__file__).resolve().parents[1]
CACHE = Path("/tmp/csp-ks2")
OUT = ROOT / "src/data/bartley-csp-history.json"


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


def extract_metrics(row: dict[str, str] | None) -> dict[str, float | None] | None:
    if not row:
        return None
    return {
        "rwmExpected": pct(first(row, "PTRWM_EXP")),
        "rwmHigher": pct(first(row, "PTRWM_HIGH")),
        "readingExpected": pct(first(row, "PTREAD_EXP")),
        "readingHigher": pct(first(row, "PTREAD_HIGH")),
        "readingScaled": num(first(row, "READ_AVERAGE")),
        "writingExpected": pct(first(row, "PTWRITTA_EXP")),
        "writingHigher": pct(first(row, "PTWRITTA_HIGH")),
        "mathsExpected": pct(first(row, "PTMAT_EXP")),
        "mathsHigher": pct(first(row, "PTMAT_HIGH")),
        "mathsScaled": num(first(row, "MAT_AVERAGE", "MATTAVERAGE")),
        "gpsExpected": pct(first(row, "PTGPS_EXP")),
        "gpsHigher": pct(first(row, "PTGPS_HIGH")),
        "gpsScaled": num(first(row, "GPS_AVERAGE")),
        "scienceExpected": pct(first(row, "PTSCITA_EXP")),
        "readingProgress": num(first(row, "READPROG")),
        "readingProgressLower": num(first(row, "READPROG_LOWER")),
        "readingProgressUpper": num(first(row, "READPROG_UPPER")),
        "writingProgress": num(first(row, "WRITPROG")),
        "writingProgressLower": num(first(row, "WRITPROG_LOWER")),
        "writingProgressUpper": num(first(row, "WRITPROG_UPPER")),
        "mathsProgress": num(first(row, "MATPROG")),
        "mathsProgressLower": num(first(row, "MATPROG_LOWER")),
        "mathsProgressUpper": num(first(row, "MATPROG_UPPER")),
        "boysRwmExpected": pct(first(row, "PTRWM_EXP_B")),
        "girlsRwmExpected": pct(first(row, "PTRWM_EXP_G")),
        "disadvantagedRwmExpected": pct(first(row, "PTRWM_EXP_FSM6CLA1A")),
        "notDisadvantagedRwmExpected": pct(
            first(row, "PTRWM_EXP_NotFSM6CLA1A", "PTRWM_EXP_NOTFSM6CLA1A")
        ),
        "disadvantageGapPp": num(first(row, "DIFFN_RWM_EXP")),
        "disadvantagedPercent": pct(first(row, "PTFSM6CLA1A")),
        "eligiblePupils": num(first(row, "TELIG")),
        "pupilsAged11": num(first(row, "TPUPYEAR")),
    }


def main() -> None:
    history = []
    for year in YEARS:
        path = download(year)
        rows = load(path)
        school = next(
            (r for r in rows if r.get("URN") == URN and r.get("RECTYPE") == "1"),
            None,
        )
        hants = next(
            (r for r in rows if r.get("LEA") == LEA and r.get("RECTYPE") == "3"),
            None,
        )
        england = next((r for r in rows if r.get("RECTYPE") in ("4", "5")), None)
        history.append(
            {
                "period": year.replace("-", "/"),
                "label": f"{year[:4]}/{year[7:]}",
                "school": extract_metrics(school),
                "hampshire": extract_metrics(hants),
                "england": extract_metrics(england),
            }
        )
        print("extracted", year)

    payload = {
        "source": {
            "name": "Compare school and college performance — KS2 downloadable data",
            "url": "https://www.compare-school-performance.service.gov.uk/download-data",
            "note": (
                "School-level KS2 performance tables extracts (RECTYPE 1 school, 3 LA, 4/5 England). "
                "No KS2 performance-table files for 2019/20–2021/22 (COVID cancellation / not published in tables). "
                "2014/15 uses the pre-2016 assessment framework and is excluded for comparability."
            ),
            "years": YEARS,
        },
        "urn": URN,
        "history": history,
    }
    OUT.write_text(json.dumps(payload, indent=2) + "\n")
    print("wrote", OUT)


if __name__ == "__main__":
    main()
