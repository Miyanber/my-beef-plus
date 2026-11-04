import { Storage } from "@plasmohq/storage";
import { useStorage } from "@plasmohq/storage/hook";
import { useEffect, useRef, useState } from "react";
import { scrapeGlobalChrome } from "./scrapers";
import type { GlobalChrome } from "./timetable-data";
import { setNativeHidden } from "./utils";

/** 講義詳細などサイズの大きいデータは sync (8KB/件) に入らないため local を使う */
const localArea = new Storage({ area: "local" });

export type PageStatus = "loading" | "ready" | "error";

interface UsePageDataOptions<T> {
  /** chrome.storage.local のキー */
  key: string;
  /** BEEF+ のDOMを読み取る関数 (描画完了待ちを含む) */
  scrape: () => Promise<T>;
  /** キャッシュが今のページに使えるか (年度が違う等は false) */
  accept?: (cached: T) => boolean;
}

/**
 * stale-while-revalidate 方式のページデータ取得フック。
 *  1. キャッシュがあれば即座に描画し、BEEF+ 本来の画面を隠す（体感ロード0ms）
 *  2. DOM の準備ができたらスクレイピングして最新データに差し替え、キャッシュを更新
 *  3. スクレイピングに失敗したら本来の画面に戻す（フォールバック）
 */
export function usePageData<T extends { lastUpdated: string }>({ key, scrape, accept }: UsePageDataOptions<T>) {
  const [cached, setCached] = useStorage<T>({ key, instance: localArea });
  const [fresh, setFresh] = useState<T>();
  const [status, setStatus] = useState<PageStatus>("loading");

  const setCachedRef = useRef(setCached);
  setCachedRef.current = setCached;
  const scrapeRef = useRef(scrape);
  scrapeRef.current = scrape;

  useEffect(() => {
    let cancelled = false;
    scrapeRef
      .current()
      .then(async (data) => {
        if (cancelled) return;
        setFresh(data);
        setStatus("ready");
        try {
          await setCachedRef.current(data);
        } catch (e) {
          console.warn("[my-beef-plus] failed to write cache", e);
        }
      })
      .catch((e) => {
        if (cancelled) return;
        console.error("[my-beef-plus] scraping failed. Falling back to the original page.", e);
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const usableCache = cached && (!accept || accept(cached)) ? cached : undefined;
  const data = status === "error" ? undefined : (fresh ?? usableCache);

  const shouldHideNative = !!data;
  useEffect(() => {
    setNativeHidden(shouldHideNative);
    return () => setNativeHidden(false);
  }, [shouldHideNative]);

  return { data, status, isFromCache: !fresh && !!usableCache };
}

/** ヘッダーのユーザー名・お知らせなど、全ページ共通の情報 */
export function useGlobalChrome(): GlobalChrome | undefined {
  const [chrome, setChrome] = useState<GlobalChrome>();
  useEffect(() => {
    let cancelled = false;
    scrapeGlobalChrome()
      .then((c) => !cancelled && setChrome(c))
      .catch((e) => console.warn("[my-beef-plus] failed to read global chrome", e));
    return () => {
      cancelled = true;
    };
  }, []);
  return chrome;
}

