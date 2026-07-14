import { writeFileSync } from "node:fs";
import { buildMonitorPayload } from "../src/lib/build-monitor-payload";

const data = await buildMonitorPayload("116338");
data.source.refreshedAt = new Date().toISOString().slice(0, 10);
writeFileSync(
  new URL("../src/data/bartley-2024-25.json", import.meta.url),
  `${JSON.stringify(data, null, 2)}\n`,
);
console.log(
  `Updated src/data/bartley-2024-25.json (refreshedAt ${data.source.refreshedAt})`,
);
