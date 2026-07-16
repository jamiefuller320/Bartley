#!/usr/bin/env python3
"""Build src/data/feeder-schools.json for Bartley feeder infants + local peers.

Uses cached CSP GIAS / Census / pupilabsence extracts under /tmp/csp-feeder/
(or downloads them). School-level KS1 and phonics are no longer in CSP open
downloads — attainment fields remain null for ASP/local fill-in.

Usage:
  python3 scripts/extract-feeder-schools.py
"""

from __future__ import annotations

import csv
import json
import urllib.request
import zipfile
from io import BytesIO
from pathlib import Path

UA = "Mozilla/5.0 (compatible; BartleyInsight/1.0)"
ROOT = Path(__file__).resolve().parents[1]
CACHE = Path("/tmp/csp-feeder")
OUT = ROOT / "src/data/feeder-schools.json"
YEAR = "2024-2025"
PERIOD = "2024/2025"

FEEDERS = [
    ("116302", "Netley Marsh Church of England Infant School", "Netley Marsh", "8503110"),
    ("116366", "St Michael and All Angels CofE Infant School", "St Michael & All Angels", "8503360"),
    ("116282", "Copythorne CofE Infant School", "Copythorne", "8503032"),
]
FEEDER_URNS = {u for u, _, _, _ in FEEDERS}
LOCAL_PREFIXES = (
    "SO32",
    "SO40",
    "SO41",
    "SO42",
    "SO43",
    "SO45",
    "SO50",
    "SO51",
    "SO52",
    "SO53",
    "BH24",
    "SP6",
)
# Hampshire / England phonics from EES (LA/national only in open data).
PHONICS = [
    {
        "period": "2022/2023",
        "label": "2022/23",
        "hampshireYear1": 80.0,
        "englandYear1": 79.0,
        "hampshireByEndYear2": 89.0,
        "englandByEndYear2": 89.0,
    },
    {
        "period": "2023/2024",
        "label": "2023/24",
        "hampshireYear1": 81.0,
        "englandYear1": 80.0,
        "hampshireByEndYear2": 91.0,
        "englandByEndYear2": 89.0,
    },
    {
        "period": "2024/2025",
        "label": "2024/25",
        "hampshireYear1": 81.0,
        "englandYear1": 80.0,
        "hampshireByEndYear2": 90.0,
        "englandByEndYear2": 89.0,
    },
]


def fnum(x: str | None) -> float | None:
    if x is None:
        return None
    s = str(x).strip().replace("%", "")
    if s == "" or s.lower() in {
        "na",
        "n/a",
        "supp",
        "suppressed",
        "ne",
        "np",
        "low",
        "lowcov",
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


def avg(vals: list[float | None]) -> float | None:
    clean = [v for v in vals if v is not None]
    if not clean:
        return None
    return round(sum(clean) / len(clean), 1)


def download_zip(filters: str, dest_name: str) -> Path:
    CACHE.mkdir(parents=True, exist_ok=True)
    path = CACHE / dest_name
    if path.exists() and path.stat().st_size > 10_000:
        return path
    url = (
        "https://www.compare-school-performance.service.gov.uk/download-data"
        f"?download=true&regions=0&filters={filters}&fileformat=csv&year={YEAR}&meta=false"
    )
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=180) as resp:
        raw = resp.read()
    # CSP returns a zip of CSVs
    try:
        with zipfile.ZipFile(BytesIO(raw)) as zf:
            names = [n for n in zf.namelist() if n.lower().endswith(".csv")]
            if not names:
                raise RuntimeError(f"No CSV in zip for {filters}")
            # Prefer the matching file name
            pick = next(
                (n for n in names if dest_name.split("-")[0].lower() in n.lower()),
                names[0],
            )
            path.write_bytes(zf.read(pick))
    except zipfile.BadZipFile:
        path.write_bytes(raw)
    return path


def load_csv(path: Path) -> list[dict[str, str]]:
    with path.open(encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def school_obj(
    urn: str,
    name: str,
    short: str,
    laestab: str | None,
    role: str,
    gias_by_urn: dict[str, dict[str, str]],
    census: dict[str, dict[str, str]],
    absence: dict[str, dict[str, str]],
    reason: str | None = None,
) -> dict:
    g = gias_by_urn[urn]
    c = census.get(urn, {})
    a = absence.get(urn, {})
    obj = {
        "urn": urn,
        "name": name,
        "short": short,
        "laEstab": laestab or g.get("LAESTAB", ""),
        "town": g.get("TOWN") or "",
        "postcode": g.get("POSTCODE") or "",
        "ageRange": f"{g.get('AGELOW')}-{g.get('AGEHIGH')}",
        "schoolType": g.get("SCHOOLTYPE") or "",
        "religiousDenomination": g.get("RELCHAR") or "",
        "compareUrl": f"https://www.compare-school-performance.service.gov.uk/school/{urn}",
        "latest": {
            "pupilsOnRoll": fnum(c.get("NOR")),
            "boysPercent": fnum(c.get("PNORB")),
            "girlsPercent": fnum(c.get("PNORG")),
            "fsmEverPercent": fnum(c.get("PNUMFSMEVER")),
            "fsmEverCount": fnum(c.get("NUMFSMEVER")),
            "senSupportPercent": fnum(c.get("PSENELK")),
            "senSupportCount": fnum(c.get("TSENELK")),
            "ehcPercent": fnum(c.get("PSENELSE")),
            "ehcCount": fnum(c.get("TSENELSE")),
            "ealPercent": fnum(c.get("PNUMEAL")),
            "absencePercent": fnum(a.get("PERCTOT")),
            "persistentAbsencePercent": fnum(a.get("PPERSABS10")),
            "phonicsYear1Expected": None,
            "phonicsByEndYear2Expected": None,
            "ks1ReadingExpected": None,
            "ks1WritingExpected": None,
            "ks1MathsExpected": None,
            "ks1ScienceExpected": None,
        },
        "role": role,
    }
    if reason:
        obj["reason"] = reason
    return obj


def group_avg(schools: list[dict], label: str) -> dict:
    return {
        "label": label,
        "pupilsOnRoll": avg([s["latest"]["pupilsOnRoll"] for s in schools]),
        "fsmEverPercent": avg([s["latest"]["fsmEverPercent"] for s in schools]),
        "senSupportPercent": avg([s["latest"]["senSupportPercent"] for s in schools]),
        "ehcPercent": avg([s["latest"]["ehcPercent"] for s in schools]),
        "ealPercent": avg([s["latest"]["ealPercent"] for s in schools]),
        "absencePercent": avg([s["latest"]["absencePercent"] for s in schools]),
        "persistentAbsencePercent": avg(
            [s["latest"]["persistentAbsencePercent"] for s in schools]
        ),
    }


def short_name(name: str) -> str:
    for suffix in (
        " Church of England Infant School",
        " CofE Infant School",
        " Infant School",
        " Infant",
    ):
        if name.endswith(suffix):
            return name[: -len(suffix)].strip()
    return name


def main() -> None:
    gias_path = download_zip("GIAS", f"gias-{YEAR}.csv")
    census_path = download_zip("Census", f"Census-{YEAR}.csv")
    absence_path = download_zip("ABSENCE", f"pupilabsence-{YEAR}.csv")
    # Fallback filenames if zip extraction named differently
    if not census_path.exists():
        census_path = next(CACHE.glob("Census*.csv"))
    if not absence_path.exists():
        absence_path = next(CACHE.glob("*absence*.csv"))

    gias_rows = load_csv(gias_path)
    gias_by_urn = {r["URN"]: r for r in gias_rows}
    census = {r["URN"]: r for r in load_csv(census_path)}
    absence = {r["URN"]: r for r in load_csv(absence_path)}

    feeders = [
        school_obj(u, n, s, l, "feeder", gias_by_urn, census, absence)
        for u, n, s, l in FEEDERS
    ]
    feeder_avg_nor = avg([f["latest"]["pupilsOnRoll"] for f in feeders])
    assert feeder_avg_nor is not None

    candidates: list[dict] = []
    for g in gias_rows:
        if g.get("LA") != "850" or g.get("SCHSTATUS") != "Open":
            continue
        try:
            low, high = int(g["AGELOW"]), int(g["AGEHIGH"])
        except (TypeError, ValueError):
            continue
        if not (low <= 5 and high == 7):
            continue
        urn = g["URN"]
        if urn in FEEDER_URNS:
            continue
        pc = (g.get("POSTCODE") or "").upper()
        if not any(pc.startswith(p) for p in LOCAL_PREFIXES):
            continue
        nor = fnum(census.get(urn, {}).get("NOR"))
        if nor is None:
            continue
        if abs(nor - feeder_avg_nor) / feeder_avg_nor > 0.55:
            continue
        a = absence.get(urn, {})
        candidates.append(
            {
                "urn": urn,
                "name": g["SCHNAME"],
                "laestab": g.get("LAESTAB"),
                "nor": nor,
                "pa": fnum(a.get("PPERSABS10")),
                "abs": fnum(a.get("PERCTOT")),
            }
        )

    candidates.sort(
        key=lambda c: (
            c["pa"] if c["pa"] is not None else 999,
            c["abs"] if c["abs"] is not None else 999,
            abs(c["nor"] - feeder_avg_nor),
        )
    )
    top3 = candidates[:3]
    peers = []
    for i, c in enumerate(top3):
        reason = (
            f"Ranked #{i + 1} among local similar-size Hampshire infants "
            f"(ages 4–7, NOR within ~55% of feeder average) by lowest persistent "
            f"absence then overall absence for 2024/25 — proxy quality signal while "
            f"school-level KS1/phonics is unpublished."
        )
        peers.append(
            school_obj(
                c["urn"],
                c["name"],
                short_name(c["name"]),
                c["laestab"],
                "peer",
                gias_by_urn,
                census,
                absence,
                reason,
            )
        )

    out = {
        "generatedAt": "2026-07-16",
        "period": PERIOD,
        "purpose": "Prior-learning / feeder intake context for Bartley CofE Junior School governors.",
        "selection": {
            "feeders": (
                "Named Bartley feeder infant schools by DfE number (LAESTAB): "
                "Netley Marsh 850/3110, St Michael and All Angels 850/3360, "
                "Copythorne 850/3032."
            ),
            "peers": (
                "Hampshire open infant schools (ages 4–7) in SO32 / SO40–SO53 / "
                "BH24 / SP6 vicinity, NOR within ~55% of feeder average, excluding "
                "the three named feeders; ranked by lowest persistent absence then "
                "overall absence — the strongest publicly published school-level "
                "quality signal while school-level KS1/phonics attainment is no "
                "longer released in Compare school performance downloads."
            ),
            "ks1Note": (
                "Statutory KS1 teacher assessments became optional and school-level "
                "KS1 results were removed from performance-table downloads after "
                "2022/23. Phonics remains statutory but school-level phonics is no "
                "longer included in CSP open downloads (only LA/national EES tables). "
                "Feeder/peer KS1 and phonics attainment fields are therefore null "
                "pending ASP/local figures."
            ),
        },
        "feeders": feeders,
        "feederAverage": group_avg(feeders, "Feeder average (3 named schools)"),
        "peers": peers,
        "peerAverage": group_avg(
            peers, "Local infant peer average (top 3 by published absence)"
        ),
        "phonicsBenchmarks": PHONICS,
        "bartleyPriorLearningContext": {
            "note": (
                "Bartley KS2 progress (last published 2022/23) measures value-added "
                "from KS1 baselines for that cohort and is the closest published "
                "signal of how prior learning converts into junior outcomes."
            ),
            "progressPeriod": "2022/2023",
            "readingProgress": -0.2,
            "writingProgress": -0.1,
            "mathsProgress": -1.0,
        },
    }

    OUT.write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {OUT} with {len(feeders)} feeders and {len(peers)} peers")
    for p in peers:
        print(
            f"  peer {p['short']}: NOR={p['latest']['pupilsOnRoll']} "
            f"PA={p['latest']['persistentAbsencePercent']}"
        )


if __name__ == "__main__":
    main()
