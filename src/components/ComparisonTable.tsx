import type { SubjectComparison } from "@/lib/types";
import { fmtPct, fmtPp, shortSubject } from "@/lib/format";

export function ComparisonTable({ subjects }: { subjects: SubjectComparison[] }) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Subject</th>
            <th>School</th>
            <th>Hampshire</th>
            <th>England</th>
            <th>vs LA</th>
            <th>vs Eng</th>
          </tr>
        </thead>
        <tbody>
          {subjects.map((row) => (
            <tr key={row.subject}>
              <td>{shortSubject(row.subject)}</td>
              <td>{fmtPct(row.schoolExpected)}</td>
              <td>{fmtPct(row.hampshireExpected)}</td>
              <td>{fmtPct(row.englandExpected)}</td>
              <td className={deltaClass(row.vsHampshire)}>
                {fmtPp(row.vsHampshire)}
              </td>
              <td className={deltaClass(row.vsEngland)}>
                {fmtPp(row.vsEngland)}
              </td>
            </tr>
          ))}
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
