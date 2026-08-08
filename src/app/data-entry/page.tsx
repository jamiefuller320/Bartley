import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { DataEntryWorkbench } from "@/components/DataEntryWorkbench";
import { getFeederSchoolsData, getSipTargets } from "@/lib/data";
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

  return (
    <main>
      <SiteHeader active="data-entry" />

      <section className="section">
        <div className="shell">
          <div className="section-intro">
            <h1>Manual data entry</h1>
            <p>
              Insert feeder KS1 / phonics percentages and maintain the{" "}
              <a
                href="https://app.governorhub.com/document/69691cd1ffcc4db7df83f5f4/view"
                target="_blank"
                rel="noreferrer"
              >
                School Improvement Plan 2025–26
              </a>{" "}
              priorities, vision, and calendar. Download JSON into the repo when
              ready to publish.
            </p>
            <p className="muted">
              Prefer the dashboard?{" "}
              <Link href="/">Return home</Link> ·{" "}
              <Link href="/analysis">Governor analysis</Link>
            </p>
          </div>

          <DataEntryWorkbench
            initialSip={sip}
            initialKs1={ks1}
            feeders={feeders}
          />
        </div>
      </section>
    </main>
  );
}
