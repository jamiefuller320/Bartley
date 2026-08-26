"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BinderTabs, type BinderTabItem } from "@/components/BinderTabs";
import { MonitorPanelContent } from "@/components/monitor/MonitorPanelContent";
import { MonitorPrintPack } from "@/components/monitor/MonitorPrintPack";
import { PrintMonitorPackButton } from "@/components/monitor/PrintMonitorPackButton";
import type { SchoolMonitorPack } from "@/lib/monitorPack";
import {
  defaultPanelForChapter,
  isMonitorChapterId,
  isMonitorPanelId,
  MONITOR_CHAPTER_META,
  MONITOR_CHAPTER_ORDER,
  MONITOR_PANEL_META,
  monitorChapterPanels,
  monitorChapterSummary,
  monitorPanelSummary,
  type MonitorChapterId,
  type MonitorPanelId,
} from "@/lib/monitorSections";

function MonitorWorkbenchInner({ pack }: { pack: SchoolMonitorPack }) {
  const searchParams = useSearchParams();
  const [chapter, setChapter] = useState<MonitorChapterId>("summary");
  const [panel, setPanel] = useState<MonitorPanelId>("summary-overview");

  useEffect(() => {
    const chapterParam = searchParams.get("chapter");
    const panelParam = searchParams.get("panel");
    if (chapterParam && isMonitorChapterId(chapterParam)) {
      setChapter(chapterParam);
      if (panelParam && isMonitorPanelId(panelParam)) {
        setPanel(panelParam);
      } else {
        setPanel(defaultPanelForChapter(chapterParam, pack));
      }
    } else if (panelParam && isMonitorPanelId(panelParam)) {
      setPanel(panelParam);
    }
  }, [searchParams, pack]);

  const panelIds = useMemo(
    () => monitorChapterPanels(chapter, pack),
    [chapter, pack],
  );

  useEffect(() => {
    if (!panelIds.includes(panel)) {
      setPanel(panelIds[0] ?? defaultPanelForChapter(chapter, pack));
    }
  }, [chapter, panel, panelIds, pack]);

  const syncUrl = useCallback(
    (nextChapter: MonitorChapterId, nextPanel: MonitorPanelId) => {
      const params = new URLSearchParams(window.location.search);
      params.set("chapter", nextChapter);
      params.set("panel", nextPanel);
      const query = params.toString();
      window.history.replaceState(
        null,
        "",
        query ? `${window.location.pathname}?${query}` : window.location.pathname,
      );
    },
    [],
  );

  const changeChapter = (nextChapter: MonitorChapterId) => {
    const nextPanel = defaultPanelForChapter(nextChapter, pack);
    setChapter(nextChapter);
    setPanel(nextPanel);
    syncUrl(nextChapter, nextPanel);
  };

  const changePanel = (nextPanel: MonitorPanelId) => {
    setPanel(nextPanel);
    syncUrl(chapter, nextPanel);
  };

  const chapterItems: BinderTabItem<MonitorChapterId>[] =
    MONITOR_CHAPTER_ORDER.map((id) => {
      const meta = MONITOR_CHAPTER_META[id];
      const summary = monitorChapterSummary(id, pack);
      return {
        id,
        label: meta.label,
        shortLabel: meta.short,
        step: meta.step,
        done: monitorChapterPanels(id, pack).length > 0,
        title: summary ? `${meta.label}: ${summary}` : meta.label,
      };
    });

  const panelItems: BinderTabItem<MonitorPanelId>[] = panelIds.map((id) => {
    const meta = MONITOR_PANEL_META[id];
    const summary = monitorPanelSummary(id, pack);
    return {
      id,
      label: meta.label,
      shortLabel: meta.short,
      step: meta.step,
      done: true,
      title: summary ? `${meta.label}: ${summary}` : meta.label,
    };
  });

  const chapterMeta = MONITOR_CHAPTER_META[chapter];
  const panelMeta = MONITOR_PANEL_META[panel];
  const chapterSummary = monitorChapterSummary(chapter, pack);
  const panelSummary = monitorPanelSummary(panel, pack);

  return (
    <section className="section monitor-stage" id="monitor">
      <div className="shell monitor-stage-shell">
        <BinderTabs
          className="monitor-chapter-binder hero-binder"
          tone="paper"
          ariaLabel="Board pack chapters"
          dataTour="monitor-chapters"
          items={chapterItems}
          activeId={chapter}
          onChange={changeChapter}
          leading={
            <PrintMonitorPackButton className="btn btn-ghost monitor-print-btn" />
          }
          sheetHeader={
            <header className="binder-sheet-head hero-tile-head">
              <div>
                <h3>{chapterMeta.label}</h3>
                {chapterSummary ? <p>{chapterSummary}</p> : null}
              </div>
            </header>
          }
          sheet={
            <BinderTabs
              className="monitor-panel-binder"
              tone="paper"
              ariaLabel={`${chapterMeta.label} panels`}
              dataTour="monitor-panels"
              items={panelItems}
              activeId={panel}
              onChange={changePanel}
              sheetHeader={
                <header className="binder-sheet-head monitor-panel-head">
                  <h4>{panelMeta.label}</h4>
                  {panelSummary ? <p>{panelSummary}</p> : null}
                  <p className="monitor-panel-lead">{panelMeta.lead}</p>
                </header>
              }
              sheet={<MonitorPanelContent panel={panel} pack={pack} />}
            />
          }
        />
        <MonitorPrintPack pack={pack} />
      </div>
    </section>
  );
}

export function MonitorWorkbench({ pack }: { pack: SchoolMonitorPack }) {
  return (
    <Suspense
      fallback={
        <section className="section monitor-stage">
          <div className="shell">
            <p className="muted">Loading board pack…</p>
          </div>
        </section>
      }
    >
      <MonitorWorkbenchInner pack={pack} />
    </Suspense>
  );
}
