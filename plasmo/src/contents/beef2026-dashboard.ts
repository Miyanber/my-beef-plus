import type { PlasmoCSConfig } from "plasmo";
import { getBeef2026TimelineState, parseBeef2026Tasks } from "~lib/parsers";
import { saveBeef2026TaskStore, type Beef2026RuntimeMessage } from "~lib/storage-cache";
import { waitForSelector } from "~lib/utils";

export const config: PlasmoCSConfig = {
  matches: ["https://beef.center.kobe-u.ac.jp/my*"],
  run_at: "document_idle",
};

let lastSavedItemsJson: string | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let hasNotifiedDone = false;

async function notifyBackground(message: Beef2026RuntimeMessage): Promise<void> {
  try {
    await chrome.runtime.sendMessage(message);
  } catch {
    // Background 未起動時や手動タブでの例外は無視
  }
}

async function syncIfReady(): Promise<void> {
  const state = getBeef2026TimelineState(document);
  if (state !== "ready" && state !== "empty") return;

  const store = parseBeef2026Tasks(document);
  const serialized = JSON.stringify(store.items);

  // ページ表示後の初回は必ず lastUpdated を更新し、以降は内容変化時のみ保存する
  if (lastSavedItemsJson === serialized) return;

  lastSavedItemsJson = serialized;
  await saveBeef2026TaskStore(store);

  if (!hasNotifiedDone) {
    hasNotifiedDone = true;
    await notifyBackground({ type: "BEEF2026_SYNC_DONE" });
  }
}

function scheduleSync(): void {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    void syncIfReady();
  }, 150);
}

;(async () => {
  try {
    const timelineRoot = await waitForSelector('[data-region="timeline"]', { timeout: 10000 });
    await syncIfReady();

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
    // ログイン画面やタイムライン非表示時はバックグラウンドへ失敗通知を送る
    await notifyBackground({
      type: "BEEF2026_SYNC_FAILED",
      reason: "BEEF2026 のタイムラインを取得できませんでした（ログイン状態をご確認ください）",
    });
  }
})();

