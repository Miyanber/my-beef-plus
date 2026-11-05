import { Storage } from "@plasmohq/storage";

const localArea = new Storage({ area: "local" });
const CACHE_PREFIX = "my_beef_cache_";
const SIDEBAR_KEY = "my_beef_sidebar_open";

/**
 * localStorage から同期的にキャッシュを取得する。
 * ページ遷移直後（0ms）に初回レンダリングでキャッシュデータを同期注入するために使用する。
 */
export function getSyncCache<T>(key: string): T | undefined {
  if (typeof window === "undefined" || !window.localStorage) return undefined;
  try {
    const raw = window.localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return undefined;
    return JSON.parse(raw) as T;
  } catch (e) {
    console.warn("[my-beef-plus] failed to read sync cache for key:", key, e);
    return undefined;
  }
}

/**
 * キャッシュを localStorage（同期アクセス用）と chrome.storage.local（拡張機能永続用）の両方に保存する。
 */
export function setSyncCache<T>(key: string, data: T): void {
  // 1. 同期キャッシュ (localStorage)
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(data));
    } catch (e) {
      // QuotaExceeded 対策: 古い講義キャッシュをパージして再試行
      try {
        purgeOldCaches();
        window.localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(data));
      } catch (retryError) {
        console.warn("[my-beef-plus] localStorage quota exceeded, skipping sync cache:", retryError);
      }
    }
  }

  // 2. 非同期キャッシュ (@plasmohq/storage -> chrome.storage.local)
  localArea.set(key, data).catch((err) => {
    console.warn("[my-beef-plus] failed to write chrome.storage.local for key:", key, err);
  });
}

/**
 * 容量不足時に古い講義キャッシュをパージする
 */
function purgeOldCaches(): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  const keysToRemove: string[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const k = window.localStorage.key(i);
    if (k && k.startsWith(CACHE_PREFIX + "course_")) {
      keysToRemove.push(k);
    }
  }
  // 半分程度を削除
  for (const k of keysToRemove.slice(0, Math.ceil(keysToRemove.length / 2))) {
    window.localStorage.removeItem(k);
  }
}

/**
 * サイドバーの開閉状態を同期的に取得する。
 * 未保存時のデフォルトは true（開いた状態）。
 */
export function getSyncSidebarOpen(): boolean {
  if (typeof window === "undefined" || !window.localStorage) return true;
  try {
    const val = window.localStorage.getItem(SIDEBAR_KEY);
    if (val === null) return true;
    return val === "true";
  } catch {
    return true;
  }
}

/**
 * サイドバーの開閉状態を同期保存し、chrome.storage.local にも保存する。
 */
export function setSyncSidebarOpen(isOpen: boolean): void {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.setItem(SIDEBAR_KEY, String(isOpen));
    } catch {}
  }
  localArea.set("isOpen", isOpen).catch(() => {});
}
