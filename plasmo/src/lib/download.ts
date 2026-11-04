import type { Attachment } from "./timetable-data";

/**
 * BEEF+ のネイティブ機構を使った教材ダウンロード。
 *  1. 一時ファイルID (fileId) を発行するAPIを呼ぶ
 *  2. ページ内の共通フォーム (#materialsSetDownFileForm) に値を入れて送信
 * ログイン済みセッションをそのまま使うため、認証情報には一切触れない。
 */
export async function downloadMaterial(courseId: string, attachment: Attachment): Promise<void> {
  const d = attachment.download;
  if (!d || !d.objectName || !d.resourceId) {
    throw new Error("ダウンロード情報が見つかりません");
  }

  const query = new URLSearchParams({
    fileName: d.fileName,
    objectName: d.objectName,
    id: d.resourceId,
    idnumber: courseId,
  });
  const response = await fetch(`/lms/course/make/tempfile?${query.toString()}`, { credentials: "same-origin" });
  if (!response.ok) throw new Error(`ファイルの準備に失敗しました (HTTP ${response.status})`);
  const fileId = (await response.text()).trim();
  if (!fileId) throw new Error("ファイルIDを取得できませんでした");

  const form = document.querySelector<HTMLFormElement>("#materialsSetDownFileForm");
  if (!form) throw new Error("BEEF+のダウンロードフォームが見つかりません");

  const set = (selector: string, value: string) => {
    const input = form.querySelector<HTMLInputElement>(selector);
    if (input) input.value = value;
  };
  set("#fileName", d.fileName);
  set("#fileId", fileId);
  set("#resourceId", d.resourceId);
  set("#contentId", d.contentId);
  set("#endDate", d.endDate);

  form.setAttribute("action", `/lms/course/material/setfiledown/${encodeURIComponent(d.fileName)}`);
  form.submit();
}

