import { ClipboardList } from "lucide-react";

export interface UnsubmittedTask {
	id: string;          // 一意のID
	courseName: string;  // コース名 (例: 基礎解析)
	contentType: string; // コンテンツ (例: 課題, テスト)
	title: string;       // タイトル (例: レポート11)
	deadline: string;    // 期限 (例: 2026/07/05 23:55:00)
	url: string;         // タイトルリンクの遷移先URL
}

interface UnsubmittedTaskListProps {
	tasks: UnsubmittedTask[];
}

export default function UnsubmittedTaskList() {
	const tasks = [{
		id: "task-001",
		courseName: "基礎解析",
		contentType: "課題",
		title: "レポート11",
		deadline: "2026/07/05 23:55:00",
		url: "/tasks/report11"
	},
	{
		id: "task-002",
		courseName: "コンピュータシステム1",
		contentType: "課題",
		title: "課題10（2026.7.3）",
		deadline: "2026/07/09 00:00:00",
		url: "/tasks/kadai10"
	}];
	return (
		<main className="w-full mx-auto px-6 py-6">
			{/* 上部ヘッダー */}
			<div className="px-4 py-2.5">
				<div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <ClipboardList className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              未提出課題・テスト・アンケート一覧
            </h1>
            <p className="text-sm text-muted-foreground">Tasks</p>
          </div>
        </div>
			</div>

			{/* テーブル領域 */}
			<div className="overflow-x-auto mt-8">
				<table className="w-full text-left text-xs border-collapse min-w-[600px]">
					<thead>
						<tr className="border-b border-gray-300 text-gray-800 font-bold bg-white">
							<th className="py-2.5 pl-4 w-3/12 cursor-pointer hover:bg-gray-50 select-none">
								コース名 ▽
							</th>
							<th className="py-2.5 w-2/12 cursor-pointer hover:bg-gray-50 select-none">
								コンテンツ ▽
							</th>
							<th className="py-2.5 w-4/12">
								タイトル
							</th>
							<th className="py-2.5 pr-4 w-3/12 text-right cursor-pointer hover:bg-gray-50 select-none">
								期限 △
							</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-gray-200">
						{tasks.map((task) => (
							<tr
								key={task.id}
								className="hover:bg-gray-100 even:bg-[#fdfaf2] transition-colors"
							>
								{/* コース名 */}
								<td className="py-3 pl-4 text-gray-700 font-medium">
									{task.courseName}
								</td>
								{/* コンテンツ（課題/テスト等） */}
								<td className="py-3 text-purple-800 font-medium">
									{task.contentType}
								</td>
								{/* タイトルリンク */}
								<td className="py-3 font-medium text-blue-800 hover:underline cursor-pointer">
									<a href={task.url}>{task.title}</a>
								</td>
								{/* 期限 */}
								<td className="py-3 pr-4 text-right text-gray-600">
									{task.deadline}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</main>
	);
}