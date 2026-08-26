"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";

const CHAPTER_LINKS = [
  { href: "/?chapter=summary&panel=summary-overview", label: "Summary" },
  { href: "/?chapter=findings&panel=findings-list", label: "Findings" },
  { href: "/?chapter=charts&panel=charts-latest", label: "Charts" },
  { href: "/?chapter=comparison&panel=comparison-peers", label: "Compare" },
  { href: "/?chapter=reference&panel=reference-glossary", label: "Reference" },
] as const;

export function SiteHeader({
  active,
}: {
  active?: "home" | "analysis" | "data-entry";
}) {
  const [open, setOpen] = useState(false);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <header className="site-header" role="banner">
      <div className="shell header-inner">
        <Link href="/" className="brand" onClick={close}>
          Bartley <span className="brand-mark">Insight</span>
        </Link>
        <button
          type="button"
          className="nav-toggle"
          aria-expanded={open}
          aria-controls={menuId}
          onClick={() => setOpen((value) => !value)}
        >
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          <span aria-hidden="true">{open ? "Close" : "Menu"}</span>
        </button>
        <nav
          id={menuId}
          className={open ? "header-nav is-open" : "header-nav"}
          aria-label="Primary"
        >
          <Link
            href="/"
            className={active === "home" ? "nav-active" : undefined}
            onClick={close}
          >
            Dashboard
          </Link>
          <Link
            href="/analysis"
            className={active === "analysis" ? "nav-active" : undefined}
            onClick={close}
          >
            Analysis
          </Link>
          <Link
            href="/data-entry"
            className={active === "data-entry" ? "nav-active" : undefined}
            onClick={close}
          >
            Data entry
          </Link>
          {CHAPTER_LINKS.map((link) => (
            <Link key={link.href} href={link.href} onClick={close}>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
