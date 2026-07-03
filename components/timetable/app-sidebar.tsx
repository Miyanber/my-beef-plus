"use client"

import {
  Home,
  ClipboardList,
  BookOpen,
  Search,
  Sparkles,
  ChevronLeft,
} from "lucide-react"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { label: "HOME", icon: Home, active: false },
  { label: "課題・テスト一覧", icon: ClipboardList, active: false },
  { label: "授業情報", icon: BookOpen, active: false },
  { label: "コース検索", icon: Search, active: true },
  { label: "BEEF+ Venture", icon: Sparkles, active: false },
]

export function AppSidebar() {
  return (
    <aside className="flex w-72 shrink-0 flex-col gap-8 bg-sidebar px-5 py-7 text-sidebar-foreground">
      {/* Logo lockup */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex size-10 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
            <span className="text-lg font-bold tracking-tight">B</span>
          </div>
          <div className="leading-tight">
            <p className="text-lg font-bold tracking-tight text-sidebar-primary">
              BEEF
              <span className="ml-0.5 text-primary">+</span>
            </p>
            <p className="text-[11px] font-medium text-sidebar-foreground/60">
              神戸大学 LMS
            </p>
          </div>
        </div>
        <button
          type="button"
          aria-label="サイドバーを折りたたむ"
          className="flex size-7 items-center justify-center rounded-full border border-sidebar-border bg-sidebar text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <ChevronLeft className="size-4" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1.5" aria-label="メインナビゲーション">
        {NAV_ITEMS.map(({ label, icon: Icon, active }) => (
          <a
            key={label}
            href="#"
            aria-current={active ? "page" : undefined}
            className={cn(
              "group relative flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-all",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
            )}
          >
            {active && (
              <span className="absolute top-1/2 left-0 h-6 w-1 -translate-y-1/2 rounded-r-full bg-sidebar-primary" />
            )}
            <Icon className="size-[18px] shrink-0" />
            <span className="truncate">{label}</span>
          </a>
        ))}
      </nav>
    </aside>
  )
}
