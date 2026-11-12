/**
 * BEEF+ 本来の（非表示にしている）DOMを操作するブリッジ。
 * 自前UIから「ネイティブの機能」を呼び出したいときに使う。
 */
import { isBlankEditor, norm, readQuillScript, sanitizeHtml, textOf } from "./parsers/dom";
import type { AnnouncementDetail } from "./timetable-data";

/** 時間割の年度・期間セレクトを書き換えて、BEEF+ のフォームを送信する */
export function submitTimetableForm(patch: { year?: string; termCode?: string }): void {
  const form = document.querySelector<HTMLFormElement>("#selectTimetable");
  if (!form) return;
  if (patch.year !== undefined) {
    const select = form.querySelector<HTMLSelectElement>("#nendo");
    if (select) select.value = patch.year;
  }
  if (patch.termCode !== undefined) {
    const select = form.querySelector<HTMLSelectElement>("#kikanCd");
    if (select) select.value = patch.termCode;
  }
  form.submit();
}

/** 「現在」(今週の時間割に戻る) */
export function goToCurrentTimetable(): void {
  document.querySelector<HTMLFormElement>("#todaysTimetable")?.submit();
}

/**
 * お知らせ詳細の DOM（#info_detail_view / #info_detail_view2 / Ajax レスポンス HTML）から
 * タイトル・発信者・掲示日・本文を抽出する。
 *
 * BEEF+ には2種類のお知らせ詳細テンプレートが存在するため両方に対応する:
 *  - 講義トップ用 (`/lms/coursetop/information/listdetail` -> `#info_preview_coursetop` / `#info_detail_view`):
 *    タイトル `#osiraseTitle`, ヘッダー `掲示日` / `発信者` / `内容`, Quill `topInofrmationDetailParts`
 *  - 共通お知らせ用 (`/lms/course/information/listdetail` -> `#info_preview` / `#info_detail_view2`):
 *    タイトル `#info_preview .block-title-txt`, ヘッダー `教職員名` / `内容詳細`, Quill `inofrmationDetailParts`
 */
export function parseAnnouncementDetailFromRoot(
  root: ParentNode,
  doc: Document,
  id: string,
  fallbackTitle: string = "",
  options?: { allowEmptyBody?: boolean; requireMatchingTitle?: boolean },
): AnnouncementDetail | null {
  const osiraseTitle = textOf(root.querySelector("#osiraseTitle"));
  const previewBlockTitle = textOf(root.querySelector("#info_preview .block-title-txt"));
  const explicitTitle =
    osiraseTitle || (previewBlockTitle && previewBlockTitle !== "お知らせ 詳細" ? previewBlockTitle : "");

  // DOM ポーリング時、直前に開いていた別のお知らせの残骸を誤って返さないようタイトル一致を確認する
  if (options?.requireMatchingTitle && fallbackTitle && explicitTitle && norm(explicitTitle) !== norm(fallbackTitle)) {
    return null;
  }

  const title = explicitTitle || fallbackTitle;

  let sender = "";
  let period = "";

  root.querySelectorAll(".contents-detail").forEach((dt) => {
    const header = textOf(dt.querySelector(".contents-header"));
    const inputArea = dt.querySelector(".contents-input-area");
    if (!inputArea) return;

    if ((header === "発信者" || header === "教職員名") && !sender) {
      const val = textOf(inputArea);
      if (val) sender = val;
    } else if (header === "掲示日" && !period) {
      if (inputArea.querySelector(".contents-time-to")) {
        const dates = Array.from(inputArea.querySelectorAll("span"))
          .filter((s) => !s.classList.contains("contents-time-to"))
          .map(textOf)
          .filter(Boolean);
        period = dates.join(" ～ ");
      } else {
        period = textOf(inputArea);
      }
    }
  });

  let bodyHtml = "";

  // パターン1: レンダリング済みの .ql-editor
  const qlEditor = root.querySelector(".ql-editor");
  if (qlEditor && !isBlankEditor(qlEditor)) {
    bodyHtml = sanitizeHtml(qlEditor.innerHTML, doc);
  }

  // パターン2: Quill 初期化前の script 内 Delta JSON (topInofrmationDetailParts / inofrmationDetailParts)
  if (!bodyHtml) {
    const fromScript =
      readQuillScript(root, doc, "topInofrmationDetailParts") ??
      readQuillScript(root, doc, "inofrmationDetailParts") ??
      readQuillScript(root, doc);
    if (fromScript?.html) {
      bodyHtml = fromScript.html;
    }
  }

  // パターン3: #topInofrmationDetailParts / #inofrmationDetailPartsBodyEditor 直下のテキスト
  if (!bodyHtml) {
    const parts = root.querySelector("#topInofrmationDetailParts, #inofrmationDetailPartsBodyEditor");
    if (parts && norm(parts.textContent)) {
      bodyHtml = sanitizeHtml(parts.innerHTML, doc);
    }
  }

  // パターン4: 「内容」または「内容詳細」ヘッダーの .contents-input-area
  if (!bodyHtml) {
    root.querySelectorAll(".contents-detail").forEach((dt) => {
      if (bodyHtml) return;
      const header = textOf(dt.querySelector(".contents-header"));
      if (header === "内容" || header === "内容詳細") {
        const inputArea = dt.querySelector(".contents-input-area");
        if (inputArea && norm(inputArea.textContent)) {
          bodyHtml = sanitizeHtml(inputArea.innerHTML, doc);
        }
      }
    });
  }

  const hasDetailContainer = !!root.querySelector("#info_preview_coursetop, #info_preview");
  if (!bodyHtml || !bodyHtml.trim()) {
    if (options?.allowEmptyBody && hasDetailContainer) {
      bodyHtml = "<p class='text-muted-foreground'>（本文はありません）</p>";
    } else {
      return null;
    }
  }

  return {
    id,
    title: title || fallbackTitle,
    sender,
    period,
    bodyHtml,
  };
}

/** _cid パラメータがページ内に存在する場合は取得する */
function getCidParam(): string {
  const cidEl = document.getElementsByName("_cid")[0] as HTMLInputElement | undefined;
  return cidEl?.defaultValue || cidEl?.value || "";
}

/**
 * 戦略1: 講義トップのお知らせ詳細エンドポイント (`/lms/coursetop/information/listdetail`) を直接 fetch する。
 * SPA 遷移後（`<head>` に `InfoDetailCourseTop` が存在しない場合）や MV3 CSP 環境下でも確実に動作する。
 */
async function fetchCourseTopAnnouncement(
  id: string,
  courseId: string,
  rishunen: string,
  courseForm: HTMLFormElement | undefined,
  fallbackTitle: string,
): Promise<AnnouncementDetail | null> {
  if (!id || !window.location.protocol.startsWith("http")) return null;

  try {
    const params = new URLSearchParams();
    if (courseForm) {
      new FormData(courseForm).forEach((val, key) => {
        if (typeof val === "string") params.set(key, val);
      });
    }
    if (courseId) params.set("idnumber", courseId);
    if (rishunen) params.set("rishunen", rishunen);
    if (!params.has("sort")) params.set("sort", "");
    params.set("informationId", id);
    if (!params.has("externalActivityId")) params.set("externalActivityId", "");

    const cid = getCidParam();
    if (cid) params.set("_cid", cid);

    const res = await fetch(`/lms/coursetop/information/listdetail?${params.toString()}`, {
      method: "GET",
      credentials: "same-origin",
      headers: {
        Accept: "text/html, */*; q=0.01",
        "X-Requested-With": "XMLHttpRequest",
      },
      cache: "no-store",
    });
    if (!res.ok) return null;

    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, "text/html");
    return parseAnnouncementDetailFromRoot(doc, document, id, fallbackTitle, { allowEmptyBody: true });
  } catch {
    return null;
  }
}

/**
 * 戦略2: 共通お知らせ詳細エンドポイント (`/lms/course/information/listdetail`) を POST で直接 fetch する。
 */
async function fetchCourseListAnnouncement(
  id: string,
  courseId: string,
  fallbackTitle: string,
): Promise<AnnouncementDetail | null> {
  if (!id || !window.location.protocol.startsWith("http")) return null;

  try {
    const infoForm = document.querySelector<HTMLFormElement>("#informationDtl");
    const csrf =
      infoForm?.querySelector<HTMLInputElement>('input[name="_csrf"]')?.value ||
      document.querySelector<HTMLInputElement>('input[name="_csrf"]')?.value ||
      "";
    if (!infoForm && !csrf) return null;

    const bodyParams = new URLSearchParams();
    if (infoForm) {
      new FormData(infoForm).forEach((val, key) => {
        if (typeof val === "string") bodyParams.set(key, val);
      });
    } else {
      bodyParams.set("_csrf", csrf);
      bodyParams.set("viewPage", "1");
      bodyParams.set("viewkind", "9");
    }
    bodyParams.set("informationId", id);

    const urlParams = new URLSearchParams();
    if (courseId) urlParams.set("idnumber", courseId);
    const cid = getCidParam();
    if (cid) urlParams.set("_cid", cid);
    const query = urlParams.toString();
    const url = `/lms/course/information/listdetail${query ? `?${query}` : ""}`;

    const res = await fetch(url, {
      method: "POST",
      credentials: "same-origin",
      headers: {
        Accept: "text/html, */*; q=0.01",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "X-Requested-With": "XMLHttpRequest",
      },
      body: bodyParams.toString(),
      cache: "no-store",
    });
    if (!res.ok) return null;

    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, "text/html");
    return parseAnnouncementDetailFromRoot(doc, document, id, fallbackTitle, { allowEmptyBody: true });
  } catch {
    return null;
  }
}

/**
 * 講義トップのお知らせ詳細を取得する。
 *  1. `/lms/coursetop/information/listdetail` への直接 GET fetch（最速・ダイアログ非依存）
 *  2. `/lms/course/information/listdetail` への直接 POST fetch（フォールバック）
 *  3. ネイティブDOMリンクのクリックおよび `#info_detail_view` / `#info_detail_view2` の監視
 */
export async function loadAnnouncementDetail(
  id: string,
  fallbackTitle: string = "",
  courseId?: string,
): Promise<AnnouncementDetail | null> {
  const courseForm =
    document.querySelector<HTMLFormElement>("#contentsWrapper #courseTopForm") ??
    Array.from(document.querySelectorAll<HTMLFormElement>("form#courseTopForm")).find((f) =>
      f.querySelector('input[name="idnumber"]'),
    );

  const resolvedCourseId =
    courseId ||
    new URLSearchParams(window.location.search).get("idnumber") ||
    courseForm?.querySelector<HTMLInputElement>('input[name="idnumber"]')?.value ||
    document.querySelector<HTMLInputElement>('input[name="idnumber"]')?.value ||
    "";

  const rishunen =
    courseForm?.querySelector<HTMLInputElement>('input[name="rishunen"]')?.value ||
    document.querySelector<HTMLInputElement>('input[name="rishunen"]')?.value ||
    resolvedCourseId.match(/^(\d{4})/)?.[1] ||
    "";

  // 1. 直接 GET fetch (/lms/coursetop/information/listdetail)
  const fromCourseTop = await fetchCourseTopAnnouncement(id, resolvedCourseId, rishunen, courseForm, fallbackTitle);
  if (fromCourseTop) return fromCourseTop;

  // 2. 直接 POST fetch (/lms/course/information/listdetail)
  const fromCourseList = await fetchCourseListAnnouncement(id, resolvedCourseId, fallbackTitle);
  if (fromCourseList) return fromCourseList;

  // 3. フォールバック: ネイティブDOMの既存ダイアログ確認 & リンククリック
  const getDialogViews = (): HTMLElement[] =>
    Array.from(document.querySelectorAll<HTMLElement>("#info_detail_view, #info_detail_view2, .ui-dialog-content"));

  // 既に同一お知らせがDOM内に展開されている場合（ローカルHTML検証時など）
  for (const view of getDialogViews()) {
    const parsed = parseAnnouncementDetailFromRoot(view, document, id, fallbackTitle);
    if (parsed) {
      const domTitle =
        textOf(view.querySelector("#osiraseTitle")) ||
        textOf(view.querySelector("#info_preview .block-title-txt"));
      const domInfoId =
        document.querySelector<HTMLInputElement>("#informationDtl #informationId")?.value ||
        courseForm?.querySelector<HTMLInputElement>("#informationId")?.value ||
        "";
      if ((fallbackTitle && domTitle === fallbackTitle) || (id && domInfoId === id)) {
        return parsed;
      }
    }
  }

  // 別のお知らせの古いDOMキャッシュが残らないようクリアしてからクリック発火
  getDialogViews().forEach((v) => {
    v.innerHTML = "";
  });

  // 講義トップ内のリンク (#courseViewInformation) を最優先で探し、無ければヘッダー通知メニュー等を探す
  const courseLinks = Array.from(
    document.querySelectorAll<HTMLElement>("#courseViewInformation a.infoTitle, #courseViewInformation a"),
  );
  const globalLinks = Array.from(
    document.querySelectorAll<HTMLElement>("a.infoTitle, a[onclick*='InfoDetail']"),
  );

  const matchLink = (a: HTMLElement): boolean => {
    const onclick = a.getAttribute("onclick") ?? "";
    const data1 = a.getAttribute("data1") ?? "";
    const cleanOnclick = onclick.replace(/\s/g, "");
    return (
      (!!id &&
        (cleanOnclick.includes(`(${id})`) ||
          cleanOnclick.includes(`,${id})`) ||
          cleanOnclick.includes(`,${id},`) ||
          cleanOnclick.includes(`'${id}'`) ||
          cleanOnclick.includes(`"${id}"`) ||
          data1 === id)) ||
      (!!fallbackTitle && a.textContent?.trim() === fallbackTitle)
    );
  };

  const link = courseLinks.find(matchLink) ?? globalLinks.find(matchLink);
  if (link) {
    try {
      link.click();
    } catch {
      // 無視
    }
  }

  // ネイティブのダイアログが自前UIの背後でチラつかないよう非表示
  const hideNativeDialog = () => {
    document.querySelectorAll<HTMLElement>(".ui-dialog, .ui-widget-overlay").forEach((el) => {
      el.style.setProperty("opacity", "0", "important");
      el.style.setProperty("pointer-events", "none", "important");
      el.style.setProperty("z-index", "-9999", "important");
    });
  };

  try {
    // ダイアログ内に情報が読み込まれるのを待つ (最大5秒: 100ms * 50)
    for (let i = 0; i < 50; i++) {
      hideNativeDialog();

      for (const view of getDialogViews()) {
        const parsed = parseAnnouncementDetailFromRoot(view, document, id, fallbackTitle, {
          requireMatchingTitle: true,
        });
        if (parsed) {
          return parsed;
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  } catch (e) {
    console.error("[my-beef-plus] failed to load announcement detail:", e);
  } finally {
    hideNativeDialog();
  }

  return null;
}

