import type { ChangeLog } from "@/lib/board";
import { ChangeLogTable } from "@/components/ChangeLogTable";

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
      <ChangeLogTable changeLog={changeLog} />
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
