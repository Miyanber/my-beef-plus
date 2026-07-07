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

interface Message {
  title: string;
  createdAt: string;
  status: string;
  url: string;
}

// お知らせ
interface Announcement {
  title: string;
  postingPeriod: {
    start: string;
    end: string;
  };
  sender: string;
  content: string; // HTML
}

// 教材
interface LectureMaterial {
  title: string;
  publicationPeriod: {
    start: string;
    end: string;
  };
  description: string;
  attachments: Attachment[];
}

// 資料ファイル
interface Attachment {
  title: string; // 資料タイトル (exercise.pdf)
  fileName: string; // ファイル名 (exercise.pdf)
  comment: string; // コメント (空文字)
  downloadUrl: string; // 実際のファイルURL
}

// 課題
interface Assignment {
  id: string; // 課題を一意に識別するID
  title: string; // 課題タイトル (演習問題 (2026/6/16・6/23))
  submissionPeriod: {
    // 提出期間
    start: string; // 提出開始日 (2026/06/16 12:00)
    end: string; // 提出終了日 (2026/06/27 00:00)
  };
  submissionStatus:
    | "SUBMITTED_ON_TIME"
    | "NOT_SUBMITTED_YET"
    | "SUBMITTED_OUT_TIME"; // 提出状況 (期限内提出)
  url: string; // 課題提出ページへのURL
}

interface Quiz {
  id: string; // テストを一意に識別するID
  title: string; // テストタイトル (第11回テスト)
  examinationPeriod: {
    // 解答期間・期限
    start: string; // 開始日時 (2026/06/26 10:40)
    end: string; // 終了日時・期限 (2026/06/26 12:15)
  };
  status: QuizStatus; // 解答ステータス (解答済)
  resultUrl?: string; // 結果ページへのURL (解答済の場合のみ)
  answerUrl?: string; // 解答ページへのURL (解答済の場合のみ)
}

// ステータスを型安全に管理する場合のEnum例
type QuizStatus = "COMPLETED" | "UNANSWERED" | "EXPIRED"; // 解答済, 未解答, 期間外 など

export interface BulletinBoardItem {
  id: string; // 掲示板アイテムを一意に識別するID
  title: string; // テーマタイトル
  // 投稿期間・期限
  postingPeriod: {
    start: string; // 開始日時
    end: string; // 終了日時・期限
  };
  url: string; // 詳細ページへのURL
}

// 1つの授業を表すインターフェース（再利用性が高い）
export interface Course {
  id: string; // HTMLでのID
  code: string;
  title: string;
  teachers: string[]; // カンマ区切りの文字列から「配列」に変更
  color: CourseColor;
  day: DayKey; // 曜日をデータ側に持たせる
  period: number; // 時限（コマ）をデータ側に持たせる
  courseSummary?: string; // コースの概要説明
  classDetails?: {
    innerHTML: string;
    updatedAt: string;
  }; // 授業情報
  messages?: Message[]; // 担当者へのメッセージ
  announcements?: Announcement[]; // お知らせ
  lectureMaterials?: LectureMaterial[]; // 教材
  assignments?: Assignment[]; // 課題
  quizzes?: Quiz[]; // テスト
  bulletinBoardItems?: BulletinBoardItem[];
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