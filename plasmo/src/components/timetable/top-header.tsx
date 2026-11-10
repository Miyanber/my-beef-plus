"use client"

import { useEffect, useRef, useState } from "react"
import { MessageSquare, Bell, ExternalLink } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import type { GlobalChrome, HeaderNotice } from "@/lib/timetable-data"
import { ThemeToggle } from "../ThemeToggle"

const LINKS = [
  { jp: "マニュアル", en: "Manual", href: "/common/support/manual", external: true },
  {
    jp: "問い合わせ",
    en: "Contacts",
    href: "https://www.istc.kobe-u.ac.jp/services/StandardService/beefplus/faq/",
    external: true,
  },
  { jp: "個人設定", en: "Settings", href: "/common/settings/", external: false },
  { jp: "サインアウト", en: "Signout", href: "/logout", external: false },
]

interface NoticeMenuProps {
  label: string
  icon: React.ReactNode
  notices: HeaderNotice[]
  /** 未読バッジに数字を出すか (出さない場合は赤い点のみ) */
  moreHref: string
  moreLabel: string
  emptyText: string
  isOpen: boolean
  onToggle: () => void
  onClose: () => void
}

function NoticeMenu({
  label,
  icon,
  notices,
  moreHref,
  moreLabel,
  emptyText,
  isOpen,
  onToggle,
  onClose,
}: NoticeMenuProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [align, setAlign] = useState<"left" | "right">("right")
  const unread = notices.filter((n) => n.isNew).length

  // 画面幅やサイドバー位置に応じて、ドロップダウンメニューの展開方向（左向き or 右向き）を自動算出
  useEffect(() => {
    if (!isOpen || !rootRef.current) return

    const updateAlign = () => {
      if (!rootRef.current) return
      const rect = rootRef.current.getBoundingClientRect()
      const header = rootRef.current.closest("header")
      const headerLeft = header ? header.getBoundingClientRect().left : 0
      const headerRight = header ? header.getBoundingClientRect().right : window.innerWidth

      const menuWidth = 320 // w-80 = 320px
      const spaceLeft = rect.right - headerLeft // ボタン右端からヘッダー左端（サイドバー境界）までの余白
      const spaceRight = headerRight - rect.left // ボタン左端からヘッダー右端までの余白

      // 1. 左側が狭くサイドバーに被るが、右側に十分なスペースがある場合は右向きに展開 (left-0)
      // 2. 右側が狭く、左側に十分なスペースがある場合は左向きに展開 (right-0)
      // 3. どちらにも収まるか両方狭い場合は、より余白が広い方を選択
      if (spaceLeft < menuWidth && spaceRight >= menuWidth) {
        setAlign("left")
      } else if (spaceRight < menuWidth && spaceLeft >= menuWidth) {
        setAlign("right")
      } else {
        setAlign(spaceRight > spaceLeft ? "left" : "right")
      }
    }

    updateAlign()
    window.addEventListener("resize", updateAlign)
    return () => window.removeEventListener("resize", updateAlign)
  }, [isOpen])

  // メニュー外のクリック / Escape で閉じる (Shadow DOM 内なので composedPath を使う)
  useEffect(() => {
    if (!isOpen) return
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !e.composedPath().includes(rootRef.current)) onClose()
    }
    const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    document.addEventListener("mousedown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("mousedown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [isOpen, onClose])

  return (
    <div className="relative" ref={rootRef} data-state={isOpen ? "open" : "closed"}>
      <button
        type="button"
        aria-label={label}
        aria-expanded={isOpen}
        onClick={onToggle}
        className="relative flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        {icon}
        {unread > 0 && (
          <span className="absolute top-0.5 right-0.5 flex min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] leading-4 font-semibold text-white ring-2 ring-card">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className={cn(
            "absolute top-11 z-50 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-xl transition-all",
            align === "left" ? "left-0" : "right-0"
          )}
        >
          <p className="border-b border-border px-4 py-2.5 text-xs font-semibold text-muted-foreground">{label}</p>
          <ul className="max-h-80 overflow-y-auto">
            {notices.length === 0 && <li className="px-4 py-6 text-center text-sm text-muted-foreground">{emptyText}</li>}
            {notices.map((n) => (
              <li key={n.id} className="border-b border-border/60 last:border-b-0">
                <a href={n.url} className="flex items-start gap-2 px-4 py-2.5 text-sm hover:bg-muted">
                  {n.isNew && <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-rose-500" />}
                  <span className="line-clamp-2 leading-snug">{n.title}</span>
                </a>
              </li>
            ))}
          </ul>
          <a
            href={moreHref}
            className="block border-t border-border px-4 py-2.5 text-center text-xs font-medium text-primary hover:bg-muted"
          >
            {moreLabel}
          </a>
        </div>
      )}
    </div>
  )
}

export function TopHeader({ chrome }: { chrome?: GlobalChrome }) {
  const [activeMenu, setActiveMenu] = useState<"info" | "update" | null>(null)
  const userName = chrome?.userName ?? ""

  const handleToggle = (type: "info" | "update") => {
    setActiveMenu((prev) => (prev === type ? null : type))
  }

  const handleClose = () => {
    setActiveMenu(null)
  }

  const hasOpenMenu = activeMenu !== null

  return (
    <header
      className={cn(
        "sticky w-full top-0 flex h-16 items-center justify-end gap-4 border-b border-border bg-card/80 pl-6 pr-8 backdrop-blur transition-[z-index]",
        hasOpenMenu ? "z-40" : "z-20",
        "has-[[data-state=open]]:z-40"
      )}
    >
      <div className="flex items-center gap-1">
        <NoticeMenu
          label="お知らせ"
          icon={<MessageSquare className="size-5" />}
          notices={chrome?.infos ?? []}
          moreHref="/lms/course/information/list"
          moreLabel="お知らせ一覧へ"
          emptyText="新しいお知らせはありません"
          isOpen={activeMenu === "info"}
          onToggle={() => handleToggle("info")}
          onClose={handleClose}
        />
        <NoticeMenu
          label="更新通知"
          icon={<Bell className="size-5" />}
          notices={chrome?.updates ?? []}
          moreHref="/updateinfo"
          moreLabel="更新通知一覧へ"
          emptyText="更新通知はありません"
          isOpen={activeMenu === "update"}
          onToggle={() => handleToggle("update")}
          onClose={handleClose}
        />
      </div>

      <Separator orientation="vertical" className="hidden h-6 md:block" />

      <nav aria-label="ユーザーメニュー" className="hidden items-center gap-5 md:flex">
        {LINKS.map((link) => (
          <a
            key={link.en}
            href={link.href}
            target={link.external ? "_blank" : undefined}
            rel={link.external ? "noreferrer" : undefined}
            className="group flex flex-col leading-tight text-muted-foreground transition-colors hover:text-foreground"
          >
            <span className="flex items-center gap-1 text-sm font-medium">
              {link.jp}
              {link.external && <ExternalLink className="size-3 opacity-50" />}
            </span>
            <span className="text-[10px] text-muted-foreground/60 group-hover:text-foreground/60">{link.en}</span>
          </a>
        ))}
      </nav>

      <Separator orientation="vertical" className="h-6" />

      <ThemeToggle />

      <div className="flex items-center gap-2.5">
        <Avatar className="size-9 border border-border shadow-sm">
          <AvatarFallback className="bg-primary text-sm font-semibold text-primary-foreground">
            {userName.charAt(0) || "?"}
          </AvatarFallback>
        </Avatar>
        <div className={cn("hidden leading-tight sm:block", !userName && "invisible")}>
          <p className="text-sm font-semibold text-foreground">{userName || "…"}</p>
          <p className="text-[11px] text-muted-foreground">ログイン中</p>
        </div>
      </div>
    </header>
  )
}
