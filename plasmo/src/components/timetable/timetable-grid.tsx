import { cn } from "@/lib/utils"
import {
  DAYS,
  PERIODS,
  COLOR_STYLES,
  type DayKey,
  type TimetableStore,
  type TimetableCourse,
} from "@/lib/timetable-data"
import React, { useState, useEffect } from "react"
import { CustomLink } from "@/components/customLink"
import { ExternalLink, Link2, X, Check, Trash2 } from "lucide-react"
import { getBeef2026Url, setBeef2026Url } from "@/lib/storage-cache"

const courseUrl = (course: TimetableCourse) => `/lms/course?idnumber=${course.id}`

/** 検索クエリに一致するか (授業名・科目コード・教員名) */
function matchesQuery(course: TimetableCourse, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return [course.title, course.code, ...course.teachers].some((s) => s.toLowerCase().includes(q))
}

interface BeefUrlModalProps {
  course: TimetableCourse
  currentUrl?: string
  onClose: () => void
  onSave: (url: string | null) => void
}

function BeefUrlModal({ course, currentUrl = "", onClose, onSave }: BeefUrlModalProps) {
  const [url, setUrl] = useState(currentUrl)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [onClose])

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(url.trim() || null)
    onClose()
  }

  const handleDelete = () => {
    onSave(null)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="flex w-full max-w-md flex-col overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150 text-foreground"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border pb-3">
          <div>
            <h3 className="text-base font-bold leading-snug">BEEF2026 連携URL設定</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {course.code} {course.title}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="mt-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1.5 text-xs font-medium">
            <span>BEEF2026 コース URL</span>
            <input
              type="url"
              placeholder="https://beef.center.kobe-u.ac.jp/2026/course/view.php?id=..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </label>
          <p className="text-[11px] text-muted-foreground">
            BEEF+ではなく旧LMS（BEEF2026）を利用する科目がある場合、ここにURLを登録すると時間割カードから1クリックで直接アクセスできます。
          </p>

          <div className="mt-3 flex items-center justify-between gap-2">
            {currentUrl ? (
              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-500/10 transition-colors"
              >
                <Trash2 className="size-3.5" />
                <span>解除</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
              >
                キャンセル
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Check className="size-3.5" />
                <span>保存</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

function CourseCard({
  course,
  dimmed,
  onOpenBeefModal,
  beefUrl,
}: {
  course: TimetableCourse
  dimmed: boolean
  onOpenBeefModal: (course: TimetableCourse) => void
  beefUrl?: string
}) {
  const styles = COLOR_STYLES[course.color]

  const handleBeefClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (beefUrl) {
      window.open(beefUrl, "_blank", "noopener,noreferrer")
    }
  }

  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onOpenBeefModal(course)
  }

  return (
    <div className="group/card relative h-full">
      <CustomLink
        href={courseUrl(course)}
        className={cn(
          "flex flex-col gap-2 border p-3 transition-all h-full min-h-18 justify-between relative",
          styles.cell,
          dimmed && "opacity-25",
        )}
        target="_self"
      >
        <div className="flex flex-col gap-1.5">
          {/* 上部: 科目コード & BEEF2026 ショートカットボタン */}
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono opacity-60 leading-none truncate">{course.code}</span>
            {beefUrl && (
              <button
                type="button"
                onClick={handleBeefClick}
                title="BEEF2026（外部LMS）を直接別タブで開く"
                className="inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold tracking-tight bg-amber-500/20 text-amber-700 dark:bg-amber-400/20 dark:text-amber-300 border border-amber-500/40 hover:bg-amber-500 hover:text-white dark:hover:bg-amber-400 dark:hover:text-black transition-all shadow-2xs z-10"
              >
                <span>BEEF2026</span>
                <ExternalLink className="size-2.5" />
              </button>
            )}
          </div>

          <p
            className={cn("text-sm font-semibold leading-snug text-pretty line-clamp-2", styles.title)}
            title={`${course.code} ${course.title}`}
          >
            {course.title}
          </p>
        </div>

        <div className="flex items-center justify-between gap-1 mt-1">
          <p
            className={cn("text-xs leading-relaxed truncate flex-1", styles.teacher)}
            title={course.teachers.join(", ")}
          >
            {course.teachers.join(", ")}
          </p>

          {/* 手動登録/編集用アイコン (ホバー時に表示、またはすでに登録されている場合は控えめに表示) */}
          <button
            type="button"
            onClick={handleEditClick}
            title={beefUrl ? "BEEF2026 URL を編集/削除" : "BEEF2026 URL を登録"}
            className={cn(
              "flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground/50 hover:bg-black/10 hover:text-foreground dark:hover:bg-white/10 transition-colors z-10",
              beefUrl ? "opacity-40 group-hover/card:opacity-100" : "opacity-0 group-hover/card:opacity-80",
            )}
          >
            <Link2 className="size-3" />
          </button>
        </div>
      </CustomLink>
    </div>
  )
}

/** 今日の曜日キー (月〜金のみ) */
function todayKey(): DayKey | null {
  return DAYS[new Date().getDay() - 1]?.key ?? null
}

interface TimetableComponentProps {
  timetableStore: TimetableStore | undefined
  query?: string
}

export function TimetableGrid({ timetableStore, query = "" }: TimetableComponentProps) {
  const dayCount = DAYS.length
  const courses = Object.values(timetableStore?.courses ?? {})
  const today = timetableStore?.isCurrent ? todayKey() : null

  // BEEF2026 マッピング状態 (リアルタイム反映用)
  const [beefMap, setBeefMap] = useState<Record<string, string>>({})
  const [modalCourse, setModalCourse] = useState<TimetableCourse | null>(null)

  // 初回マウント時および更新時にマップを読み込み
  const reloadBeefMap = () => {
    const map: Record<string, string> = {}
    for (const c of courses) {
      const u = c.beef2026Url || getBeef2026Url(c.id, c.code)
      if (u) {
        map[c.id] = u
      }
    }
    setBeefMap(map)
  }

  useEffect(() => {
    reloadBeefMap()
  }, [timetableStore])

  const handleSaveBeefUrl = (course: TimetableCourse, url: string | null) => {
    setBeef2026Url(course.id, url)
    if (course.code) {
      setBeef2026Url(course.code, url)
    }
    setBeefMap((prev) => {
      const next = { ...prev }
      if (!url) {
        delete next[course.id]
      } else {
        next[course.id] = url
      }
      return next
    })
  }

  const maxPeriod = courses.reduce((max, c) => Math.max(max, ...c.dates.map((d) => d.period)), 0)
  const periods = maxPeriod > PERIODS.length
    ? Array.from({ length: maxPeriod }, (_, i) => i + 1)
    : PERIODS

  const coursesAt = (day: DayKey, period: number) =>
    courses.filter((course) => course.dates.some((d) => d.day === day && d.period === period))

  return (
    <>
      {modalCourse && (
        <BeefUrlModal
          course={modalCourse}
          currentUrl={beefMap[modalCourse.id] || modalCourse.beef2026Url || getBeef2026Url(modalCourse.id, modalCourse.code)}
          onClose={() => setModalCourse(null)}
          onSave={(url) => handleSaveBeefUrl(modalCourse, url)}
        />
      )}

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
                        <div className="flex flex-col gap-2">
                          {cell.map((course) => (
                            <CourseCard
                              key={course.id}
                              course={course}
                              dimmed={!matchesQuery(course, query)}
                              beefUrl={beefMap[course.id] || course.beef2026Url || getBeef2026Url(course.id, course.code)}
                              onOpenBeefModal={(c) => setModalCourse(c)}
                            />
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
                          <CourseCard
                            key={course.id}
                            course={course}
                            dimmed={!matchesQuery(course, query)}
                            beefUrl={beefMap[course.id] || course.beef2026Url || getBeef2026Url(course.id, course.code)}
                            onOpenBeefModal={(c) => setModalCourse(c)}
                          />
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

