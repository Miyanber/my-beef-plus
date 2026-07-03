"use client"

import { MessageSquare, Bell } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"

const LINKS = [
  { jp: "マニュアル", en: "Manual" },
  { jp: "問い合わせ", en: "Contacts" },
  { jp: "個人設定", en: "Settings" },
  { jp: "サインアウト", en: "Signout" },
]

function IconButton({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className="relative flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {children}
      <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-rose-500 ring-2 ring-card" />
    </button>
  )
}

export function TopHeader() {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-end gap-4 border-b border-border bg-card/80 px-6 backdrop-blur">
      <div className="flex items-center gap-1">
        <IconButton label="メッセージ">
          <MessageSquare className="size-5" />
        </IconButton>
        <IconButton label="通知">
          <Bell className="size-5" />
        </IconButton>
      </div>

      <Separator orientation="vertical" className="h-6" />

      <nav
        aria-label="ユーザーメニュー"
        className="hidden items-center gap-5 md:flex"
      >
        {LINKS.map((link) => (
          <a
            key={link.en}
            href="#"
            className="group flex flex-col leading-tight text-muted-foreground transition-colors hover:text-foreground"
          >
            <span className="text-sm font-medium">{link.jp}</span>
            <span className="text-[10px] text-muted-foreground/60 group-hover:text-foreground/60">
              {link.en}
            </span>
          </a>
        ))}
      </nav>

      <Separator orientation="vertical" className="h-6" />

      <div className="flex items-center gap-2.5">
        <Avatar className="size-9 border border-border shadow-sm">
          <AvatarFallback className="bg-primary text-sm font-semibold text-primary-foreground">
            K
          </AvatarFallback>
        </Avatar>
        <div className="hidden leading-tight sm:block">
          <p className="text-sm font-semibold text-foreground">宮崎 聖也</p>
          <p className="text-[11px] text-muted-foreground">Seiya Miyazaki</p>
        </div>
      </div>
    </header>
  )
}
