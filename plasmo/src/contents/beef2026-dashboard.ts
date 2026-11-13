import type { PlasmoCSConfig } from "plasmo";
import { getBeef2026TimelineState, parseBeef2026Tasks } from "~lib/parsers";
import { saveBeef2026TaskStore } from "~lib/storage-cache";
import { waitForSelector } from "~lib/utils";

export const config: PlasmoCSConfig = {
  matches: ["https://beef.center.kobe-u.ac.jp/my*"],
  run_at: "document_idle",
};

let lastSavedItemsJson: string | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function syncIfReady(): void {
  const state = getBeef2026TimelineState(document);
  if (state !== "ready" && state !== "empty") return;

  const store = parseBeef2026Tasks(document);
  const serialized = JSON.stringify(store.items);

  // ページ表示後の初回は必ず lastUpdated を更新し、以降は内容変化時のみ保存する
  if (lastSavedItemsJson === serialized) return;

  lastSavedItemsJson = serialized;
  void saveBeef2026TaskStore(store);
}

function scheduleSync(): void {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    syncIfReady();
  }, 150);
}

;(async () => {
  try {
    const timelineRoot = await waitForSelector('[data-region="timeline"]', { timeout: 10000 });
    syncIfReady();

    const observer = new MutationObserver(() => {
      scheduleSync();
    });
    observer.observe(timelineRoot, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "style"],
    });
  } catch {
    // ログイン画面やタイムライン非表示時は何もしない
  }
})();

