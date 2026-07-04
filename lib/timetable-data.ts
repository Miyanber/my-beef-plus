export type CourseColor = "violet" | "blue" | "sky" | "amber" | "rose" | "teal"

export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri"

export const DAYS: { key: DayKey; label: string; sub: string }[] = [
  { key: "mon", label: "月", sub: "Mon" },
  { key: "tue", label: "火", sub: "Tue" },
  { key: "wed", label: "水", sub: "Wed" },
  { key: "thu", label: "木", sub: "Thu" },
  { key: "fri", label: "金", sub: "Fri" },
]

export const PERIODS = [1, 2, 3, 4, 5, 6]

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
  title: string;        // 資料タイトル (exercise.pdf)
  fileName: string;     // ファイル名 (exercise.pdf)
  comment: string;      // コメント (空文字)
  downloadUrl: string;  // 実際のファイルURL
}

// 課題
interface Assignment {
  id: string;           // 課題を一意に識別するID
  title: string;        // 課題タイトル (演習問題 (2026/6/16・6/23))
  submissionPeriod: {   // 提出期間
    start: string;      // 提出開始日 (2026/06/16 12:00)
    end: string;        // 提出終了日 (2026/06/27 00:00)
  };
  submissionStatus: "SUBMITTED_ON_TIME" | "NOT_SUBMITTED_YET" | "SUBMITTED_OUT_TIME";    // 提出状況 (期限内提出)
  url: string;          // 課題提出ページへのURL
}

interface Quiz {
  id: string;                  // テストを一意に識別するID
  title: string;               // テストタイトル (第11回テスト)
  examinationPeriod: {         // 解答期間・期限
    start: string;             // 開始日時 (2026/06/26 10:40)
    end: string;               // 終了日時・期限 (2026/06/26 12:15)
  };
  status: QuizStatus;          // 解答ステータス (解答済)
  resultUrl?: string;             // 結果ページへのURL (解答済の場合のみ)
  answerUrl?: string;             // 解答ページへのURL (解答済の場合のみ)
}

// ステータスを型安全に管理する場合のEnum例
type QuizStatus = 'COMPLETED' | 'UNANSWERED' | 'EXPIRED'; // 解答済, 未解答, 期間外 など

interface bulletinBoard {

}

// 1つの授業を表すインターフェース（再利用性が高い）
export interface Course {
  code: string;
  title: string;
  teachers: string[]; // カンマ区切りの文字列から「配列」に変更
  color: CourseColor;
  day: DayKey;        // 曜日をデータ側に持たせる
  period: number;     // 時限（コマ）をデータ側に持たせる
  courseSummary?: string; // コースの概要説明
  classDetails?: {
    innerHTML: string;
    updatedAt: string;
  };  // 授業情報
  messages?: Message[]; // 担当者へのメッセージ
  announcements?: Announcement[]; // お知らせ
  lectureMaterials?: LectureMaterial[]; // 教材
  assignments?: Assignment[]; // 課題
  quizzes?: Quiz[]; // テスト
}

// 汎用的なフラット配列
export const COURSES: Course[] = [
  {
    code: "CS101",
    title: "情報科学概論",
    teachers: ["神戸 太郎", "六甲 次郎", "灘 三郎", "東灘 四郎", "須磨 五郎", "垂水 六郎", "兵庫 七郎", "長田 八郎"],
    color: "blue",
    day: "wed",
    period: 1,
  },
  {
    code: "MA102",
    title: "代数学演習A",
    teachers: ["北 九郎", "中央 十郎"],
    color: "blue",
    day: "thu",
    period: 1,
  },
  {
    code: "MA103",
    title: "微分積分演習A",
    teachers: ["北 九郎", "中央 十郎"],
    color: "blue",
    day: "thu",
    period: 1,
  },
  {
    code: "EN201",
    title: "専門英語B",
    teachers: ["須磨 五郎", "ポート 花子"],
    color: "blue",
    day: "fri",
    period: 1,
  },
  {
    code: "MA101",
    title: "情報数学基礎",
    teachers: ["海山 健一"],
    color: "blue",
    day: "tue",
    period: 2,
  },
  {
    code: "CS102",
    title: "基礎演習A",
    teachers: ["山手 翔太", "Prof. Sample A", "浜辺 亮", "港 雄大", "担当教員グループ", "明石 誠", "長田 八郎", "芦屋 蓮", "西宮 陽介"],
    color: "blue",
    day: "fri",
    period: 2,
    courseSummary: "本講義では、基礎的な理論と応用手法について段階的に学習します。各回の演習を通じて理解を深め、実践的な問題解決能力を養います。",
    classDetails: {
      innerHTML: `<p>本講義のシラバスおよび各回の実施計画です（サンプルデータ）。</p>`,
      updatedAt: `2026/04/09 15:55`
    },
    messages: [],
    announcements: [
      {
        title: "第11回の講義について",
        postingPeriod: {
          start: "2026/06/26 07:50",
          end: "9999/12/31 00:00",
        },
        sender: "神戸　太郎",
        content: `<p>次回の講義に関する連絡事項です。</p><p>詳細は授業ページをご確認ください。</p><p>質問がある場合はメッセージ機能よりご連絡ください。</p>`
      }
    ],
    lectureMaterials: [
      {
        title: "第6回授業資料",
        publicationPeriod: {
          start: "2026/05/21 00:00",
          end: "9999/12/31 23:59"
        },
        description: "<p>第1回（4/10）授業資料です。</p>",
        attachments: [
          {
            title: "sample_material_1.pdf",
            fileName: "sample_material_1.pdf",
            comment: "",
            downloadUrl: "/downloads/sample_material_1.pdf"
          },
          {
            title: "sample_material_1_rev.pdf",
            fileName: "sample_material_1_rev.pdf",
            comment: "課題の問題に訂正があったので、訂正したものを再度掲載しておきます。",
            downloadUrl: "/downloads/sample_material_1_rev.pdf"
          },
          {
            title: "sample_notebook.ipynb",
            fileName: "sample_notebook.ipynb",
            comment: "授業時のプログラムの例です",
            downloadUrl: "/downloads/sample_notebook.ipynb"
          }
        ]
      }
    ],
    assignments: [],
    quizzes: [],
  },
  {
    code: "CS103",
    title: "データ構造入門",
    teachers: ["灘 三郎"],
    color: "blue",
    day: "mon",
    period: 3,
  },
  {
    code: "MA104",
    title: "線型空間論",
    teachers: ["尼崎 拓真"],
    color: "blue",
    day: "tue",
    period: 3,
  },
  {
    code: "PH101",
    title: "力学基礎",
    teachers: ["姫路 大地", "宝塚 悠斗"],
    color: "blue",
    day: "wed",
    period: 3,
  },
  {
    code: "MA105",
    title: "微分積分学",
    teachers: ["三田 直樹"],
    color: "blue",
    day: "mon",
    period: 4,
  },
  {
    code: "ST101",
    title: "確率統計基礎",
    teachers: ["伊丹 和也"],
    color: "blue",
    day: "thu",
    period: 4,
  },
  {
    code: "CS104",
    title: "計算機基礎A",
    teachers: ["西宮 陽介", "川西 智也"], // 重複していた「川西 智也」を1つに統合
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
}
