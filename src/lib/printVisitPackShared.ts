/**
 * Shared print helpers for board / visit packs (Comparison-tool compatible).
 */

export const VISIT_PACK_DOCUMENT_CSS = `
html {
  color-scheme: light only;
}
html, body {
  margin: 0 !important;
  padding: 0 !important;
  background: #fff !important;
  height: auto !important;
  min-height: 0 !important;
  overflow: visible !important;
  color: #14233a !important;
  font-family: Figtree, system-ui, sans-serif;
  font-size: 11pt;
  line-height: 1.4;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.no-print { display: none !important; }
.visit-pack-page-break {
  display: none !important;
  height: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
  border: 0 !important;
}
.visit-pack, .visit-pack-print-clone, .visit-pack-print-root, .monitor-print-pack {
  display: block !important;
  border: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
  float: none !important;
  position: static !important;
  width: 100% !important;
  overflow: visible !important;
  min-height: 0 !important;
  height: auto !important;
  color-scheme: light only;
  background: #fff !important;
  color: #14233a !important;
}
.visit-pack-print-clone :where(
  h1, h2, h3, h4, h5, h6,
  p, li, dt, dd, th, td,
  blockquote, strong, em, small,
  span, div, label, figcaption
) {
  color: #14233a !important;
  -webkit-text-fill-color: #14233a !important;
}
.visit-pack-print-clone a {
  color: #0b4f6c !important;
  -webkit-text-fill-color: #0b4f6c !important;
}
.visit-pack-sheet, .monitor-pack-sheet {
  display: block !important;
  float: none !important;
  position: static !important;
  overflow: visible !important;
  width: 100% !important;
  margin: 0 !important;
  padding: 0 0 2mm !important;
  border: 0 !important;
  page-break-inside: auto !important;
  page-break-after: auto !important;
  break-after: auto !important;
  background: #fff !important;
}
.monitor-pack-section,
.print-chart-block,
.monitor-print-clone .snapshot-row,
.monitor-print-clone .exec-grid,
.monitor-print-clone .findings-list,
.monitor-print-clone .data-table {
  display: block !important;
  overflow: visible !important;
  page-break-inside: avoid;
  break-inside: avoid;
  background: #fff !important;
}
.monitor-print-clone .snapshot-metric {
  border-top-color: rgba(20, 35, 58, 0.18) !important;
}
.monitor-print-clone svg {
  max-width: 100% !important;
  height: auto !important;
}
.monitor-print-clone .recharts-responsive-container {
  width: 100% !important;
  height: auto !important;
  min-height: 220px !important;
}
.monitor-print-clone .recharts-wrapper {
  width: 100% !important;
  height: auto !important;
}
.monitor-print-clone .volatility-note {
  color: #3d4f66 !important;
  -webkit-text-fill-color: #3d4f66 !important;
  background: #f4f7f9 !important;
}
.monitor-print-clone .data-table,
.monitor-print-clone .peer-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
  background: #fff !important;
}
.monitor-print-clone .data-table th,
.monitor-print-clone .data-table td,
.monitor-print-clone .peer-table th,
.monitor-print-clone .peer-table td {
  border: 1px solid rgba(20, 35, 58, 0.18);
  padding: 0.28rem 0.35rem;
  text-align: left;
  background: #fff !important;
  color: #14233a !important;
  -webkit-text-fill-color: #14233a !important;
}
.monitor-print-clone .data-table thead th,
.monitor-print-clone .peer-table thead th {
  color: #0b4f6c !important;
  -webkit-text-fill-color: #0b4f6c !important;
}
.monitor-print-clone .feeder-meta {
  display: block;
  font-size: 0.72rem;
  color: #3d4f66 !important;
  -webkit-text-fill-color: #3d4f66 !important;
}
`;

export const VISIT_PACK_PRINT_CSS = `
@media print {
@page { margin: 12mm; }
html { color-scheme: light only; }
.visit-pack > .visit-pack-sheet ~ .visit-pack-sheet,
.visit-pack > .monitor-pack-sheet ~ .monitor-pack-sheet,
.visit-pack-print-clone > .visit-pack-sheet ~ .visit-pack-sheet,
.visit-pack-print-clone > .monitor-pack-sheet ~ .monitor-pack-sheet,
.visit-pack-print-root > .visit-pack-sheet ~ .visit-pack-sheet {
  break-before: page !important;
  page-break-before: always !important;
}
}
`;

export const VISIT_PACK_PRINT_STYLES =
  VISIT_PACK_DOCUMENT_CSS + VISIT_PACK_PRINT_CSS;

export const PRINT_CLEANUP_SAFETY_MS = 10 * 60 * 1000;

export function buildVisitPackPrintDocument(
  cloneHtml: string,
  baseHref = "/",
): string {
  return `<!DOCTYPE html>
<html lang="en-GB">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="light" />
<base href="${baseHref}" />
<style>${VISIT_PACK_PRINT_STYLES}</style>
</head>
<body>${cloneHtml}</body>
</html>`;
}

export function prepareVisitPackForPrint(pack: HTMLElement): HTMLElement {
  const source = resolveVisitPackElement(pack);
  copyRechartsDimensions(source);
  const clone = source.cloneNode(true) as HTMLElement;
  clone.classList.add("visit-pack-print-root");
  clone.classList.remove("visit-pack-print-clone");
  clone.querySelectorAll(".no-print").forEach((el) => el.remove());
  clone.querySelectorAll(".print-only").forEach((el) => {
    el.classList.remove("print-only");
  });
  clone.querySelectorAll(".visit-pack-page-break").forEach((el) => el.remove());
  while (clone.firstChild) {
    const first = clone.firstChild;
    if (
      first.nodeType === 1 &&
      ((first as Element).classList.contains("visit-pack-sheet") ||
        (first as Element).classList.contains("monitor-pack-sheet"))
    ) {
      break;
    }
    clone.removeChild(first);
  }
  copyRechartsDimensions(clone);
  return clone;
}

/** Inline Recharts dimensions so clones from off-screen packs print at full size. */
function copyRechartsDimensions(root: HTMLElement): void {
  root.querySelectorAll<HTMLElement>(".recharts-responsive-container").forEach(
    (container) => {
      const rect = container.getBoundingClientRect();
      if (rect.width > 0) {
        container.style.width = `${rect.width}px`;
        container.style.minWidth = `${rect.width}px`;
      }
      if (rect.height > 0) {
        container.style.height = `${rect.height}px`;
        container.style.minHeight = `${rect.height}px`;
      }
    },
  );
  root.querySelectorAll<SVGSVGElement>("svg.recharts-surface").forEach((svg) => {
    const rect = svg.getBoundingClientRect();
    if (rect.width > 0 && !svg.getAttribute("width")) {
      svg.setAttribute("width", String(Math.round(rect.width)));
    }
    if (rect.height > 0 && !svg.getAttribute("height")) {
      svg.setAttribute("height", String(Math.round(rect.height)));
    }
  });
}

function resolveVisitPackElement(pack: HTMLElement): HTMLElement {
  if (
    pack.classList.contains("visit-pack") ||
    pack.classList.contains("monitor-print-pack")
  ) {
    return pack;
  }
  const nested = pack.querySelector<HTMLElement>(".visit-pack, .monitor-print-pack");
  return nested ?? pack;
}
