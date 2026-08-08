#!/usr/bin/env python3
"""Re-select top peer junior schools and refresh multi-year KS2 metrics.

Each run:
  1. Downloads latest GIAS extract + multi-year CSP KS2 CSVs
  2. Re-selects the top 3 state-funded Hampshire junior peers near Bartley
  3. Rebuilds src/data/peer-schools.json (peers, averages, history, selection)

Usage:
  python3 scripts/refresh-peers.py
"""

from __future__ import annotations

import csv
import json
import statistics
import urllib.request
import zipfile
from io import BytesIO
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

BARTLEY_URN = "116338"
HAMPSHIRE_LA = "850"
ELIGIBLE_TOLERANCE = 0.40  # within ~40% of Bartley's eligible cohort
GIAS_YEAR = YEARS[-1]  # latest YEARS entry

STATE_FUNDED_MINOR_GROUPS = {
    "Maintained school",
    "Academy",
    "Free school",
}

LOCAL_PREFIXES = (
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

SUBJECTS = [
    ("Reading, writing and maths", "rwm"),
    ("Reading", "reading"),
    ("Writing", "writing"),
    ("Maths", "maths"),
    ("Grammar, punctuation and spelling", "gps"),
    ("Science", "science"),
]

SHORT_SUFFIXES = (
    " Church of England Junior School",
    " Church of England Junior",
    " CofE Junior School",
    " C of E Junior School",
    " CofE Junior",
    " Junior School",
    " Junior",
)


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


def download_zip(filters: str, dest_name: str, year: str = GIAS_YEAR) -> Path:
    """Download a CSP zip extract and write the first/matching CSV to CACHE."""
    CACHE.mkdir(parents=True, exist_ok=True)
    path = CACHE / dest_name
    if path.exists() and path.stat().st_size > 10_000:
        return path
    url = (
        "https://www.compare-school-performance.service.gov.uk/download-data"
        f"?download=true&regions=0&filters={filters}&fileformat=csv&year={year}&meta=false"
    )
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=180) as resp:
        raw = resp.read()
    try:
        with zipfile.ZipFile(BytesIO(raw)) as zf:
            names = [n for n in zf.namelist() if n.lower().endswith(".csv")]
            if not names:
                raise RuntimeError(f"No CSV in zip for {filters}")
            pick = next(
                (n for n in names if dest_name.split("-")[0].lower() in n.lower()),
                names[0],
            )
            path.write_bytes(zf.read(pick))
    except zipfile.BadZipFile:
        path.write_bytes(raw)
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


def classify_sector(minor_group: str | None, school_type: str | None) -> tuple[str, str]:
    """Return (sector, sectorLabel). Independent/private are not like-for-like."""
    minor = (minor_group or "").strip()
    stype = (school_type or "").strip()
    blob = f"{minor} {stype}".lower()
    if any(hint in blob for hint in ("independent", "private", "non-maintained")):
        return "independent", "Independent"
    if (
        minor in STATE_FUNDED_MINOR_GROUPS
        or "academy" in minor.lower()
        or "maintained" in minor.lower()
        or "free school" in minor.lower()
    ):
        return "state-funded", "State-funded"
    if any(
        token in stype.lower()
        for token in (
            "community school",
            "voluntary",
            "foundation school",
            "academy",
            "free school",
        )
    ):
        return "state-funded", "State-funded"
    return "other", "Other"


def is_state_funded(g: dict[str, str]) -> bool:
    sector, _ = classify_sector(g.get("MINORGROUP"), g.get("SCHOOLTYPE"))
    return sector == "state-funded"


def short_name(name: str) -> str:
    short = name.strip()
    for suffix in SHORT_SUFFIXES:
        if short.endswith(suffix):
            short = short[: -len(suffix)].strip()
            break
    # Compact common directional prefixes used in local junior names.
    if short.startswith("North "):
        short = "N. " + short[len("North ") :]
    elif short.startswith("South "):
        short = "S. " + short[len("South ") :]
    return short


def year_label(year: str) -> str:
    """2024-2025 -> 2024/25."""
    if len(year) >= 9 and year[4] == "-":
        return f"{year[:4]}/{year[7:]}"
    return year


def period_slash(year: str) -> str:
    return year.replace("-", "/")


def gias_field(g: dict[str, str], *keys: str, default: str = "") -> str:
    for key in keys:
        val = g.get(key)
        if val not in (None, ""):
            return str(val).strip()
    return default


def is_open(g: dict[str, str]) -> bool:
    status = gias_field(g, "SCHSTATUS", "SchoolStatus", "STATUS").lower()
    return status == "open" or status == ""


def is_junior_age_range(g: dict[str, str]) -> bool:
    try:
        low = int(gias_field(g, "AGELOW", "AgeLow", "LOWAGE") or "")
        high = int(gias_field(g, "AGEHIGH", "AgeHigh", "HIGHAGE") or "")
    except ValueError:
        return False
    return low == 7 and high == 11


def postcode_in_vicinity(postcode: str) -> bool:
    pc = (postcode or "").upper().replace(" ", "")
    # Compare against prefix + digit/letter boundary using spaced form too.
    spaced = (postcode or "").upper().strip()
    return any(
        spaced.startswith(p + " ") or spaced.startswith(p) or pc.startswith(p)
        for p in LOCAL_PREFIXES
    )


def rank_reason(rank: int, rwm: float | None, label: str, tied: bool) -> str:
    ordinal = {1: "Highest", 2: "Second-highest", 3: "Third-highest"}.get(
        rank, f"Ranked #{rank}"
    )
    if tied and rank <= 2:
        ordinal = "Joint-highest" if rank == 1 else "Joint second-highest"
    rwm_bit = f" ({rwm:g}% RWM)" if rwm is not None else ""
    return (
        f"{ordinal} combined RWM expected among similar-size state-funded "
        f"Hampshire juniors in the local vicinity ({label}){rwm_bit}."
    )


def select_peers(
    gias_rows: list[dict[str, str]],
    latest_ks2: list[dict[str, str]],
) -> tuple[list[dict], float]:
    """Return (top 3 candidate dicts, Bartley eligible cohort)."""
    ks2_by_urn = {
        str(r.get("URN", "")).strip(): r
        for r in latest_ks2
        if str(r.get("URN", "")).strip()
    }

    bartley_row = ks2_by_urn.get(BARTLEY_URN)
    if not bartley_row:
        raise RuntimeError(f"Bartley URN {BARTLEY_URN} missing from latest KS2 extract")
    bartley_eligible = num(first(bartley_row, "TEALELIG", "TELIG"))
    if bartley_eligible is None or bartley_eligible <= 0:
        raise RuntimeError("Bartley eligible cohort (TELIG/TEALELIG) unavailable")

    gias_by_urn = {
        gias_field(g, "URN"): g for g in gias_rows if gias_field(g, "URN")
    }

    candidates: list[dict] = []
    for urn, g in gias_by_urn.items():
        if urn == BARTLEY_URN:
            continue
        la = gias_field(g, "LA", "LEA")
        # Prefer numeric LA code; fall back to name-containing "Hampshire".
        if la != HAMPSHIRE_LA and "hampshire" not in la.lower():
            continue
        if not is_open(g):
            continue
        if not is_state_funded(g):
            continue
        if not is_junior_age_range(g):
            continue
        postcode = gias_field(g, "POSTCODE", "Postcode", "PCODE")
        if not postcode_in_vicinity(postcode):
            continue

        ks2 = ks2_by_urn.get(urn)
        if not ks2:
            continue
        metrics = metrics_from_row(ks2)
        eligible = metrics.get("eligiblePupils")
        rwm = metrics.get("rwmExpected")
        if eligible is None or rwm is None:
            continue
        if abs(eligible - bartley_eligible) / bartley_eligible > ELIGIBLE_TOLERANCE:
            continue

        minor = gias_field(g, "MINORGROUP", "MinorGroup")
        stype = gias_field(g, "SCHOOLTYPE", "SchoolType", "TYPE")
        sector, sector_label = classify_sector(minor, stype)
        name = gias_field(g, "SCHNAME", "SchoolName", "NAME") or urn
        candidates.append(
            {
                "urn": urn,
                "name": name,
                "short": short_name(name),
                "postcode": postcode,
                "town": gias_field(g, "TOWN", "Town", "LOCALITY"),
                "ageRange": (
                    f"{gias_field(g, 'AGELOW', 'AgeLow')}-"
                    f"{gias_field(g, 'AGEHIGH', 'AgeHigh')}"
                ),
                "laEstab": gias_field(g, "LAESTAB", "LaEstab"),
                "latest": metrics,
                "compareUrl": (
                    "https://www.compare-school-performance.service.gov.uk/"
                    f"school/{urn}"
                ),
                "minorGroup": minor,
                "schoolType": stype,
                "sector": sector,
                "sectorLabel": sector_label,
                "_rwm": rwm,
                "_eligible": eligible,
            }
        )

    candidates.sort(key=lambda c: (-c["_rwm"], abs(c["_eligible"] - bartley_eligible), c["name"]))
    top = candidates[:3]
    if len(top) < 3:
        print(f"Warning: only {len(top)} peer candidates matched selection criteria")

    # Detect ties on RWM for reason wording.
    rwm_values = [c["_rwm"] for c in top]
    for i, c in enumerate(top):
        rank = i + 1
        tied = rwm_values.count(c["_rwm"]) > 1
        c["reason"] = rank_reason(rank, c["_rwm"], year_label(GIAS_YEAR), tied)
        del c["_rwm"]
        del c["_eligible"]

    return top, bartley_eligible


def build_history(by_year: dict[str, dict[str, dict]], urns: list[str]) -> list[dict]:
    history = []
    for year in YEARS:
        period = period_slash(year)
        label = year_label(year)
        for subject, key in SUBJECTS:
            by_expected: dict[str, float] = {}
            by_higher: dict[str, float] = {}
            by_scaled: dict[str, float] = {}
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
    return history


def build_by_urn_year(by_year: dict[str, dict[str, dict]], urns: list[str]) -> dict:
    by_urn_year = {}
    for urn in urns:
        series = []
        for year in YEARS:
            metrics = by_year.get(year, {}).get(urn)
            if not metrics:
                continue
            series.append(
                {
                    "period": period_slash(year),
                    "label": year_label(year),
                    "metrics": metrics,
                }
            )
        by_urn_year[urn] = series
    return by_urn_year


def main() -> None:
    print(f"Downloading GIAS extract for {GIAS_YEAR}…")
    gias_path = download_zip("GIAS", f"gias-{GIAS_YEAR}.csv", year=GIAS_YEAR)
    gias_rows = load(gias_path)

    print("Downloading KS2 extracts…")
    by_year: dict[str, dict[str, dict]] = {}
    latest_rows: list[dict[str, str]] = []
    for year in YEARS:
        rows = load(download(year))
        by_year[year] = {}
        # Index later once peer URNs are known; keep latest rows for selection.
        if year == GIAS_YEAR:
            latest_rows = rows
        # Temporarily store full rows keyed by URN for post-selection fill.
        for row in rows:
            urn = str(row.get("URN", "")).strip()
            if urn:
                by_year[year][urn] = metrics_from_row(row)

    peers, bartley_eligible = select_peers(gias_rows, latest_rows)
    urns = [p["urn"] for p in peers]

    # Trim by_year metrics maps to selected peers only (smaller JSON).
    slim_by_year: dict[str, dict[str, dict]] = {}
    for year in YEARS:
        slim_by_year[year] = {
            urn: by_year[year][urn] for urn in urns if urn in by_year.get(year, {})
        }
        # Ensure each peer's latest block uses the metrics map (already set in select).
        if year == GIAS_YEAR:
            for peer in peers:
                latest = slim_by_year[year].get(peer["urn"])
                if latest:
                    peer["latest"] = latest

    eligible_display = (
        int(bartley_eligible)
        if bartley_eligible == int(bartley_eligible)
        else bartley_eligible
    )
    method = (
        f"State-funded Hampshire junior schools (maintained / academy; ages 7–11), "
        f"open, eligible cohort within ~40% of Bartley ({eligible_display}), "
        f"postcodes in SO40–SO53 / BH24 / SP6 vicinity; ranked by "
        f"{year_label(GIAS_YEAR)} combined RWM expected standard. Independent "
        f"(private/public) schools are excluded because they do not publish the "
        f"same statutory KS2 performance-table measures."
    )

    bundle = {
        "selection": {
            "method": method,
            "bartleyUrn": BARTLEY_URN,
            "bartleyLatestEligible": bartley_eligible,
            "years": YEARS,
            "sector": "state-funded only",
            "sectorNote": (
                "Independent / private schools are omitted from peer comparisons: "
                "they are not required to publish the same Compare school "
                "performance KS2 attainment, progress and disadvantage tables as "
                "state-funded schools, so figures are not like-for-like with Bartley."
            ),
        },
        "peers": peers,
        "peerAverageLatest": {
            "rwmExpected": avg([p["latest"].get("rwmExpected") for p in peers]),
            "readingExpected": avg([p["latest"].get("readingExpected") for p in peers]),
            "writingExpected": avg([p["latest"].get("writingExpected") for p in peers]),
            "mathsExpected": avg([p["latest"].get("mathsExpected") for p in peers]),
            "gpsExpected": avg([p["latest"].get("gpsExpected") for p in peers]),
            "scienceExpected": avg([p["latest"].get("scienceExpected") for p in peers]),
        },
        "history": build_history(slim_by_year, urns),
        "byUrnYearMetrics": build_by_urn_year(slim_by_year, urns),
    }

    OUT.write_text(json.dumps(bundle, indent=2) + "\n", encoding="utf-8")
    print(f"Updated {OUT}")
    print("Selected peers:")
    for i, p in enumerate(peers, 1):
        rwm = p["latest"].get("rwmExpected")
        elig = p["latest"].get("eligiblePupils")
        print(
            f"  #{i} {p['short']} ({p['urn']}) "
            f"RWM={rwm} eligible={elig} {p['postcode']} — {p['reason']}"
        )


if __name__ == "__main__":
    main()
