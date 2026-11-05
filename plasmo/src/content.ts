import type { PlasmoCSConfig } from "plasmo"
import legacyThemeCss from "data-text:./legacy-theme.css"
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
 * 現在の保存されたテーマを取得する（デフォルトはシステムテーマ）
 */
function getResolvedTheme(): "dark" | "light" {
  try {
    const saved = window.localStorage ? window.localStorage.getItem("theme") : null
    if (saved === "dark") return "dark"
    if (saved === "light") return "light"
    // "system" または未設定時はシステム設定に追従
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark"
    }
  } catch {}
  return "light"
}

/**
 * ページ全体（<html> タグ）にダークテーマクラスを同期反映する
 */
function applyTheme(isDark: boolean): void {
  const root = document.documentElement
  if (isDark) {
    root.classList.add("dark")
    root.style.colorScheme = "dark"
  } else {
    root.classList.remove("dark")
    root.style.colorScheme = "light"
  }
}

/**
 * ネイティブ画面用ダークテーマCSSをDOMに即座に注入する
 */
function injectLegacyThemeStyle(): void {
  if (document.getElementById(LEGACY_STYLE_ID)) return
  const style = document.createElement("style")
  style.id = LEGACY_STYLE_ID
  style.textContent = legacyThemeCss
  const target = document.head || document.documentElement
  if (target) {
    target.appendChild(style)
  } else {
    document.addEventListener("DOMContentLoaded", () => {
      (document.head || document.documentElement).appendChild(style)
    }, { once: true })
  }
}

// 1. document_start 直後に 0ms でテーマを判定・適用（白飛び/FOUCを完全根絶）
const initialTheme = getResolvedTheme()
applyTheme(initialTheme === "dark")
injectLegacyThemeStyle()

// 2. 他のタブや独自UI画面（next-themes）との同期を監視
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === "theme") {
      applyTheme(getResolvedTheme() === "dark")
    }
  })

  // 同一ウィンドウ内の切り替えカスタムイベント
  window.addEventListener("beef-plus-theme-change", (e: any) => {
    const nextTheme = e.detail?.theme
    if (nextTheme === "dark" || nextTheme === "light") {
      applyTheme(nextTheme === "dark")
    } else {
      applyTheme(getResolvedTheme() === "dark")
    }
  })
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
