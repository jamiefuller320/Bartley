"use client";

export type ChartViewMode = "compare" | "history";

export function ViewModeDock({
  mode,
  onChange,
}: {
  mode: ChartViewMode;
  onChange: (mode: ChartViewMode) => void;
}) {
  const setCompare = () => onChange("compare");
  const setHistory = () => onChange("history");
  const toggle = () => onChange(mode === "compare" ? "history" : "compare");

  return (
    <div className="view-dock" role="group" aria-label="Chart view mode">
      <button
        type="button"
        className={
          mode === "compare" ? "view-dock-label active" : "view-dock-label"
        }
        onClick={setCompare}
        aria-pressed={mode === "compare"}
      >
        Bartley / Hampshire / England
      </button>

      <button
        type="button"
        className="view-dock-switch"
        onClick={toggle}
        aria-label="Switch chart view"
        aria-pressed={mode === "history"}
        title={
          mode === "compare"
            ? "Show Bartley year-on-year history"
            : "Show Bartley versus Hampshire and England"
        }
      >
        <span className="view-dock-track" aria-hidden="true">
          <span
            className={
              mode === "history" ? "view-dock-thumb history" : "view-dock-thumb"
            }
          />
        </span>
      </button>

      <button
        type="button"
        className={
          mode === "history" ? "view-dock-label active" : "view-dock-label"
        }
        onClick={setHistory}
        aria-pressed={mode === "history"}
      >
        Bartley year-on-year
      </button>
    </div>
  );
}
