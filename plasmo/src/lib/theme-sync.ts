import { Storage } from "@plasmohq/storage";

export type ThemeMode = "system" | "light" | "dark";

export const THEME_STORAGE_KEY = "theme";
export const THEME_CHANGE_EVENT = "beef-plus-theme-change";

export const NEXT_THEME: Record<ThemeMode, ThemeMode> = {
  system: "light",
  light: "dark",
  dark: "system",
};

export const THEME_META: Record<ThemeMode, { label: string; nextLabel: string }> = {
  system: { label: "システム", nextLabel: "ライト" },
  light: { label: "ライト", nextLabel: "ダーク" },
  dark: { label: "ダーク", nextLabel: "システム" },
};

const localArea = new Storage({ area: "local" });

export function isThemeMode(value: unknown): value is ThemeMode {
  return value === "system" || value === "light" || value === "dark";
}

/**
 * 現在のオリジンの localStorage から同期的にテーマモードを取得する（0ms FOUC 対策用）
 */
export function getStoredThemeMode(): ThemeMode {
  try {
    const saved = window.localStorage ? window.localStorage.getItem(THEME_STORAGE_KEY) : null;
    if (isThemeMode(saved)) return saved;
  } catch {}
  return "system";
}

/**
 * テーマモードと OS 設定から実際にダークテーマを適用すべきか判定する
 */
export function resolveIsDark(mode: ThemeMode): boolean {
  if (mode === "dark") return true;
  if (mode === "light") return false;
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  return false;
}

/**
 * <html> タグにダークテーマクラスと color-scheme を反映する
 */
export function applyDocumentTheme(mode: ThemeMode): boolean {
  const isDark = resolveIsDark(mode);
  if (typeof document !== "undefined") {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      root.style.colorScheme = "dark";
    } else {
      root.classList.remove("dark");
      root.style.colorScheme = "light";
    }
  }
  return isDark;
}

/**
 * 自オリジンの localStorage ミラーのみを更新する
 */
export function setLocalThemeMirror(mode: ThemeMode): void {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(THEME_STORAGE_KEY, mode);
    }
  } catch {}
}

/**
 * localStorage・chrome.storage.local・DOM・カスタムイベントをすべて同期保存する
 */
export function saveThemeEverywhere(mode: ThemeMode): void {
  applyDocumentTheme(mode);
  setLocalThemeMirror(mode);
  localArea.set(THEME_STORAGE_KEY, mode).catch(() => {});
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(THEME_CHANGE_EVENT, {
        detail: { theme: mode },
      }),
    );
  }
}

/**
 * React (next-themes) 側からのテーマ変更を chrome.storage.local に保存する
 */
export async function persistThemeToExtensionStorage(mode: ThemeMode): Promise<void> {
  try {
    const current = await localArea.get<string>(THEME_STORAGE_KEY);
    if (current !== mode) {
      await localArea.set(THEME_STORAGE_KEY, mode);
    }
  } catch {}
}

/**
 * chrome.storage.local から正本テーマを取得し、自オリジンの localStorage と DOM に同期する
 */
export async function syncThemeFromExtensionStorage(
  onSynced?: (mode: ThemeMode) => void,
): Promise<ThemeMode | undefined> {
  try {
    const saved = await localArea.get<string>(THEME_STORAGE_KEY);
    if (!isThemeMode(saved)) return undefined;

    if (getStoredThemeMode() !== saved) {
      setLocalThemeMirror(saved);
      applyDocumentTheme(saved);
    }
    onSynced?.(saved);
    return saved;
  } catch {
    return undefined;
  }
}

/**
 * 別オリジンや別タブで行われた chrome.storage.local のテーマ変更を監視する
 */
export function watchExtensionTheme(onChange: (mode: ThemeMode) => void): () => void {
  let active = true;
  const callbackMap = {
    [THEME_STORAGE_KEY]: () => {
      void localArea.get<string>(THEME_STORAGE_KEY).then((val) => {
        if (!active || !isThemeMode(val)) return;
        setLocalThemeMirror(val);
        applyDocumentTheme(val);
        onChange(val);
      });
    },
  };
  localArea.watch(callbackMap);
  return () => {
    active = false;
    localArea.unwatch(callbackMap);
  };
}
