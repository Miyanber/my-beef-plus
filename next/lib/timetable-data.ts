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

// 汎用的なフラット配列
export const COURSES: Course[] = [
  {
    code: "1X016",
    title: "システム情報学入門",
    teachers: [
      "太田 能",
      "的場 修",
      "大川 剛直",
      "藤井 信忠",
      "仁田 功一",
      "國領 大介",
      "古賀 朱門",
      "上島 基之",
    ],
    color: "blue",
    day: "wed",
    period: 1,
  },
  {
    code: "1X052",
    title: "代数・幾何演習1",
    teachers: ["小林 太", "後藤 優太"],
    color: "blue",
    day: "thu",
    period: 1,
  },
  {
    code: "1X053",
    title: "解析演習1",
    teachers: ["小林 太", "後藤 優太"],
    color: "blue",
    day: "thu",
    period: 1,
  },
  {
    code: "2X065",
    title: "数理情報英語B",
    teachers: ["仁田 功一", "上崎 麻衣子"],
    color: "blue",
    day: "fri",
    period: 1,
  },
  {
    code: "1X051",
    title: "離散数学",
    teachers: ["國谷 紀良"],
    color: "blue",
    day: "tue",
    period: 2,
  },
  {
    code: "1X017",
    title: "演習1",
    teachers: [
      "三宅 洋平",
      "FINNERTY PATRICK MARTIN",
      "森田 紘平",
      "中田 柊也",
      "システム情報学部教員",
      "山本 大介",
      "上島 基之",
      "中島 涼輔",
      "山下 歩",
    ],
    color: "blue",
    day: "fri",
    period: 2,
    courseSummary:
      "はじめに，高等学校で習った1変数関数の微分積分を多変数関数へ拡張する．それを踏まえ，曲線や曲面について学び，ベクトル解析に関する諸定理を理解する．その後に，フーリエ解析をはじめ，フーリエ解析の微分方程式への応用，微分方程式の数値解法，複素関数を学んでいく．",
    classDetails: {
      innerHTML: `<p><span style="background-color: rgb(255, 255, 255); color: rgb(0, 0, 0);">はじめに，2変数関数の微分積分を中心に講義する．特にテイラーの定理，陰関数定理，逆写像定理について詳しく説明する．また，ベクトル解析ではガウスの発散定理，ストークスの定理について，その物理的意味も説明する．最後に，応用解析学の三本柱であるフーリエ解析，微分方程式，複素関数について俯瞰するとともに，重要な点を述べる．本講義は「対面」で実施する．</span></p><p><br></p><p><span style="background-color: rgb(255, 255, 255); color: rgb(0, 0, 0);">1. 多変数関数と偏導関数，高階偏導関数</span></p><p><span style="background-color: rgb(255, 255, 255); color: rgb(0, 0, 0);">2. テイラーの定理，陰関数定理，逆写像定理</span></p><p><span style="background-color: rgb(255, 255, 255); color: rgb(0, 0, 0);">3. 極値問題</span></p><p><span style="background-color: rgb(255, 255, 255); color: rgb(0, 0, 0);">4. 二重積分(定義，性質，累次積分)</span></p><p><span style="background-color: rgb(255, 255, 255); color: rgb(0, 0, 0);">5. 二重積分(変数変換，広義重積分)</span></p><p><span style="background-color: rgb(255, 255, 255); color: rgb(0, 0, 0);">6. 多重積分とその応用</span></p><p><span style="background-color: rgb(255, 255, 255); color: rgb(0, 0, 0);">7. 外積とベクトル値関数</span></p><p><span style="background-color: rgb(255, 255, 255); color: rgb(0, 0, 0);">8. 曲線と曲面</span></p><p><span style="background-color: rgb(255, 255, 255); color: rgb(0, 0, 0);">9. スカラー場の勾配，ベクトル場の発散と回転</span></p><p><span style="background-color: rgb(255, 255, 255); color: rgb(0, 0, 0);">10. 線積分と面積分</span></p><p><span style="background-color: rgb(255, 255, 255); color: rgb(0, 0, 0);">11. グリーンの定理，ガウスの発散定理，ストークスの定理</span></p><p><span style="background-color: rgb(255, 255, 255); color: rgb(0, 0, 0);">12. フーリエ解析(フーリエ級数，フーリエ変換，ラプラス変換)</span></p><p><span style="background-color: rgb(255, 255, 255); color: rgb(0, 0, 0);">13. フーリエ解析の微分方程式への応用</span></p><p><span style="background-color: rgb(255, 255, 255); color: rgb(0, 0, 0);">14. 微分方程式の数値解法</span></p><p><span style="background-color: rgb(255, 255, 255); color: rgb(0, 0, 0);">15. 複素関数(正則関数，複素積分)</span></p><p><br></p>`,
      updatedAt: `2026/04/09 15:55`,
    },
    messages: [],
    announcements: [
      {
        title: "6月26日の授業について",
        postingPeriod: {
          start: "2026/06/26 07:50",
          end: "9999/12/31 00:00",
        },
        sender: "中島　涼輔",
        content: `<p>現在、大雨により京阪神の広い地区で公共交通機関が運転見合わせとなっており、</p><p>すでに数名の方から通学困難との連絡をいただいております。</p><p>そのため、そのような理由で出席できない方向けに Teams でオンライン配信を行う予定です。</p><p>オンライン受講を希望の方は、Beef+ 上のメッセージに</p><p>欠席理由（運転見合わせの路線、気象警報等）を記載の上ご連絡ください。</p>`,
      },
    ],
    lectureMaterials: [
      {
        title: "第6回授業資料",
        publicationPeriod: {
          start: "2026/05/21 00:00",
          end: "9999/12/31 23:59",
        },
        description: "<p>第1回（4/10）授業資料です。</p>",
        attachments: [
          {
            title: "enshu1_6th.pdf",
            fileName: "enshu1_6th.pdf",
            comment: "",
            downloadUrl: "/downloads/enshu1_6th.pdf",
          },
          {
            title: "enshu1_6th_訂正版.pdf",
            fileName: "enshu1_6th_訂正版.pdf",
            comment:
              "課題の問題に訂正があったので、訂正したものを再度掲載しておきます。",
            downloadUrl: "/downloads/enshu1_6th_訂正版.pdf",
          },
          {
            title: "enshu6.ipynb",
            fileName: "enshu6.ipynb",
            comment: "授業時のプログラムの例です",
            downloadUrl: "/downloads/enshu6.ipynb",
          },
        ],
      },
    ],
    assignments: [
      {
        id: "asg-001",
        title: "演習問題 (2026/16・6/23)",
        submissionPeriod: {
          start: "2026/06/16 12:00",
          end: "2026/06/27 00:00",
        },
        submissionStatus: "SUBMITTED_ON_TIME",
        url: "/assignments/1",
      },
      {
        id: "asg-002",
        title: "演習問題 (2026/6/2)",
        submissionPeriod: {
          start: "2026/06/02 12:00",
          end: "2026/06/06 00:00",
        },
        submissionStatus: "SUBMITTED_ON_TIME",
        url: "/assignments/2",
      },
      {
        id: "asg-003",
        title: "演習問題 (2026/5/19)",
        submissionPeriod: {
          start: "2026/05/19 11:50",
          end: "2026/05/23 00:00",
        },
        submissionStatus: "SUBMITTED_ON_TIME",
        url: "/assignments/3",
      },
      {
        id: "asg-004",
        title: "演習問題 (2026/4/28)",
        submissionPeriod: {
          start: "2026/04/28 11:50",
          end: "2026/05/02 00:00",
        },
        submissionStatus: "SUBMITTED_ON_TIME",
        url: "/assignments/4",
      },
      {
        id: "asg-005",
        title: "演習問題 (2026/4/21)",
        submissionPeriod: {
          start: "2026/04/21 11:50",
          end: "2026/04/25 00:00",
        },
        submissionStatus: "SUBMITTED_ON_TIME",
        url: "/assignments/5",
      },
    ],
    quizzes: [
      {
        id: "quiz-011",
        title: "第11回テスト",
        examinationPeriod: {
          start: "2026/06/26 10:40",
          end: "2026/06/26 12:15",
        },
        status: "COMPLETED",
        resultUrl: "/quizzes/11/result",
        answerUrl: "/quizzes/11/answer",
      },
      {
        id: "quiz-010",
        title: "第10回テスト",
        examinationPeriod: {
          start: "2026/06/19 11:00",
          end: "2026/06/19 12:15",
        },
        status: "COMPLETED",
        resultUrl: "/quizzes/10/result",
        answerUrl: "/quizzes/10/answer",
      },
      {
        id: "quiz-009",
        title: "第9回テスト",
        examinationPeriod: {
          start: "2026/06/12 11:00",
          end: "2026/06/12 12:20",
        },
        status: "COMPLETED",
        resultUrl: "/quizzes/9/result",
        answerUrl: "/quizzes/9/answer",
      },
      {
        id: "quiz-008",
        title: "第8回テスト",
        examinationPeriod: {
          start: "2026/06/05 11:00",
          end: "2026/06/05 12:10",
        },
        status: "COMPLETED",
        resultUrl: "/quizzes/8/result",
        answerUrl: "/quizzes/8/answer",
      },
      {
        id: "quiz-007",
        title: "第7回テスト",
        examinationPeriod: {
          start: "2026/05/29 11:00",
          end: "2026/05/29 12:10",
        },
        status: "COMPLETED",
        resultUrl: "/quizzes/7/result",
        answerUrl: "/quizzes/7/answer",
      },
      {
        id: "quiz-006",
        title: "第6回テスト",
        examinationPeriod: {
          start: "2026/05/22 11:00",
          end: "2026/05/22 12:20",
        },
        status: "COMPLETED",
        resultUrl: "/quizzes/6/result",
        answerUrl: "/quizzes/6/answer",
      },
      {
        id: "quiz-005",
        title: "第5回テスト",
        examinationPeriod: {
          start: "2026/05/15 11:00",
          end: "2026/05/15 11:20",
        },
        status: "COMPLETED",
        resultUrl: "/quizzes/5/result",
        answerUrl: "/quizzes/5/answer",
      },
    ],
    bulletinBoardItems: [
      {
        id: "bbs-001",
        title:
          "ジョブ型就業体験プログラム 学生募集の案内(大学都市神戸産官学プラットフォーム)",
        postingPeriod: {
          start: "2026/06/17 13:30",
          end: "9999/12/31 00:00",
        },
        url: "/bbs/1",
      },
      {
        id: "bbs-002",
        title: "U-22 プログラミング・コンテスト2026",
        postingPeriod: {
          start: "2026/05/13 00:00",
          end: "9999/12/31 00:00",
        },
        url: "/bbs/2",
      },
    ],
  },
  {
    code: "1X007",
    title: "アルゴリズムとデータ構造",
    teachers: ["大川 剛直"],
    color: "blue",
    day: "mon",
    period: 3,
  },
  {
    code: "1X003",
    title: "線形代数",
    teachers: ["菊池 誠"],
    color: "blue",
    day: "tue",
    period: 3,
  },
  {
    code: "1X005",
    title: "物理基礎",
    teachers: ["陰山 聡", "臼井 英之"],
    color: "blue",
    day: "wed",
    period: 3,
  },
  {
    code: "1X004",
    title: "基礎解析",
    teachers: ["佐野 英樹"],
    color: "blue",
    day: "mon",
    period: 4,
  },
  {
    code: "1X006",
    title: "確率・統計・情報",
    teachers: ["澤 正憲"],
    color: "blue",
    day: "thu",
    period: 4,
  },
  {
    code: "1X012",
    title: "コンピュータシステム1",
    teachers: ["山下 歩", "竹内 尚輝"], // 重複していた「竹内 尚輝」を1つに統合
    color: "blue",
    day: "fri",
    period: 4,
  },
];
export const COLOR_STYLES: Record<
  CourseColor,
  { cell: string; badge: string; title: string; teacher: string }
> = {
  violet: {
    cell: "bg-violet-50/80 border-violet-200/70 hover:bg-violet-100/80",
    badge: "bg-violet-600 text-white",
    title: "text-violet-950",
    teacher: "text-violet-700/80",
  },
  blue: {
    cell: "bg-indigo-50/80 border-indigo-200/70 hover:bg-indigo-100/80",
    badge: "bg-indigo-600 text-white",
    title: "text-indigo-950",
    teacher: "text-indigo-700/80",
  },
  sky: {
    cell: "bg-sky-50/80 border-sky-200/70 hover:bg-sky-100/80",
    badge: "bg-sky-600 text-white",
    title: "text-sky-950",
    teacher: "text-sky-700/80",
  },
  amber: {
    cell: "bg-amber-50/80 border-amber-200/70 hover:bg-amber-100/80",
    badge: "bg-amber-500 text-white",
    title: "text-amber-950",
    teacher: "text-amber-700/80",
  },
  rose: {
    cell: "bg-rose-50/80 border-rose-200/70 hover:bg-rose-100/80",
    badge: "bg-rose-500 text-white",
    title: "text-rose-950",
    teacher: "text-rose-700/80",
  },
  teal: {
    cell: "bg-teal-50/80 border-teal-200/70 hover:bg-teal-100/80",
    badge: "bg-teal-600 text-white",
    title: "text-teal-950",
    teacher: "text-teal-700/80",
  },
};
