import { CalendarRange } from "lucide-react"
import type { PlasmoCSConfig, PlasmoGetInlineAnchor, PlasmoGetRootContainer } from "plasmo"
import { useEffect } from "react"
import { Navigation } from "~components/timetable/app-sidebar"
import { getDefaultStyle } from "~lib/plasmo-style"
import { waitForSelector } from "~lib/utils"

export const config: PlasmoCSConfig = {
  matches: ["https://beefplus.center.kobe-u.ac.jp/lms*"]
}

export const getStyle = getDefaultStyle

// export const getRootContainer: PlasmoGetRootContainer = async () => {
//   const wrapper = await waitForSelector("#pageContents .timetable-color");
//   return wrapper
// }

export const getInlineAnchor: PlasmoGetInlineAnchor = async () => ({
  element: await waitForSelector("#sidemenu .sidemenu-head"),
  insertPosition: "afterend"
})

// 3. 挿入するコンポーネント
const MyInjectedComponent = () => {
  useEffect(() => {
    (async () => {
      await waitForSelector("#sidemenu .sidemenu-link");
      document.querySelectorAll("#sidemenu .sidemenu-link").forEach(elem => elem.remove());
    })();
  })

  return (
    <>
      <Navigation isOpen={true}></Navigation>
    </>
  )
}

export default MyInjectedComponent