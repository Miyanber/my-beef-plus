
import type { PlasmoCSConfig, PlasmoGetInlineAnchor } from "plasmo"

// コンポーネントのパスは環境に合わせて適宜微調整してください
import { AppSidebar } from "@/components/timetable/app-sidebar"
import { useEffect, useState } from "react"
import { CalendarRange } from "lucide-react"
import { ControlBar } from "@/components/timetable/control-bar"
import { TimetableGrid } from "@/components/timetable/timetable-grid"
import { getDefaultStyle } from "~lib/plasmo-style"
import { DefaultLayout } from "~pages/layout"

export const config: PlasmoCSConfig = {
	matches: ["<all_urls>"]
}




export const getStyle = getDefaultStyle

// メインのコンポーネント
const PlasmoSidebarOverlay = () => {

	const [scrapedData, setScrapedData] = useState<{ title: string; userName: string }>({
		title: "",
		userName: ""
	})

	useEffect(() => {
		const timetable = document.getElementById("timetable");
		// timetable.remove();

		// --------------------------------------------------------
		// パターンB: ターゲットサイトからデータを抽出（スクレイピング）
		// --------------------------------------------------------
		const titleText = document.querySelector("h1")?.textContent?.trim() || "タイトルなし"
		const userText = document.querySelector(".user-profile-name")?.textContent?.trim() || "ゲスト"

		// 2. 抽出したデータをStateに保存
		setScrapedData({
			title: titleText,
			userName: userText
		})
	}, []) // ページ読み込み時に1回だけ実行
	return (
		<DefaultLayout>
			<main className="flex-1 px-6 py-8 lg:px-10">
				<div className="mx-auto flex max-w-6xl flex-col gap-8">
					{/* Page title */}
					<div className="flex items-center gap-3">
						<div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
							<CalendarRange className="size-6" />
						</div>
						<div>
							<h1 className="text-2xl font-bold tracking-tight text-foreground">
								時間割
							</h1>
							<p className="text-sm text-muted-foreground">Class Timetable</p>
						</div>
					</div>

					<ControlBar />
					<TimetableGrid />
				</div>
			</main>
		</DefaultLayout>
	)
}

export default PlasmoSidebarOverlay