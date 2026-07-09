import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 指定したセレクターの要素がDOMに出現するまで待機する関数
 */
export function waitForSelector(selector: string, timeout = 10000): Promise<Element> {
  return new Promise((resolve, reject) => {
    // 既に存在していれば即レス
    const existingElement = document.querySelector(selector)
    if (existingElement) return resolve(existingElement)

    const observer = new MutationObserver((_, obs) => {
      const element = document.querySelector(selector)
      if (element) {
        obs.disconnect()
        clearTimeout(timer)
        resolve(element)
      }
    })

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    })

    // タイムアウト処理（一応入れておくと安全）
    const timer = setTimeout(() => {
      observer.disconnect()
      reject(new Error(`Timeout: Element "${selector}" not found after ${timeout}ms`))
    }, timeout)
  })
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