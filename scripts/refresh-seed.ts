import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { buildMonitorPayload } from "../src/lib/build-monitor-payload";
import { buildChangeLog } from "../src/lib/board";
import type { PeerSchoolsBundle, SchoolMonitorData } from "../src/lib/types";

const seedUrl = new URL("../src/data/bartley-2024-25.json", import.meta.url);
const peersUrl = new URL("../src/data/peer-schools.json", import.meta.url);
const changeLogUrl = new URL("../src/data/change-log.json", import.meta.url);

function readJson<T>(url: URL): T | null {
  if (!existsSync(url)) return null;
  return JSON.parse(readFileSync(url, "utf8")) as T;
}

const previous = readJson<SchoolMonitorData>(seedUrl);
const peers = readJson<PeerSchoolsBundle>(peersUrl);

const data = await buildMonitorPayload("116338");
data.source.refreshedAt = new Date().toISOString().slice(0, 10);

const changeLog = buildChangeLog(previous, data, peers, peers);
writeFileSync(changeLogUrl, `${JSON.stringify(changeLog, null, 2)}\n`);
writeFileSync(seedUrl, `${JSON.stringify(data, null, 2)}\n`);

console.log(
  `Updated src/data/bartley-2024-25.json (refreshedAt ${data.source.refreshedAt})`,
);
console.log(
  `Updated src/data/change-log.json (${changeLog.items.length} moved figures)`,
);
