import type { Finding } from "@/lib/types";
import { severityLabel } from "@/lib/format";

const tone: Record<Finding["severity"], string> = {
  positive: "var(--tone-positive)",
  watch: "var(--tone-watch)",
  priority: "var(--tone-priority)",
};

export function FindingsList({ findings }: { findings: Finding[] }) {
  return (
    <ol className="findings-list">
      {findings.map((finding) => (
        <li key={finding.title} className="finding-item">
          <span
            className="finding-severity"
            style={{ color: tone[finding.severity] }}
          >
            {severityLabel(finding.severity)}
          </span>
          <h3>{finding.title}</h3>
          <p>{finding.detail}</p>
        </li>
      ))}
    </ol>
  );
}
