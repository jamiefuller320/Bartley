"use client";

export type ChartViewMode = "compare" | "history";

export function ViewModeDock({
  mode,
  onChange,
}: {
  mode: ChartViewMode;
  onChange: (mode: ChartViewMode) => void;
}) {
  return (
    <div className="view-dock" role="group" aria-label="Chart view mode">
      <span className={mode === "compare" ? "view-dock-label active" : "view-dock-label"}>
        Bartley / Hampshire / England
      </span>
      <label className="view-dock-switch">
        <span className="sr-only">Switch chart view</span>
        <input
          type="range"
          min={0}
          max={1}
          step={1}
          value={mode === "compare" ? 0 : 1}
          onChange={(event) =>
            onChange(event.target.value === "0" ? "compare" : "history")
          }
          aria-valuetext={
            mode === "compare"
              ? "Bartley versus Hampshire and England"
              : "Bartley year on year history"
          }
        />
        <span className="view-dock-track" aria-hidden="true">
          <span
            className={
              mode === "history"
                ? "view-dock-thumb history"
                : "view-dock-thumb"
            }
          />
        </span>
      </label>
      <span className={mode === "history" ? "view-dock-label active" : "view-dock-label"}>
        Bartley year-on-year
      </span>
    </div>
  );
}
