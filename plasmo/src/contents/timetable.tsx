
import type { PlasmoCSConfig } from "plasmo"
import { useStorage } from "@plasmohq/storage/hook"

// コンポーネントのパスは環境に合わせて適宜微調整してください
import { useEffect } from "react"
import { CalendarRange } from "lucide-react"
import { ControlBar } from "@/components/timetable/control-bar"
import { TimetableGrid } from "@/components/timetable/timetable-grid"
import { getDefaultStyle } from "~lib/plasmo-style"
import { DefaultLayout } from "~pages/layout"
import type { TimetableStore } from "@/lib/timetable-data"
import { executeIfExpired, waitForSelector } from "~lib/utils"
import { parseBEEFTimetable } from "~lib/parser"

export const config: PlasmoCSConfig = {
  matches: ["https://beefplus.center.kobe-u.ac.jp/lms/timetable*"],
  run_at: "document_start"
}

export const getStyle = getDefaultStyle


// メインのコンポーネント
const PlasmoSidebarOverlay = () => {
  return 
  const [timetableStore, setTimetableStore] = useStorage<TimetableStore>("timetableStore");

  useEffect(() => {
    const nowDate = new Date();
    const ONE_DAY = 24 * 60 * 60 * 1000;

    executeIfExpired(timetableStore, ONE_DAY, async () => {
      const baseCourses = timetableStore?.courses || {};
      const form = await waitForSelector("#selectTimetable") as HTMLFormElement;
      const parsedData = parseBEEFTimetable(baseCourses, form); // 引数を修正
      const contentsWrapper = await waitForSelector("#contentsWrapper") as HTMLElement;
      contentsWrapper.hidden = true;
      setTimetableStore({
        lastUpdated: nowDate.toISOString(),
        courses: parsedData
      });
    });
    
  }, []);


  return (
    <DefaultLayout>
      <main className="flex-1 px-6 py-8 lg:px-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-8">
          {/* Page title */}
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <CalendarRange className="size-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                時間割
              </h1>
              <p className="text-sm text-muted-foreground">Class Timetable</p>
            </div>
          </div>

          <TimetableGrid timetableStore={timetableStore} />
          <ControlBar />
        </div>
      </main>
    </DefaultLayout>
  )
}

export default PlasmoSidebarOverlay