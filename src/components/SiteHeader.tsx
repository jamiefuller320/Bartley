import Link from "next/link";

export function SiteHeader({ active }: { active?: "home" | "analysis" }) {
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link href="/" className="tool-mark">
          Bartley Insight
        </Link>
        <nav className="header-nav" aria-label="Primary">
          <Link href="/" className={active === "home" ? "nav-active" : undefined}>
            Dashboard
          </Link>
          <Link
            href="/analysis"
            className={active === "analysis" ? "nav-active" : undefined}
          >
            Analysis
          </Link>
          <a href="/#charts">Charts</a>
          <a href="/#equity">Equity</a>
          <a href="/#source">Source</a>
        </nav>
      </div>
    </header>
  );
}
