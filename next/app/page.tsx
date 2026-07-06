import { CalendarRange } from "lucide-react"
import { ControlBar } from "@/components/timetable/control-bar"
import { TimetableGrid } from "@/components/timetable/timetable-grid"

export default function Page() {
  return (
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
  )
}
