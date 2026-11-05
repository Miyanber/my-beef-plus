import type { PlasmoCSConfig } from "plasmo"
import { ClipboardList } from "lucide-react"
import { PageTitle } from "@/components/page-title"
import { TaskView } from "@/components/task/task-view"
import { getDefaultStyle } from "~lib/plasmo-style"
import { DefaultLayout } from "~pages/layout"
import type { TaskStore } from "@/lib/timetable-data"
import { scrapeTasks } from "~lib/scrapers"
import { usePageData } from "~lib/use-page-data"
import { getSyncCache } from "~lib/storage-cache"
import { setNativeHidden } from "~lib/utils"

export const config: PlasmoCSConfig = {
  matches: [
    "https://beefplus.center.kobe-u.ac.jp/lms/task*",
    "https://beefplus.center.kobe-u.ac.jp/lms/task"
  ],
  run_at: "document_start"
}

export const getStyle = getDefaultStyle

// スクリプト読み込み直後（document_start）の最速タイミングでキャッシュ判定を行い、
// キャッシュがあれば即座にネイティブDOMを隠蔽して画面遷移時のチラつきを100%防止
try {
  if (getSyncCache<TaskStore>("taskStore")) {
    setNativeHidden(true)
  }
} catch {}

const TaskPage = () => {
  const { data } = usePageData<TaskStore>({
    key: "taskStore",
    scrape: scrapeTasks
  })

  // データが揃うまでは BEEF+ 本来の画面を表示しておく
  if (!data) return null

  return (
    <DefaultLayout>
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
    </DefaultLayout>
  )
}

export default TaskPage

