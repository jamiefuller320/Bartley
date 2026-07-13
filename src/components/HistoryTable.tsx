import type { HistoryRow } from "@/lib/types";
import { fmtPct } from "@/lib/format";

function periodShort(period: string): string {
  const [a, b] = period.split("/");
  return b && b.length === 4 ? `${a}/${b.slice(2)}` : period;
}

export function HistoryTable({ history }: { history: HistoryRow[] }) {
  const rows = history
    .filter((h) => h.subject === "Reading, writing and maths")
    .sort((a, b) => a.period.localeCompare(b.period));

  if (!rows.length) return null;

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Year</th>
            <th>School RWM</th>
            <th>Hampshire</th>
            <th>England</th>
            <th>School higher</th>
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
