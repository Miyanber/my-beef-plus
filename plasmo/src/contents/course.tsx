
import type { PlasmoCSConfig } from "plasmo"
import { useStorage } from "@plasmohq/storage/hook"

// コンポーネントのパスは環境に合わせて適宜微調整してください
import { useEffect } from "react"
import { getDefaultStyle } from "~lib/plasmo-style"
import { DefaultLayout } from "~pages/layout"
import type { CourseDetail, Announcement, LectureMaterial, Attachment } from "@/lib/timetable-data"
import { Bell, Edit3, FilePenLine, FileText, Mail, MessageSquare, MoreVertical } from "lucide-react"
import { executeIfExpired, waitForSelector } from "~lib/utils"

export const config: PlasmoCSConfig = {
  matches: ["https://beefplus.center.kobe-u.ac.jp/lms/course*"],
  run_at: "document_start"
}

export const getStyle = getDefaultStyle

interface SectionProps {
  title: string;
  bgColor: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const SectionWrapper: React.FC<SectionProps> = ({ title, bgColor, icon, children }) => {
  return (
    <div className="flex flex-col md:flex-row border border-gray-300 shadow-sm bg-white rounded-sm overflow-hidden mb-6">
      {/* 左側のカラーラベルエリア */}
      <div className={`${bgColor} text-white flex flex-col items-center justify-center p-4 w-full md:w-32 flex-shrink-0 text-center gap-2`}>
        {icon}
        <span className="font-bold text-sm tracking-wider">{title}</span>
      </div>
      {/* 右側のコンテンツエリア */}
      <div className="flex-1 p-4 overflow-x-auto">
        {children}
      </div>
    </div>
  );
};

/**
 * HTML文字列からCourseDetailオブジェクトを構築する関数
 * (ブラウザ環境のDOMParser、またはJSDOM環境を想定しています)
 */
export function parseCourseDetailHTML(id: string, courseDetail: CourseDetail, formElement: HTMLFormElement | Document = document): CourseDetail {
  const document = formElement;

  // 2. courseSummaryの抽出 (#bodyEditor の中のテキスト)
  const courseSummary = document.querySelector("#bodyEditor")?.textContent?.trim() || undefined;

  // 3. classDetailsの抽出 (#onlineBodyEditor のHTMLと更新日時)
  let classDetails: CourseDetail["classDetails"] = undefined;
  const onlineBody = document.querySelector("#onlineBodyEditor .ql-editor");
  if (onlineBody) {
    const onlineUpdateText = document.querySelector(".online-update-txt")?.textContent || "";
    const updatedAt = onlineUpdateText.replace("更新日時:", "").trim();
    classDetails = {
      rawHTML: onlineBody.innerHTML.trim(),
      updatedAt: updatedAt,
    };
  }

  // 4. announcements (お知らせ) のパース
  const announcements: Announcement[] = [];
  const infoBlocks = document.querySelectorAll(".sortInformationParent .sortInformationBlock");
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
  const materialList = document.querySelector("#materialList");

  if (materialList) {
    // 各回の塊（.contents-detail）を基準にループします
    const details = materialList.querySelectorAll(".contents-detail");

    details.forEach((detail) => {
      // 該当セクションのタイトル（例：「第13回授業資料」）
      const titleLabel = detail.querySelector(".material-sub-color label");
      if (!titleLabel) return;
      const title = titleLabel.textContent?.trim() || "";

      let start = "";
      let end = "";
      let description = "";
      const attachments: Attachment[] = [];

      // タイトル要素以降の次の要素から兄弟要素を順に走査し、
      // 次の回の塊（.material-sub-color を持つ要素）が出現するまで情報を収集する
      let currentElement = detail.nextElementSibling;
      while (currentElement && !currentElement.querySelector(".material-sub-color")) {

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
        const editor = currentElement.querySelector(".ql-editor");
        if (editor) {
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
    });
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

// メインのコンポーネント
const PlasmoSidebarOverlay = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get("id") || "default";
  const [courseDetail, setCourseDetail] = useStorage<CourseDetail>(`course_${id}`, {
    id: "default",
    lastUpdated: new Date(0).toISOString(),
    courseSummary: "",
    messages: [],
    announcements: [],
    lectureMaterials: [],
    assignments: [],
    quizzes: [],
    bulletinBoardItems: []
  });

  // 資料などは除外
  if (window.location.pathname !== "/lms/course") {
    return null;
  }

  useEffect(() => {
    const nowDate = new Date();
    const ONE_DAY = 24 * 60 * 60 * 1000;

    executeIfExpired(courseDetail, ONE_DAY, async () => {
      const form = await waitForSelector("#courseTopForm") as HTMLFormElement;
      const parsedData = parseCourseDetailHTML(id, courseDetail, form);
      const contentsWrapper = await waitForSelector("#contentsWrapper") as HTMLElement;
      contentsWrapper.hidden = true;
      setCourseDetail({
        ...parsedData,
        lastUpdated: nowDate.toISOString()
      });
    });

  }, []);

  return (
    <DefaultLayout>
      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* コースの概要説明 */}
        <section className="bg-white border border-gray-300 rounded-sm p-4 mb-6 shadow-sm">
          <h2 className="text-base font-bold border-b border-gray-200 pb-2 mb-3">コースの概要説明/Course Summary</h2>
          <p className="text-sm text-gray-600">{courseDetail.courseSummary}</p>
        </section>

        {/* 授業情報 */}
        <section className="bg-white border border-gray-300 rounded-sm p-4 mb-6 shadow-sm">
          <h2 className="text-base font-bold border-b border-gray-200 pb-2 mb-2">授業情報</h2>
          <p className="text-xs text-gray-400 mb-3">更新日時:{courseDetail.classDetails?.updatedAt}</p>
          <div
            className="prose max-w-none text-slate-700"
            dangerouslySetInnerHTML={{ __html: courseDetail.classDetails ? courseDetail.classDetails.rawHTML : "" }}
          />
        </section>

        {/* --- 各セクションブロック --- */}

        {/* 担当へのメッセージ */}
        <SectionWrapper title="担当へのメッセージ" bgColor="bg-[#4caf50]" icon={<Mail size={24} />}>
          <div className="w-full">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-300 text-gray-500 font-medium">
                  <th className="pb-2 w-1/2">タイトル ▽</th>
                  <th className="pb-2 w-1/4">問い合わせ作成日時 ▽</th>
                  <th className="pb-2 w-1/4">ステータス ▽</th>
                </tr>
              </thead>
              <tbody>
                {/* メッセージ履歴がない場合の空表示、または行を追加 */}
                <tr>
                  <td colSpan={3} className="py-4 text-center text-gray-400">メッセージはありません</td>
                </tr>
              </tbody>
            </table>
            <button className="mt-3 flex items-center justify-center w-8 h-8 rounded-full bg-[#4caf50] text-white hover:bg-[#43a047] transition shadow-sm">
              <span className="text-xl font-bold leading-none">+</span>
            </button>
          </div>
        </SectionWrapper>

        {/* お知らせ */}
        <SectionWrapper title="お知らせ" bgColor="bg-[#a16e2b]" icon={<Bell size={24} />}>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-300 text-gray-500 font-medium">
                <th className="pb-2 w-7/12">お知らせタイトル ▽</th>
                <th className="pb-2 w-5/12">掲載期間 ▽</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {courseDetail.announcements && courseDetail.announcements.map(announcement => (
                <tr className="hover:bg-gray-50" key={announcement.postingPeriod.start}>
                  <td className="py-2.5 font-bold text-blue-800 hover:underline cursor-pointer">{announcement.title}</td>
                  <td className="py-2.5 text-gray-600">{announcement.postingPeriod.start} 〜 {announcement.postingPeriod.end}</td>
                </tr>
              ))}

            </tbody>
          </table>
        </SectionWrapper>

        {/* 教材 */}
        <SectionWrapper title="教材" bgColor="bg-[#4ba3c3]" icon={<Edit3 size={24} />}>
          <div className="space-y-4 text-xs">
            {/* 演習問題 */}
            {courseDetail.lectureMaterials && courseDetail.lectureMaterials.map(material => (
              <div key={material.title} className="bg-[#e2e8cc] p-3 rounded-sm">
                <div className="font-bold mb-1">{material.title}</div>
                <div className="text-gray-600 mb-2">公開期間：{material.publicationPeriod.start} 〜 {material.publicationPeriod.end}</div>
                <div className="text-gray-700 mb-3 pl-1" dangerouslySetInnerHTML={{ __html: material.description }}></div>
                {material.attachments.length > 0 && (
                  <table className="w-full border-t border-gray-300 pt-2">
                    <thead>
                      <tr className="text-gray-500 font-medium text-left">
                        <th className="py-1 w-1/3">資料タイトル</th>
                        <th className="py-1 w-1/3">ファイル名</th>
                        <th className="py-1 w-1/3">コメント</th>
                      </tr>
                    </thead>
                    <tbody>
                      {material.attachments.map(attachment => (
                        <tr key={attachment.materialId} className="border-t border-dashed border-gray-300">
                          <td onClick={async () => {
                            try {
                              // 1. 元のHTMLの「隠し要素」たちがまだ残っている場所からデータを直接取得する
                              // ※ セレクターは実際のHTML構造（#material248364 など）に合わせて調整してください
                              const materialBlock = document.querySelector(`#${attachment.materialId}`);
                              if (!materialBlock) {
                                console.error("元データのブロックが見つかりません");
                                return;
                              }

                              const downloadFileName = materialBlock.querySelector(".fileName")?.textContent?.trim() || "";
                              const objectName = materialBlock.querySelector(".objectName")?.textContent?.trim() || "";
                              const resourceId = materialBlock.querySelector(".resource_Id")?.textContent?.trim() || "";
                              const endDate = materialBlock.querySelector(".openEndDate")?.textContent?.trim() || "";
                              const dlMaterialId = (materialBlock.querySelector("#dlMaterialId") as HTMLInputElement)?.value || "";
                              const idnumber = (document.querySelector('input[type="hidden"][name="idnumber"]') as HTMLInputElement)?.value || "";

                              // 2. BEEF+の仕様：一時的な fileId を取得するAPIを叩く
                              const tempFileUrl = `/lms/course/make/tempfile?fileName=${encodeURIComponent(downloadFileName)}&objectName=${encodeURIComponent(objectName)}&id=${resourceId}&idnumber=${idnumber}`;

                              const response = await fetch(tempFileUrl);
                              if (!response.ok) throw new Error("ネットワークエラーが発生しました");
                              const officialFileId = await response.text(); // これで本物の fileId が取れる

                              // 3. 画面内にあるBEEF+の共通フォーム（#materialsSetDownFileForm）に値を直接セットする
                              const form = document.querySelector("#materialsSetDownFileForm") as HTMLFormElement;
                              if (!form) {
                                console.error("BEEF+のダウンロードフォームが見つかりません");
                                return;
                              }

                              (form.querySelector("#fileName") as HTMLInputElement).value = downloadFileName;
                              (form.querySelector("#fileId") as HTMLInputElement).value = officialFileId;
                              (form.querySelector("#resourceId") as HTMLInputElement).value = resourceId;
                              (form.querySelector("#contentId") as HTMLInputElement).value = dlMaterialId;
                              (form.querySelector("#endDate") as HTMLInputElement).value = endDate;

                              // 4. 送信先URLを設定して、フォームを強制サブミット！
                              const actionUrl = "/lms/course/material/setfiledown/" + encodeURIComponent(downloadFileName);
                              form.setAttribute("action", actionUrl);

                              form.submit();

                            } catch (error) {
                              console.error("ダウンロード処理でエラーが発生しました:", error);
                            }
                          }} className="py-2 font-bold text-blue-800 hover:underline cursor-pointer">
                            {attachment.title}
                          </td>
                          <td className="py-2 text-gray-600">{attachment.fileName}</td>
                          <td className="py-2 text-gray-400">{attachment.comment}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

              </div>
            ))}

          </div>
        </SectionWrapper>

        {/* 課題 */}
        <SectionWrapper title="課題" bgColor="bg-[#e26d5c]" icon={<FileText size={24} />}>
          <table className="w-full text-left text-xs border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-300 text-gray-500 font-medium">
                <th className="pb-2 w-4/12">課題タイトル ▽</th>
                <th className="pb-2 w-2/12">提出開始日 ▽</th>
                <th className="pb-2 w-2/12">提出終了日 ▽</th>
                <th className="pb-2 w-2/12">提出状況 ▽</th>
                <th className="pb-2 w-2/12 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {courseDetail.assignments && courseDetail.assignments.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="py-3 font-bold text-blue-800 hover:underline cursor-pointer">{item.title}</td>
                  <td className="py-3 text-gray-600">{item.submissionPeriod.start}</td>
                  <td className="py-3 text-gray-600">{item.submissionPeriod.end}</td>
                  <td className="py-3 text-green-700 font-medium">{item.submissionStatus}</td>
                  <td className="py-3 text-center">
                    {/* 操作ボタン風のドット三つメニュー */}
                    <button className="inline-flex flex-col gap-0.5 items-center justify-center w-6 h-6 rounded-full bg-gray-700 text-white hover:bg-gray-800 transition">
                      <span className="w-1 h-1 bg-white rounded-full">A</span>
                      <span className="w-1 h-1 bg-white rounded-full">B</span>
                      <span className="w-1 h-1 bg-white rounded-full">C</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionWrapper>

        {/* テスト */}
        <SectionWrapper title="テスト" bgColor="bg-[#3b78be]" icon={<FilePenLine size={24} />}>
          <table className="w-full text-left text-xs border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-300 text-gray-700 font-medium">
                <th className="pb-3 pt-2 pl-4 w-4/12">テストタイトル ▽</th>
                <th className="pb-3 pt-2 w-4/12">解答期間・期限 ▽</th>
                <th className="pb-3 pt-2 w-2/12">解答ステータス ▽</th>
                <th className="pb-3 pt-2 pr-4 w-2/12 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {courseDetail.quizzes && courseDetail.quizzes.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-100 even:bg-[#fdfaf2] transition-colors">
                  <td className="py-4 pl-4 font-bold text-blue-800 hover:underline cursor-pointer">
                    {item.title}
                  </td>
                  <td className="py-4 text-gray-500">
                    {item.examinationPeriod.start} ～ {item.examinationPeriod.end}
                  </td>
                  <td className="py-4 text-gray-700">
                    {item.status}
                  </td>
                  <td className="py-4 pr-4 text-center">
                    {/* 操作ボタン（丸背景＋縦の3点リーダー） */}
                    <button className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#555555] text-white hover:bg-gray-800 transition">
                      <MoreVertical size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionWrapper>

        <SectionWrapper title="掲示板" bgColor="bg-[#358f80]" icon={<MessageSquare size={24} />}>
          <table className="w-full text-left text-xs border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-300 text-gray-700 font-medium">
                <th className="pb-3 pt-2 pl-4 w-7/12">テーマタイトル ▽</th>
                <th className="pb-3 pt-2 w-4/12">投稿期間・期限 ▽</th>
                <th className="pb-3 pt-2 pr-4 w-1/12 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {courseDetail.bulletinBoardItems && courseDetail.bulletinBoardItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-100 even:bg-[#fdfaf2] transition-colors">
                  <td className="py-4 pl-4 font-bold text-blue-800 hover:underline cursor-pointer">
                    <a href={item.url}>{item.title}</a>
                  </td>
                  <td className="py-4 text-gray-500">
                    {item.postingPeriod.start} ~ {item.postingPeriod.end}
                  </td>
                  <td className="py-4 pr-4 text-center">
                    {/* 操作ボタン（丸背景＋縦の3点リーダー） */}
                    <button className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#555555] text-white hover:bg-gray-800 transition">
                      <MoreVertical size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionWrapper>

        {/* 下部のダイレクトリンク */}
        {/* <div className="flex items-center gap-2 mt-8 text-xs max-w-xl bg-white p-2 border border-gray-300 rounded-sm">
        <span className="text-gray-500 whitespace-nowrap">このページのダイレクトリンク</span>
        <label htmlFor=""></label>
        <input
          type="text"
          readOnly
          value="https://beefplus.center.kobe-u.ac.jp/lms/course?idnumber=20261X0511001"
          className="flex-1 border border-gray-300 px-2 py-1 bg-gray-50 rounded-sm outline-none text-gray-600"
        />
        <button className="bg-gray-700 text-white px-3 py-1 rounded-sm hover:bg-gray-800 transition">
          選択
        </button>
      </div> */}

      </main>
    </DefaultLayout>
  )
}

export default PlasmoSidebarOverlay