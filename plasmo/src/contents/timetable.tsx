
import type { PlasmoCSConfig, PlasmoGetInlineAnchor } from "plasmo"
import { useStorage } from "@plasmohq/storage/hook"

// コンポーネントのパスは環境に合わせて適宜微調整してください
import { useEffect, useState } from "react"
import { CalendarRange } from "lucide-react"
import { ControlBar } from "@/components/timetable/control-bar"
import { TimetableGrid } from "@/components/timetable/timetable-grid"
import { getDefaultStyle } from "~lib/plasmo-style"
import { DefaultLayout } from "~pages/layout"
import type { DayKey, CourseColor, TimetableStore, TimetableCourse } from "@/lib/timetable-data"
import { executeIfExpired, waitForSelector } from "~lib/utils"

export const config: PlasmoCSConfig = {
  matches: ["https://beefplus.center.kobe-u.ac.jp/lms/timetable*"],
  run_at: "document_start"
}

export const getStyle = getDefaultStyle


export function parseBEEFTimetable(timetableCourses: Record<string, TimetableCourse>, formElement: HTMLFormElement | Document = document): Record<string, TimetableCourse> {
  const dayKeys: DayKey[] = ["mon", "tue", "wed", "thu", "fri"];
  const rows = formElement.querySelectorAll(".div-table-data-row");

  rows.forEach((row) => {
    const periodText = row.querySelector(".div-table-colomn-period")?.textContent?.trim() || "";
    const periodMatch = periodText.match(/([１２３４５６123456])時限/);
    if (!periodMatch) return;

    const rawPeriod = periodMatch[1];
    const period = parseInt(
      rawPeriod.replace(/[１-６]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0)),
      10
    );

    dayKeys.forEach((dayKey, index) => {
      const colClass = `${index + 1}-yobicol`;

      const cell = row.querySelector(`.div-table-cell[class*="${colClass}"]`);
      if (!cell) return;

      const lectureBlocks = cell.querySelectorAll(".clearfix");

      lectureBlocks.forEach((block) => {
        const titleEl = block.querySelector(".timetable-course-top-btn");
        if (!titleEl) return;

        const id = titleEl.id;
        if (!timetableCourses[id]) {
          const fullTitleText = titleEl.textContent?.trim() || "";

          const spaceIndex = fullTitleText.indexOf(" ");
          let code = "";
          let title = fullTitleText;
          if (spaceIndex !== -1) {
            code = fullTitleText.substring(0, spaceIndex).trim();
            title = fullTitleText.substring(spaceIndex + 1).trim();
          }

          const teacherSpans = block.querySelectorAll(".div-table-cell-detail span");
          const teachers: string[] = [];
          const seenTeachers = new Set<string>();

          teacherSpans.forEach((span) => {
            const name = span.textContent?.replace(/[\s,、]+/g, " ").trim() || "";
            if (name && name !== "," && !seenTeachers.has(name)) {
              teachers.push(name);
              seenTeachers.add(name);
            }
          });

          const course: TimetableCourse = {
            id,
            code,
            title,
            teachers,
            color: "blue" as CourseColor,
            dates: [
              {
                day: dayKey,
                period: period
              }
            ]
          };

          timetableCourses[id] = course;
        } else {
          timetableCourses[id].dates.push({
            day: dayKey,
            period: period
          })
        }
      });
    });
  });

  return timetableCourses;
}

// メインのコンポーネント
const PlasmoSidebarOverlay = () => {
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