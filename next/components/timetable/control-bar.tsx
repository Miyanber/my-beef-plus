"use client"

import { CalendarDays, Search, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function ControlBar() {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="year-select"
            className="text-xs font-medium text-muted-foreground"
          >
            年度
          </label>
          <Select defaultValue="2026">
            <SelectTrigger id="year-select" className="h-10 w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="2026">2026 年度</SelectItem>
                <SelectItem value="2025">2025 年度</SelectItem>
                <SelectItem value="2024">2024 年度</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="class-search"
            className="text-xs font-medium text-muted-foreground"
          >
            クラス検索
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="class-search"
              placeholder="授業名・コードで検索"
              className="h-10 w-64 pl-9"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col items-start gap-2 sm:items-end">
        <Button variant="secondary" className="h-10 gap-2">
          <RotateCcw className="size-4" />
          現在
        </Button>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarDays className="size-3.5" />
          2026年06月29日 〜 2026年07月04日
        </p>
      </div>
    </div>
  )
}
