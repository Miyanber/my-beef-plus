import { CalendarRange } from "lucide-react"
import { AppSidebar } from "@/components/timetable/app-sidebar"
import { TopHeader } from "@/components/timetable/top-header"
import { ControlBar } from "@/components/timetable/control-bar"
import { TimetableGrid } from "@/components/timetable/timetable-grid"

export default function Page() {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopHeader />

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

        <footer className="border-t border-border bg-card/50 px-6 py-6 lg:px-10">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
                B
              </div>
              <span className="text-sm font-semibold text-foreground">
                BEEF<span className="text-primary">+</span>
              </span>
              <span className="text-xs text-muted-foreground">神戸大学 LMS</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Copyright © ISTC, KOBE UNIV. All Rights Reserved.
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}
