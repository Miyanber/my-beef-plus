import type {
  Announcement,
  Assignment,
  Attachment,
  BulletinBoardItem,
  CourseDetail,
  CourseHeader,
  LectureMaterial,
  Message,
  Quiz,
  QuizStatus,
  Survey,
  SubmissionStatus,
} from "../timetable-data";
import { setBeef2026Url } from "../storage-cache";
import {
  collectActions,
  norm,
  queryParam,
  readEditor,
  readQuillScript,
  safeHref,
  splitPeriod,
  textOf,
} from "./dom";

// ---------------------------------------------------------------------------
// ヘッダー (科目名・担当教員・開講学期)
// ---------------------------------------------------------------------------

function parseHeader(root: ParentNode): CourseHeader | undefined {
  const spans = Array.from(root.querySelectorAll(".course-title-txt a span")).map(textOf).filter(Boolean);
  if (spans.length === 0) return undefined;

  const semesterLabel = spans[0];
  const name = spans[spans.length - 1];
  // [学期, (時間割コード), 科目コード, 科目名] / [学期, 科目コード, 科目名]
  const code = spans.length >= 3 ? spans[spans.length - 2] : "";

  const yearInput = root.querySelector('input[name="rishunen"]') as HTMLInputElement | null;
  const year = yearInput?.getAttribute("value") ?? semesterLabel.split(" ")[0] ?? "";

  let teachers: string[] = [];
  for (const row of Array.from(root.querySelectorAll(".course-view-title-txt"))) {
    const cols = row.querySelectorAll("span");
    if (textOf(cols[0]) === "担当" && cols[1]) {
      teachers = (cols[1].textContent ?? "")
        .split(/[,、，]/)
        .map((t) => norm(t))
        .filter(Boolean);
    }
  }

  return {
    year,
    semesterLabel,
    code,
    name,
    teachers,
    schedule: textOf(root.querySelector(".subblock_form")),
  };
}

// ---------------------------------------------------------------------------
// お知らせ
// ---------------------------------------------------------------------------

function parseAnnouncements(root: ParentNode): Announcement[] {
  return Array.from(root.querySelectorAll("#courseViewInformation .sortInformationBlock")).map((block) => {
    const link = block.querySelector(".infoTitle");
    const onclick = link?.getAttribute("onclick") ?? "";
    const id =
      onclick.match(/InfoDetail(?:CourseTop)?\(\s*[^,]+,\s*['"]?(\d+)['"]?/)?.[1] ??
      link?.getAttribute("data1") ??
      "";
    const dates = Array.from(block.querySelectorAll(".infoPeriod span"))
      .filter((s) => !s.classList.contains("contents-time-to"))
      .map(textOf);
    return {
      id,
      title: textOf(link),
      postingPeriod: { start: dates[0] ?? "", end: dates[dates.length - 1] ?? "" },
    };
  });
}

// ---------------------------------------------------------------------------
// 教材
// ---------------------------------------------------------------------------

function parseAttachment(el: Element): Attachment | null {
  const nameCell = el.querySelector(".course-view-material-file-name");
  const fileLabel = nameCell?.querySelector(".material-file-name");
  const anchor = Array.from(el.querySelectorAll("a[href]")).find((a) => safeHref(a));
  // リンク教材でも .fileName / .objectName の要素自体は存在する（中身が空）ため、中身で判定する
  const hasFile = !!textOf(el.querySelector(".objectName")) || !!el.querySelector(".fileDownload");

  const title = textOf(fileLabel) || textOf(anchor) || textOf(nameCell);
  if (!title) return null;

  const kind: Attachment["kind"] = hasFile
    ? "file"
    : anchor
      ? "link"
      : el.querySelector("video, iframe, .movie, [class*='video']")
        ? "video"
        : "file";

  const hidden = (selector: string) => textOf(el.querySelector(selector));
  const fileName = hidden(".fileName") || textOf(el.querySelector(".material-type-file-name label")) || title;

  const attachment: Attachment = {
    materialId: el.id,
    kind,
    title,
    fileName,
    comment: textOf(el.querySelector(".course-view-material-comment")),
    updatedAt: textOf(el.querySelector(".course-view-material-update")),
  };

  if (kind === "link") attachment.href = safeHref(anchor);
  if (kind === "file") {
    attachment.download = {
      fileName: hidden(".fileName"),
      objectName: hidden(".objectName"),
      resourceId: hidden(".resource_Id"),
      contentId: (el.querySelector('input[type="hidden"]') as HTMLInputElement | null)?.getAttribute("value") ?? "",
      endDate: hidden(".openEndDate"),
    };
  }
  return attachment;
}

/**
 * #materialList の直下は「第N回」の見出し・公開期間・コメント・ファイル行が
 * フラットに並んでいるため、見出しごとにグルーピングする。
 */
function parseMaterials(root: ParentNode, doc: Document): LectureMaterial[] {
  const list = root.querySelector("#materialList");
  if (!list) return [];

  const sections: LectureMaterial[] = [];
  let current: LectureMaterial | null = null;

  for (const child of Array.from(list.children)) {
    const titleLabel = child.querySelector(".block-title label");
    if (titleLabel) {
      current = {
        title: textOf(titleLabel),
        publicationPeriod: { start: "", end: "" },
        description: "",
        attachments: [],
      };
      sections.push(current);
      continue;
    }
    if (!current) continue;

    if (child.classList.contains("materialCss")) {
      const attachment = parseAttachment(child);
      if (attachment) current.attachments.push(attachment);
    } else if (child.classList.contains("course-material-edit-comment")) {
      const editorEl = child.querySelector('[id^="materialContentsBodyEditor"]');
      const indexMatch = editorEl?.id.match(/materialContentsBodyEditor(\d+)/);
      const scriptTarget = indexMatch ? `materialContents_${indexMatch[1]}` : undefined;
      const content =
        readEditor(child, doc, scriptTarget, child) ??
        (scriptTarget ? readQuillScript(doc, doc, scriptTarget) : null);
      if (content) current.description = content.html;
    } else if (textOf(child.querySelector(".contents-header-txt .bold-txt")) === "公開期間") {
      current.publicationPeriod = splitPeriod(textOf(child.querySelector(".contents-input-area span")));
    }
  }
  return sections;
}

// ---------------------------------------------------------------------------
// 課題 / テスト / アンケート / 掲示板 / メッセージ
// ---------------------------------------------------------------------------

function toSubmissionStatus(text: string): SubmissionStatus {
  if (text.includes("未提出")) return "NOT_SUBMITTED_YET";
  if (text.includes("期限後") || text.includes("遅")) return "SUBMITTED_OUT_TIME";
  if (text.includes("提出")) return "SUBMITTED_ON_TIME";
  return "UNKNOWN";
}

function parseAssignments(root: ParentNode): Assignment[] {
  return Array.from(root.querySelectorAll("#reportList .sortReportBlock")).map((block) => {
    const link = block.querySelector(".reportTitle");
    const url = safeHref(link) || collectActions(block)[0]?.url || "";
    const statusText = textOf(block.querySelector(".submitStatus"));
    const hiddenId = (block.querySelector("input.reportId") as HTMLInputElement | null)?.getAttribute("value");
    return {
      id: hiddenId || queryParam(url, "reportId"),
      title: textOf(link),
      submissionPeriod: {
        start: textOf(block.querySelector(".timeStart")),
        end: textOf(block.querySelector(".timeEnd")),
      },
      submissionStatus: toSubmissionStatus(statusText),
      statusText,
      url,
    };
  });
}

function toQuizStatus(text: string): QuizStatus {
  if (text.includes("未")) return "UNANSWERED";
  if (text.includes("期間外")) return "EXPIRED";
  if (text.includes("済")) return "COMPLETED";
  return "UNKNOWN";
}

function parseQuizzes(root: ParentNode): Quiz[] {
  return Array.from(root.querySelectorAll("#examList .sortExamBlock")).map((block, index) => {
    const title = block.querySelector(".exTitle");
    const actions = collectActions(block);
    const url = safeHref(title) || actions[0]?.url || "";
    const statusText = textOf(block.querySelector(".exAnswerStatus"));
    return {
      id: queryParam(url, "examinationId") || `exam-${index}`,
      title: textOf(title),
      examinationPeriod: splitPeriod(textOf(block.querySelector(".exPeriod"))),
      status: toQuizStatus(statusText),
      statusText,
      url,
      actions,
    };
  });
}

function parseSurveys(root: ParentNode): Survey[] {
  return Array.from(root.querySelectorAll("#surveyList .sortSurveyBlock")).map((block) => {
    const title = block.querySelector(".surveyTitle");
    const actions = collectActions(block);
    const url = safeHref(title) || actions[0]?.url || "";
    return {
      id: queryParam(url, "surveyId"),
      title: textOf(title),
      period: splitPeriod(textOf(block.querySelector(".surveyPeriod"))),
      resultOpenPeriod: textOf(block.querySelector(".surveyOpenDate")),
      url,
      actions,
    };
  });
}

function parseForums(root: ParentNode): BulletinBoardItem[] {
  return Array.from(root.querySelectorAll("#forumList .sortForumBlock")).map((block) => {
    const title = block.querySelector(".forumTitle");
    const url = safeHref(title) || collectActions(block)[0]?.url || "";
    return {
      id: queryParam(url, "forumId"),
      title: textOf(title),
      postingPeriod: splitPeriod(textOf(block.querySelector(".forumPeriod"))),
      url,
    };
  });
}

/**
 * 担当へのメッセージ。メッセージが存在するサンプルが無いため、
 * 「リンク付きのタイトル + 日時 + ステータス」という一覧の一般形で読む（要実機確認）。
 */
function parseMessages(root: ParentNode): Message[] {
  const rows = Array.from(root.querySelectorAll("#inquiryList .sortInquiryParent > *"));
  return rows
    .map((row) => {
      const link = row.querySelector("a[href]");
      return {
        title: textOf(row.querySelector(".inquiryTitle")) || textOf(link),
        createdAt: textOf(row.querySelector(".createDate, .inquiryCreateDate")),
        status: textOf(row.querySelector(".inquiryStatus")),
        url: safeHref(link),
      };
    })
    .filter((m) => m.title);
}

// ---------------------------------------------------------------------------
// BEEF2026 (旧Moodle LMS) 連携URL検出
// ---------------------------------------------------------------------------

const BEEF2026_REGEX = /https?:\/\/beef\.center\.kobe-u\.ac\.jp\/(?:[0-9]{4}\/)?course\/view\.php\?[^"'<>\s\\]*id=\d+[^"'<>\s\\]*/i;

/**
 * 講義ページから BEEF2026 (Moodle) のコースURLを抽出する
 */
export function extractBeef2026Url(doc: Document): string | undefined {
  // 1. aタグのhrefから検索
  const links = Array.from(doc.querySelectorAll<HTMLAnchorElement>('a[href*="beef.center.kobe-u.ac.jp"]'));
  for (const a of links) {
    const href = a.getAttribute("href") || a.href;
    const match = href.match(BEEF2026_REGEX);
    if (match) return match[0];
  }

  // 2. scriptタグ（QuillのJSONデータ等）から検索
  const scripts = Array.from(doc.querySelectorAll("script"));
  for (const script of scripts) {
    const text = script.textContent || "";
    if (text.includes("beef.center.kobe-u.ac.jp")) {
      const unescaped = text.replace(/\\\//g, "/");
      const match = unescaped.match(BEEF2026_REGEX);
      if (match) return match[0];
    }
  }

  // 3. onlineBodyEditor / bodyEditor のHTMLテキストから検索
  const editorTexts = [
    doc.querySelector("#onlineBodyEditor")?.innerHTML,
    doc.querySelector("#bodyEditor")?.innerHTML,
  ].filter(Boolean) as string[];
  for (const html of editorTexts) {
    const match = html.match(BEEF2026_REGEX);
    if (match) return match[0];
  }

  return undefined;
}

// ---------------------------------------------------------------------------
// エントリポイント
// ---------------------------------------------------------------------------

/**
 * 講義トップ (/lms/course?idnumber=...) のDOMを解析する。
 * Quillエディタの描画完了待ちは呼び出し側 (scrapers) の責務。
 */
export function parseCourseDetail(doc: Document, id: string): CourseDetail {
  const summary = readEditor(doc.querySelector("#bodyEditor"), doc, "courseContents", doc);
  const online = readEditor(doc.querySelector("#onlineBodyEditor"), doc, "onlineContents", doc);
  const header = parseHeader(doc);
  const beef2026Url = extractBeef2026Url(doc);

  if (beef2026Url) {
    setBeef2026Url(id, beef2026Url);
    if (header?.code) {
      setBeef2026Url(header.code, beef2026Url);
    }
  }

  return {
    id,
    lastUpdated: new Date().toISOString(),
    header,
    beef2026Url,
    courseSummary: summary ? { text: summary.text, rawHTML: summary.html } : undefined,
    classDetails: online
      ? {
          rawHTML: online.html,
          updatedAt: textOf(doc.querySelector(".online-update-txt")).replace(/^更新日時\s*[:：]\s*/, ""),
        }
      : undefined,
    newMessageUrl: safeHref(doc.querySelector("#message .block-title-btn a")) || undefined,
    messages: parseMessages(doc),
    announcements: parseAnnouncements(doc),
    lectureMaterials: parseMaterials(doc, doc),
    assignments: parseAssignments(doc),
    quizzes: parseQuizzes(doc),
    surveys: parseSurveys(doc),
    bulletinBoardItems: parseForums(doc),
  };
}
