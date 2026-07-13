import seed from "@/data/bartley-2024-25.json";
import type { SchoolMonitorData } from "@/lib/types";

export function getBartleyMonitorData(): SchoolMonitorData {
  return seed as SchoolMonitorData;
}
