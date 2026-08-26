import Link from "next/link";
import { formatSipDate, type SipBundle } from "@/lib/manual-data";

export function SipPrioritiesCard({
  sip,
  embedded = false,
}: {
  sip: SipBundle;
  embedded?: boolean;
}) {
  const priorities = sip.priorities ?? [];
  if (!priorities.length && !sip.vision) return null;

  const fgb = sip.calendar?.fgbMeetings ?? [];
  const inset = sip.calendar?.insetDays ?? [];
  const previous = sip.previousPriorities ?? [];

  const inner = (
    <>
      {!embedded ? (
        <div className="section-head">
          <h2>
            SIP priorities
            {sip.period ? ` ${sip.period.replace("/", "–")}` : ""}
          </h2>
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
      ) : null}

      {sip.vision ? (
        <blockquote className="sip-vision">
          <p>{sip.vision}</p>
        </blockquote>
      ) : null}

      {priorities.length ? (
        <ol className="sip-priority-list">
          {priorities.map((priority, index) => (
            <li key={priority.id}>
              <h3>
                <span className="sip-priority-index">{index + 1}.</span>{" "}
                {priority.title || "Untitled priority"}
              </h3>
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
      ) : null}

      {previous.length ? (
        <div className="sip-sustain">
          <h3>Sustain from 2024–25</h3>
          <ul>
            {previous.map((priority) => (
              <li key={priority.id}>
                <strong>{priority.title}</strong>
                <span className="muted"> — {priority.detail}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {fgb.length || inset.length ? (
        <div className="sip-calendar">
          {fgb.length ? (
            <p>
              <strong>FGB meetings:</strong>{" "}
              {fgb.map(formatSipDate).join(" · ")}
            </p>
          ) : null}
          {inset.length ? (
            <p>
              <strong>INSET days:</strong>{" "}
              {inset.map(formatSipDate).join(" · ")}
            </p>
          ) : null}
        </div>
      ) : null}
    </>
  );

  if (embedded) {
    return <div className="monitor-panel-body">{inner}</div>;
  }

  return (
    <section className="section" id="sip">
      <div className="shell">{inner}</div>
    </section>
  );
}
