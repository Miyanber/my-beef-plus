import type { PlasmoCSConfig } from "plasmo"
import legacyThemeCss from "data-text:./legacy-theme.css"
import {
  THEME_CHANGE_EVENT,
  THEME_STORAGE_KEY,
  applyDocumentTheme,
  getStoredThemeMode,
  isThemeMode,
  syncThemeFromExtensionStorage,
  watchExtensionTheme
} from "~lib/theme-sync"
import { waitForSelector } from "~lib/utils"

export const config: PlasmoCSConfig = {
  matches: [
    "https://beefplus.center.kobe-u.ac.jp/lms/*",
    "https://beefplus.center.kobe-u.ac.jp/portal/*"
  ],
  run_at: "document_start"
}

const LEGACY_STYLE_ID = "my-beef-plus-legacy-theme-style"

/**
 * ネイティブ画面用ダークテーマCSSをDOMに即座に注入する
 */
function injectLegacyThemeStyle(): void {
  let style = document.getElementById(LEGACY_STYLE_ID) as HTMLStyleElement | null
  if (!style) {
    style = document.createElement("style")
    style.id = LEGACY_STYLE_ID
    const target = document.head || document.documentElement
    if (target) {
      target.appendChild(style)
    } else {
      document.addEventListener("DOMContentLoaded", () => {
        ;(document.head || document.documentElement).appendChild(style!)
      }, { once: true })
    }
  }
  style.textContent = legacyThemeCss
}

// 1. document_start 直後に 0ms でテーマを判定・適用（白飛び/FOUCを完全根絶）
// legacy-theme.css v1.1.0 (shadcn sharp theme)
applyDocumentTheme(getStoredThemeMode())
injectLegacyThemeStyle()

// 2. 別オリジン (BEEF2026) や他タブとのテーマ同期を監視
if (typeof window !== "undefined") {
  void syncThemeFromExtensionStorage((saved) => {
    window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: { theme: saved } }))
  })

  watchExtensionTheme((nextMode) => {
    window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: { theme: nextMode } }))
  })

  window.addEventListener("storage", (e) => {
    if (e.key === THEME_STORAGE_KEY) {
      applyDocumentTheme(getStoredThemeMode())
    }
  })

  // 同一ウィンドウ内の切り替えカスタムイベント
  window.addEventListener(THEME_CHANGE_EVENT, (e: any) => {
    const nextTheme = e.detail?.theme
    if (isThemeMode(nextTheme)) {
      applyDocumentTheme(nextTheme)
    } else {
      applyDocumentTheme(getStoredThemeMode())
    }
  })

  // システムテーマ変更時に "system"（または未設定）なら自動追従
  if (window.matchMedia) {
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", () => {
        if (getStoredThemeMode() === "system") {
          applyDocumentTheme("system")
        }
      })
  }
}

// 3. レスポンシブ用 viewport の注入（純粋スクリプトとして実行、UIマウントなし）
;(async () => {
  try {
    await waitForSelector("body")

    let viewport = document.querySelector('meta[name="viewport"]')
    if (viewport) {
      viewport.setAttribute("content", "width=device-width, initial-scale=1.0")
    } else {
      viewport = document.createElement("meta")
      viewport.setAttribute("name", "viewport")
      viewport.setAttribute("content", "width=device-width, initial-scale=1.0")
      document.head.appendChild(viewport)
    }
  } catch {
    // タイムアウト時は無視
  }
})()
