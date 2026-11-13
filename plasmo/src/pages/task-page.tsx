import { ClipboardList, ExternalLink, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PageTitle } from "~components/page-title";
import { TaskView } from "~components/task/task-view";
import { BEEF2026_DASHBOARD_URL } from "~lib/parsers";
import { scrapeTasks } from "~lib/scrapers";
import {
  getBeef2026TaskStoreFromStorage,
  getBeef2026TaskSyncFromStorage,
  getSyncBeef2026TaskStore,
  getSyncBeef2026TaskSync,
  setSyncBeef2026TaskStoreCache,
  setSyncBeef2026TaskSync,
  watchBeef2026TaskStore,
} from "~lib/storage-cache";
import type { TaskItem, TaskStore } from "~lib/timetable-data";
import { usePageData } from "~lib/use-page-data";
import { cn } from "~lib/utils";

function formatSyncTimestamp(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function TaskPage() {
  const { data } = usePageData<TaskStore>({
    key: "taskStore",
    scrape: scrapeTasks,
  });

  const [beef2026SyncEnabled, setBeef2026SyncEnabled] = useState<boolean>(() => getSyncBeef2026TaskSync());
  const [beef2026Store, setBeef2026Store] = useState<TaskStore | undefined>(() => getSyncBeef2026TaskStore());

  useEffect(() => {
    let active = true;

    getBeef2026TaskSyncFromStorage().then((saved) => {
      if (!active || typeof saved !== "boolean") return;
      setBeef2026SyncEnabled(saved);
      setSyncBeef2026TaskSync(saved);
    });

    getBeef2026TaskStoreFromStorage().then((store) => {
      if (!active || !store) return;
      setBeef2026Store(store);
      setSyncBeef2026TaskStoreCache(store);
    });

    const unwatch = watchBeef2026TaskStore((nextStore) => {
      if (!active) return;
      setBeef2026Store(nextStore);
    });

    return () => {
      active = false;
      unwatch();
    };
  }, []);

  const handleToggleSync = () => {
    const next = !beef2026SyncEnabled;
    setBeef2026SyncEnabled(next);
    setSyncBeef2026TaskSync(next);
  };

  const mergedStore = useMemo<TaskStore | undefined>(() => {
    if (!data) return undefined;
    const beefPlusItems: TaskItem[] = data.items.map((item) => ({
      ...item,
      source: item.source ?? "beefplus",
    }));
    const beef2026Items: TaskItem[] =
      beef2026SyncEnabled && beef2026Store?.items ? beef2026Store.items : [];

    return {
      lastUpdated: data.lastUpdated,
      items: [...beefPlusItems, ...beef2026Items],
    };
  }, [data, beef2026SyncEnabled, beef2026Store]);

  if (!mergedStore) {
    return (
      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-10 animate-pulse">
        <div className="mx-auto flex max-w-6xl flex-col gap-6">
          <div className="h-8 w-48 rounded-lg bg-muted" />
          <div className="h-14 w-full rounded-2xl bg-muted" />
          <div className="h-80 w-full rounded-2xl bg-muted" />
        </div>
      </main>
    );
  }

  const lastSyncedLabel = formatSyncTimestamp(beef2026Store?.lastUpdated);

  return (
    <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:gap-8">
        <PageTitle
          icon={<ClipboardList />}
          title="課題・テスト一覧"
          subtitle="未提出の課題・小テスト・アンケート一覧"
          actions={
            <button
              type="button"
              role="switch"
              aria-checked={beef2026SyncEnabled}
              onClick={handleToggleSync}
              className={cn(
                "inline-flex items-center gap-2.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors",
                beef2026SyncEnabled
                  ? "border-sky-300 bg-sky-50 text-sky-800 hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-200 dark:hover:bg-sky-900/40"
                  : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <span>BEEF2026 同期</span>
              <span
                aria-hidden="true"
                className={cn(
                  "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
                  beef2026SyncEnabled ? "bg-sky-600 dark:bg-sky-500" : "bg-muted-foreground/30",
                )}
              >
                <span
                  className={cn(
                    "inline-block size-3.5 rounded-full bg-white shadow-sm transition-transform",
                    beef2026SyncEnabled ? "translate-x-[18px]" : "translate-x-1",
                  )}
                />
              </span>
            </button>
          }
        />

        {beef2026SyncEnabled && (
          <div className="flex flex-col gap-3 rounded-2xl border border-sky-200/80 bg-sky-50/60 px-4 py-3 text-xs dark:border-sky-900/60 dark:bg-sky-950/20 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5 text-sky-900 dark:text-sky-200">
              <RefreshCw className="size-4 shrink-0 text-sky-600 dark:text-sky-400" />
              {beef2026Store ? (
                <span>
                  BEEF2026 同期中（{beef2026Store.items.length}件）
                  {lastSyncedLabel && (
                    <span className="ml-2 text-sky-700/80 dark:text-sky-300/80">
                      最終同期: {lastSyncedLabel}
                    </span>
                  )}
                </span>
              ) : (
                <span>
                  BEEF2026 のデータがまだありません。ダッシュボードを開くとタイムラインの課題が自動で取り込まれます。
                </span>
              )}
            </div>
            <a
              href={BEEF2026_DASHBOARD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-sky-300 bg-white px-3 py-1.5 text-xs font-semibold text-sky-800 shadow-sm transition-colors hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-950/60 dark:text-sky-200 dark:hover:bg-sky-900/60"
            >
              <span>BEEF2026 を開いて同期</span>
              <ExternalLink className="size-3.5" />
            </a>
          </div>
        )}

        <TaskView store={mergedStore} beef2026SyncEnabled={beef2026SyncEnabled} />
      </div>
    </main>
  );
}
