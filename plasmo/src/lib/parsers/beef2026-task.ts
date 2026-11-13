import type { TaskItem, TaskKind, TaskStore } from "../timetable-data";
import { norm, safeHref, textOf } from "./dom";

export const BEEF2026_ORIGIN = "https://beef.center.kobe-u.ac.jp";
export const BEEF2026_DASHBOARD_URL = `${BEEF2026_ORIGIN}/my/`;

export type Beef2026TimelineState = "unavailable" | "loading" | "empty" | "ready";

function isHiddenEl(el: Element | null): boolean {
  if (!el) return true;
  if (el.classList.contains("hidden") || el.classList.contains("d-none")) return true;
  return (el as HTMLElement).style?.display === "none";
}

function getTimelineScope(root: ParentNode): Element | null {
  return (
    root.querySelector('[data-region="timeline"] [data-region="view-dates"]') ??
    root.querySelector('[data-region="timeline"]')
  );
}

/**
 * BEEF2026 ダッシュボードのタイムラインブロックが描画完了しているか判定する
 */
export function getBeef2026TimelineState(root: ParentNode): Beef2026TimelineState {
  const scope = getTimelineScope(root);
  if (!scope) return "unavailable";

  const items = scope.querySelectorAll('[data-region="event-list-content"] [data-region="event-list-item"]');
  if (items.length > 0) return "ready";

  const emptyMsg = scope.querySelector('[data-region="no-events-empty-message"]');
  if (emptyMsg && !isHiddenEl(emptyMsg)) return "empty";

  return "loading";
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function formatYmd(date: Date): string {
  return `${date.getFullYear()}/${pad2(date.getMonth() + 1)}/${pad2(date.getDate())}`;
}

function parseDateFromHeader(el: Element): string {
  const tsAttr = el.getAttribute("data-timestamp");
  if (tsAttr && /^\d+$/.test(tsAttr)) {
    const d = new Date(Number(tsAttr) * 1000);
    if (!Number.isNaN(d.getTime())) {
      return formatYmd(d);
    }
  }
  const heading = textOf(el);
  const m = heading.match(/(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/);
  if (m) {
    return `${m[1]}/${pad2(Number(m[2]))}/${pad2(Number(m[3]))}`;
  }
  return "";
}

function parseDateTimeFromAriaLabel(ariaLabel: string): { date: string; time: string } {
  const m = ariaLabel.match(/(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日(?:\s*(\d{1,2}):(\d{2}))?/);
  if (!m) return { date: "", time: "" };
  const date = `${m[1]}/${pad2(Number(m[2]))}/${pad2(Number(m[3]))}`;
  const time = m[4] && m[5] ? `${pad2(Number(m[4]))}:${m[5]}:00` : "";
  return { date, time };
}

function toAbsBeef2026Url(rawHref: string): string {
  if (!rawHref) return "";
  try {
    return new URL(rawHref, BEEF2026_ORIGIN).href;
  } catch {
    return rawHref;
  }
}

function detectBeef2026TaskKind(
  actionTypeText: string,
  iconSrc: string,
  url: string,
): { kind: TaskKind; kindLabel: string } {
  if (url.includes("/mod/assign/") || iconSrc.includes("/assign/") || actionTypeText.includes("課題")) {
    return { kind: "REPORT", kindLabel: "課題" };
  }
  if (url.includes("/mod/quiz/") || iconSrc.includes("/quiz/") || actionTypeText.includes("テスト")) {
    return { kind: "EXAM", kindLabel: "テスト" };
  }
  if (
    url.includes("/mod/feedback/") ||
    url.includes("/mod/questionnaire/") ||
    url.includes("/mod/survey/") ||
    iconSrc.includes("/feedback/") ||
    iconSrc.includes("/questionnaire/") ||
    actionTypeText.includes("アンケート")
  ) {
    return { kind: "SURVEY", kindLabel: "アンケート" };
  }
  return { kind: "OTHER", kindLabel: "その他" };
}

/**
 * BEEF2026 ダッシュボードの描画済みタイムライン DOM から課題・テスト一覧を抽出する
 */
export function parseBeef2026Tasks(root: ParentNode): TaskStore {
  const scope = getTimelineScope(root);
  const content = scope?.querySelector('[data-region="event-list-content"]');
  if (!content) {
    return { lastUpdated: new Date().toISOString(), items: [] };
  }

  const nodes = Array.from(
    content.querySelectorAll('[data-region="event-list-content-date"], [data-region="event-list-item"]'),
  );

  const items: TaskItem[] = [];
  let currentDate = "";

  nodes.forEach((node, index) => {
    if (node.getAttribute("data-region") === "event-list-content-date") {
      currentDate = parseDateFromHeader(node);
      return;
    }

    const titleLink = node.querySelector(".event-name a");
    const actionLink = node.querySelector(".timeline-action-button a");
    const url = toAbsBeef2026Url(safeHref(titleLink) || safeHref(actionLink)) || BEEF2026_DASHBOARD_URL;
    const title = textOf(titleLink);
    if (!title) return;

    // 締切時刻 (例: "13:20")
    const timelineName = node.querySelector(".timeline-name");
    const timeEl = timelineName?.querySelector(":scope > small");
    const timeMatch = textOf(timeEl).match(/(\d{1,2}):(\d{2})/);
    const timePart = timeMatch ? `${pad2(Number(timeMatch[1]))}:${timeMatch[2]}:00` : "";

    const ariaLabel = titleLink?.getAttribute("aria-label") ?? "";
    const ariaDateTime = parseDateTimeFromAriaLabel(ariaLabel);
    const datePart = currentDate || ariaDateTime.date;
    const finalTime = timePart || ariaDateTime.time || "00:00:00";
    const deadline = datePart ? `${datePart} ${finalTime}` : "";

    // サブタイトル: "「課題」の提出期限 · [後期][3X004] システムモデル"
    const subtitle = textOf(node.querySelector(".event-name-container small"));
    const sepMatch = subtitle.match(/^(.+?)\s*[·・]\s*(.+)$/);
    const actionTypeText = sepMatch ? norm(sepMatch[1]) : subtitle;
    let courseName = sepMatch ? norm(sepMatch[2]) : "";

    if (!courseName && ariaLabel) {
      const courseFromAria = ariaLabel.match(/^(.+?)\s+の\s+/);
      if (courseFromAria) courseName = norm(courseFromAria[1]);
    }
    if (!courseName) courseName = "BEEF2026";

    const iconSrc = node.querySelector("img.icon")?.getAttribute("src") ?? "";
    const { kind, kindLabel } = detectBeef2026TaskKind(actionTypeText, iconSrc, url);

    let cmId = "";
    try {
      const parsed = new URL(url, BEEF2026_ORIGIN);
      cmId = parsed.searchParams.get("id") ?? "";
    } catch {
      cmId = "";
    }

    items.push({
      id: `beef2026:${cmId || `${index}:${title}:${deadline}`}`,
      courseId: "",
      courseName,
      kind,
      kindLabel,
      title,
      url,
      deadline,
      source: "beef2026",
    });
  });

  return {
    lastUpdated: new Date().toISOString(),
    items,
  };
}

