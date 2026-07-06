"use client"

import {
  Home,
  ClipboardList,
  BookOpen,
  Search,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Menu
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

const NAV_ITEMS = [
  { label: "HOME", path: "/", icon: Home },
  { label: "課題・テスト一覧", path: "/attachments", icon: ClipboardList },
  { label: "授業情報", path: "/classes", icon: BookOpen },
  { label: "コース検索", path: "/search", icon: Search },
  { label: "BEEF+ Venture", path: "/venture", icon: Sparkles },
]

export function AppSidebar() {
  const [isOpen, setIsOpen] = useState(true) // PC用の開閉状態

  return (
    <>
      {/* 1. スマホ用：ハンバーガーボタンとドロワー（md未満で表示） */}
      <div className="flex h-16 items-center border-b px-4 md:hidden bg-sidebar text-sidebar-foreground">
        <Sheet>
          <SheetTrigger>
            <div
              aria-label="メニューを開く"
              className="flex size-9 items-center justify-center rounded-lg border border-sidebar-border bg-sidebar hover:bg-sidebar-accent"
            >
              <Menu className="size-5" />
            </div>
          </SheetTrigger>
          {/* side="left" で左からスライドイン */}
          <SheetContent side="left" className="w-72 bg-sidebar p-0 text-sidebar-foreground border-sidebar-border">
            <div className="flex flex-col gap-8 px-5 py-7">
              {/* スマホ用ロゴ情報 */}
              <LogoLockup isOpen={true} />
              {/* スマホ用ナビゲーション */}
              <Navigation isOpen={true} />
            </div>
          </SheetContent>
        </Sheet>
        <span className="ml-4 font-bold text-sm text-sidebar-primary">BEEF +</span>
      </div>

      {/* 2. PC用：開閉可能なサイドバー（md以上で表示） */}
      <aside
        className={cn(
          "hidden md:flex shrink-0 flex-col gap-8 bg-sidebar px-5 py-7 text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 h-screen fixed top-0",
          isOpen ? "w-72" : "w-20 px-4"
        )}
      >
        {/* ロゴとPC用トグルボタン */}
        <div className={cn("flex items-center", isOpen ? "justify-between" : "justify-center")}>
          <LogoLockup isOpen={isOpen} />
          
          {isOpen && (
            <button
              type="button"
              aria-label="サイドバーを折りたたむ"
              onClick={() => setIsOpen(false)}
              className="flex size-7 items-center justify-center rounded-full border border-sidebar-border bg-sidebar text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <ChevronLeft className="size-4" />
            </button>
          )}
        </div>

        {/* 閉じた状態の時の展開ボタン */}
        {!isOpen && (
          <div className="flex justify-center">
            <button
              type="button"
              aria-label="サイドバーを展開する"
              onClick={() => setIsOpen(true)}
              className="flex size-7 items-center justify-center rounded-full border border-sidebar-border bg-sidebar text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        )}

        {/* PC用ナビゲーション */}
        <Navigation isOpen={isOpen} />
      </aside>
    </>
  )
}

// --- 再利用するためのサブコンポーネント ---

function LogoLockup({ isOpen }: { isOpen: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
        <span className="text-lg font-bold tracking-tight">B</span>
      </div>
      {isOpen && (
        <div className="leading-tight whitespace-nowrap">
          <p className="text-lg font-bold tracking-tight text-sidebar-primary">
            BEEF
            <span className="ml-0.5 text-primary">+</span>
          </p>
          <p className="text-[11px] font-medium text-sidebar-foreground/60">
            神戸大学 LMS
          </p>
        </div>
      )}
    </div>
  )
}

function Navigation({ isOpen }: { isOpen: boolean }) {
  return (
    <nav className="flex flex-col gap-1.5" aria-label="メインナビゲーション">
      {NAV_ITEMS.map(({ label, icon: Icon, path }) => {
        const active = window.location.pathname === path;
        return (
          <a
            key={label}
            href={path}
            aria-current={active ? "page" : undefined}
            title={!isOpen ? label : undefined}
            className={cn(
              "group relative flex items-center rounded-xl py-3 text-sm font-medium transition-all",
              isOpen ? "px-3.5 gap-3" : "justify-center px-0",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
            )}
          >
            {active && (
              <span className="absolute top-1/2 left-0 h-6 w-1 -translate-y-1/2 rounded-r-full bg-sidebar-primary" />
            )}
            <Icon className="size-[18px] shrink-0" />
            {isOpen && <span className="truncate">{label}</span>}
          </a>
        )
      })}
    </nav>
  )
}