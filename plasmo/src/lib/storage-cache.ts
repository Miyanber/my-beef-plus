import { Storage } from "@plasmohq/storage";

const localArea = new Storage({ area: "local" });
const CACHE_PREFIX = "my_beef_cache_";
const SIDEBAR_KEY = "my_beef_sidebar_open";
const SIDEBAR_OVERRIDE_KEY = "my_beef_sidebar_user_override";
const BEEF2026_MAP_KEY = "beef2026_course_map";

/**
 * サイドバー自動開閉の判定基準となるブレークポイント (px)。
 * - Surface Pro 12インチ（CSS幅 最大約1464px）以下: デフォルト折り畳み (false)
 * - 一般的な15.6インチ以上のPC（FHD 125%拡大時 CSS幅 約1536px、100%時 1920px）以上: デフォルト展開 (true)
 */
export const SIDEBAR_BREAKPOINT = 1500;

/**
 * 画面幅に基づくデフォルトの開閉状態を判定する。
 * Surface Pro 12インチ以下 (< 1500px) は折り畳み (false)、
 * 15.6インチ以上 (>= 1500px) は展開 (true)。
 */
export function getDefaultSidebarOpen(): boolean {
  if (typeof window === "undefined") return true;
  return window.innerWidth >= SIDEBAR_BREAKPOINT;
}

/**
 * ユーザーが手動でサイドバーの開閉を明示的に切り替えたことがあるかを判定する。
 */
export function hasUserSidebarOverride(): boolean {
  if (typeof window === "undefined" || !window.localStorage) return false;
  return window.localStorage.getItem(SIDEBAR_OVERRIDE_KEY) === "true";
}

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
 * キャッシュが存在するかどうかを同期的に判定する
 */
export function hasSyncCache(key: string): boolean {
  if (typeof window === "undefined" || !window.localStorage) return false;
  return window.localStorage.getItem(CACHE_PREFIX + key) !== null;
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
 * 1. ユーザーが明示的に手動で開閉を切り替えている場合はその設定値を最優先する。
 * 2. 未変更（デフォルト）の場合は画面幅に応じた初期状態（Surface Pro 12インチ以下は折り畳み、15.6インチ以上は展開）を返す。
 */
export function getSyncSidebarOpen(): boolean {
  if (typeof window === "undefined" || !window.localStorage) {
    return getDefaultSidebarOpen();
  }
  try {
    if (hasUserSidebarOverride()) {
      const val = window.localStorage.getItem(SIDEBAR_KEY);
      if (val !== null) return val === "true";
      // 互換性: 旧キー "isOpen" もチェック
      const oldVal = window.localStorage.getItem("isOpen");
      if (oldVal !== null) {
        window.localStorage.setItem(SIDEBAR_KEY, oldVal);
        return oldVal === "true";
      }
    }
    return getDefaultSidebarOpen();
  } catch {
    return getDefaultSidebarOpen();
  }
}

/**
 * サイドバーの開閉状態をユーザー設定として同期保存し、chrome.storage.local にも保存する。
 */
export function setSyncSidebarOpen(isOpen: boolean): void {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.setItem(SIDEBAR_OVERRIDE_KEY, "true");
      window.localStorage.setItem(SIDEBAR_KEY, String(isOpen));
      window.localStorage.setItem("isOpen", String(isOpen));
    } catch {}
  }
  localArea.set("isOpen", isOpen).catch(() => {});
  localArea.set(SIDEBAR_KEY, isOpen).catch(() => {});
  localArea.set(SIDEBAR_OVERRIDE_KEY, true).catch(() => {});
}

// ---------------------------------------------------------------------------
// BEEF2026 コース URL マッピング管理
// ---------------------------------------------------------------------------

/**
 * 全科目の BEEF2026 URL マップを同期的に取得する (key: courseId または code, value: url)
 */
export function getSyncBeef2026Map(): Record<string, string> {
  return getSyncCache<Record<string, string>>(BEEF2026_MAP_KEY) ?? {};
}

/**
 * 指定科目の BEEF2026 URL を取得する（courseId または 科目コード で検索）
 */
export function getBeef2026Url(courseId?: string, code?: string): string | undefined {
  const map = getSyncBeef2026Map();
  if (courseId && map[courseId]) return map[courseId];
  if (code && map[code]) return map[code];
  return undefined;
}

/**
 * 特定の科目に対する BEEF2026 URL を保存・更新・削除する
 * @param key courseId または 科目コード
 * @param url 保存するURL（空文字列や null/undefined の場合は削除）
 */
export function setBeef2026Url(key: string, url: string | null | undefined): void {
  const map = { ...getSyncBeef2026Map() };
  if (!url || !url.trim()) {
    delete map[key];
  } else {
    map[key] = url.trim();
  }
  setSyncCache(BEEF2026_MAP_KEY, map);
}

