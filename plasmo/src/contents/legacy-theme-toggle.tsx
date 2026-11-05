import type { PlasmoCSConfig } from "plasmo"
import { Moon, Sun } from "lucide-react"
import { useEffect, useState } from "react"
import { Storage } from "@plasmohq/storage"
import { getDefaultStyle } from "~lib/plasmo-style"
import { onRouteChanged, parseRoute } from "~lib/router"

const localArea = new Storage({ area: "local" })

export const config: PlasmoCSConfig = {
  matches: [
    "https://beefplus.center.kobe-u.ac.jp/lms/*",
    "https://beefplus.center.kobe-u.ac.jp/portal/*"
  ],
  run_at: "document_end"
}

export const getStyle = getDefaultStyle

/**
 * 現在のページが独自UI対象のルート（時間割・課題一覧・講義トップ）かを判定する
 */
function isModernUiPage(): boolean {
  if (typeof window === "undefined") return false
  const route = parseRoute(window.location.href)
  return route.type !== "native"
}

/**
 * 現在のテーマがダークモードかを判定する
 */
function checkIsDark(): boolean {
  if (typeof document === "undefined") return false
  return document.documentElement.classList.contains("dark")
}

const LegacyThemeToggle = () => {
  const [mounted, setMounted] = useState(false)
  const [isModern, setIsModern] = useState(false)
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    setMounted(true)
    setIsModern(isModernUiPage())
    setIsDark(checkIsDark())

    const handleThemeChange = (e: any) => {
      const targetTheme = e.detail?.theme
      if (targetTheme === "dark") {
        setIsDark(true)
      } else if (targetTheme === "light") {
        setIsDark(false)
      } else {
        setIsDark(checkIsDark())
      }
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "theme") {
        setIsDark(checkIsDark())
      }
    }

    window.addEventListener("beef-plus-theme-change", handleThemeChange)
    window.addEventListener("storage", handleStorage)

    // SPAルーティング変更リスナー
    const cleanupRoute = onRouteChanged(() => {
      setIsModern(isModernUiPage())
      setIsDark(checkIsDark())
    })

    // MutationObserver でネイティブDOM隠蔽やURL変化を監視
    const observer = new MutationObserver(() => {
      setIsModern(isModernUiPage())
    })
    observer.observe(document.head || document.documentElement, {
      childList: true,
      subtree: true
    })

    return () => {
      window.removeEventListener("beef-plus-theme-change", handleThemeChange)
      window.removeEventListener("storage", handleStorage)
      cleanupRoute()
      observer.disconnect()
    }
  }, [])

  // マウント前、または独自UIが整備されているページでは描画しない（独自UIヘッダー内に既にThemeToggleがあるため）
  if (!mounted || isModern) {
    return null
  }

  const toggleTheme = () => {
    const nextDark = !isDark
    const nextTheme = nextDark ? "dark" : "light"

    if (nextDark) {
      document.documentElement.classList.add("dark")
      document.documentElement.style.colorScheme = "dark"
    } else {
      document.documentElement.classList.remove("dark")
      document.documentElement.style.colorScheme = "light"
    }

    try {
      localStorage.setItem("theme", nextTheme)
    } catch {}

    localArea.set("theme", nextTheme).catch(() => {})

    window.dispatchEvent(
      new CustomEvent("beef-plus-theme-change", {
        detail: { theme: nextTheme }
      })
    )

    setIsDark(nextDark)
  }

  return (
    <div className="fixed top-2 right-3 z-[99999] pointer-events-auto">
      <button
        type="button"
        onClick={toggleTheme}
        aria-label="テーマ切り替え (Light / Dark)"
        title={isDark ? "ライトモードに切り替え" : "ダークモードに切り替え"}
        className="flex size-9 items-center justify-center rounded-full border border-border/80 bg-card/90 text-foreground shadow-md backdrop-blur transition-all duration-200 hover:scale-105 hover:bg-muted active:scale-95"
      >
        {isDark ? (
          <Sun className="size-4.5 text-amber-400 transition-transform duration-200" />
        ) : (
          <Moon className="size-4.5 text-slate-700 transition-transform duration-200" />
        )}
      </button>
    </div>
  )
}

export default LegacyThemeToggle
