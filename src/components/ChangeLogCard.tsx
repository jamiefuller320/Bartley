import type { ChangeLog } from "@/lib/board";

export function ChangeLogCard({
  changeLog,
  embedded = false,
}: {
  changeLog: ChangeLog;
  embedded?: boolean;
}) {
  if (!changeLog.items.length) return null;

  const inner = (
    <>
      {!embedded ? (
        <div className="section-head">
          <h2>What changed</h2>
          <p>
            {changeLog.summary} Figures compare the previous seed refresh
            {changeLog.previousRefreshedAt
              ? ` (${changeLog.previousRefreshedAt})`
              : ""}{" "}
            with the current seed
            {changeLog.currentRefreshedAt
              ? ` (${changeLog.currentRefreshedAt})`
              : ""}
            — not necessarily consecutive published academic years.
          </p>
        </div>
      ) : null}
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
        <p className="chart-note">
          {changeLog.previousRefreshedAt && changeLog.currentRefreshedAt
            ? `Comparing ${changeLog.previousRefreshedAt} → ${changeLog.currentRefreshedAt}. `
            : ""}
          After each automated data refresh, this table is rewritten from the
          live seed diff.
        </p>
    </>
  );

  if (embedded) {
    return <div className="monitor-panel-body">{inner}</div>;
  }

  return (
    <section className="section section-alt" id="changes">
      <div className="shell">{inner}</div>
    </section>
  );
}
