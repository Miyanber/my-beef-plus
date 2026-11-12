import React, { useState, useEffect } from "react"
import { X, Check, Trash2 } from "lucide-react"

export interface BeefUrlModalProps {
  courseTitle: string
  courseCode?: string
  currentUrl?: string
  onClose: () => void
  onSave: (url: string | null) => void
}

export function BeefUrlModal({
  courseTitle,
  courseCode,
  currentUrl = "",
  onClose,
  onSave,
}: BeefUrlModalProps) {
  const [url, setUrl] = useState(currentUrl)

  useEffect(() => {
    setUrl(currentUrl)
  }, [currentUrl])

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
              {courseCode ? `${courseCode} ` : ""}{courseTitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
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
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            BEEF+ではなく旧LMS（BEEF2026）を利用する科目がある場合、ここにURLを登録すると時間割カードや講義トップから直接アクセスできるようになります。
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

