/**
 * Print the governor board pack in an isolated iframe (iPad / iPhone safe).
 *
 * WebKit prints blank pages when the source node is visibility:hidden or clipped
 * off-screen in the main document — same approach as School Compass visit packs.
 */

import {
  buildVisitPackPrintDocument,
  prepareVisitPackForPrint,
  PRINT_CLEANUP_SAFETY_MS,
} from "@/lib/printVisitPackShared";

export function resolveMonitorPackElement(host: HTMLElement): HTMLElement {
  if (
    host.classList.contains("visit-pack") ||
    host.classList.contains("monitor-print-pack")
  ) {
    return host;
  }
  const nested = host.querySelector<HTMLElement>(".visit-pack, .monitor-print-pack");
  return nested ?? host;
}

function printViaIframe(pack: HTMLElement): void {
  const clone = prepareVisitPackForPrint(pack);
  clone.classList.add("visit-pack-print-clone", "monitor-print-clone");

  const iframe = document.createElement("iframe");
  iframe.setAttribute("title", "Print board pack");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText =
    "position:fixed;left:-10000px;top:0;width:210mm;height:297mm;border:0;pointer-events:none;z-index:-1;";

  document.body.appendChild(iframe);

  const idoc = iframe.contentDocument;
  const iwin = iframe.contentWindow;
  if (!idoc || !iwin) {
    iframe.remove();
    return;
  }

  idoc.open();
  idoc.write(buildVisitPackPrintDocument(clone.outerHTML, document.baseURI));
  idoc.close();

  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    iframe.remove();
  };

  iwin.addEventListener("afterprint", cleanup);
  window.setTimeout(cleanup, PRINT_CLEANUP_SAFETY_MS);

  const triggerPrint = () => {
    try {
      iwin.focus();
      iwin.print();
    } catch {
      cleanup();
    }
  };

  window.setTimeout(triggerPrint, 250);
}

export function printMonitorPackElement(host: HTMLElement): void {
  const resolved = resolveMonitorPackElement(host);
  printViaIframe(resolved);
}
