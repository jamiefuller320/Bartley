import Link from "next/link";
import { loadSchoolMonitorPack } from "@/lib/monitorPack";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MonitorWorkbench } from "@/components/monitor/MonitorWorkbench";

export default function HomePage() {
  const pack = loadSchoolMonitorPack();

  return (
    <main id="main">
      <SiteHeader active="home" />

      <section className="hero area-hero">
        <div className="hero-atmosphere" aria-hidden="true" />
        <div className="shell hero-copy">
          <p className="hero-kicker">Bartley Insight</p>
          <h1>{pack.data.profile.name}</h1>
          <p className="hero-lede">
            Governor board pack for Key Stage 2 outcomes — structured like
            School Compass with summary, findings, charts, and comparison tabs
            so any school&apos;s data can plug into the same layout later.
          </p>
          <div className="hero-actions">
            <Link className="btn btn-primary" href="/?chapter=summary&panel=summary-overview">
              Board summary
            </Link>
            <Link className="btn btn-ghost" href="/analysis">
              Governor analysis
            </Link>
          </div>
        </div>
      </section>

      <MonitorWorkbench pack={pack} />

      <SiteFooter
        urn={pack.data.profile.urn}
        refreshedAt={pack.data.source.refreshedAt}
      />
    </main>
  );
}
