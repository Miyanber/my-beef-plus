import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface WaitForSelectorOptions {
  timeout?: number;
  root?: Element | Document;
}

/**
 * 指定したセレクターの要素がDOMに出現するまで待機する関数
 */
export function waitForSelector(
  selector: string,
  options: WaitForSelectorOptions = {}
): Promise<Element> {
  const { timeout = 10000, root = document } = options;

  return new Promise((resolve, reject) => {
    const existingElement = root.querySelector(selector);
    if (existingElement) return resolve(existingElement);

    const observer = new MutationObserver((_, obs) => {
      const element = root.querySelector(selector);
      if (element) {
        obs.disconnect();
        clearTimeout(timer);
        resolve(element);
      }
    });

    const targetNode = root instanceof Document ? root.documentElement : root;

    observer.observe(targetNode, {
      childList: true,
      subtree: true,
    });

    const timer = setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Timeout: Element "${selector}" not found under the specified root after ${timeout}ms`));
    }, timeout);
  });
}

/**
 * 指定したキャッシュデータが存在しない、または有効期限が切れている場合にのみコールバック関数を実行する関数
 */
export const executeIfExpired = async <T extends { lastUpdated: string }>(
  cacheData: T | null | undefined,
  timeoutMs: number,
  callback: () => Promise<void>
): Promise<void> => {
  const nowDate = new Date();
  const isInitial = !cacheData;
  const isExpired = !!(
    cacheData &&
    nowDate.getTime() - new Date(cacheData.lastUpdated).getTime() > timeoutMs
  );

  const isDebug = process.env.PLASMO_PUBLIC_DEBUG === "True";

  if (isInitial || isExpired || isDebug) {
    await callback();
  }
};

/**
 * DOMContentLoaded を過ぎ、ページ側の ready ハンドラ (Quill初期化など) が
 * 一巡するまで待機する。content script は document_start で動くため必要。
 */
export function waitForDomReady(): Promise<void> {
  return new Promise((resolve) => {
    const settle = () => setTimeout(resolve, 0);
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", settle, { once: true });
    } else {
      settle();
    }
  });
}

const HIDE_NATIVE_STYLE_ID = "my-beef-plus-hide-native";

/**
 * BEEF+ 本来の画面 (#contentsWrapper) の表示/非表示を切り替える。
 * 要素は DOM に残すため、スクレイピングやネイティブのダウンロードフォームは引き続き使える。
 * display: none だと jQuery UI Dialog や Quill 等のDOM計測・スクリプト実行が阻害されるため、
 * サイズを維持したまま画面外に固定配置して視覚的・操作的にのみ完全に隠す。
 */
export function setNativeHidden(hidden: boolean): void {
  const existing = document.getElementById(HIDE_NATIVE_STYLE_ID);
  if (hidden && !existing) {
    const style = document.createElement("style");
    style.id = HIDE_NATIVE_STYLE_ID;
    style.textContent = `
      #contentsWrapper {
        position: fixed !important;
        top: 0 !important;
        left: -99999px !important;
        width: 1200px !important;
        height: 800px !important;
        opacity: 0 !important;
        pointer-events: none !important;
        z-index: -9999 !important;
      }
    `;
    (document.head ?? document.documentElement).appendChild(style);
  } else if (!hidden && existing) {
    existing.remove();
  }
}
