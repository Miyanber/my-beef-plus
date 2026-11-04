import type { PlasmoCSConfig } from "plasmo"
import { waitForSelector } from "~lib/utils"

export const config: PlasmoCSConfig = {
  matches: [
    "https://beefplus.center.kobe-u.ac.jp/lms/*",
    "https://beefplus.center.kobe-u.ac.jp/portal/*"
  ],
  run_at: "document_start"
}

// レスポンシブ用 viewport の注入（純粋スクリプトとして実行、UIマウントなし）
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

