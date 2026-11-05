import { Storage } from "@plasmohq/storage";
import { useEffect, useRef, useState } from "react";
import { scrapeGlobalChrome } from "./scrapers";
import { getSyncCache, setSyncCache } from "./storage-cache";
import type { GlobalChrome } from "./timetable-data";
import { setNativeHidden } from "./utils";

/** 講義詳細などサイズの大きいデータは sync (8KB/件) に入らないため local を使う */
const localArea = new Storage({ area: "local" });

export type PageStatus = "loading" | "ready" | "error";

interface UsePageDataOptions<T> {
  /** ストレージのキー */
  key: string;
  /** BEEF+ のDOMを読み取る関数 (描画完了待ちを含む) */
  scrape: () => Promise<T>;
  /** キャッシュが今のページに使えるか (年度が違う等は false) */
  accept?: (cached: T) => boolean;
}

/**
 * stale-while-revalidate 方式のページデータ取得フック。
 *  1. 同期キャッシュ (localStorage) があれば即座（0ms）に描画し、BEEF+ 本来の画面を隠す
 *  2. DOM の準備ができたらスクレイピングして最新データに差し替え、キャッシュを更新
 *  3. キャッシュがなくスクレイピングにも失敗したら本来の画面に戻す（フォールバック）
 */
export function usePageData<T extends { lastUpdated: string }>({ key, scrape, accept }: UsePageDataOptions<T>) {
  // 1. 同期キャッシュから初期値を即座に取得（ページ遷移直後の初回レンダリングで即時利用可能）
  const [cached, setCached] = useState<T | undefined>(() => {
    const syncData = getSyncCache<T>(key);
    if (syncData && (!accept || accept(syncData))) {
      // キャッシュが存在する場合、初回レンダー前から即座にネイティブDOMを隠蔽してチラつきを根絶
      setNativeHidden(true);
      return syncData;
    }
    return undefined;
  });

  const [fresh, setFresh] = useState<T>();
  const [status, setStatus] = useState<PageStatus>("loading");

  const scrapeRef = useRef(scrape);
  scrapeRef.current = scrape;

  // 2. chrome.storage.local からもバックアップとして非同期読み出し
  // (localStorage に入りきらなかった場合や、過去バージョンの既存キャッシュを拾う)
  useEffect(() => {
    let cancelled = false;
    localArea.get<T>(key).then((val) => {
      if (!cancelled && val && (!accept || accept(val))) {
        setCached((prev) => {
          if (!prev) {
            // 同期キャッシュに未保存だった場合は保存して次回以降の0ms即座表示に備える
            try {
              setSyncCache(key, val);
            } catch {}
            return val;
          }
          return prev;
        });
      }
    }).catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [key]);

  // 3. 最新DOMのスクレイピングとキャッシュの更新
  useEffect(() => {
    let cancelled = false;
    scrapeRef
      .current()
      .then(async (data) => {
        if (cancelled) return;
        setFresh(data);
        setStatus("ready");
        try {
          setSyncCache(key, data);
        } catch (e) {
          console.warn("[my-beef-plus] failed to write cache", e);
        }
      })
      .catch((e) => {
        if (cancelled) return;
        console.error("[my-beef-plus] scraping failed.", e);
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [key]);

  const usableCache = cached && (!accept || accept(cached)) ? cached : undefined;
  
  // キャッシュがあれば、スクレイピングがエラーになってもキャッシュ表示を優先維持（Zero Risk / 高UX）
  const data = fresh ?? usableCache;

  const shouldHideNative = !!data;
  useEffect(() => {
    setNativeHidden(shouldHideNative);
    return () => setNativeHidden(false);
  }, [shouldHideNative]);

  return { data, status, isFromCache: !fresh && !!usableCache };
}

/** ヘッダーのユーザー名・お知らせなど、全ページ共通の情報（キャッシュ対応） */
export function useGlobalChrome(): GlobalChrome | undefined {
  const [chrome, setChrome] = useState<GlobalChrome | undefined>(() => {
    return getSyncCache<GlobalChrome>("globalChrome");
  });

  useEffect(() => {
    let cancelled = false;
    scrapeGlobalChrome()
      .then((c) => {
        if (!cancelled && c) {
          setChrome(c);
          setSyncCache("globalChrome", c);
        }
      })
      .catch((e) => console.warn("[my-beef-plus] failed to read global chrome", e));
    return () => {
      cancelled = true;
    };
  }, []);

  return chrome;
}
