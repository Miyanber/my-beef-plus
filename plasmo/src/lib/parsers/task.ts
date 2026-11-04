import type { GlobalChrome, HeaderNotice, TaskItem, TaskKind, TaskStore } from "../timetable-data";
import { norm, queryParam, safeHref, textOf } from "./dom";

// ---------------------------------------------------------------------------
// 課題・テスト一覧 (/lms/task)
// ---------------------------------------------------------------------------

function toTaskKind(label: string, url: string): TaskKind {
  if (label.includes("課題") || url.includes("/report/")) return "REPORT";
  if (label.includes("テスト") || url.includes("/examination/")) return "EXAM";
  if (label.includes("アンケート") || url.includes("/surveys/")) return "SURVEY";
  return "OTHER";
}

export function parseTasks(root: ParentNode): TaskStore {
  const items: TaskItem[] = Array.from(root.querySelectorAll("#taskList .sortTaskBlock")).map((block, index) => {
    // PC用 / スマホ用で同じリンクが2回出力されているため、最初のものを採用する
    const contentLink = block.querySelector(".tasklist-contents a");
    const titleLink = block.querySelector(".tasklist-title a");
    const url = safeHref(titleLink) || safeHref(contentLink);
    const kindLabel = textOf(contentLink);
    const courseId = queryParam(url, "idnumber");
    const itemId =
      queryParam(url, "reportId") || queryParam(url, "examinationId") || queryParam(url, "surveyId") || String(index);

    return {
      id: `${courseId}:${itemId}`,
      courseId,
      courseName: textOf(block.querySelector(".tasklist-course")),
      kind: toTaskKind(kindLabel, url),
      kindLabel,
      title: textOf(titleLink),
      url,
      deadline: textOf(block.querySelector(".tasklist-deadline .deadline")),
    };
  });

  return { lastUpdated: new Date().toISOString(), items };
}

// ---------------------------------------------------------------------------
// 画面共通 (ヘッダーのユーザー名・お知らせ・更新通知)
// ---------------------------------------------------------------------------

function parseNotices(root: ParentNode, selector: string, kind: "info" | "update"): HeaderNotice[] {
  const notices: HeaderNotice[] = [];
  root.querySelectorAll(selector).forEach((a, index) => {
    if (kind === "info") {
      // お知らせ: onclickでダイアログを開く。data1=お知らせID, data2=講義ID
      const infoId = a.getAttribute("data1");
      const courseId = a.getAttribute("data2");
      if (!infoId || !courseId) return; // 末尾の「お知らせ一覧」リンクは除外
      notices.push({
        id: infoId,
        title: textOf(a.querySelector(".info_title")),
        url: `/lms/course?idnumber=${courseId}`,
        isNew: !!a.querySelector(".newIcon"),
      });
    } else {
      const href = safeHref(a);
      if (!href.startsWith("/updateinfo/transition")) return; // 末尾の「更新通知一覧へ」は除外
      notices.push({
        id: queryParam(href, "updateInfoId") || String(index),
        title: norm(textOf(a).replace(/^[・•]\s*/, "")),
        url: href,
        isNew: true,
      });
    }
  });
  return notices;
}

export function parseGlobalChrome(root: ParentNode): GlobalChrome {
  return {
    userName: textOf(root.querySelector(".login-view-name label")),
    infos: parseNotices(root, "#ctrl_menu_info a.header-control-colomn", "info"),
    updates: parseNotices(root, "#ctrl_menu_notification a.header-control-colomn", "update"),
  };
}

