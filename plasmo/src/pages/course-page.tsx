import { CourseView } from "@/components/course/course-view";
import { scrapeCourseDetail } from "@/lib/scrapers";
import type { CourseDetail } from "@/lib/timetable-data";
import { usePageData } from "@/lib/use-page-data";

interface CoursePageProps {
  courseId: string;
}

export function CoursePage({ courseId }: CoursePageProps) {
  const { data } = usePageData<CourseDetail>({
    key: `course_${courseId}`,
    scrape: () => scrapeCourseDetail(courseId),
  });

  if (!data) {
    return (
      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-10 animate-pulse">
        <div className="mx-auto flex max-w-6xl flex-col gap-6">
          <div className="h-10 w-64 rounded-xl bg-muted" />
          <div className="h-40 w-full rounded-2xl bg-muted" />
          <div className="h-64 w-full rounded-2xl bg-muted" />
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
      <CourseView course={data} />
    </main>
  );
}
