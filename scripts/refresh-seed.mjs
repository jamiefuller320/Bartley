/**
 * Regenerates src/data/bartley-2024-25.json from the DfE EES API.
 * Usage: node scripts/refresh-seed.mjs
 */
import { writeFileSync } from "node:fs";

const res = await fetch("http://localhost:3000/api/school/116338");
if (!res.ok) {
  console.error("API failed", res.status, await res.text());
  process.exit(1);
}
const data = await res.json();
delete data.live;
delete data.fetchedAt;
writeFileSync(
  new URL("../src/data/bartley-2024-25.json", import.meta.url),
  JSON.stringify(data, null, 2) + "\n",
);
console.log("Updated src/data/bartley-2024-25.json");
