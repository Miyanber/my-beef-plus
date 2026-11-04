import type { PlasmoCSConfig } from "plasmo"
import { CalendarRange } from "lucide-react"
import { useState } from "react"
import { ControlBar } from "@/components/timetable/control-bar"
import { TimetableGrid } from "@/components/timetable/timetable-grid"
import { PageTitle } from "@/components/page-title"
import { getDefaultStyle } from "~lib/plasmo-style"
import { DefaultLayout } from "~pages/layout"
import type { TimetableStore } from "@/lib/timetable-data"
import { scrapeTimetable } from "~lib/scrapers"
import { usePageData } from "~lib/use-page-data"

export const config: PlasmoCSConfig = {
  matches: ["https://beefplus.center.kobe-u.ac.jp/lms/timetable*"],
  run_at: "document_start"
}

export const getStyle = getDefaultStyle

/**
 * キャッシュが今開いているページ (年度・期間) のものか。
 * 年度などを切り替えた直後に、別の年度のキャッシュが一瞬表示されるのを防ぐ。
 */
function isCacheForCurrentUrl(cached: TimetableStore): boolean {
  const params = new URLSearchParams(window.location.search)
  const year = params.get("risyunen")
  const term = params.get("kikanCd")
  return (!year || year === cached.year) && (term === null || term === cached.termCode)
}

// メインのコンポーネント
const TimetablePage = () => {
  const { data } = usePageData<TimetableStore>({
    key: "timetableStore",
    scrape: scrapeTimetable,
    accept: isCacheForCurrentUrl
  })
  const [query, setQuery] = useState("")

  // データが揃うまでは BEEF+ 本来の画面をそのまま表示しておく
  if (!data) return null

  return (
    <DefaultLayout>
      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:gap-8">
          <PageTitle icon={<CalendarRange />} title="時間割" subtitle="Class Timetable" />
          <ControlBar store={data} query={query} onQueryChange={setQuery} />
          <TimetableGrid timetableStore={data} query={query} />
        </div>
      </main>
    </DefaultLayout>
  )
}

export default TimetablePage
