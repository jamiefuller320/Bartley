"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";

export function SiteHeader({ active }: { active?: "home" | "analysis" }) {
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
    <header className="site-header">
      <div className="shell header-inner">
        <Link href="/" className="tool-mark" onClick={close}>
          Bartley Insight
        </Link>
        <button
          type="button"
          className="nav-toggle"
          aria-expanded={open}
          aria-controls={menuId}
          onClick={() => setOpen((value) => !value)}
        >
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          <span aria-hidden="true">{open ? "✕" : "Menu"}</span>
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
          <Link href="/#summary" onClick={close}>
            Summary
          </Link>
          <Link href="/#changes" onClick={close}>
            Changes
          </Link>
          <Link href="/#charts" onClick={close}>
            Charts
          </Link>
          <Link href="/#equity" onClick={close}>
            Equity
          </Link>
          <Link href="/#glossary" onClick={close}>
            Glossary
          </Link>
          <Link href="/#source" onClick={close}>
            Source
          </Link>
        </nav>
      </div>
    </header>
  );
}
