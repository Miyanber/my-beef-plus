import { useState, useMemo } from "react"
import { Search, Clock, ExternalLink, CheckCircle2 } from "lucide-react"
import { Input } from "~components/ui/input"
import { cn } from "~lib/utils"
import { formatDateTime, getDeadlineInfo, type Urgency } from "~lib/format"
import type { TaskKind, TaskSource, TaskStore } from "~lib/timetable-data"

const KIND_LABELS: Record<TaskKind, { label: string; color: string }> = {
  REPORT: { label: "課題", color: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300 border-rose-200 dark:border-rose-800" },
  EXAM: { label: "テスト", color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800" },
  SURVEY: { label: "アンケート", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" },
  OTHER: { label: "その他", color: "bg-muted text-muted-foreground border-border" },
}

const URGENCY_STYLES: Record<Urgency, { label: string; badge: string; border: string }> = {
  overdue: { label: "期限切れ", badge: "bg-red-500 text-white dark:bg-red-600", border: "border-red-300 dark:border-red-900" },
  today: { label: "本日締切", badge: "bg-rose-600 text-white animate-pulse", border: "border-rose-300 dark:border-rose-900" },
  soon: { label: "近日中", badge: "bg-amber-500 text-white", border: "border-amber-200 dark:border-amber-800" },
  week: { label: "今週中", badge: "bg-sky-500 text-white", border: "border-sky-200 dark:border-sky-800" },
  later: { label: "余裕あり", badge: "bg-muted text-muted-foreground", border: "border-border" },
  none: { label: "", badge: "bg-muted text-muted-foreground", border: "border-border" },
}

interface TaskViewProps {
  store: TaskStore
  beef2026SyncEnabled?: boolean
}

export function TaskView({ store, beef2026SyncEnabled = false }: TaskViewProps) {
  const [query, setQuery] = useState("")
  const [selectedCourse, setSelectedCourse] = useState<string>("ALL")
  const [selectedKind, setSelectedKind] = useState<string>("ALL")
  const [selectedSource, setSelectedSource] = useState<"ALL" | TaskSource>("ALL")

  const allItems = store.items

  // 同期設定が OFF に戻ったときはソースフィルタをリセットする
  const activeSourceFilter = beef2026SyncEnabled ? selectedSource : "ALL"

  // ユニークな講義名リスト
  const courses = useMemo(() => {
    const map = new Map<string, string>()
    allItems.forEach((item) => {
      if (item.courseName) map.set(item.courseName, item.courseName)
    })
    return Array.from(map.values())
  }, [allItems])

  // フィルタリング & 締切ソート
  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase()
    return allItems
      .filter((item) => {
        const itemSource: TaskSource = item.source ?? "beefplus"
        if (activeSourceFilter !== "ALL" && itemSource !== activeSourceFilter) return false
        if (selectedCourse !== "ALL" && item.courseName !== selectedCourse) return false
        if (selectedKind !== "ALL" && item.kind !== selectedKind) return false
        if (q && !item.title.toLowerCase().includes(q) && !item.courseName.toLowerCase().includes(q)) return false
        return true
      })
      .sort((a, b) => {
        const timeA = getDeadlineInfo(a.deadline).time ?? Infinity
        const timeB = getDeadlineInfo(b.deadline).time ?? Infinity
        return timeA - timeB
      })
  }, [allItems, query, selectedCourse, selectedKind, activeSourceFilter])

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      {/* 検索・絞り込みコントロール */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="課題名・講義名で検索"
              className="h-9 w-60 pl-9"
            />
          </div>

          {/* 講義名フィルタ */}
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-xs text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 dark:bg-input/30"
          >
            <option value="ALL">すべての講義 ({allItems.length})</option>
            {courses.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* 種別フィルタ */}
          <select
            value={selectedKind}
            onChange={(e) => setSelectedKind(e.target.value)}
            className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-xs text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 dark:bg-input/30"
          >
            <option value="ALL">すべての種別</option>
            <option value="REPORT">課題 (レポート)</option>
            <option value="EXAM">テスト (小テスト)</option>
            <option value="SURVEY">アンケート</option>
          </select>

          {/* LMS ソースフィルタ (BEEF2026 同期 ON 時のみ表示) */}
          {beef2026SyncEnabled && (
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value as "ALL" | TaskSource)}
              className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-xs text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 dark:bg-input/30"
            >
              <option value="ALL">すべてのLMS</option>
              <option value="beefplus">BEEF+ のみ</option>
              <option value="beef2026">BEEF2026 のみ</option>
            </select>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="size-3.5" />
          <span>該当: <strong className="text-foreground">{filteredItems.length}</strong> 件</span>
        </div>
      </div>

      {/* タスク一覧カード / テーブル */}
      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 py-16 text-center">
          <CheckCircle2 className="size-12 text-emerald-500/80 mb-3" />
          <h3 className="text-base font-semibold text-foreground">該当する未提出タスクはありません</h3>
          <p className="mt-1 text-xs text-muted-foreground">現在すべての課題・テストが完了しているか、検索条件に合致しません。</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          {/* PC向けテーブル表示 */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
                  <th className="py-3.5 pl-5 w-3/12">講義名</th>
                  <th className="py-3.5 w-1/12 text-center">種別</th>
                  <th className="py-3.5 w-5/12">タイトル</th>
                  <th className="py-3.5 pr-5 w-3/12 text-right">提出締切 / 残り時間</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredItems.map((item) => {
                  const deadlineInfo = getDeadlineInfo(item.deadline)
                  const kindConfig = KIND_LABELS[item.kind] || KIND_LABELS.OTHER
                  const urgencyConfig = URGENCY_STYLES[deadlineInfo.urgency]
                  const isBeef2026 = item.source === "beef2026"

                  return (
                    <tr key={item.id} className="transition-colors hover:bg-muted/40 group">
                      <td className="py-3.5 pl-5 font-medium text-foreground">
                        <div className="flex items-center gap-2 min-w-0">
                          {isBeef2026 && (
                            <span className="inline-flex shrink-0 items-center rounded border border-sky-200 bg-sky-100 px-1.5 py-0.5 text-[10px] font-semibold text-sky-700 dark:border-sky-800 dark:bg-sky-500/15 dark:text-sky-300">
                              BEEF2026
                            </span>
                          )}
                          <span className="line-clamp-1">{item.courseName}</span>
                        </div>
                      </td>
                      <td className="py-3.5 text-center">
                        <span className={cn("inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold", kindConfig.color)}>
                          {item.kindLabel || kindConfig.label}
                        </span>
                      </td>
                      <td className="py-3.5 pr-3">
                        <a
                          href={item.url}
                          target={isBeef2026 ? "_blank" : undefined}
                          rel={isBeef2026 ? "noopener noreferrer" : undefined}
                          className="flex items-center gap-1.5 font-semibold text-primary hover:underline group-hover:text-primary"
                        >
                          <span className="line-clamp-1">{item.title}</span>
                          <ExternalLink className="size-3.5 shrink-0 opacity-60 group-hover:opacity-100" />
                        </a>
                      </td>
                      <td className="py-3.5 pr-5 text-right whitespace-nowrap">
                        <div className="flex flex-col items-end gap-1">
                          <span className="font-mono text-xs text-foreground/90">{formatDateTime(item.deadline)}</span>
                          {deadlineInfo.label && (
                            <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold tracking-tight shadow-xs", urgencyConfig.badge)}>
                              {deadlineInfo.label}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* スマホ向けカードリスト表示 */}
          <div className="divide-y divide-border/60 md:hidden">
            {filteredItems.map((item) => {
              const deadlineInfo = getDeadlineInfo(item.deadline)
              const kindConfig = KIND_LABELS[item.kind] || KIND_LABELS.OTHER
              const urgencyConfig = URGENCY_STYLES[deadlineInfo.urgency]
              const isBeef2026 = item.source === "beef2026"

              return (
                <a
                  key={item.id}
                  href={item.url}
                  target={isBeef2026 ? "_blank" : undefined}
                  rel={isBeef2026 ? "noopener noreferrer" : undefined}
                  className="flex flex-col gap-2 p-4 transition-colors hover:bg-muted/40"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {isBeef2026 && (
                        <span className="inline-flex shrink-0 items-center rounded border border-sky-200 bg-sky-100 px-1.5 py-0.5 text-[10px] font-semibold text-sky-700 dark:border-sky-800 dark:bg-sky-500/15 dark:text-sky-300">
                          BEEF2026
                        </span>
                      )}
                      <span className="text-xs font-semibold text-muted-foreground truncate">{item.courseName}</span>
                    </div>
                    <span className={cn("inline-flex shrink-0 items-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold", kindConfig.color)}>
                      {item.kindLabel || kindConfig.label}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-foreground leading-snug line-clamp-2">{item.title}</h4>
                  <div className="mt-1 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{formatDateTime(item.deadline)}</span>
                    {deadlineInfo.label && (
                      <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold", urgencyConfig.badge)}>
                        {deadlineInfo.label}
                      </span>
                    )}
                  </div>
                </a>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

