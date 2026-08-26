"use client";

import { useEffect, useState } from "react";

const CHAPTERS = [
  { id: "summary", label: "Summary" },
  { id: "findings", label: "Findings" },
  { id: "charts", label: "Charts" },
  { id: "peers", label: "Peers" },
  { id: "equity", label: "Equity" },
  { id: "progress", label: "Progress" },
  { id: "feeders", label: "Feeders" },
  { id: "sip", label: "SIP" },
  { id: "source", label: "Source" },
] as const;

export function DashboardChapterNav() {
  const [active, setActive] = useState<string>("summary");

  useEffect(() => {
    const nodes = CHAPTERS.map((chapter) =>
      document.getElementById(chapter.id),
    ).filter((node): node is HTMLElement => Boolean(node));

    if (!nodes.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) =>
              a.boundingClientRect.top - b.boundingClientRect.top,
          );
        if (visible[0]?.target.id) {
          setActive(visible[0].target.id);
        }
      },
      {
        rootMargin: "-30% 0px -55% 0px",
        threshold: [0, 0.25, 0.5],
      },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  return (
    <nav
      className="dashboard-chapter-nav no-print"
      aria-label="Dashboard sections"
    >
      <div className="shell dashboard-chapter-nav-inner">
        {CHAPTERS.map((chapter) => (
          <a
            key={chapter.id}
            href={`#${chapter.id}`}
            className={active === chapter.id ? "is-active" : undefined}
          >
            {chapter.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
