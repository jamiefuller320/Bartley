"use client";

export function PrintMonitorPackButton({
  className = "btn btn-ghost monitor-print-btn",
}: {
  className?: string;
}) {
  return (
    <button
      type="button"
      className={className}
      data-tour="print-monitor-pack"
      onClick={() => {
        const host = document.querySelector<HTMLElement>(
          '[data-monitor-pack="board"] .monitor-print-pack',
        );
        if (!host) return;
        const root = document.documentElement;
        root.classList.add("monitor-print-active");
        window.print();
        window.setTimeout(() => root.classList.remove("monitor-print-active"), 500);
      }}
    >
      Print board pack
    </button>
  );
}
