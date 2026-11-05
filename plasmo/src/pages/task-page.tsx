import { ClipboardList } from "lucide-react";
import { PageTitle } from "@/components/page-title";
import { TaskView } from "@/components/task/task-view";
import { scrapeTasks } from "@/lib/scrapers";
import type { TaskStore } from "@/lib/timetable-data";
import { usePageData } from "@/lib/use-page-data";

export function TaskPage() {
  const { data } = usePageData<TaskStore>({
    key: "taskStore",
    scrape: scrapeTasks,
  });

  if (!data) {
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

  return (
    <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:gap-8">
        <PageTitle
          icon={<ClipboardList />}
          title="課題・テスト一覧"
          subtitle="未提出の課題・小テスト・アンケート一覧"
        />
        <TaskView store={data} />
      </div>
    </main>
  );
}
