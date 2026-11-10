/**
 * BEEF+ 本来の（非表示にしている）DOMを操作するブリッジ。
 * 自前UIから「ネイティブの機能」を呼び出したいときに使う。
 */
import { parseQuillScriptText, sanitizeHtml } from "./parsers/dom";
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

/** メインワールドのコンテキストでインラインスクリプトを実行する */
function runInMainWorld(code: string): void {
  const script = document.createElement("script");
  script.textContent = code;
  (document.head || document.documentElement).appendChild(script);
  script.remove();
}

/** Quill の setJsonData 引数から Delta JSON 文字列を安全に抽出して HTML に変換する */
function extractBodyFromScript(scriptText: string): string | null {
  return parseQuillScriptText(scriptText, document)?.html ?? null;
}

/**
 * 講義トップのお知らせ詳細を取得する。
 * メインワールドで InfoDetailCourseTop を直接呼び出して BEEF+ に詳細ダイアログを読み込ませ、
 * DOM またはスクリプトからタイトル・発信者・掲示日・本文を抽出する。
 */
export async function loadAnnouncementDetail(id: string, fallbackTitle: string = ""): Promise<AnnouncementDetail | null> {
  // 1. メインワールドで InfoDetailCourseTop を直接発火
  runInMainWorld(`
    (function() {
      try {
        var fakeEvent = {
          preventDefault: function() {},
          stopPropagation: function() {},
          target: document.body
        };
        if (typeof InfoDetailCourseTop === 'function') {
          InfoDetailCourseTop(fakeEvent, ${JSON.stringify(id)});
        } else if (typeof InfoDetail === 'function') {
          InfoDetail(fakeEvent, ${JSON.stringify(id)}, "");
        }
      } catch (err) {
        console.warn("[my-beef-plus] main-world InfoDetailCourseTop error:", err);
      }
    })();
  `);

  // 2. DOM のリンクも念のためクリック発火
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

  if (link) {
    try {
      link.click();
      link.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
    } catch {
      // 無視
    }
  }

  // 3. ネイティブのダイアログが自前UIの背後でチラつかないよう非表示（ただしスクリプト実行を壊さないよう透明化）
  const hideNativeDialog = () => {
    document.querySelectorAll<HTMLElement>(".ui-dialog, .ui-widget-overlay").forEach((el) => {
      el.style.setProperty("opacity", "0", "important");
      el.style.setProperty("pointer-events", "none", "important");
      el.style.setProperty("z-index", "-9999", "important");
    });
  };

  try {
    // 4. ダイアログ内に情報が読み込まれるのを待つ (最大5秒: 100ms * 50)
    for (let i = 0; i < 50; i++) {
      hideNativeDialog();

      const view = document.querySelector("#info_detail_view, .ui-dialog-content");
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

        let bodyHtml = "";

        // パターン1: レンダリング済みの .ql-editor
        const qlEditor = view.querySelector(".ql-editor");
        if (qlEditor && qlEditor.textContent && qlEditor.textContent.trim().length > 0) {
          bodyHtml = sanitizeHtml(qlEditor.innerHTML, document);
        }

        // パターン2: Quill 初期化前の script 内 Delta JSON
        if (!bodyHtml) {
          const scripts = view.querySelectorAll("script");
          for (const s of Array.from(scripts)) {
            const extracted = extractBodyFromScript(s.textContent || "");
            if (extracted) {
              bodyHtml = extracted;
              break;
            }
          }
        }

        // パターン3: #topInofrmationDetailParts 直下のテキスト
        if (!bodyHtml) {
          const parts = view.querySelector("#topInofrmationDetailParts");
          if (parts && parts.textContent && parts.textContent.trim().length > 0) {
            bodyHtml = sanitizeHtml(parts.innerHTML, document);
          }
        }

        // パターン4: 「内容」ヘッダーの .contents-input-area
        if (!bodyHtml) {
          view.querySelectorAll(".contents-detail").forEach((dt) => {
            const header = dt.querySelector(".contents-header")?.textContent?.trim();
            if (header === "内容") {
              const inputArea = dt.querySelector(".contents-input-area");
              if (inputArea && inputArea.textContent && inputArea.textContent.trim().length > 0) {
                bodyHtml = sanitizeHtml(inputArea.innerHTML, document);
              }
            }
          });
        }

        // 本文が取得できた場合は即座に返却
        if (bodyHtml && bodyHtml.trim()) {
          return {
            id,
            title: title || fallbackTitle,
            sender,
            period,
            bodyHtml,
          };
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // タイムアウト時のフォールバック
    const finalView = document.querySelector("#info_detail_view, .ui-dialog-content");
    if (finalView) {
      const title = finalView.querySelector("#osiraseTitle")?.textContent?.trim() || fallbackTitle;
      let sender = "";
      let period = "";
      finalView.querySelectorAll(".contents-detail").forEach((dt) => {
        const header = dt.querySelector(".contents-header")?.textContent?.trim();
        const val = dt.querySelector(".contents-input-area")?.textContent?.replace(/\s+/g, " ")?.trim();
        if (header === "発信者" && val) sender = val;
        if (header === "掲示日" && val) period = val;
      });

      // script 内の Delta JSON を再度走査
      let bodyHtml = "";
      finalView.querySelectorAll("script").forEach((s) => {
        const extracted = extractBodyFromScript(s.textContent || "");
        if (extracted && !bodyHtml) bodyHtml = extracted;
      });

      if (bodyHtml) {
        return {
          id,
          title: title || fallbackTitle,
          sender,
          period,
          bodyHtml,
        };
      }

      if (title) {
        return {
          id,
          title,
          sender,
          period,
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
