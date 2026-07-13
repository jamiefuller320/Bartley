import type { SchoolProfile } from "@/lib/types";
import { fmtPct } from "@/lib/format";

export function CohortProfile({ profile }: { profile: SchoolProfile }) {
  const items = [
    { label: "Year 6 cohort", value: profile.pupilsAged11?.toString() ?? "—" },
    {
      label: "Eligible pupils",
      value: profile.eligiblePupils?.toString() ?? "—",
    },
    {
      label: "Disadvantaged",
      value: fmtPct(profile.disadvantagedPercent),
    },
    { label: "SEN support", value: fmtPct(profile.senSupportPercent) },
    { label: "EHC plan", value: fmtPct(profile.ehcPercent) },
    { label: "EAL", value: fmtPct(profile.ealPercent) },
    { label: "Non-mobile", value: fmtPct(profile.nonMobilePercent) },
    {
      label: "Boys / girls",
      value: `${fmtPct(profile.boysPercent, 0)} / ${fmtPct(profile.girlsPercent, 0)}`,
    },
  ];

  return (
    <dl className="cohort-grid">
      {items.map((item) => (
        <div key={item.label} className="cohort-item">
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
