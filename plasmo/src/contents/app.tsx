import type { PlasmoCSConfig } from "plasmo";
import { useEffect, useState } from "react";
import { getDefaultStyle } from "~lib/plasmo-style";
import { onRouteChanged, parseRoute, setupGlobalLinkInterceptor, type AppRoute } from "~lib/router";
import { setNativeHidden } from "~lib/utils";
import { CoursePage } from "~pages/course-page";
import { DefaultLayout } from "~pages/layout";
import { TaskPage } from "~pages/task-page";
import { TimetablePage } from "~pages/timetable-page";

export const config: PlasmoCSConfig = {
  matches: ["https://beefplus.center.kobe-u.ac.jp/lms/*"],
  run_at: "document_start",
};

export const getStyle = getDefaultStyle;

// 最速タイミングでリンククリックのインターセプトと初期ネイティブ隠蔽を設定
if (typeof window !== "undefined") {
  setupGlobalLinkInterceptor();
  const initialRoute = parseRoute(window.location.href);
  if (initialRoute.type !== "native") {
    setNativeHidden(true);
  }
}

const App = () => {
  const [route, setRoute] = useState<AppRoute>(() => parseRoute(window.location.href));

  useEffect(() => {
    // SPAナビゲーションおよび popstate（戻る/進む）のリスナー
    const cleanup = onRouteChanged((nextRoute) => {
      setRoute(nextRoute);
      if (nextRoute.type === "native") {
        setNativeHidden(false);
      } else {
        setNativeHidden(true);
      }
    });
    return cleanup;
  }, []);

  // 独自UI対象外の画面（提出画面、テスト解答等）はネイティブDOMを表示するためマウントしない
  if (route.type === "native") {
    return null;
  }

  return (
    <DefaultLayout>
      {route.type === "timetable" && <TimetablePage key={route.url} />}
      {route.type === "course" && route.courseId && (
        <CoursePage key={route.courseId} courseId={route.courseId} />
      )}
      {route.type === "task" && <TaskPage key={route.url} />}
    </DefaultLayout>
  );
};

export default App;
