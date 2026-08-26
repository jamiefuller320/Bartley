"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      className="btn btn-ghost print-button no-print"
      onClick={() => window.print()}
    >
      Print / save PDF
    </button>
  );
}
