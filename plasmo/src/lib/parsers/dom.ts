/**
 * パーサー共通のDOMユーティリティ。
 * すべて副作用のない関数で、ブラウザ(content script)でも jsdom でも動くようにしている。
 */
import type { DateRange } from "../timetable-data";

/** 連続する空白(全角含む)を1つにして前後を削る */
export function norm(s: string | null | undefined): string {
  return (s ?? "").replace(/[\s\u3000]+/g, " ").trim();
}

export function textOf(el: Element | null | undefined): string {
  return norm(el?.textContent);
}

/** 全角数字を半角にする ("２" -> "2") */
export function toHalfWidthDigits(s: string): string {
  return s.replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0));
}

/** "A ～ B" 形式の期間文字列を分割する */
export function splitPeriod(s: string | null | undefined): DateRange {
  const parts = norm(s).split(/\s*[～〜~]\s*/);
  return { start: parts[0] ?? "", end: parts[1] ?? "" };
}

/** クエリ文字列から値を取り出す (相対URL可) */
export function queryParam(url: string, name: string): string {
  try {
    return new URL(url, "https://beefplus.center.kobe-u.ac.jp").searchParams.get(name) ?? "";
  } catch {
    return "";
  }
}

/** javascript: 等の実行可能リンクではない、通常のリンクだけを返す */
export function safeHref(a: Element | null | undefined): string {
  const href = a?.getAttribute("href") ?? "";
  if (!href || /^\s*(javascript|data|vbscript):/i.test(href) || href === "#") return "";
  return href;
}

/** メニュー内リンクなどを ActionLink 配列にする */
export function collectActions(scope: Element): { label: string; url: string }[] {
  return Array.from(scope.querySelectorAll(".control-menu a[href]"))
    .map((a) => ({ label: textOf(a), url: safeHref(a) }))
    .filter((a) => a.label && a.url);
}

const FORBIDDEN_TAGS =
  "script,style,iframe,object,embed,link,meta,base,form,input,button,textarea,select";

/**
 * Quill 等でレンダリングされたリッチテキストHTMLを、表示用に無害化する。
 * - 実行可能な要素 / on* 属性 / javascript: URL / style 属性を除去
 * - リンクは別タブで開く
 */
export function sanitizeHtml(html: string, doc: Document): string {
  const tpl = doc.createElement("template");
  tpl.innerHTML = html;
  const frag = tpl.content;

  frag.querySelectorAll(FORBIDDEN_TAGS).forEach((el) => el.remove());
  frag.querySelectorAll("*").forEach((el) => {
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase();
      if (name.startsWith("on") || name === "style" || name === "contenteditable") {
        el.removeAttribute(attr.name);
      } else if (
        (name === "href" || name === "src" || name === "xlink:href") &&
        /^\s*(javascript|data|vbscript):/i.test(attr.value)
      ) {
        el.removeAttribute(attr.name);
      }
    }
    if (el.tagName === "A") {
      el.setAttribute("target", "_blank");
      el.setAttribute("rel", "noopener noreferrer");
    }
  });

  return tpl.innerHTML.trim();
}

/** Quillのエディタ要素が「空」かどうか */
export function isBlankEditor(editor: Element | null | undefined): boolean {
  if (!editor) return true;
  if (editor.classList.contains("ql-blank")) return true;
  return !norm(editor.textContent) && !editor.querySelector("img,video,a");
}

/**
 * Quillエディタから中身を取り出す。
 * 空なら null を返す。
 */
export function readEditor(
  container: Element | null | undefined,
  doc: Document,
): { text: string; html: string } | null {
  const editor = container?.querySelector(".ql-editor");
  if (!editor || isBlankEditor(editor)) return null;
  return { text: norm(editor.textContent), html: sanitizeHtml(editor.innerHTML, doc) };
}

/**
 * "2026/11/05 12:00" / "2026/11/05 12:00:00" をミリ秒に変換する。
 * 解釈できない場合は null。9999年等の「無期限」も数値としては返る。
 */
export function parseBeefDate(s: string | null | undefined): number | null {
  const m = norm(s).match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (!m) return null;
  const [, y, mo, d, h = "0", mi = "0", sec = "0"] = m;
  return new Date(+y, +mo - 1, +d, +h, +mi, +sec).getTime();
}

/** 9999年のような「無期限」の日付か */
export function isUnlimited(s: string | null | undefined): boolean {
  return /^9999\//.test(norm(s));
}

