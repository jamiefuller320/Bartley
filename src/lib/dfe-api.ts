const BASE = "https://api.education.gov.uk/statistics/v1";

export const DATASET_IDS = {
  schoolPerformance: "019afee4-e5d0-72f9-9a8f-d7a1a56eac1d",
  schoolInformation: "019afee4-ba17-73cb-85e0-f88c101bb734",
  laPerformance: "019afee5-4791-7467-a788-c163fd9b57de",
} as const;

export const BARTLEY = {
  urn: "116338",
  locationId: "5eaQd",
  laEstab: "8503197",
  hampshireLocationId: "znRFQ",
  name: "Bartley Church of England Junior School",
} as const;

type Meta = {
  filters: Array<{
    id: string;
    column: string;
    options: Array<{ id: string; label: string }>;
  }>;
  indicators: Array<{ id: string; column: string; label: string }>;
  locations: Array<{
    level: { code: string; label: string };
    options: Array<{ id: string; label: string; urn?: string; code?: string }>;
  }>;
};

type ApiRow = {
  timePeriod: { period: string };
  geographicLevel: string;
  locations: Record<string, string>;
  filters: Record<string, string>;
  values: Record<string, string>;
};

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    // Meta payloads can exceed Next's 2MB data cache limit.
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`DfE API ${res.status} for ${url}`);
  }
  return res.json() as Promise<T>;
}

async function fetchPages(
  dataset: string,
  params: Record<string, string>,
): Promise<ApiRow[]> {
  const results: ApiRow[] = [];
  let page = 1;
  let totalPages = 1;
  do {
    const qs = new URLSearchParams({ ...params, page: String(page), pageSize: "100" });
    const data = await getJson<{
      results: ApiRow[];
      paging: { totalPages: number };
    }>(`${BASE}/data-sets/${dataset}/query?${qs}`);
    results.push(...(data.results ?? []));
    totalPages = data.paging?.totalPages ?? 1;
    page += 1;
  } while (page <= totalPages);
  return results;
}

function decode(meta: Meta, rows: ApiRow[]) {
  const fmap = Object.fromEntries(
    meta.filters.map((f) => [
      f.id,
      {
        col: f.column,
        opts: Object.fromEntries(f.options.map((o) => [o.id, o.label])),
      },
    ]),
  );
  const imap = Object.fromEntries(
    meta.indicators.map((i) => [i.id, i.column]),
  );
  return rows.map((row) => ({
    period: row.timePeriod.period,
    geographicLevel: row.geographicLevel,
    locations: row.locations,
    filters: Object.fromEntries(
      Object.entries(row.filters ?? {}).map(([fid, oid]) => [
        fmap[fid]?.col ?? fid,
        fmap[fid]?.opts[oid] ?? oid,
      ]),
    ),
    values: Object.fromEntries(
      Object.entries(row.values ?? {}).map(([iid, val]) => [
        imap[iid] ?? iid,
        val,
      ]),
    ),
  }));
}

export function parseMetric(value: string | undefined): number | null {
  if (value === undefined || value === null) return null;
  if (["", "z", "x", ":", ".", "c", "u", "low", "suppressed"].includes(value)) {
    return null;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export async function findSchoolLocationId(urn: string): Promise<string | null> {
  const meta = await getJson<Meta>(
    `${BASE}/data-sets/${DATASET_IDS.schoolPerformance}/meta`,
  );
  for (const loc of meta.locations) {
    if (loc.level.code !== "SCH") continue;
    const match = loc.options.find((o) => o.urn === urn);
    if (match) return match.id;
  }
  return null;
}

export async function fetchSchoolBundle(urn = BARTLEY.urn) {
  const [perfMeta, infoMeta, laMeta] = await Promise.all([
    getJson<Meta>(`${BASE}/data-sets/${DATASET_IDS.schoolPerformance}/meta`),
    getJson<Meta>(`${BASE}/data-sets/${DATASET_IDS.schoolInformation}/meta`),
    getJson<Meta>(`${BASE}/data-sets/${DATASET_IDS.laPerformance}/meta`),
  ]);

  const locationId =
    urn === BARTLEY.urn
      ? BARTLEY.locationId
      : await findSchoolLocationId(urn);
  if (!locationId) {
    throw new Error(`School URN ${urn} not found in KS2 performance dataset`);
  }

  const indicatorPerf =
    "IwjBz,i2s6X,ODwCL,CQCId,6lKrf,0H5T5,7tjXo,pBYSo,LukWj,HAYzL,YAzHK";
  const indicatorInfo =
    "onQmX,l9CcB,0HGT5,U5tRF,WoS2b,1WYi3,5ftdi,A65GK,bx4tT,dYs0Z,4V7UZ,VXl5X,D8mQe,gNdO9,RdCka,eJluS,Tz2PJ,S7iVx,yPBaB,PoXOe";
  const indicatorLa = "WmV2b,E1cqF,45XUZ,N8lDC,9VF4v,29Plz";

  const [perfRaw, infoRaw, hampRaw, engRaw] = await Promise.all([
    fetchPages(DATASET_IDS.schoolPerformance, {
      "locations.eq": `SCH|id|${locationId}`,
      indicators: indicatorPerf,
    }),
    fetchPages(DATASET_IDS.schoolInformation, {
      "locations.eq": `SCH|id|${locationId}`,
      indicators: indicatorInfo,
    }),
    fetchPages(DATASET_IDS.laPerformance, {
      "locations.eq": `LA|id|${BARTLEY.hampshireLocationId}`,
      indicators: indicatorLa,
    }),
    fetchPages(DATASET_IDS.laPerformance, {
      "geographicLevels.eq": "NAT",
      indicators: indicatorLa,
    }),
  ]);

  return {
    locationId,
    perf: decode(perfMeta, perfRaw),
    info: decode(infoMeta, infoRaw),
    hampshire: decode(laMeta, hampRaw),
    england: decode(laMeta, engRaw),
  };
}
