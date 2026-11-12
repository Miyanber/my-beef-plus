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

interface QuillOpAttributes {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  code?: boolean;
  script?: "sub" | "super";
  link?: string;
  header?: number;
  list?: "ordered" | "bullet";
  blockquote?: boolean;
  "code-block"?: boolean;
  [key: string]: unknown;
}

interface QuillOp {
  insert?: string | { formula?: string; image?: string };
  attributes?: QuillOpAttributes;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatInlineOp(html: string, attrs?: QuillOpAttributes): string {
  if (!attrs || !html) return html;
  let out = html;
  if (attrs.code) out = `<code>${out}</code>`;
  if (attrs.script === "sub") out = `<sub>${out}</sub>`;
  else if (attrs.script === "super") out = `<sup>${out}</sup>`;
  if (attrs.strike) out = `<s>${out}</s>`;
  if (attrs.underline) out = `<u>${out}</u>`;
  if (attrs.italic) out = `<em>${out}</em>`;
  if (attrs.bold) out = `<strong>${out}</strong>`;
  if (typeof attrs.link === "string" && attrs.link && !/^\s*(javascript|data|vbscript):/i.test(attrs.link)) {
    // BEEF+ の埋め込みリンク（数字のみ）は平文のままにする
    if (!/^\d+$/.test(attrs.link)) {
      out = `<a href="${escapeHtml(attrs.link)}" target="_blank" rel="noopener noreferrer">${out}</a>`;
    }
  }
  return out;
}

/**
 * Quill Delta ({ ops: [...] }) を HTML とプレーンテキストに変換する。
 * DOMParser (SPA遷移時) や Quill の初期化完了前でも、`<script>` 内の `setJsonData` から
 * コース概要・授業情報・教材コメント等を確実に復元できるようにする。
 */
export function parseQuillDeltaToHtml(
  delta: unknown,
  doc: Document,
): { text: string; html: string } | null {
  const ops = (delta as { ops?: QuillOp[] } | null | undefined)?.ops;
  if (!Array.isArray(ops) || ops.length === 0) return null;

  interface LineEntry {
    html: string;
    text: string;
    attrs?: QuillOpAttributes;
  }

  const lines: LineEntry[] = [];
  let currentHtml = "";
  let currentText = "";
  let hasMedia = false;

  for (const op of ops) {
    if (!op || op.insert == null) continue;

    if (typeof op.insert === "string") {
      const segments = op.insert.split("\n");
      for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        if (seg.length > 0) {
          currentHtml += formatInlineOp(escapeHtml(seg), op.attributes);
          currentText += seg;
        }
        if (i < segments.length - 1) {
          lines.push({ html: currentHtml, text: currentText, attrs: op.attributes });
          currentHtml = "";
          currentText = "";
        }
      }
    } else if (typeof op.insert === "object") {
      if (typeof op.insert.formula === "string" && op.insert.formula) {
        currentHtml += formatInlineOp(`<code>${escapeHtml(op.insert.formula)}</code>`, op.attributes);
        currentText += op.insert.formula;
      } else if (
        typeof op.insert.image === "string" &&
        op.insert.image &&
        !/^\s*(javascript|vbscript):/i.test(op.insert.image)
      ) {
        currentHtml += `<img src="${escapeHtml(op.insert.image)}">`;
        hasMedia = true;
      }
    }
  }

  if (currentHtml.length > 0 || currentText.length > 0) {
    lines.push({ html: currentHtml, text: currentText });
  }

  // Quill Delta 末尾の空改行を除去
  while (
    lines.length > 0 &&
    !norm(lines[lines.length - 1].text) &&
    !lines[lines.length - 1].html.includes("<img")
  ) {
    lines.pop();
  }

  const fullText = norm(lines.map((l) => l.text).join(" "));
  if (!fullText && !hasMedia) return null;

  const out: string[] = [];
  let openList: "ul" | "ol" | null = null;

  for (const line of lines) {
    const listType =
      line.attrs?.list === "ordered" ? "ol" : line.attrs?.list === "bullet" ? "ul" : null;
    if (listType !== openList) {
      if (openList) out.push(`</${openList}>`);
      if (listType) out.push(`<${listType}>`);
      openList = listType;
    }

    const inner = line.html || "<br>";
    if (listType) {
      out.push(`<li>${inner}</li>`);
    } else if (
      typeof line.attrs?.header === "number" &&
      line.attrs.header >= 1 &&
      line.attrs.header <= 6
    ) {
      const h = line.attrs.header;
      out.push(`<h${h}>${inner}</h${h}>`);
    } else if (line.attrs?.blockquote) {
      out.push(`<blockquote>${inner}</blockquote>`);
    } else if (line.attrs?.["code-block"]) {
      out.push(`<pre><code>${line.html}</code></pre>`);
    } else {
      out.push(`<p>${inner}</p>`);
    }
  }

  if (openList) {
    out.push(`</${openList}>`);
  }

  const sanitized = sanitizeHtml(out.join(""), doc);
  if (!sanitized) return null;
  return { text: fullText, html: sanitized };
}

/**
 * JavaScript の文字列リテラルの中身を JSON 文字列値として安全にデコードする。
 * Thymeleaf の JS エスケープが出力する `\'` や `\xXX` 等、素の `JSON.parse` でエラーになる
 * エスケープシーケンスも正しく解釈する。
 */
function decodeJsStringLiteral(raw: string, quote: '"' | "'"): string | null {
  try {
    if (quote === '"') {
      return JSON.parse(`"${raw}"`) as string;
    }
  } catch {
    // JS 固有エスケープが含まれる場合は以下の正規化へ進む
  }

  try {
    const normalized = raw.replace(
      /\\(\\|"|'|\/|b|f|n|r|t|v|0(?![0-9])|x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4}|u\{[0-9a-fA-F]+\}|\r?\n|.)|"/g,
      (m, esc?: string) => {
        if (m === '"' || esc === '"') return '\\"';
        if (!esc) return m;
        if (esc === "\\") return "\\\\";
        if (esc === "'") return "'";
        if (esc === "/") return "/";
        if (esc === "b" || esc === "f" || esc === "n" || esc === "r" || esc === "t") return `\\${esc}`;
        if (esc === "v") return "\\u000b";
        if (esc === "0") return "\\u0000";
        if (esc.startsWith("x")) return `\\u00${esc.slice(1)}`;
        if (esc.startsWith("u{")) {
          const cp = parseInt(esc.slice(2, -1), 16);
          return String.fromCodePoint(cp).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
        }
        if (esc.startsWith("u")) return `\\${esc}`;
        if (esc === "\n" || esc === "\r\n") return "";
        return esc;
      },
    );
    return JSON.parse(`"${normalized}"`) as string;
  } catch {
    return null;
  }
}

/**
 * スクリプト文字列中の `setJsonData("...")` から Quill Delta を抽出して変換する。
 */
export function parseQuillScriptText(
  scriptText: string,
  doc: Document,
  targetName?: string,
): { text: string; html: string } | null {
  if (!scriptText || !scriptText.includes("setJsonData")) return null;

  const targetPrefix = targetName ? `\\b${targetName}\\s*\\.\\s*` : "";
  const dqMatch = scriptText.match(new RegExp(`${targetPrefix}setJsonData\\(\\s*"((?:[^"\\\\]|\\\\.)*)"`));
  const sqMatch = dqMatch
    ? null
    : scriptText.match(new RegExp(`${targetPrefix}setJsonData\\(\\s*'((?:[^'\\\\]|\\\\.)*)'`));

  const raw = dqMatch?.[1] ?? sqMatch?.[1];
  const quote: '"' | "'" = dqMatch ? '"' : "'";
  if (raw == null) return null;

  const unescaped = decodeJsStringLiteral(raw, quote);
  if (unescaped == null) return null;

  try {
    const parsed = JSON.parse(unescaped);
    const delta = typeof parsed === "string" ? JSON.parse(parsed) : parsed;
    return parseQuillDeltaToHtml(delta, doc);
  } catch {
    return null;
  }
}

/**
 * 指定スコープ内の `<script>` 要素群から `_QuillUtil.<targetName>.setJsonData(...)` を探して変換する。
 */
export function readQuillScript(
  root: ParentNode,
  doc: Document,
  targetName?: string,
): { text: string; html: string } | null {
  const scripts = Array.from(root.querySelectorAll("script"));
  for (const script of scripts) {
    const res = parseQuillScriptText(script.textContent ?? "", doc, targetName);
    if (res) return res;
  }
  return null;
}

/**
 * Quillエディタから中身を取り出す。
 * `.ql-editor` が未描画または `.ql-blank`（Quill初期化の非同期競合時や DOMParser 解析時）の場合は、
 * `<script>` 内の `_QuillUtil.<fallbackScriptTarget>.setJsonData(...)` からフォールバック復元する。
 * 空なら null を返す。
 */
export function readEditor(
  container: Element | null | undefined,
  doc: Document,
  fallbackScriptTarget?: string,
  scriptRoot?: ParentNode,
): { text: string; html: string } | null {
  const editor = container?.querySelector(".ql-editor");
  if (editor && !isBlankEditor(editor)) {
    return { text: norm(editor.textContent), html: sanitizeHtml(editor.innerHTML, doc) };
  }
  if (fallbackScriptTarget || scriptRoot) {
    return readQuillScript(scriptRoot ?? doc, doc, fallbackScriptTarget);
  }
  return null;
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

