import type { PlasmoCSConfig } from "plasmo"
import { DefaultLayout } from "~pages/layout"
import { CourseView } from "@/components/course/course-view"
import { getDefaultStyle } from "~lib/plasmo-style"
import type { CourseDetail } from "@/lib/timetable-data"
import { scrapeCourseDetail } from "~lib/scrapers"
import { usePageData } from "~lib/use-page-data"
import { getSyncCache } from "~lib/storage-cache"
import { setNativeHidden } from "~lib/utils"

export const config: PlasmoCSConfig = {
  // 講義トップのみ。課題提出・テスト解答などの子ページ (/lms/course/xxx) は
  // ネイティブ画面を CSS で整えるだけにする（ハイブリッド方針）
  matches: [
    "https://beefplus.center.kobe-u.ac.jp/lms/course",
    "https://beefplus.center.kobe-u.ac.jp/lms/course?*"
  ],
  run_at: "document_start"
}

export const getStyle = getDefaultStyle

// スクリプト読み込み直後（document_start）の最速タイミングでキャッシュ判定を行い、
// キャッシュがあれば即座にネイティブDOMを隠蔽して画面遷移時のチラつきを100%防止
try {
  const initialCourseId = new URLSearchParams(window.location.search).get("idnumber") ?? ""
  if (initialCourseId && getSyncCache<CourseDetail>(`course_${initialCourseId}`)) {
    setNativeHidden(true)
  }
} catch {}

const CoursePage = () => {
  const courseId = new URLSearchParams(window.location.search).get("idnumber") ?? ""

  const { data } = usePageData<CourseDetail>({
    key: `course_${courseId}`,
    scrape: () => scrapeCourseDetail(courseId)
  })

  // 講義IDが無い / データが揃うまでは BEEF+ 本来の画面をそのまま表示しておく
  if (!courseId || !data) return null

  return (
    <DefaultLayout>
      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
        <CourseView course={data} />
      </main>
    </DefaultLayout>
  )
}

export default CoursePage
