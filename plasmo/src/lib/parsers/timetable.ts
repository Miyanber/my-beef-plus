import {
  pickCourseColor,
  type DayKey,
  type SelectOption,
  type TimetableCourse,
  type TimetableStore,
} from "../timetable-data";
import { getBeef2026Url } from "../storage-cache";
import { norm, textOf, toHalfWidthDigits } from "./dom";

const DAY_KEYS: DayKey[] = ["mon", "tue", "wed", "thu", "fri"];

function readOptions(select: Element | null | undefined): SelectOption[] {
  if (!select) return [];
  return Array.from(select.querySelectorAll("option")).map((o) => ({
    value: o.getAttribute("value") ?? "",
    label: norm(o.textContent),
  }));
}

function selectedValue(select: Element | null | undefined): string {
  if (!select) return "";
  const selected = select.querySelector("option[selected]") as Element | null;
  return selected?.getAttribute("value") ?? (select as HTMLSelectElement).value ?? "";
}

/** "神戸　太郎" / ", 六甲　次郎" のような教員名表記を整える */
function cleanTeacherName(raw: string): string {
  return norm(raw.replace(/^[\s\u3000,、，]+/, ""));
}

/**
 * 時間割画面 (/lms/timetable) のDOMを解析する。
 * @param root `document` もしくは時間割フォーム
 */
export function parseTimetable(root: ParentNode): TimetableStore {
  const courses: Record<string, TimetableCourse> = {};

  root.querySelectorAll(".div-table-data-row").forEach((row) => {
    const periodText = toHalfWidthDigits(textOf(row.querySelector(".div-table-colomn-period")));
    const periodMatch = periodText.match(/(\d)\s*時限/);
    if (!periodMatch) return;
    const period = parseInt(periodMatch[1], 10);

    const cells = Array.from(row.querySelectorAll(".div-table-cell"));

    DAY_KEYS.forEach((day, index) => {
      const cell = cells.find((c) => c.classList.contains(`${index + 1}-yobicol`));
      if (!cell) return;

      cell.querySelectorAll(".timetable-course-top-btn").forEach((titleEl) => {
        const id = titleEl.id;
        if (!id) return;

        const existing = courses[id];
        if (existing) {
          // 週複数コマ / 連続コマの授業は枠を追加するだけ
          if (!existing.dates.some((d) => d.day === day && d.period === period)) {
            existing.dates.push({ day, period });
          }
          return;
        }

        const fullTitle = textOf(titleEl);
        const spaceIndex = fullTitle.indexOf(" ");
        const code = spaceIndex === -1 ? "" : fullTitle.slice(0, spaceIndex);
        const title = spaceIndex === -1 ? fullTitle : fullTitle.slice(spaceIndex + 1);

        // 教員名は .div-table-cell-detail 直下の最初のdiv (.div-table-cell-info は除く)
        const block = titleEl.parentElement ?? cell;
        const teacherRoot =
          Array.from(block.querySelectorAll(".div-table-cell-detail > div")).find(
            (d) => !d.classList.contains("div-table-cell-info"),
          ) ?? null;
        const teachers: string[] = [];
        teacherRoot?.querySelectorAll("span").forEach((span) => {
          // "A, B" のように1つのspanに複数入っている場合にも対応
          (span.textContent ?? "").split(/[,、，]/).forEach((part) => {
            const name = cleanTeacherName(part);
            if (name && !teachers.includes(name)) teachers.push(name);
          });
        });

        courses[id] = {
          id,
          code,
          title,
          teachers,
          color: pickCourseColor(code || id),
          beef2026Url: getBeef2026Url(id, code),
          dates: [{ day, period }],
        };
      });
    });
  });

  const yearSelect = root.querySelector("#nendo");
  const termSelect = root.querySelector("#kikanCd");

  return {
    lastUpdated: new Date().toISOString(),
    year: selectedValue(yearSelect),
    termCode: selectedValue(termSelect),
    weekRange: textOf(root.querySelector(".selected-display-date")),
    isCurrent: root.querySelector("#isToday")?.getAttribute("value") === "true",
    yearOptions: readOptions(yearSelect),
    termOptions: readOptions(termSelect).filter((o) => o.value !== ""),
    courses,
  };
}
