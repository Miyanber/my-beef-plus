import { CalendarRange } from "lucide-react";
import { useState } from "react";
import { PageTitle } from "@/components/page-title";
import { ControlBar } from "@/components/timetable/control-bar";
import { TimetableGrid } from "@/components/timetable/timetable-grid";
import { scrapeTimetable } from "@/lib/scrapers";
import type { TimetableStore } from "@/lib/timetable-data";
import { usePageData } from "@/lib/use-page-data";

function isCacheForCurrentUrl(cached: TimetableStore): boolean {
  const params = new URLSearchParams(window.location.search);
  const year = params.get("risyunen");
  const term = params.get("kikanCd");
  return (!year || year === cached.year) && (term === null || term === cached.termCode);
}

export function TimetablePage() {
  const { data } = usePageData<TimetableStore>({
    key: "timetableStore",
    scrape: scrapeTimetable,
    accept: isCacheForCurrentUrl,
  });
  const [query, setQuery] = useState("");

  if (!data) {
    return (
      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-10 animate-pulse">
        <div className="mx-auto flex max-w-6xl flex-col gap-6">
          <div className="h-8 w-48 rounded-lg bg-muted" />
          <div className="h-12 w-full rounded-xl bg-muted" />
          <div className="h-96 w-full rounded-2xl bg-muted" />
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:gap-8">
        <PageTitle icon={<CalendarRange />} title="時間割" subtitle="Class Timetable" />
        <ControlBar store={data} query={query} onQueryChange={setQuery} />
        <TimetableGrid timetableStore={data} query={query} />
      </div>
    </main>
  );
}
