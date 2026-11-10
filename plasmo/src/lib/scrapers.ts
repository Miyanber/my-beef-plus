/**
 * ブラウザ(content script)専用のスクレイピング入口。
 * 「描画完了を待つ」処理だけをここに置き、実際の解析は副作用のない lib/parsers に任せる。
 */
import { parseCourseDetail, parseGlobalChrome, parseTasks, parseTimetable } from "./parsers";
import type { CourseDetail, GlobalChrome, TaskStore, TimetableStore } from "./timetable-data";
import { waitForDomReady, waitForSelector } from "./utils";

/** Quill で描画されるエディタ要素 (.ql-editor が生成されるまで待つ。空でも可) */
const QUILL_CONTAINERS = '#bodyEditor, #onlineBodyEditor, [id^="materialContentsBodyEditor"]';

async function waitForQuillEditors(): Promise<void> {
  const containers = Array.from(document.querySelectorAll(QUILL_CONTAINERS));
  await Promise.all(
    containers.map(async (container) => {
      try {
        const editor = await waitForSelector(".ql-editor", { root: container, timeout: 4000 });
        if (editor.classList.contains("ql-blank")) {
          // QuillUtil インスタンス化直後は .ql-blank で、直後の $(document).ready で setJsonData が呼ばれるため少し待つ
          await waitForSelector(".ql-editor:not(.ql-blank)", { root: container, timeout: 300 }).catch(() => {});
        }
      } catch {
        console.warn("[my-beef-plus] Quill editor not rendered:", container.id);
      }
    })
  );
}

export async function scrapeTimetable(): Promise<TimetableStore> {
  await waitForDomReady();
  await waitForSelector("#selectTimetable");
  return parseTimetable(document);
}

export async function scrapeCourseDetail(courseId: string): Promise<CourseDetail> {
  await waitForDomReady();
  await waitForSelector("#courseTopForm");
  await waitForQuillEditors();
  return parseCourseDetail(document, courseId);
}

export async function scrapeTasks(): Promise<TaskStore> {
  await waitForDomReady();
  await waitForSelector("#taskList");
  return parseTasks(document);
}

export async function scrapeGlobalChrome(): Promise<GlobalChrome> {
  await waitForDomReady();
  return parseGlobalChrome(document);
}

