import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { DataEntryWorkbench } from "@/components/DataEntryWorkbench";
import { getBartleyMonitorData, getFeederSchoolsData, getSipTargets } from "@/lib/data";
import type { FeederAspOverlay, SipBundle } from "@/lib/manual-data";
import feederAspOverlay from "@/data/feeder-asp-overlay.json";

export const metadata: Metadata = {
  title: "Manual data entry · Bartley Insight",
  description:
    "Enter feeder KS1/phonics figures and SIP priorities for the Bartley board pack, then download JSON for the repo.",
};

export default function DataEntryPage() {
  const sip = getSipTargets() as SipBundle;
  const ks1 = feederAspOverlay as FeederAspOverlay;
  const feeders = getFeederSchoolsData();
  const data = getBartleyMonitorData();

  return (
    <main id="main">
      <SiteHeader active="data-entry" />

      <section className="area-hero">
        <div className="shell">
          <p className="area-kicker">Bartley Insight</p>
          <h1>Manual data entry</h1>
          <p className="area-lead">
            Insert feeder KS1 / phonics percentages and maintain School
            Improvement Plan priorities, vision, and calendar. Download JSON into
            the repo when ready to publish.
          </p>
          <p className="area-actions">
            <Link className="btn btn-primary" href="/">
              Return to dashboard
            </Link>
            <Link className="btn btn-ghost" href="/analysis">
              Governor analysis
            </Link>
          </p>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <div className="section-head">
            <h2>Edit pack inputs</h2>
            <p>
              Source SIP:{" "}
              <a
                href="https://app.governorhub.com/document/69691cd1ffcc4db7df83f5f4/view"
                target="_blank"
                rel="noreferrer"
              >
                School Improvement Plan 2025–26
              </a>
              . Changes stay local until you download and commit the JSON files.
            </p>
          </div>

          <DataEntryWorkbench
            initialSip={sip}
            initialKs1={ks1}
            feeders={feeders}
          />
        </div>
      </section>

      <SiteFooter
        urn={data.profile.urn}
        refreshedAt={data.source.refreshedAt}
      />
    </main>
  );
}
