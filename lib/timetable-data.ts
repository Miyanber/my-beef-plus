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
