import type { DateRange } from "./timetable-data";
import { isUnlimited, norm, parseBeefDate } from "./parsers/dom";

/** "2026/11/05 12:00:00" -> "11/05 12:00" / 9999年 -> "無期限" */
export function formatDateTime(s: string | null | undefined): string {
  const text = norm(s);
  if (!text) return "";
  if (isUnlimited(text)) return "無期限";
  const m = text.match(/^\d{4}\/(\d{1,2})\/(\d{1,2})(?:\s+(\d{1,2}:\d{2}))?/);
  if (!m) return text;
  return `${m[1].padStart(2, "0")}/${m[2].padStart(2, "0")}${m[3] ? " " + m[3] : ""}`;
}

/** 期間を "07/17 11:30 〜 無期限" の形にする */
export function formatRange(range: DateRange | undefined): string {
  if (!range || (!range.start && !range.end)) return "";
  return `${formatDateTime(range.start)} 〜 ${formatDateTime(range.end)}`;
}

export type Urgency = "overdue" | "today" | "soon" | "week" | "later" | "none";

export interface DeadlineInfo {
  urgency: Urgency;
  /** 「あと3時間」「期限切れ」など */
  label: string;
  /** 期限のミリ秒 (解釈できなければ null) */
  time: number | null;
}

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** 期限までの残り時間と緊急度を求める */
export function getDeadlineInfo(deadline: string, now: number = Date.now()): DeadlineInfo {
  const time = parseBeefDate(deadline);
  if (time === null || isUnlimited(deadline)) return { urgency: "none", label: "", time };

  const diff = time - now;
  if (diff < 0) return { urgency: "overdue", label: "期限切れ", time };
  if (diff < HOUR) return { urgency: "today", label: `あと${Math.max(1, Math.floor(diff / MINUTE))}分`, time };
  if (diff < DAY) return { urgency: "today", label: `あと${Math.floor(diff / HOUR)}時間`, time };
  if (diff < 3 * DAY) return { urgency: "soon", label: `あと${Math.floor(diff / DAY)}日`, time };
  if (diff < 7 * DAY) return { urgency: "week", label: `あと${Math.floor(diff / DAY)}日`, time };
  return { urgency: "later", label: `あと${Math.floor(diff / DAY)}日`, time };
}

