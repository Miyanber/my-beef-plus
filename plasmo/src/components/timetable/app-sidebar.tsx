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
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useStorage } from "@plasmohq/storage/hook"
import { useEffect, useState } from "react"
import { getSyncSidebarOpen, setSyncSidebarOpen } from "@/lib/storage-cache"
import { onRouteChanged } from "@/lib/router"

const NAV_ITEMS = [
  { label: "HOME", path: "/lms/timetable", icon: Home },
  { label: "課題・テスト一覧", path: "/lms/task", icon: ClipboardList },
  { label: "授業情報", path: "/lms/online", icon: BookOpen },
  { label: "コース検索", path: "/course/search", icon: Search },
  { label: "BEEF+ Venture", path: "https://ventureplus.center.kobe-u.ac.jp/login", icon: Sparkles },
]

function checkActivePath(path: string, currentPath: string): boolean {
  return currentPath === path || currentPath.startsWith(path + "/")
}

export function AppSidebar() {
  // 1. 同期ストレージ（localStorage）から前回の開閉状態を即座に取得して初期化
  // これにより、初回レンダリングから前回の位置・幅が100%維持される
  const [isOpen, setIsOpenState] = useState<boolean>(getSyncSidebarOpen)
  const [hasMounted, setHasMounted] = useState(false)
  const [currentPath, setCurrentPath] = useState(() => (typeof window !== "undefined" ? window.location.pathname : ""))

  // 2. chrome.storage.local とのバックグラウンド同期
  const [, setStoredOpen] = useStorage<boolean>("isOpen", isOpen)

  useEffect(() => {
    setHasMounted(true)
    // SPAナビゲーション時にアクティブパスを即時追従させる
    return onRouteChanged((route) => {
      if (route.type !== "native") {
        setCurrentPath(route.pathname)
      }
    })
  }, [])

  const handleToggle = (next: boolean) => {
    setIsOpenState(next)
    setSyncSidebarOpen(next)
    setStoredOpen(next)
  }

  return (
    <>
      {/* 1. スマホ用：ハンバーガーボタンとドロワー（md未満で表示） */}
      <div className="fixed z-30 flex h-16 items-center border-b px-4 md:hidden bg-sidebar text-sidebar-foreground">
        <Sheet>
          <SheetTrigger 
            aria-label="メニューを開く"
            className="flex size-8 items-center justify-center rounded-lg border border-sidebar-border bg-sidebar hover:bg-sidebar-accent"
          >
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-72 bg-sidebar p-0 text-sidebar-foreground border-sidebar-border">
            <div className="flex flex-col gap-8 px-5 py-7">
              <LogoLockup isOpen={true} />
              <Navigation isOpen={true} currentPath={currentPath} />
            </div>
          </SheetContent>
        </Sheet>
        <span className="ml-4 font-bold text-sm text-sidebar-primary">BEEF +</span>
      </div>

      {/* 2. PC用：開閉可能なサイドバー（md以上で表示） */}
      <aside
        className={cn(
          "hidden flex-shrink-0 md:block bg-sidebar px-5 py-7 text-sidebar-foreground border-r border-sidebar-border top-0",
          // 初回描画（ページ遷移直後）はアニメーションをオフにして位置ブレやチラつきを完全防止。
          // ユーザーの明示的な開閉クリック時のみ transition を発火させる。
          hasMounted ? "transition-all duration-300" : "transition-none",
          isOpen ? "w-72" : "w-20 px-4"
        )}
      >
        {/* top-7 は aside の py-7 に合わせている */}
        <div className="md:flex shrink-0 flex-col gap-8 sticky top-7 w-full">
          {/* ロゴとPC用トグルボタン */}
          <div className={cn("flex items-center", isOpen ? "justify-between" : "justify-center")}>
            <LogoLockup isOpen={isOpen} />
            
            {isOpen && (
              <button
                type="button"
                aria-label="サイドバーを折りたたむ"
                onClick={() => handleToggle(false)}
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
                onClick={() => handleToggle(true)}
                className="flex size-7 items-center justify-center rounded-full border border-sidebar-border bg-sidebar text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          )}

          {/* PC用ナビゲーション */}
          <Navigation isOpen={isOpen} currentPath={currentPath} />
        </div>
      </aside>
    </>
  )
}

// --- 再利用するためのサブコンポーネント ---

function LogoLockup({ isOpen }: { isOpen: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl text-sidebar-primary-foreground shadow-md">
        <img className="w-9 font-bold tracking-tight" src="https://beefplus.center.kobe-u.ac.jp/favicon.ico" alt="BEEF+" />
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

function Navigation({ isOpen, currentPath }: { isOpen: boolean; currentPath: string }) {
  return (
    <nav className="flex flex-col gap-1.5" aria-label="メインナビゲーション">
      {NAV_ITEMS.map(({ label, icon: Icon, path }) => {
        const active = checkActivePath(path, currentPath);
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
