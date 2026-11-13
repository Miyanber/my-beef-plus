export type CourseColor = "violet" | "blue" | "sky" | "amber" | "rose" | "teal";

export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri";

export const DAYS: { key: DayKey; label: string; sub: string }[] = [
  { key: "mon", label: "月", sub: "Mon" },
  { key: "tue", label: "火", sub: "Tue" },
  { key: "wed", label: "水", sub: "Wed" },
  { key: "thu", label: "木", sub: "Thu" },
  { key: "fri", label: "金", sub: "Fri" },
];

export const PERIODS = [1, 2, 3, 4, 5, 6];

export const COURSE_COLORS: CourseColor[] = ["violet", "blue", "sky", "amber", "rose", "teal"];

/** 科目コードなどから決定的にカラーを選ぶ（同じ科目は常に同じ色になる） */
export function pickCourseColor(seed: string): CourseColor {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return COURSE_COLORS[hash % COURSE_COLORS.length];
}

// ---------------------------------------------------------------------------
// 共通
// ---------------------------------------------------------------------------

/** BEEF+ 上の表記そのままの日時範囲 (例: "2026/06/16 12:00") */
export interface DateRange {
  start: string;
  end: string;
}

/** 一覧に表示するリンク（「提出する」「結果表示」など） */
export interface ActionLink {
  label: string;
  url: string;
}

// ---------------------------------------------------------------------------
// 講義詳細 (/lms/course)
// ---------------------------------------------------------------------------

export interface Message {
  title: string;
  createdAt: string;
  status: string;
  url: string;
}

// お知らせ
export interface Announcement {
  /** BEEF+ 内部のお知らせID (InfoDetailCourseTop の引数) */
  id: string;
  title: string;
  postingPeriod: DateRange;
}

export interface AnnouncementDetail {
  id: string;
  title: string;
  sender: string;
  period: string;
  bodyHtml: string;
}

// 資料ファイル / リンク / 動画
export interface Attachment {
  /** HTML上の要素のID (例: "material264629") */
  materialId: string;
  kind: "file" | "link" | "video";
  title: string; // 資料タイトル
  fileName: string; // ファイル名
  comment: string; // コメント
  updatedAt: string; // 登録日
  /** kind が "link" のときの遷移先 */
  href?: string;
  /** kind が "file" のときにダウンロードAPIへ渡す情報 */
  download?: {
    fileName: string;
    objectName: string;
    resourceId: string;
    contentId: string;
    endDate: string;
  };
}

// 教材（第N回ごとのまとまり）
export interface LectureMaterial {
  title: string;
  publicationPeriod: DateRange;
  description: string; // HTML (サニタイズ済み)
  attachments: Attachment[];
}

export type SubmissionStatus =
  | "SUBMITTED_ON_TIME"
  | "NOT_SUBMITTED_YET"
  | "SUBMITTED_OUT_TIME"
  | "UNKNOWN";

// 課題
export interface Assignment {
  id: string;
  title: string;
  submissionPeriod: DateRange;
  submissionStatus: SubmissionStatus;
  /** BEEF+ 上の表記 (期限内提出 / 未提出 など) */
  statusText: string;
  url: string;
}

export type QuizStatus = "COMPLETED" | "UNANSWERED" | "EXPIRED" | "UNKNOWN";

// テスト
export interface Quiz {
  id: string;
  title: string;
  examinationPeriod: DateRange;
  status: QuizStatus;
  statusText: string;
  /** タイトルのリンク先（解答可能 / 結果表示のとき） */
  url: string;
  actions: ActionLink[];
}

// アンケート
export interface Survey {
  id: string;
  title: string;
  period: DateRange;
  resultOpenPeriod: string;
  url: string;
  actions: ActionLink[];
}

// 掲示板
export interface BulletinBoardItem {
  id: string;
  title: string;
  postingPeriod: DateRange;
  url: string;
}

export interface CourseHeader {
  year: string; // 2026
  semesterLabel: string; // "2026 前期"
  code: string; // 科目コード (1X017)
  name: string; // 科目名
  teachers: string[];
  schedule: string; // "前期/金曜日/２時限"
}

// 授業の「詳細・中身」のデータ（LMSから取得）
export interface CourseDetail {
  id: string; // idnumber (TimetableCourse.id と一致)
  lastUpdated: string;
  header?: CourseHeader;
  beef2026Url?: string; // BEEF2026 (旧Moodle LMS) のコースURL
  courseSummary?: {
    text: string;
    rawHTML: string;
  };
  classDetails?: {
    rawHTML: string;
    updatedAt: string;
  };
  newMessageUrl?: string;
  messages: Message[];
  announcements: Announcement[];
  lectureMaterials: LectureMaterial[];
  assignments: Assignment[];
  quizzes: Quiz[];
  surveys: Survey[];
  bulletinBoardItems: BulletinBoardItem[];
}

// ---------------------------------------------------------------------------
// 時間割 (/lms/timetable)
// ---------------------------------------------------------------------------

// 時間割の「枠」としての授業データ
export interface TimetableCourse {
  id: string; // 固有ID (e.g., '20261X0521001')
  code: string; // 科目コード
  title: string; // 授業名
  teachers: string[]; // 担当教員
  color: CourseColor;
  beef2026Url?: string; // BEEF2026 のコースURL
  dates: Array<{
    day: DayKey;
    period: number;
  }>;
}

export interface SelectOption {
  value: string;
  label: string;
}

// 時間割全体のストア型
export interface TimetableStore {
  lastUpdated: string; // タイムスタンプ
  year: string; // 表示中の年度
  termCode: string; // 表示中の期間コード ("" = 既定)
  weekRange: string; // "2026年11月02日 ～ 2026年11月07日"
  /** 表示中の週が「今週」かどうか (BEEF+ の「現在」ボタンが無効なとき true) */
  isCurrent: boolean;
  yearOptions: SelectOption[];
  termOptions: SelectOption[];
  courses: Record<string, TimetableCourse>;
}

// ---------------------------------------------------------------------------
// 課題・テスト一覧 (/lms/task)
// ---------------------------------------------------------------------------

export type TaskKind = "REPORT" | "EXAM" | "SURVEY" | "OTHER";

export type TaskSource = "beefplus" | "beef2026";

export interface TaskItem {
  id: string;
  courseId: string;
  courseName: string;
  kind: TaskKind;
  kindLabel: string; // BEEF+ 上の表記 (課題 / テスト / アンケート)
  title: string;
  url: string;
  deadline: string; // "2026/11/05 12:00:00"
  source?: TaskSource;
}

export interface TaskStore {
  lastUpdated: string;
  items: TaskItem[];
}

// ---------------------------------------------------------------------------
// 画面共通（ヘッダー等）
// ---------------------------------------------------------------------------

export interface HeaderNotice {
  id: string;
  title: string;
  url: string;
  isNew: boolean;
}

export interface GlobalChrome {
  userName: string;
  infos: HeaderNotice[];
  updates: HeaderNotice[];
}

export const COLOR_STYLES: Record<
  CourseColor,
  { cell: string; badge: string; title: string; teacher: string }
> = {
  violet: {
    cell: "bg-violet-50/80 border-violet-200/70 hover:bg-violet-100/80 dark:bg-violet-950/20 dark:border-violet-800/50 dark:hover:bg-violet-900/30",
    badge: "bg-violet-600 text-white dark:bg-violet-500",
    title: "text-violet-950 dark:text-violet-50",
    teacher: "text-violet-700/80 dark:text-violet-300/80",
  },
  blue: {
    cell: "bg-indigo-50/80 border-indigo-200/70 hover:bg-indigo-100/80 dark:bg-indigo-950/20 dark:border-indigo-800/50 dark:hover:bg-indigo-900/30",
    badge: "bg-indigo-600 text-white dark:bg-indigo-500",
    title: "text-indigo-950 dark:text-indigo-50",
    teacher: "text-indigo-700/80 dark:text-indigo-300/80",
  },
  sky: {
    cell: "bg-sky-50/80 border-sky-200/70 hover:bg-sky-100/80 dark:bg-sky-950/20 dark:border-sky-800/50 dark:hover:bg-sky-900/30",
    badge: "bg-sky-600 text-white dark:bg-sky-500",
    title: "text-sky-950 dark:text-sky-50",
    teacher: "text-sky-700/80 dark:text-sky-300/80",
  },
  amber: {
    cell: "bg-amber-50/80 border-amber-200/70 hover:bg-amber-100/80 dark:bg-amber-950/10 dark:border-amber-800/40 dark:hover:bg-amber-900/20",
    badge: "bg-amber-500 text-white dark:bg-amber-600",
    title: "text-amber-950 dark:text-amber-50",
    teacher: "text-amber-700/80 dark:text-amber-300/80",
  },
  rose: {
    cell: "bg-rose-50/80 border-rose-200/70 hover:bg-rose-100/80 dark:bg-rose-950/20 dark:border-rose-800/50 dark:hover:bg-rose-900/30",
    badge: "bg-rose-500 text-white dark:bg-rose-600",
    title: "text-rose-950 dark:text-rose-50",
    teacher: "text-rose-700/80 dark:text-rose-300/80",
  },
  teal: {
    cell: "bg-teal-50/80 border-teal-200/70 hover:bg-teal-100/80 dark:bg-teal-950/20 dark:border-teal-800/50 dark:hover:bg-teal-900/30",
    badge: "bg-teal-600 text-white dark:bg-teal-500",
    title: "text-teal-950 dark:text-teal-50",
    teacher: "text-teal-700/80 dark:text-teal-300/80",
  },
};
