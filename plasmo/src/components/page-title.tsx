import type { ReactNode } from "react"

interface PageTitleProps {
  icon: ReactNode
  title: string
  subtitle?: string
  /** 右側に置く要素（更新ボタンなど） */
  actions?: ReactNode
}

/** 各ページ共通の「アイコン + タイトル」ヘッダー */
export function PageTitle({ icon, title, subtitle, actions }: PageTitleProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm [&_svg]:size-6">
          {icon}
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {actions}
    </div>
  )
}

