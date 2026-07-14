import type { SchoolProfile, SubjectComparison } from "@/lib/types";
import { fmtPct, fmtPp, shortSubject } from "@/lib/format";

export function ComparisonTable({
  subjects,
  metric = "expected",
  cohortSize,
}: {
  subjects: SubjectComparison[];
  metric?: "expected" | "higher";
  cohortSize?: number | null;
  profile?: SchoolProfile;
}) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Subject</th>
            <th>
              School
              {cohortSize != null ? ` (n=${cohortSize})` : ""}
            </th>
            <th>Hampshire</th>
            <th>England</th>
            <th>vs LA</th>
            <th>vs Eng</th>
          </tr>
        </thead>
        <tbody>
          {subjects.map((row) => {
            const school =
              metric === "expected" ? row.schoolExpected : row.schoolHigher;
            const hampshire =
              metric === "expected"
                ? row.hampshireExpected
                : row.hampshireHigher;
            const england =
              metric === "expected" ? row.englandExpected : row.englandHigher;
            const vsLa =
              school != null && hampshire != null ? school - hampshire : null;
            const vsEng =
              school != null && england != null ? school - england : null;
            return (
              <tr key={row.subject}>
                <td>{shortSubject(row.subject)}</td>
                <td>{fmtPct(school)}</td>
                <td>{fmtPct(hampshire)}</td>
                <td>{fmtPct(england)}</td>
                <td className={deltaClass(vsLa)}>{fmtPp(vsLa)}</td>
                <td className={deltaClass(vsEng)}>{fmtPp(vsEng)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function deltaClass(value: number | null): string {
  if (value === null || value === undefined) return "";
  if (value >= 2) return "delta-up";
  if (value <= -2) return "delta-down";
  return "delta-flat";
}
