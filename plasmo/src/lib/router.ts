import { parseCourseDetail, parseGlobalChrome, parseTasks, parseTimetable } from "./parsers";
import { getSyncCache, setSyncCache } from "./storage-cache";
import type { CourseDetail, TaskStore, TimetableStore } from "./timetable-data";
import { setNativeHidden } from "./utils";

export type RouteType = "timetable" | "course" | "task" | "native";

export interface CustomRoute {
  type: "timetable" | "course" | "task";
  url: string;
  pathname: string;
  search: string;
  courseId?: string;
}

export interface NativeRoute {
  type: "native";
  url: string;
}

export type AppRoute = CustomRoute | NativeRoute;

type RouteListener = (route: AppRoute) => void;
type DataListener = (key: string, data: any) => void;

const routeListeners: Set<RouteListener> = new Set();
const dataListeners: Set<DataListener> = new Set();

export function onRouteChanged(listener: RouteListener): () => void {
  routeListeners.add(listener);
  return () => routeListeners.delete(listener);
}

export function onDataUpdated(listener: DataListener): () => void {
  dataListeners.add(listener);
  return () => dataListeners.delete(listener);
}

export function notifyDataUpdated(key: string, data: any): void {
  dataListeners.forEach((fn) => fn(key, data));
}

/**
 * URL 文字列または URL オブジェクトを解析し、独自UI対象のルートかネイティブかを判定する
 */
export function parseRoute(rawUrl: string | URL = window.location.href): AppRoute {
  try {
    const u = typeof rawUrl === "string" ? new URL(rawUrl, window.location.origin) : rawUrl;
    
    // 同一オリジンでない場合はネイティブ扱い
    if (u.origin !== window.location.origin) {
      return { type: "native", url: u.href };
    }

    const path = u.pathname;

    // 1. 時間割 (/lms/timetable*)
    if (path.startsWith("/lms/timetable")) {
      return {
        type: "timetable",
        url: u.href,
        pathname: path,
        search: u.search,
      };
    }

    // 2. 講義トップ (/lms/course?idnumber=... 等。ただし /lms/course/report/... 等の子パスはネイティブ)
    if (path === "/lms/course" || path === "/lms/course/") {
      const courseId = u.searchParams.get("idnumber");
      if (courseId) {
        return {
          type: "course",
          url: u.href,
          pathname: path,
          search: u.search,
          courseId,
        };
      }
    }

    // 3. 課題一覧 (/lms/task*)
    if (path.startsWith("/lms/task")) {
      return {
        type: "task",
        url: u.href,
        pathname: path,
        search: u.search,
      };
    }

    // 4. それ以外（提出フォーム、テスト解答、設定など）はすべてネイティブ扱い
    return { type: "native", url: u.href };
  } catch {
    return { type: "native", url: String(rawUrl) };
  }
}

/**
 * 指定のルートに対応するキャッシュキーを取得する
 */
export function getRouteCacheKey(route: CustomRoute): string {
  switch (route.type) {
    case "timetable":
      return "timetableStore";
    case "course":
      return `course_${route.courseId}`;
    case "task":
      return "taskStore";
  }
}

let isRevalidating = false;
let revalidateController: AbortController | null = null;
let spaNavigated = false;

export function hasSpaNavigated(): boolean {
  return spaNavigated;
}

/**
 * バックグラウンドで対象ページの最新HTMLをfetchし、スクレイピングしてキャッシュ＆UIを更新。
 * さらに裏のネイティブDOM（#contentsWrapper）も最新ページのDOMに差し替えてダウンロード等の動作を担保する。
 */
export async function revalidatePage(targetUrl: string, route: CustomRoute): Promise<void> {
  if (revalidateController) {
    revalidateController.abort();
  }
  revalidateController = new AbortController();
  const signal = revalidateController.signal;

  try {
    isRevalidating = true;
    const res = await fetch(targetUrl, {
      credentials: "same-origin",
      signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const html = await res.text();
    if (signal.aborted) return;

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    // 1. ネイティブDOMの同期（#contentsWrapper を差し替えて隠しフォームや要素を最新にする）
    const newContents = doc.querySelector("#contentsWrapper");
    const currentContents = document.querySelector("#contentsWrapper");
    if (newContents && currentContents) {
      currentContents.innerHTML = newContents.innerHTML;
    }

    // #contentsWrapper 外にある #informationDtl の CSRF トークン等も最新ページから同期
    const newInfoForm = doc.querySelector<HTMLFormElement>("#informationDtl");
    const currentInfoForm = document.querySelector<HTMLFormElement>("#informationDtl");
    if (newInfoForm && currentInfoForm) {
      currentInfoForm.innerHTML = newInfoForm.innerHTML;
    }

    // 2. データの解析とキャッシュ更新
    const key = getRouteCacheKey(route);
    if (route.type === "timetable") {
      const data = parseTimetable(doc);
      setSyncCache(key, data);
      notifyDataUpdated(key, data);
    } else if (route.type === "course" && route.courseId) {
      const data = parseCourseDetail(doc, route.courseId);
      setSyncCache(key, data);
      notifyDataUpdated(key, data);
    } else if (route.type === "task") {
      const data = parseTasks(doc);
      setSyncCache(key, data);
      notifyDataUpdated(key, data);
    }

    const chrome = parseGlobalChrome(doc);
    if (chrome.userName || chrome.infos.length > 0 || chrome.updates.length > 0) {
      setSyncCache("globalChrome", chrome);
      notifyDataUpdated("globalChrome", chrome);
    }
  } catch (err: any) {
    if (err?.name !== "AbortError") {
      console.warn("[my-beef-plus] revalidate failed for:", targetUrl, err);
    }
  } finally {
    isRevalidating = false;
  }
}

/**
 * SPAナビゲーションを実行する
 * @param url 遷移先URL
 * @param replace history.replaceState を使用するか
 */
export function navigateTo(url: string, replace = false): void {
  const nextRoute = parseRoute(url);

  // ネイティブ画面（提出・テスト等）への遷移は通常のブラウザフルリロードを実行
  if (nextRoute.type === "native") {
    window.location.href = url;
    return;
  }

  // 独自UI画面への遷移:
  spaNavigated = true;

  // 1. URL を即座に更新
  if (replace) {
    window.history.replaceState(null, "", url);
  } else {
    window.history.pushState(null, "", url);
  }

  // 2. ルートリスナーに通知して即座にコンポーネントを切り替え
  routeListeners.forEach((fn) => fn(nextRoute));

  // 3. ネイティブDOMを画面外に退避
  setNativeHidden(true);

  // 4. 裏で最新データを fetch して SWR 更新
  revalidatePage(url, nextRoute);
}

let isInterceptorInitialized = false;

/**
 * ドキュメント全体のリンククリックを監視し、独自UI画面へのリンクを自動でインターセプトしてSPA遷移する
 */
export function setupGlobalLinkInterceptor(): () => void {
  if (typeof window === "undefined" || isInterceptorInitialized) {
    return () => {};
  }
  isInterceptorInitialized = true;

  const handleClick = (e: MouseEvent) => {
    // 修飾キーが押されている場合は通常のブラウザ動作（別タブで開く等）に任せる
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
      return;
    }

    const target = e.target as Element | null;
    if (!target) return;

    const anchor = target.closest<HTMLAnchorElement>("a[href]");
    if (!anchor) return;

    // target="_blank" のリンクは対象外
    if (anchor.target && anchor.target !== "_self") {
      return;
    }

    const href = anchor.href;
    if (!href || href.startsWith("javascript:") || href.startsWith("#")) {
      return;
    }

    const route = parseRoute(href);
    // 独自UI対象画面（時間割、講義トップ、課題一覧）であればインターセプトして即座遷移！
    if (route.type !== "native") {
      e.preventDefault();
      e.stopPropagation();
      navigateTo(href);
    }
  };

  const handlePopState = () => {
    const currentRoute = parseRoute(window.location.href);
    if (currentRoute.type !== "native") {
      spaNavigated = true;
      setNativeHidden(true);
      routeListeners.forEach((fn) => fn(currentRoute));
      revalidatePage(window.location.href, currentRoute);
    } else {
      setNativeHidden(false);
      window.location.reload();
    }
  };

  document.addEventListener("click", handleClick, true);
  window.addEventListener("popstate", handlePopState);

  return () => {
    document.removeEventListener("click", handleClick, true);
    window.removeEventListener("popstate", handlePopState);
    isInterceptorInitialized = false;
  };
}
