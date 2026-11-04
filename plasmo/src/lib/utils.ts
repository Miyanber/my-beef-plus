import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface WaitForSelectorOptions {
  timeout?: number;
  root?: Element | Document; // 🎯 検索基準となる親要素を指定できるようにする
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
    // 1. 指定された root の中から既に存在していれば即レス
    const existingElement = root.querySelector(selector);
    if (existingElement) return resolve(existingElement);

    const observer = new MutationObserver((_, obs) => {
      // 2. 変更があった際も root の中から探す
      const element = root.querySelector(selector);
      if (element) {
        obs.disconnect();
        clearTimeout(timer);
        resolve(element);
      }
    });

    // 3. 監視対象も root に絞る（Documentの場合は documentElement、Elementの場合はそれ自体）
    const targetNode = root instanceof Document ? root.documentElement : root;

    observer.observe(targetNode, {
      childList: true,
      subtree: true,
    });

    // タイムアウト処理
    const timer = setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Timeout: Element "${selector}" not found under the specified root after ${timeout}ms`));
    }, timeout);
  });
}

/**
 * 指定したキャッシュデータが存在しない、または有効期限が切れている場合にのみコールバック関数を実行する関数
 * @param cacheData useStorageから取得したキャッシュデータ（lastUpdatedプロパティを持つオブジェクト）
 * @param timeoutMs 有効期限（ミリ秒）
 * @param callback 実行するコールバック関数
 * @returns Promise<void>
 */
export const executeIfExpired = async <T extends { lastUpdated: string }>(
  cacheData: T | null | undefined,
  timeoutMs: number,
  callback: () => Promise<void>
): Promise<void> => {
  const nowDate = new Date();

  // 1. ストレージが空かどうかの判定
  const isInitial = !cacheData;

  // 2. 有効期限が切れているかどうかの判定
  const isExpired = !!(
    cacheData &&
    nowDate.getTime() - new Date(cacheData.lastUpdated).getTime() > timeoutMs
  );

  // TODO: リロードボタン押したときはキャッシュ無効化できるようにする
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
 * スクレイピングに失敗したときは false にして、元の画面にフォールバックする。
 */
export function setNativeHidden(hidden: boolean): void {
  const existing = document.getElementById(HIDE_NATIVE_STYLE_ID);
  if (hidden && !existing) {
    const style = document.createElement("style");
    style.id = HIDE_NATIVE_STYLE_ID;
    style.textContent = "#contentsWrapper { display: none !important; }";
    (document.head ?? document.documentElement).appendChild(style);
  } else if (!hidden && existing) {
    existing.remove();
  }
}
