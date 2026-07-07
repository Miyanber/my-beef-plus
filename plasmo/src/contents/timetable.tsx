
import type { PlasmoCSConfig, PlasmoGetInlineAnchor } from "plasmo"

// コンポーネントのパスは環境に合わせて適宜微調整してください
import { useEffect, useState } from "react"
import { CalendarRange } from "lucide-react"
import { ControlBar } from "@/components/timetable/control-bar"
import { TimetableGrid } from "@/components/timetable/timetable-grid"
import { getDefaultStyle } from "~lib/plasmo-style"
import { DefaultLayout } from "~pages/layout"
import type { Course, DayKey, CourseColor } from "@/lib/timetable-data"

export const config: PlasmoCSConfig = {
	matches: ["https://beefplus.center.kobe-u.ac.jp/lms/timetable"],
	run_at: "document_start"
}

export const getStyle = getDefaultStyle


export function parseBEEFTimetable(formElement: HTMLFormElement | Document = document): Course[] {
  const courses: Course[] = [];
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
      
      // 【修正箇所】数字から始まるクラス名に対応するため、属性セレクターに変更
      const cell = row.querySelector(`.div-table-cell[class*="${colClass}"]`);
      if (!cell) return;

      const lectureBlocks = cell.querySelectorAll(".clearfix");

      lectureBlocks.forEach((block) => {
        const titleEl = block.querySelector(".timetable-course-top-btn");
        if (!titleEl) return;

        const id = titleEl.id;
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

        const course: Course = {
					id,
          code,
          title,
          teachers,
          color: "blue" as CourseColor,
          day: dayKey,
          period,
          messages: [],
          announcements: [],
          lectureMaterials: [],
          assignments: [],
          quizzes: [],
          bulletinBoardItems: []
        };

        courses.push(course);
      });
    });
  });

  return courses;
}

// メインのコンポーネント
const PlasmoSidebarOverlay = () => {
	const [courses, setCourses] = useState<Course[]>([]);

	useEffect(() => {
		const form = document.getElementById("selectTimetable") as HTMLFormElement;

		if (form) {
			const parsedData = parseBEEFTimetable(form);
			setCourses(parsedData);
			form.style.display = "none";
		}

		const observer = new MutationObserver((mutations, obs) => {
			const form = document.getElementById("selectTimetable") as HTMLFormElement;
			if (form) {
				// 見つかったらパースして、監視を止める
				const parsedData = parseBEEFTimetable(form);
				setCourses(parsedData);
				form.style.display = "none"; // 元のUIを消す
				obs.disconnect(); // 監視終了
			}
		});

		// 拡張機能起動時点から、ドキュメント全体（bodyなど）を監視
		observer.observe(document.documentElement, {
			childList: true,
			subtree: true,
		});

		return () => observer.disconnect(); // クリーンアップ
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

					<TimetableGrid courses={courses} />
					<ControlBar />
				</div>
			</main>
		</DefaultLayout>
	)
}

export default PlasmoSidebarOverlay