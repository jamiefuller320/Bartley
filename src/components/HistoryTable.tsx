import type { HistoryRow } from "@/lib/types";
import { fmtPct, fmtNum, shortSubject } from "@/lib/format";

function periodShort(period: string): string {
  const [a, b] = period.split("/");
  return b && b.length === 4 ? `${a}/${b.slice(2)}` : period;
}

export function HistoryTable({
  history,
  subject = "Reading, writing and maths",
}: {
  history: HistoryRow[];
  subject?: string;
}) {
  const rows = history
    .filter((h) => h.subject === subject)
    .sort((a, b) => a.period.localeCompare(b.period));

  if (!rows.length) return null;

  const showScaled = rows.some((r) => r.schoolScaled !== null);
  const showProgress = rows.some((r) => r.schoolProgress !== null);

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Year</th>
            <th>School {shortSubject(subject)}</th>
            <th>Hampshire</th>
            <th>England</th>
            <th>Higher</th>
            {showScaled ? <th>Scaled</th> : null}
            {showProgress ? <th>Progress</th> : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.period}>
              <td>{periodShort(row.period)}</td>
              <td>{fmtPct(row.schoolExpected)}</td>
              <td>{fmtPct(row.hampshireExpected)}</td>
              <td>{fmtPct(row.englandExpected)}</td>
              <td>{fmtPct(row.schoolHigher)}</td>
              {showScaled ? <td>{fmtNum(row.schoolScaled, 0)}</td> : null}
              {showProgress ? <td>{fmtNum(row.schoolProgress, 1)}</td> : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
