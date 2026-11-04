"use client"

import { CalendarDays, Search, RotateCcw, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { goToCurrentTimetable, submitTimetableForm } from "@/lib/native"
import type { TimetableStore } from "@/lib/timetable-data"

const selectClassName =
  "h-10 w-36 rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"

interface ControlBarProps {
  store: TimetableStore | undefined
  query: string
  onQueryChange: (query: string) => void
}

export function ControlBar({ store, query, onQueryChange }: ControlBarProps) {
  const yearOptions = store?.yearOptions ?? []
  const termOptions = store?.termOptions ?? []

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="year-select" className="text-xs font-medium text-muted-foreground">
            年度
          </label>
          <select
            id="year-select"
            className={selectClassName}
            value={store?.year ?? ""}
            disabled={yearOptions.length === 0}
            onChange={(e) => submitTimetableForm({ year: e.target.value })}
          >
            {yearOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label} 年度
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="term-select" className="text-xs font-medium text-muted-foreground">
            期間
          </label>
          <select
            id="term-select"
            className={selectClassName}
            value={store?.termCode ?? ""}
            disabled={termOptions.length === 0}
            onChange={(e) => submitTimetableForm({ termCode: e.target.value })}
          >
            <option value="">現在の期間</option>
            {termOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="class-search" className="text-xs font-medium text-muted-foreground">
            クラス検索
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="class-search"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="授業名・コード・教員で検索"
              className="h-10 w-64 pl-9 pr-8"
            />
            {query && (
              <button
                type="button"
                aria-label="検索をクリア"
                onClick={() => onQueryChange("")}
                className="absolute top-1/2 right-2 flex size-5 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col items-start gap-2 sm:items-end">
        <Button
          variant="secondary"
          className={cn("h-10 gap-2")}
          disabled={!store || store.isCurrent}
          onClick={goToCurrentTimetable}
        >
          <RotateCcw className="size-4" />
          現在
        </Button>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarDays className="size-3.5" />
          {store?.weekRange || "—"}
        </p>
      </div>
    </div>
  )
}
