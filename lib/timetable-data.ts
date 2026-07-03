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

// 1つの授業を表すインターフェース（再利用性が高い）
export interface Course {
  code: string;
  title: string;
  teachers: string[]; // カンマ区切りの文字列から「配列」に変更
  color: CourseColor;
  day: DayKey;        // 曜日をデータ側に持たせる
  period: number;     // 時限（コマ）をデータ側に持たせる
}

// 汎用的なフラット配列
export const COURSES: Course[] = [
  {
    code: "1X016",
    title: "システム情報学入門",
    teachers: ["太田 能", "的場 修", "大川 剛直", "藤井 信忠", "仁田 功一", "國領 大介", "古賀 朱門", "上島 基之"],
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
    teachers: ["三宅 洋平", "FINNERTY PATRICK MARTIN", "森田 紘平", "中田 柊也", "システム情報学部教員", "山本 大介", "上島 基之", "中島 涼輔", "山下 歩"],
    color: "blue",
    day: "fri",
    period: 2,
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
}
