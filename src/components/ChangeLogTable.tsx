import type { ChangeLog } from "@/lib/board";

export function ChangeLogTable({ changeLog }: { changeLog: ChangeLog }) {
  if (!changeLog.items.length) return null;

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Measure</th>
            <th>Previous</th>
            <th>Current</th>
            <th>Change</th>
          </tr>
        </thead>
        <tbody>
          {changeLog.items.map((item) => (
            <tr key={item.label}>
              <td>{item.label}</td>
              <td>{item.previous}</td>
              <td>{item.current}</td>
              <td
                className={
                  item.tone === "up"
                    ? "delta-up"
                    : item.tone === "down"
                      ? "delta-down"
                      : "delta-flat"
                }
              >
                {item.delta}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
