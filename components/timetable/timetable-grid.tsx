import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  DAYS,
  PERIODS,
  SCHEDULE,
  COLOR_STYLES,
  type Course,
} from "@/lib/timetable-data"

function CourseCard({ course }: { course: Course }) {
  const styles = COLOR_STYLES[course.color]
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-xl border p-3 transition-colors",
        styles.cell,
      )}
    >
      <div className="flex flex-col gap-1.5">
        <Badge className={cn("font-mono", styles.badge)}>{course.code}</Badge>
        <p className={cn("text-sm font-semibold leading-snug text-pretty", styles.title)}>
          {course.title}
        </p>
      </div>
      <p className={cn("text-xs leading-relaxed", styles.teacher)}>
        {course.teachers}
      </p>
    </div>
  )
}

export function TimetableGrid() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] border-separate border-spacing-0">
          <thead>
            <tr>
              <th className="w-16 bg-muted/40 px-3 py-4 text-center text-xs font-semibold text-muted-foreground">
                時限
              </th>
              {DAYS.map((day) => (
                <th
                  key={day.key}
                  className="border-l border-border/60 bg-muted/40 px-4 py-4 text-center"
                >
                  <div className="flex flex-col items-center leading-tight">
                    <span className="text-base font-bold text-foreground">
                      {day.label}
                    </span>
                    <span className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                      {day.sub}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERIODS.map((period) => (
              <tr key={period} className="group">
                <td className="border-t border-border/50 bg-muted/20 px-3 py-4 text-center align-middle">
                  <div className="flex flex-col items-center leading-tight">
                    <span className="text-lg font-bold text-foreground/80">
                      {period}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      時限
                    </span>
                  </div>
                </td>
                {DAYS.map((day) => {
                  const courses = SCHEDULE[period]?.[day.key] ?? []
                  return (
                    <td
                      key={day.key}
                      className="border-t border-l border-border/50 p-2 align-top"
                    >
                      {courses.length > 0 ? (
                        <div className="flex flex-col gap-2">
                          {courses.map((course) => (
                            <CourseCard key={course.code} course={course} />
                          ))}
                        </div>
                      ) : (
                        <div className="h-full min-h-24" aria-hidden="true" />
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
