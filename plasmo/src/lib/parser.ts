import type { Announcement, Attachment, CourseColor, CourseDetail, DayKey, LectureMaterial, TimetableCourse } from "./timetable-data";
import { waitForSelector } from "./utils";


export function parseBEEFTimetable(timetableCourses: Record<string, TimetableCourse>, formElement: HTMLFormElement | Document = document): Record<string, TimetableCourse> {
  const dayKeys: DayKey[] = ["mon", "tue", "wed", "thu", "fri"];
  const rows = formElement.querySelectorAll(".div-table-data-row");

  rows.forEach((row) => {
    const periodText = row.querySelector(".div-table-colomn-period")?.textContent?.trim() || "";
    const periodMatch = periodText.match(/([１２３４５６123456])時限/);
    if (!periodMatch) return;

    const rawPeriod = periodMatch[1];
    const period = parseInt(
      rawPeriod.replace(/[１-６]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0)),
      10
    );

    dayKeys.forEach((dayKey, index) => {
      const colClass = `${index + 1}-yobicol`;

      const cell = row.querySelector(`.div-table-cell[class*="${colClass}"]`);
      if (!cell) return;

      const lectureBlocks = cell.querySelectorAll(".clearfix");

      lectureBlocks.forEach((block) => {
        const titleEl = block.querySelector(".timetable-course-top-btn");
        if (!titleEl) return;

        const id = titleEl.id;
        if (!timetableCourses[id]) {
          const fullTitleText = titleEl.textContent?.trim() || "";

          const spaceIndex = fullTitleText.indexOf(" ");
          let code = "";
          let title = fullTitleText;
          if (spaceIndex !== -1) {
            code = fullTitleText.substring(0, spaceIndex).trim();
            title = fullTitleText.substring(spaceIndex + 1).trim();
          }

          const teacherSpans = block.querySelectorAll(".div-table-cell-detail span");
          const teachers: string[] = [];
          const seenTeachers = new Set<string>();

          teacherSpans.forEach((span) => {
            const name = span.textContent?.replace(/[\s,、]+/g, " ").trim() || "";
            if (name && name !== "," && !seenTeachers.has(name)) {
              teachers.push(name);
              seenTeachers.add(name);
            }
          });

          const course: TimetableCourse = {
            id,
            code,
            title,
            teachers,
            color: "blue" as CourseColor,
            dates: [
              {
                day: dayKey,
                period: period
              }
            ]
          };

          timetableCourses[id] = course;
        } else {
          timetableCourses[id].dates.push({
            day: dayKey,
            period: period
          })
        }
      });
    });
  });

  return timetableCourses;
}


/**
 * HTML文字列からCourseDetailオブジェクトを構築する関数
 * (ブラウザ環境のDOMParser、またはJSDOM環境を想定しています)
 */
export async function parseCourseDetailHTML(id: string, courseDetail: CourseDetail, selector: string): Promise<CourseDetail> {
  await waitForSelector(selector);

  const qlEditorWrappers: Element[] = [];
  qlEditorWrappers.push(...document.querySelectorAll(".course-material-edit-comment").values().toArray())
  await Promise.all(
    qlEditorWrappers.map(
      (element) => new Promise<void>(
        (resolve) => {
          waitForSelector(".ql-editor:not(.ql-blank)", { root: element }).then(
            () => resolve()
          );
        })
    )
  );

  const selectorElement = await waitForSelector(selector);
  console.log(document.getElementsByClassName("course-header")[0].outerHTML)

  // 1. 年度
  const rishunen = (document.querySelector('input[name="rishunen"]') as HTMLInputElement)?.value || "";

  // 2. 時間割コード・科目名
  const courseTitleSpans = document.querySelectorAll('.course-title-txt a.link-txt span');
  const semesterText = courseTitleSpans[0]?.textContent.trim() || ""; // "2026 前期"
  const courseCode = courseTitleSpans[1]?.textContent.trim() || "";    // "1X017"
  const courseName = courseTitleSpans[2]?.textContent.trim() || "";    // "演習1"

  // 3. 担当教員
  const teachersElement = document.querySelector('.course-view-title-txt:nth-child(1) span:nth-child(2)');
  const teachers = teachersElement?.textContent.trim() || "";

  // 4. 開講学期 (パース処理)
  const scheduleElement = document.querySelector('.subblock_form');
  const scheduleRaw = scheduleElement?.textContent.trim() || ""; // "前期/金曜日/２時限"

  let formattedSchedule = null;
  if (scheduleRaw) {
    const parts = scheduleRaw.split('/');
    if (parts.length === 3) {
      const semester = parts[0];                          // "前期"
      const day = parts[1].replace('曜日', '');           // "金曜日" -> "金"
      const period = parts[2].replace(/[^0-9１-９]/g, '') // 数字か全角数字のみ抽出
        .replace(/[１-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0)); // 全角を半角に変換 ("２" -> "2")

      formattedSchedule = { semester, day, period: parseInt(period, 10) || period };
    }
  }

  // 5. コースの概要説明
  const summaryElement = document.querySelector('.contents-title-txt:nth-child(2)');
  // "コースの概要説明/Course Summary" のラベル部分を削除して本文のみを抽出
  const courseSummaryText = summaryElement?.textContent.replace(/^コースの概要説明\/Course Summary\s*/, '').trim() || "";
  const bodyQlEditor = document.querySelector("#bodyEditor .ql-editor");
  let courseSumaryRaw = "";
  if (bodyQlEditor) {
    courseSumaryRaw = bodyQlEditor.innerHTML.trim();
  }
  const courseSummary = {
    text: courseSummaryText,
    rawHTML: courseSumaryRaw
  }

  // --- 結果の出力 ---
  console.log({
    "年度": rishunen,
    "開講時期(表示)": semesterText,
    "時間割コード": courseCode,
    "科目名": courseName,
    "担当教員": teachers,
    "開講学期(パース後)": formattedSchedule ? `(${formattedSchedule.semester}, ${formattedSchedule.day}, ${formattedSchedule.period})` : null,
    "コースの概要説明": courseSummary
  });

  // 3. classDetailsの抽出 (#onlineBodyEditor のHTMLと更新日時)
  let classDetails: CourseDetail["classDetails"] = undefined;
  const onlineBody = selectorElement.querySelector("#onlineBodyEditor .ql-editor");
  if (onlineBody) {
    const onlineUpdateText = selectorElement.querySelector(".online-update-txt")?.textContent || "";
    const updatedAt = onlineUpdateText.replace("更新日時:", "").trim();
    classDetails = {
      rawHTML: onlineBody.innerHTML.trim(),
      updatedAt: updatedAt,
    };
  }

  // 4. announcements (お知らせ) のパース
  const announcements: Announcement[] = [];
  const infoBlocks = selectorElement.querySelectorAll(".sortInformationParent .sortInformationBlock");
  infoBlocks.forEach((block) => {
    const titleElem = block.querySelector(".infoTitle");
    const title = titleElem?.textContent?.trim() || "";

    // 掲載期間
    const periodSpans = block.querySelectorAll(".infoPeriod span");
    const start = periodSpans[0]?.textContent?.trim() || "";
    const end = periodSpans[2]?.textContent?.trim() || "";

    // 差出人 (HTML上の "送信者：担当教員" から "担当教員" を抽出)
    const senderText = block.querySelector(".infoSender")?.textContent?.trim() || "";
    const sender = senderText.replace("送信者：", "").trim();

    // 本文 (HTML構造上、一覧にはダイアログ用のonclick属性しか無いため、フォールバックとしてonclickのJavascript文字列を保持)
    const content = titleElem?.getAttribute("onclick") || "";

    announcements.push({
      title,
      postingPeriod: { start, end },
      sender,
      content,
    });
  });

  // 5. lectureMaterials (教材) のパース
  const lectureMaterials: LectureMaterial[] = [];
  const materialList = selectorElement.querySelector("#materialList");

  if (materialList) {
    // 各回の塊（.contents-detail）を基準にループします
    const details = materialList.querySelectorAll(".contents-detail");

    for (const detail of details) {
      // 該当セクションのタイトル（例：「第13回授業資料」）
      const titleLabel = detail.querySelector(".block-title label");
      if (!titleLabel) continue;
      const title = titleLabel.textContent?.trim() || "";

      let start = "";
      let end = "";
      let description = "";
      const attachments: Attachment[] = [];

      // タイトル要素以降の次の要素から兄弟要素を順に走査し、
      // 次の回の塊（.material-sub-color を持つ要素）が出現するまで情報を収集する
      let currentElement = detail.nextElementSibling;
      while (currentElement && !currentElement.querySelector(".block-title")) {

        // 公開期間の抽出
        const headerTxt = currentElement.querySelector(".contents-header-txt .bold-txt")?.textContent?.trim();
        if (headerTxt === "公開期間") {
          const periodText = currentElement.querySelector(".contents-input-area span")?.textContent?.trim() || "";
          const parts = periodText.split("～");
          if (parts.length === 2) {
            start = parts[0].trim();
            end = parts[1].trim();
          }
        }

        // 説明・コメントの抽出
        if (currentElement.classList.contains("course-material-edit-comment")) {
          const editor = await waitForSelector(".ql-editor:not(.ql-blank)", { root: currentElement }) as HTMLDivElement;
          description = editor.innerHTML.trim();
        }

        // 資料ファイル (.materialCss) の抽出
        if (currentElement.classList.contains("materialCss")) {
          // 資料タイトル / リンク名
          const fileA = currentElement.querySelector<HTMLAnchorElement>(".course-view-material-file-name .material-file-name");
          const attachmentTitle = fileA?.textContent?.trim() || "";

          // ファイル名 (material-type-file-name 枠の label)
          const fileName = currentElement.querySelector(".material-type-file-name label")?.textContent?.trim() || attachmentTitle;

          // ファイル個別コメント
          const comment = currentElement.querySelector(".course-view-material-comment")?.textContent?.trim() || "";

          const materialId = currentElement.id;

          if (attachmentTitle) {
            attachments.push({
              title: attachmentTitle,
              fileName,
              comment,
              materialId,
            });
          }
        }

        currentElement = currentElement.nextElementSibling;
      }

      lectureMaterials.push({
        title,
        publicationPeriod: { start, end },
        description,
        attachments,
      });
    };
  }

  const lastUpdated = new Date().toISOString();

  // HTML側に対象セクションが存在しないデータは、型を充足させるため空配列で返却します
  return {
    id,
    lastUpdated,
    courseSummary,
    classDetails,
    messages: [],
    announcements,
    lectureMaterials,
    assignments: [],
    quizzes: [],
    bulletinBoardItems: [],
  };
}