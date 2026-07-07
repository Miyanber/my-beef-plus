import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  DAYS,
  PERIODS,
  COLOR_STYLES,
  type Course,
} from "@/lib/timetable-data"
import React from "react"
import { CustomLink } from "@/components/customLink"

function CourseCard({ course }: { course: Course }) {
  const styles = COLOR_STYLES[course.color];
  return (
    <CustomLink
      href={`https://beefplus.center.kobe-u.ac.jp/lms/course?idnumber=${course.id}`}
      className={cn(
        "flex flex-col gap-2 border-2 p-3 transition-colors h-full justify-between", // 高さを揃えやすく
        styles.cell,
      )}
      target="_self"
    >
      <div className="flex flex-col gap-1">
        <p className={cn("text-sm font-semibold leading-snug text-pretty line-clamp-2", styles.title)}>
          {course.title}
        </p>
      </div>

      <p
        className={cn("text-xs leading-relaxed truncate", styles.teacher)}
        title={course.teachers.join(", ")} // ホバーした瞬間にフルネームがツールチップで出るようにしておく
      >
        {course.teachers.join(", ")}
      </p>
    </CustomLink>
  )
}

interface TimetableComponentProps {
  courses: Course[]; // 親から受け取るデータの型を指定
}

export function TimetableGrid({ courses }: TimetableComponentProps) {
  const dayCount = DAYS.length

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="overflow-x-auto">
        {/* 1列目(時限): 64px
          2列目以降(曜日): 曜日の数に合わせて等幅 (1fr) で自動生成
          min-w-[880px] で横スクロールの最小幅を確保
        */}
        <div
          className="grid min-w-200"
          style={{ gridTemplateColumns: `64px repeat(${dayCount}, minmax(0, 1fr))` }}
        >

          {/* =================================================================
            ヘッダーエリア（時限ラベル ＋ 各曜日）
          ================================================================== */}
          {/* 左上の空セル（「時限」表記） */}
          <div className="bg-muted/40 px-3 py-4 text-center text-xs font-semibold text-muted-foreground flex items-center justify-center">
            時限
          </div>

          {/* 曜日ヘッダー */}
          {DAYS.map((day) => (
            <div
              key={day.key}
              className="border-l-2 border-border/60 bg-muted/40 px-4 py-4 text-center flex flex-col items-center justify-center leading-tight"
            >
              <span className="text-base font-bold text-foreground">
                {day.label}
              </span>
              <span className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                {day.sub}
              </span>
            </div>
          ))}

          {/* =================================================================
            ボディエリア（時限行 ＋ 各コマの授業セル）
          ================================================================== */}
          {PERIODS.map((period) => (
            <React.Fragment key={period}>

              {/* 行の先頭：時限セル */}
              <div className="border-t-2 border-border/50 bg-muted/20 px-3 py-4 text-center flex flex-col items-center justify-center leading-tight">
                <span className="text-lg font-bold text-foreground/80">
                  {period}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  時限
                </span>
              </div>

              {/* 各曜日の授業セル */}
              {DAYS.map((day) => {
                const filteredCourses = courses.filter(course => course.day === day.key && course.period === period);

                return (
                  <div
                    key={day.key}
                    className="border-t-2 border-l-2 border-border/50 p-2 min-h-24 content-start"
                  >
                    {filteredCourses.length > 0 && (
                      <div className="flex flex-col">
                        {filteredCourses.map((course) => (
                          <CourseCard key={course.code} course={course} />
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}

            </React.Fragment>
          ))}

        </div>
      </div>
    </div>
  )
}
