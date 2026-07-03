import React from 'react';
import { Mail, Bell, FileText, Edit3 } from 'lucide-react'; // アイコン用にlucide-reactを使用（お好みのものに変えてもOKです）

type Params = {
  params: {
    code: string;
  };
}

// ==========================================
// 共通のブロックラッパーコンポーネント
// ==========================================
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

// ==========================================
// メインページコンポーネント
// ==========================================
export default function CoursePage({ params }: Params) {
  const code = params.code;
  
  return (
    <main className="max-w-6xl mx-auto px-4 py-6">
      {/* コースの概要説明 */}
      <section className="bg-white border border-gray-300 rounded-sm p-4 mb-6 shadow-sm">
        <h2 className="text-base font-bold border-b border-gray-200 pb-2 mb-3">コースの概要説明/Course Summary</h2>
        <p className="text-sm text-gray-600">このページはお知らせや資料の配布、課題の提出に利用します。</p>
      </section>

      {/* 授業情報 */}
      <section className="bg-white border border-gray-300 rounded-sm p-4 mb-6 shadow-sm">
        <h2 className="text-base font-bold border-b border-gray-200 pb-2 mb-2">授業情報</h2>
        <p className="text-xs text-gray-400 mb-3">更新日時:2026/05/12 10:27</p>
        <ul className="list-disc list-inside text-sm space-y-1 text-gray-700 pl-2">
          <li>時限：火曜2限（10:40～12:10）</li>
          <li>教室：J202</li>
          <li>成績評価：期末試験70%、演習30%</li>
          <li>教科書：「レクチャー 離散数学」（サイエンス社、2019年）</li>
          <li>質問がある場合は「担当へのメッセージ」をご利用ください。メールでも構いません。E-mail: tkuniya@port.kobe-u.ac.jp</li>
        </ul>
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
            <tr className="hover:bg-gray-50">
              <td className="py-2.5 font-bold text-blue-800 hover:underline cursor-pointer">第11回の内容</td>
              <td className="py-2.5 text-gray-600">2026/06/29 00:00 〜 9999/12/31 00:00</td>
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="py-2.5 font-bold text-blue-800 hover:underline cursor-pointer">授業予定</td>
              <td className="py-2.5 text-gray-600">2026/04/10 00:00 〜 9999/12/31 00:00</td>
            </tr>
          </tbody>
        </table>
      </SectionWrapper>

      {/* 教材 */}
      <SectionWrapper title="教材" bgColor="bg-[#4ba3c3]" icon={<Edit3 size={24} />}>
        <div className="space-y-4 text-xs">
          {/* 演習問題 */}
          <div className="bg-[#e2e8cc] p-3 rounded-sm">
            <div className="font-bold mb-1">演習問題</div>
            <div className="text-gray-600 mb-2">公開期間：2026/06/23 12:00 〜 9999/12/31 23:59</div>
            <p className="text-gray-700 mb-3 pl-1">第10回までの分です。</p>
            <table className="w-full border-t border-gray-300 pt-2">
              <thead>
                <tr className="text-gray-500 font-medium text-left">
                  <th className="py-1 w-1/3">資料タイトル</th>
                  <th className="py-1 w-1/3">ファイル名</th>
                  <th className="py-1 w-1/3">コメント</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-dashed border-gray-300">
                  <td className="py-2 font-bold text-blue-800 hover:underline cursor-pointer">exercise.pdf</td>
                  <td className="py-2 text-gray-600">exercise.pdf</td>
                  <td className="py-2 text-gray-400">-</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 演習問題略解 */}
          <div className="bg-[#e2e8cc] p-3 rounded-sm">
            <div className="font-bold mb-1">演習問題略解</div>
            <div className="text-gray-600 mb-2">公開期間：2026/04/26 00:00 〜 9999/12/31 23:59</div>
            <p className="text-gray-700 mb-3 pl-1">第10回までの分です。</p>
            <table className="w-full border-t border-gray-300 pt-2">
              <thead>
                <tr className="text-gray-500 font-medium text-left">
                  <th className="py-1 w-1/3">資料タイトル</th>
                  <th className="py-1 w-1/3">ファイル名</th>
                  <th className="py-1 w-1/3">コメント</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-dashed border-gray-300">
                  <td className="py-2 font-bold text-blue-800 hover:underline cursor-pointer">answer.pdf</td>
                  <td className="py-2 text-gray-600">answer.pdf</td>
                  <td className="py-2 text-gray-400">-</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 追加資料 */}
          <div className="bg-[#e2e8cc] p-3 rounded-sm">
            <div className="font-bold mb-1">追加資料</div>
            <div className="text-gray-600 mb-2">公開期間：2026/04/17 00:00 〜 9999/12/31 23:59</div>
            <p className="text-gray-700 mb-3 pl-1">教科書に載っていない内容についての追加資料です。</p>
            <table className="w-full border-t border-gray-300 pt-2">
              <thead>
                <tr className="text-gray-500 font-medium text-left">
                  <th className="py-1 w-1/3">資料タイトル</th>
                  <th className="py-1 w-1/3">ファイル名</th>
                  <th className="py-1 w-1/3">コメント</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dashed divide-gray-300">
                <tr>
                  <td className="py-2 font-bold text-blue-800 hover:underline cursor-pointer">260428.pdf</td>
                  <td className="py-2 text-gray-600">260428.pdf</td>
                  <td className="py-2 text-gray-400">-</td>
                </tr>
                <tr>
                  <td className="py-2 font-bold text-blue-800 hover:underline cursor-pointer">260421.pdf</td>
                  <td className="py-2 text-gray-600">260421.pdf</td>
                  <td className="py-2 text-gray-400">-</td>
                </tr>
              </tbody>
            </table>
          </div>
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
            {[
              { title: '演習問題 (2026/16・6/23)', start: '2026/06/16 12:00', end: '2026/06/27 00:00' },
              { title: '演習問題 (2026/6/2)', start: '2026/06/02 12:00', end: '2026/06/06 00:00' },
              { title: '演習問題 (2026/5/19)', start: '2026/05/19 11:50', end: '2026/05/23 00:00' },
              { title: '演習問題 (2026/4/28)', start: '2026/04/28 11:50', startRaw: '04/28', end: '2026/05/02 00:00' },
              { title: '演習問題 (2026/4/21)', start: '2026/04/21 11:50', end: '2026/04/25 00:00' },
            ].map((item, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="py-3 font-bold text-blue-800 hover:underline cursor-pointer">{item.title}</td>
                <td className="py-3 text-gray-600">{item.start}</td>
                <td className="py-3 text-gray-600">{item.end}</td>
                <td className="py-3 text-green-700 font-medium">期限内提出</td>
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
  );
}