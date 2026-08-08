import Link from "next/link";
import type { SipBundle } from "@/lib/manual-data";

export function SipPrioritiesCard({ sip }: { sip: SipBundle }) {
  const priorities = sip.priorities ?? [];
  if (!priorities.length) return null;

  return (
    <section className="section" id="sip">
      <div className="shell">
        <div className="section-intro">
          <h2>SIP priorities</h2>
          <p>
            School improvement priorities used alongside published performance
            data
            {sip.sourceUrl ? (
              <>
                . Source:{" "}
                <a href={sip.sourceUrl} target="_blank" rel="noreferrer">
                  {sip.sourceTitle ?? "GovernorHub SIP"}
                </a>
              </>
            ) : (
              "."
            )}{" "}
            Edit on the{" "}
            <Link href="/data-entry">manual data entry</Link> page.
          </p>
        </div>
        <ol className="sip-priority-list">
          {priorities.map((priority) => (
            <li key={priority.id}>
              <h3>{priority.title || "Untitled priority"}</h3>
              <p>{priority.detail}</p>
              <p className="muted">
                {[
                  priority.byPeriod
                    ? `By ${priority.byPeriod.replace("/", "–")}`
                    : null,
                  priority.focusGroups.length
                    ? `Focus: ${priority.focusGroups.join(", ")}`
                    : null,
                  priority.subjects.length
                    ? `Subjects: ${priority.subjects.join(", ")}`
                    : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
