/**
 * BEEF+ 本来の（非表示にしている）DOMを操作するブリッジ。
 * 自前UIから「ネイティブの機能」を呼び出したいときに使う。
 */
import { sanitizeHtml } from "./parsers/dom";
import type { AnnouncementDetail } from "./timetable-data";
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
 * ネイティブのリンク (onclick = InfoDetailCourseTop) をクリックしてBEEF+に詳細ダイアログを読み込ませ、
 * DOM からタイトル・発信者・掲示日・本文(Quill HTML)を構造化して抽出する。
 */
export async function loadAnnouncementDetail(id: string, fallbackTitle: string = ""): Promise<AnnouncementDetail | null> {
  // 1. 対象のお知らせリンクを探す
  const links = Array.from(document.querySelectorAll<HTMLElement>("a.infoTitle, #courseViewInformation a, a[onclick*='InfoDetail']"));
  const link = links.find((a) => {
    const onclick = a.getAttribute("onclick") ?? "";
    const data1 = a.getAttribute("data1") ?? "";
    const cleanOnclick = onclick.replace(/\s/g, "");
    return (
      cleanOnclick.includes(`(${id})`) ||
      cleanOnclick.includes(`,${id})`) ||
      cleanOnclick.includes(`,${id},`) ||
      cleanOnclick.includes(`'${id}'`) ||
      cleanOnclick.includes(`"${id}"`) ||
      data1 === id ||
      (fallbackTitle && a.textContent?.trim() === fallbackTitle)
    );
  });

  if (!link) {
    console.warn("[my-beef-plus] announcement link not found for id:", id);
    return null;
  }

  // 2. クリックしてBEEF+本来のダイアログ読み込みを発火
  link.click();
  link.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));

  // 3. ネイティブのダイアログが画面に被らないよう非表示にする処理
  const hideNativeDialog = () => {
    const dialogs = document.querySelectorAll<HTMLElement>(".ui-dialog");
    dialogs.forEach((d) => d.style.setProperty("display", "none", "important"));
    const overlays = document.querySelectorAll<HTMLElement>(".ui-widget-overlay");
    overlays.forEach((o) => o.style.setProperty("display", "none", "important"));
  };

  try {
    // 4. ダイアログ内に本文が読み込まれるのを待つ (最大5秒: 100ms * 50)
    for (let i = 0; i < 50; i++) {
      hideNativeDialog();

      const view = document.querySelector("#info_detail_view");
      if (view) {
        const title = view.querySelector("#osiraseTitle")?.textContent?.trim() || fallbackTitle;
        let sender = "";
        let period = "";

        view.querySelectorAll(".contents-detail").forEach((dt) => {
          const header = dt.querySelector(".contents-header")?.textContent?.trim();
          const val = dt.querySelector(".contents-input-area")?.textContent?.replace(/\s+/g, " ")?.trim();
          if (header === "発信者" && val) sender = val;
          if (header === "掲示日" && val) period = val;
        });

        // 本文の取得（QuillエディタのDOMから）
        const qlEditor = view.querySelector(".ql-editor, #topInofrmationDetailParts");
        let bodyHtml = "";

        if (qlEditor && qlEditor.textContent && qlEditor.textContent.trim().length > 0) {
          const editorInner = qlEditor.classList.contains("ql-editor") ? qlEditor : qlEditor.querySelector(".ql-editor");
          if (editorInner && editorInner.textContent?.trim()) {
            bodyHtml = sanitizeHtml(editorInner.innerHTML, document);
          } else if (qlEditor.textContent.trim()) {
            bodyHtml = sanitizeHtml(qlEditor.innerHTML, document);
          }
        }

        // DOMにまだ反映されていない場合、script内のJSONから抽出を試みる
        if (!bodyHtml) {
          const scripts = view.querySelectorAll("script");
          for (const s of Array.from(scripts)) {
            const text = s.textContent || "";
            const jsonIdx = text.indexOf("setJsonData(");
            if (jsonIdx !== -1) {
              const start = text.indexOf('"', jsonIdx);
              const end = text.lastIndexOf('")');
              if (start !== -1 && end > start) {
                const rawJson = text.slice(start, end + 1);
                try {
                  const unescaped = JSON.parse(rawJson);
                  const delta = typeof unescaped === "string" ? JSON.parse(unescaped) : unescaped;
                  if (Array.isArray(delta?.ops)) {
                    const extractedText = delta.ops.map((op: { insert?: string }) => op.insert || "").join("");
                    bodyHtml = extractedText
                      .split("\n")
                      .map((line: string) => `<p>${line || "<br>"}</p>`)
                      .join("");
                    break;
                  }
                } catch {
                  // パース失敗時はスキップ
                }
              }
            }
          }
        }

        // 本文が取得できた場合、即座に返却！
        if (bodyHtml && bodyHtml.trim()) {
          return {
            id,
            title,
            sender,
            period,
            bodyHtml,
          };
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // タイムアウトしてもタイトル等が存在すれば返却
    const finalView = document.querySelector("#info_detail_view");
    if (finalView) {
      const title = finalView.querySelector("#osiraseTitle")?.textContent?.trim() || fallbackTitle;
      if (title) {
        return {
          id,
          title,
          sender: "",
          period: "",
          bodyHtml: "<p class='text-muted-foreground'>本文の読み込みがタイムアウトしました。標準画面から確認してください。</p>",
        };
      }
    }
  } catch (e) {
    console.error("[my-beef-plus] failed to load announcement detail:", e);
  } finally {
    hideNativeDialog();
  }

  return null;
}
