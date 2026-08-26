"use client";

import { printMonitorPackElement } from "@/lib/printMonitorPack";

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
          '[data-monitor-pack="board"]',
        );
        if (!host) return;
        printMonitorPackElement(host);
      }}
    >
      Print board pack
    </button>
  );
}
