/**
 * BEEF+ 本来の（非表示にしている）DOMを操作するブリッジ。
 * 自前UIから「ネイティブの機能」を呼び出したいときに使う。
 */
import { sanitizeHtml } from "./parsers/dom";
import { waitForSelector } from "./utils";

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
 * 講義トップのお知らせ詳細を取得する。
 * ネイティブのリンク (onclick = InfoDetailCourseTop) をクリックしてBEEF+に詳細を読み込ませ、
 * #info_detail_view に描画された内容を読み取る。
 * 取得できなかった場合は null (呼び出し側でフォールバックする)。
 */
export async function loadAnnouncementDetail(id: string): Promise<string | null> {
  const link = Array.from(document.querySelectorAll<HTMLElement>("#courseViewInformation a.infoTitle")).find((a) =>
    (a.getAttribute("onclick") ?? "").replace(/\s/g, "").includes(`,${id})`),
  );
  if (!link) return null;

  const view = document.querySelector("#info_detail_view");
  const before = view?.innerHTML ?? "";
  link.click();

  try {
    const target = (await waitForSelector("#info_detail_view", { timeout: 1000 })) as Element;
    // 内容が入るまで少し待つ
    for (let i = 0; i < 30; i++) {
      const html = target.innerHTML;
      if (html.trim() && html !== before) return sanitizeHtml(html, document);
      await new Promise((r) => setTimeout(r, 100));
    }
  } catch {
    // タイムアウト
  }
  return null;
}

