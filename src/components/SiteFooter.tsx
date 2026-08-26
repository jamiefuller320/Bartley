import Link from "next/link";

export function SiteFooter({
  refreshedAt,
  urn,
}: {
  refreshedAt?: string | null;
  urn?: string | null;
}) {
  return (
    <footer className="site-footer" role="contentinfo">
      <div className="shell site-footer-inner">
        <div className="site-footer-brand">
          <Link href="/" className="site-footer-name">
            Bartley Insight
          </Link>
          <p>
            Governor-facing Key Stage 2 performance monitor for Bartley CofE
            Junior School — styled to match School Compass so the pack can
            merge into schoolcompass.uk without a visual reset.
          </p>
        </div>
        <nav className="site-footer-nav" aria-label="Dashboard sections">
          <p className="site-footer-nav-label">On this site</p>
          <ul>
            <li>
              <Link href="/?chapter=summary&panel=summary-overview">Summary</Link>
            </li>
            <li>
              <Link href="/analysis">Analysis</Link>
            </li>
            <li>
              <Link href="/data-entry">Data entry</Link>
            </li>
            <li>
              <Link href="/?chapter=charts&panel=charts-latest">Charts</Link>
            </li>
            <li>
              <Link href="/?chapter=reference&panel=reference-source">Source</Link>
            </li>
          </ul>
        </nav>
        <p className="site-footer-meta">
          {urn ? `URN ${urn} · ` : ""}
          Hampshire
          {refreshedAt ? ` · refreshed ${refreshedAt}` : ""}
          {" · "}
          Visual language shared with{" "}
          <a href="https://schoolcompass.uk/" rel="noreferrer">
            schoolcompass.uk
          </a>
          .
        </p>
      </div>
    </footer>
  );
}
