import type { PlasmoCSConfig } from "plasmo"
import { Monitor, Moon, Sun } from "lucide-react"
import { useEffect, useState } from "react"
import { getDefaultStyle } from "~lib/plasmo-style"
import { onRouteChanged, parseRoute } from "~lib/router"
import {
  NEXT_THEME,
  THEME_CHANGE_EVENT,
  THEME_META,
  THEME_STORAGE_KEY,
  applyDocumentTheme,
  getStoredThemeMode,
  isThemeMode,
  saveThemeEverywhere,
  syncThemeFromExtensionStorage,
  watchExtensionTheme,
  type ThemeMode
} from "~lib/theme-sync"

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

const LegacyThemeToggle = () => {
  const [mounted, setMounted] = useState(false)
  const [isModern, setIsModern] = useState(false)
  const [themeMode, setThemeMode] = useState<ThemeMode>("system")

  useEffect(() => {
    setMounted(true)
    setIsModern(isModernUiPage())
    setThemeMode(getStoredThemeMode())

    void syncThemeFromExtensionStorage((saved) => {
      setThemeMode(saved)
    })

    const unwatchExt = watchExtensionTheme((nextMode) => {
      setThemeMode(nextMode)
    })

    const handleThemeChange = (e: any) => {
      const targetTheme = e.detail?.theme
      if (isThemeMode(targetTheme)) {
        setThemeMode(targetTheme)
      } else {
        setThemeMode(getStoredThemeMode())
      }
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === THEME_STORAGE_KEY) {
        const nextMode = getStoredThemeMode()
        setThemeMode(nextMode)
        applyDocumentTheme(nextMode)
      }
    }

    const mediaQuery = window.matchMedia?.("(prefers-color-scheme: dark)")
    const handleMediaChange = () => {
      if (getStoredThemeMode() === "system") {
        applyDocumentTheme("system")
      }
    }

    window.addEventListener(THEME_CHANGE_EVENT, handleThemeChange)
    window.addEventListener("storage", handleStorage)
    mediaQuery?.addEventListener("change", handleMediaChange)

    // SPAルーティング変更リスナー
    const cleanupRoute = onRouteChanged(() => {
      setIsModern(isModernUiPage())
      setThemeMode(getStoredThemeMode())
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
      unwatchExt()
      window.removeEventListener(THEME_CHANGE_EVENT, handleThemeChange)
      window.removeEventListener("storage", handleStorage)
      mediaQuery?.removeEventListener("change", handleMediaChange)
      cleanupRoute()
      observer.disconnect()
    }
  }, [])

  // マウント前、または独自UIが整備されているページでは描画しない（独自UIヘッダー内に既にThemeToggleがあるため）
  if (!mounted || isModern) {
    return null
  }

  const toggleTheme = () => {
    const nextTheme = NEXT_THEME[themeMode]
    saveThemeEverywhere(nextTheme)
    setThemeMode(nextTheme)
  }

  const meta = THEME_META[themeMode]

  return (
    <div className="fixed top-2 right-3 z-[99999] pointer-events-auto">
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={`テーマ切り替え（現在: ${meta.label}）`}
        title={`テーマ: ${meta.label}（クリックで${meta.nextLabel}に切り替え）`}
        className="flex size-9 items-center justify-center rounded-full border border-border/80 bg-card/90 text-foreground shadow-md backdrop-blur transition-all duration-200 hover:scale-105 hover:bg-muted active:scale-95"
      >
        {themeMode === "system" ? (
          <Monitor className="size-4.5 text-slate-700 dark:text-slate-200 transition-transform duration-200" />
        ) : themeMode === "light" ? (
          <Sun className="size-4.5 text-amber-500 transition-transform duration-200" />
        ) : (
          <Moon className="size-4.5 text-slate-700 dark:text-slate-200 transition-transform duration-200" />
        )}
      </button>
    </div>
  )
}

export default LegacyThemeToggle
