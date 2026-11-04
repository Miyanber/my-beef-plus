import { cn } from "@/lib/utils"
import {
  DAYS,
  PERIODS,
  COLOR_STYLES,
  type DayKey,
  type TimetableStore,
  type TimetableCourse,
} from "@/lib/timetable-data"
import React from "react"
import { CustomLink } from "@/components/customLink"

const courseUrl = (course: TimetableCourse) => `/lms/course?idnumber=${course.id}`

/** 検索クエリに一致するか (授業名・科目コード・教員名) */
function matchesQuery(course: TimetableCourse, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return [course.title, course.code, ...course.teachers].some((s) => s.toLowerCase().includes(q))
}

function CourseCard({ course, dimmed }: { course: TimetableCourse; dimmed: boolean }) {
  const styles = COLOR_STYLES[course.color];
  return (
    <CustomLink
      href={courseUrl(course)}
      className={cn(
        "flex flex-col gap-2 border p-3 transition-all h-full min-h-15 justify-between",
        styles.cell,
        dimmed && "opacity-25",
      )}
      target="_self"
    >
      <div className="flex flex-col gap-1">
        <p
          className={cn("text-sm font-semibold leading-snug text-pretty line-clamp-2", styles.title)}
          title={`${course.code} ${course.title}`}
        >
          {course.title}
        </p>
      </div>

      <p
        className={cn("text-xs leading-relaxed truncate", styles.teacher)}
        title={course.teachers.join(", ")} // ホバーした瞬間にフルネームがツールチップで出る
      >
        {course.teachers.join(", ")}
      </p>
    </CustomLink>
  )
}

/** 今日の曜日キー (月〜金のみ) */
function todayKey(): DayKey | null {
  return DAYS[new Date().getDay() - 1]?.key ?? null
}

interface TimetableComponentProps {
  timetableStore: TimetableStore | undefined;
  query?: string;
}

export function TimetableGrid({ timetableStore, query = "" }: TimetableComponentProps) {
  const dayCount = DAYS.length
  const courses = Object.values(timetableStore?.courses ?? {})
  const today = timetableStore?.isCurrent ? todayKey() : null

  const maxPeriod = courses.reduce((max, c) => Math.max(max, ...c.dates.map((d) => d.period)), 0)
  const periods = maxPeriod > PERIODS.length
    ? Array.from({ length: maxPeriod }, (_, i) => i + 1)
    : PERIODS

  const coursesAt = (day: DayKey, period: number) =>
    courses.filter((course) => course.dates.some((d) => d.day === day && d.period === period))

  return (
    <>
      {/* ===== PC / タブレット: マトリクス表示 ===== */}
      <div className="hidden overflow-hidden rounded-2xl border border-border bg-card shadow-sm md:block">
        <div className="overflow-x-auto">
          {/* 1列目(時限): 64px / 2列目以降(曜日): 曜日の数に合わせて等幅 */}
          <div
            className="grid min-w-200"
            style={{ gridTemplateColumns: `64px repeat(${dayCount}, minmax(0, 1fr))` }}
          >
            <div className="bg-muted/40 px-3 py-4 text-center text-xs font-semibold text-muted-foreground flex items-center justify-center">
              時限
            </div>

            {DAYS.map((day) => (
              <div
                key={day.key}
                className={cn(
                  "border-l border-border/60 bg-muted/40 px-4 py-4 text-center flex flex-col items-center justify-center leading-tight",
                  today === day.key && "bg-primary/10",
                )}
              >
                <span className={cn("text-base font-bold text-foreground", today === day.key && "text-primary")}>
                  {day.label}
                </span>
                <span className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                  {day.sub}
                </span>
              </div>
            ))}

            {periods.map((period) => (
              <React.Fragment key={period}>
                <div className="border-t border-border/50 bg-muted/20 px-3 py-4 text-center flex flex-col items-center justify-center leading-tight">
                  <span className="text-lg font-bold text-foreground/80">{period}</span>
                  <span className="text-[10px] text-muted-foreground">時限</span>
                </div>

                {DAYS.map((day) => {
                  const cell = coursesAt(day.key, period)
                  return (
                    <div
                      key={day.key}
                      className={cn(
                        "border-t border-l border-border/50 p-2 min-h-24 content-start",
                        today === day.key && "bg-primary/5",
                      )}
                    >
                      {cell.length > 0 && (
                        <div className="flex flex-col">
                          {cell.map((course) => (
                            <CourseCard key={course.id} course={course} dimmed={!matchesQuery(course, query)} />
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

      {/* ===== スマホ: 曜日ごとのリスト表示 ===== */}
      <div className="flex flex-col gap-4 md:hidden">
        {DAYS.map((day) => {
          const slots = periods
            .map((period) => ({ period, cell: coursesAt(day.key, period) }))
            .filter((s) => s.cell.length > 0)
          return (
            <section
              key={day.key}
              className={cn(
                "overflow-hidden rounded-2xl border border-border bg-card shadow-sm",
                today === day.key && "ring-2 ring-primary/40",
              )}
            >
              <h2 className="flex items-baseline gap-2 border-b border-border bg-muted/40 px-4 py-3">
                <span className={cn("text-base font-bold", today === day.key && "text-primary")}>{day.label}曜日</span>
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{day.sub}</span>
              </h2>
              {slots.length === 0 ? (
                <p className="px-4 py-4 text-sm text-muted-foreground">授業はありません</p>
              ) : (
                <ul className="divide-y divide-border/60">
                  {slots.map(({ period, cell }) => (
                    <li key={period} className="flex gap-3 p-3">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-bold">
                        {period}
                      </span>
                      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                        {cell.map((course) => (
                          <CourseCard key={course.id} course={course} dimmed={!matchesQuery(course, query)} />
                        ))}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )
        })}
      </div>
    </>
  )
}
