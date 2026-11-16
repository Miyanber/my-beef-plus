import { BEEF2026_DASHBOARD_URL } from "~lib/parsers";
import {
  BEEF2026_SYNC_COOLDOWN_MS,
  BEEF2026_SYNC_TIMEOUT_MS,
  getBeef2026SyncStatusFromStorage,
  getBeef2026TaskStoreFromStorage,
  isBeef2026SyncStale,
  setBeef2026SyncStatus,
  type Beef2026RuntimeMessage,
  type Beef2026SyncStatus,
  type SyncBeef2026Response,
} from "~lib/storage-cache";

let activeSyncTabId: number | null = null;
let activeSyncTimer: ReturnType<typeof setTimeout> | null = null;
let syncStarting = false;
let statusWriteQueue: Promise<void> = Promise.resolve();

function queueStatusUpdate(status: Beef2026SyncStatus): Promise<void> {
  statusWriteQueue = statusWriteQueue
    .then(() => setBeef2026SyncStatus(status))
    .catch(() => {});
  return statusWriteQueue;
}

function clearSyncTimer(): void {
  if (activeSyncTimer !== null) {
    clearTimeout(activeSyncTimer);
    activeSyncTimer = null;
  }
}

async function resolveActiveTabId(): Promise<number | null> {
  if (activeSyncTabId !== null) return activeSyncTabId;
  const status = await getBeef2026SyncStatusFromStorage();
  if (
    status?.phase === "syncing" &&
    !isBeef2026SyncStale(status) &&
    typeof status.activeTabId === "number"
  ) {
    return status.activeTabId;
  }
  return null;
}

async function tabExists(tabId: number): Promise<boolean> {
  try {
    await chrome.tabs.get(tabId);
    return true;
  } catch {
    return false;
  }
}

async function closeTabSafely(tabId: number): Promise<void> {
  try {
    await chrome.tabs.remove(tabId);
  } catch {
    // すでに閉じられている場合は無視
  }
}

async function finishSync(
  tabId: number,
  nextStatus: { phase: "idle" | "error"; errorMessage?: string },
): Promise<void> {
  clearSyncTimer();
  if (activeSyncTabId === tabId) {
    activeSyncTabId = null;
  }
  await queueStatusUpdate({
    phase: nextStatus.phase,
    lastAttemptAt: Date.now(),
    errorMessage: nextStatus.errorMessage,
  });
  await closeTabSafely(tabId);
}

async function startBackgroundSync(
  force: boolean,
  windowId?: number,
): Promise<SyncBeef2026Response> {
  if (syncStarting || activeSyncTabId !== null) {
    return { started: false, reason: "already_syncing" };
  }

  syncStarting = true;
  try {
    const [currentStatus, existingStore] = await Promise.all([
      getBeef2026SyncStatusFromStorage(),
      getBeef2026TaskStoreFromStorage(),
    ]);

    if (
      currentStatus?.phase === "syncing" &&
      !isBeef2026SyncStale(currentStatus) &&
      typeof currentStatus.activeTabId === "number" &&
      (await tabExists(currentStatus.activeTabId))
    ) {
      activeSyncTabId = currentStatus.activeTabId;
      return { started: false, reason: "already_syncing" };
    }

    const now = Date.now();
    if (!force) {
      const parsedUpdated = existingStore?.lastUpdated ? Date.parse(existingStore.lastUpdated) : NaN;
      const lastStoreTime = Number.isFinite(parsedUpdated) ? parsedUpdated : 0;
      const lastAttemptTime = currentStatus?.lastAttemptAt ?? 0;
      const lastSyncTime = Math.max(lastStoreTime, lastAttemptTime);

      if (lastSyncTime > 0 && now - lastSyncTime < BEEF2026_SYNC_COOLDOWN_MS) {
        return { started: false, reason: "cooldown" };
      }
    }

    const tab = await chrome.tabs.create({
      url: BEEF2026_DASHBOARD_URL,
      active: false,
      ...(typeof windowId === "number" ? { windowId } : {}),
    });

    if (typeof tab.id !== "number") {
      await queueStatusUpdate({
        phase: "error",
        lastAttemptAt: now,
        errorMessage: "BEEF2026 同期用タブを開けませんでした",
      });
      return { started: false, reason: "tab_create_failed" };
    }

    const tabId = tab.id;
    activeSyncTabId = tabId;

    await queueStatusUpdate({
      phase: "syncing",
      startedAt: now,
      lastAttemptAt: now,
      activeTabId: tabId,
    });

    clearSyncTimer();
    activeSyncTimer = setTimeout(() => {
      void finishSync(tabId, {
        phase: "error",
        errorMessage: "BEEF2026 の自動同期がタイムアウトしました（手動で開いて確認してください）",
      });
    }, BEEF2026_SYNC_TIMEOUT_MS);

    return { started: true };
  } catch (err) {
    console.warn("[my-beef-plus] failed to start BEEF2026 background sync:", err);
    await queueStatusUpdate({
      phase: "error",
      lastAttemptAt: Date.now(),
      errorMessage: "BEEF2026 のバックグラウンド同期に失敗しました",
    });
    return { started: false, reason: "error" };
  } finally {
    syncStarting = false;
  }
}

chrome.runtime.onMessage.addListener((message: Beef2026RuntimeMessage, sender, sendResponse) => {
  if (!message || typeof message !== "object") return false;

  if (message.type === "SYNC_BEEF2026") {
    void startBackgroundSync(Boolean(message.force), sender.tab?.windowId).then(sendResponse);
    return true;
  }

  if (message.type === "BEEF2026_SYNC_DONE" || message.type === "BEEF2026_SYNC_FAILED") {
    const senderTabId = sender.tab?.id;
    if (typeof senderTabId !== "number") return false;

    void (async () => {
      const trackedTabId = await resolveActiveTabId();
      if (trackedTabId !== senderTabId) return;

      if (message.type === "BEEF2026_SYNC_DONE") {
        await finishSync(senderTabId, { phase: "idle" });
      } else {
        await finishSync(senderTabId, {
          phase: "error",
          errorMessage: message.reason || "BEEF2026 のタイムラインを取得できませんでした",
        });
      }
    })();
    return false;
  }

  return false;
});

chrome.tabs.onRemoved.addListener((tabId) => {
  void (async () => {
    const trackedTabId = await resolveActiveTabId();
    if (trackedTabId !== tabId) return;
    clearSyncTimer();
    activeSyncTabId = null;
    await queueStatusUpdate({
      phase: "idle",
      lastAttemptAt: Date.now(),
    });
  })();
});
