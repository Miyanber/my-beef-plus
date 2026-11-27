import type { PlasmoCSConfig } from "plasmo";
import beef2026ThemeCss from "data-text:../beef2026-theme.css";
import { runBeef2026DomEnhancements, updateThemeToggleButton } from "~lib/beef2026-enhance";
import {
  THEME_CHANGE_EVENT,
  THEME_STORAGE_KEY,
  applyDocumentTheme,
  getStoredThemeMode,
  isThemeMode,
  syncThemeFromExtensionStorage,
  watchExtensionTheme,
} from "~lib/theme-sync";
import { waitForSelector } from "~lib/utils";

export const config: PlasmoCSConfig = {
  matches: ["https://beef.center.kobe-u.ac.jp/*"],
  run_at: "document_start",
};

const BEEF2026_STYLE_ID = "my-beef-plus-beef2026-theme-style";

function injectBeef2026ThemeStyle(): void {
  let style = document.getElementById(BEEF2026_STYLE_ID) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement("style");
    style.id = BEEF2026_STYLE_ID;
    const target = document.head || document.documentElement;
    if (target) {
      target.appendChild(style);
    } else {
      document.addEventListener(
        "DOMContentLoaded",
        () => {
          (document.head || document.documentElement).appendChild(style!);
        },
        { once: true },
      );
    }
  }
  style.textContent = beef2026ThemeCss;
}

// 1. document_start 直後に 0ms でテーマ判定＆CSS注入（FOUC 防止）
applyDocumentTheme(getStoredThemeMode());
injectBeef2026ThemeStyle();

// 2. BEEF+ 側および他タブとのテーマ同期を監視
if (typeof window !== "undefined") {
  void syncThemeFromExtensionStorage((saved) => {
    updateThemeToggleButton(saved);
  });

  watchExtensionTheme((nextMode) => {
    updateThemeToggleButton(nextMode);
  });

  window.addEventListener("storage", (e) => {
    if (e.key === THEME_STORAGE_KEY) {
      const mode = getStoredThemeMode();
      applyDocumentTheme(mode);
      updateThemeToggleButton(mode);
    }
  });

  window.addEventListener(THEME_CHANGE_EVENT, (e: any) => {
    const nextTheme = e.detail?.theme;
    const mode = isThemeMode(nextTheme) ? nextTheme : getStoredThemeMode();
    applyDocumentTheme(mode);
    updateThemeToggleButton(mode);
  });

  if (window.matchMedia) {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
      if (getStoredThemeMode() === "system") {
        applyDocumentTheme("system");
        updateThemeToggleButton("system");
      }
    });
  }
}

// 3. DOM 構築後に Navbar クイックナビ・テーマボタン・サイトホーム整理を適用
;(async () => {
  try {
    await waitForSelector("body", { timeout: 10000 });
    if (document.readyState === "loading") {
      await new Promise<void>((resolve) => {
        document.addEventListener("DOMContentLoaded", () => resolve(), { once: true });
      });
    }
    runBeef2026DomEnhancements();

    // レスポンシブ viewport が未設定なら補完
    if (!document.querySelector('meta[name="viewport"]')) {
      const viewport = document.createElement("meta");
      viewport.setAttribute("name", "viewport");
      viewport.setAttribute("content", "width=device-width, initial-scale=1.0");
      document.head.appendChild(viewport);
    }
  } catch {
    // タイムアウト時は無視
  }
})();
