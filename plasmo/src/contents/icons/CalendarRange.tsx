import { CalendarRange } from "lucide-react"
import type { PlasmoCSConfig, PlasmoGetInlineAnchor, PlasmoGetRootContainer } from "plasmo"
import { useEffect } from "react"
import { getDefaultStyle } from "~lib/plasmo-style"
import { waitForSelector } from "~lib/utils"

export const config: PlasmoCSConfig = {
  matches: ["https://beefplus.center.kobe-u.ac.jp/lms/timetable*"]
}

export const getStyle = getDefaultStyle

// export const getRootContainer: PlasmoGetRootContainer = async () => {
//   const wrapper = await waitForSelector("#pageContents .timetable-color");
//   return wrapper
// }

export const getInlineAnchor: PlasmoGetInlineAnchor = async () => ({
  element: await waitForSelector("#pageContents .timetable-color"),
  insertPosition: "afterbegin"
})

// 3. 挿入するコンポーネント
const MyInjectedComponent = () => {
  useEffect(() => {
    (async () => {
      (await waitForSelector("#pageContents .timetable-title")).remove();
      (await waitForSelector("#pageContents .timetable-icon")).remove();
    })();
  })

  return (
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
  )
}

export default MyInjectedComponent