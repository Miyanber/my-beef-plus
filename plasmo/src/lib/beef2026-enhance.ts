import {
  NEXT_THEME,
  THEME_META,
  getStoredThemeMode,
  saveThemeEverywhere,
  type ThemeMode,
} from "./theme-sync";

const NAV_CONTAINER_ID = "my-beef-b2026-nav";
const THEME_BTN_ID = "my-beef-b2026-theme-btn";
const COLLAPSE_STORAGE_PREFIX = "my_beef_b2026_open_";

const ICON_SVG: Record<ThemeMode, string> = {
  system:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
  light:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>',
  dark:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>',
};

interface QuickNavLink {
  label: string;
  href: string;
  match: (pathname: string) => boolean;
  iconSvg: string;
}

const QUICK_NAV_LINKS: QuickNavLink[] = [
  {
    label: "ホーム",
    href: "/",
    match: (p) => p === "/" || p === "/index.php",
    iconSvg:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
  },
  {
    label: "マイコース",
    href: "/my/courses.php",
    match: (p) => p.startsWith("/my/courses"),
    iconSvg:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>',
  },
  {
    label: "ダッシュボード",
    href: "/my/",
    match: (p) => p === "/my" || p === "/my/" || p === "/my/index.php",
    iconSvg:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>',
  },
  {
    label: "BEEF+ 時間割",
    href: "https://beefplus.center.kobe-u.ac.jp/lms/timetable",
    match: () => false,
    iconSvg:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>',
  },
];

/**
 * テーマ切替ボタンの表示を現在のモードに同期する
 */
export function updateThemeToggleButton(mode: ThemeMode = getStoredThemeMode()): void {
  const btn = document.getElementById(THEME_BTN_ID) as HTMLButtonElement | null;
  if (!btn) return;
  const meta = THEME_META[mode];
  btn.innerHTML = ICON_SVG[mode];
  btn.setAttribute("aria-label", `テーマ切り替え（現在: ${meta.label}）`);
  btn.setAttribute("title", `テーマ: ${meta.label}（クリックで${meta.nextLabel}に切り替え）`);
}

/**
 * Navbar にクイックナビゲーションとテーマ切替ボタンを挿入する
 */
export function mountBeef2026NavbarEnhancements(): void {
  const navbarContainer = document.querySelector("nav.navbar.fixed-top .container-fluid");
  const userNav = document.getElementById("usernavigation");

  // 1. クイックナビリンクの挿入
  if (navbarContainer && !document.getElementById(NAV_CONTAINER_ID)) {
    const nav = document.createElement("nav");
    nav.id = NAV_CONTAINER_ID;
    nav.setAttribute("aria-label", "BEEF2026 クイックメニュー");

    const currentPath = window.location.pathname;
    for (const item of QUICK_NAV_LINKS) {
      const a = document.createElement("a");
      a.href = item.href;
      a.className = "my-beef-b2026-nav-link";
      if (item.match(currentPath)) {
        a.dataset.active = "true";
      }
      a.innerHTML = `${item.iconSvg}<span>${item.label}</span>`;
      nav.appendChild(a);
    }

    if (userNav && userNav.parentElement === navbarContainer) {
      navbarContainer.insertBefore(nav, userNav);
    } else {
      navbarContainer.appendChild(nav);
    }
  }

  // 2. テーマ切替ボタンの挿入
  if (!document.getElementById(THEME_BTN_ID)) {
    const btn = document.createElement("button");
    btn.id = THEME_BTN_ID;
    btn.type = "button";
    btn.addEventListener("click", () => {
      const next = NEXT_THEME[getStoredThemeMode()];
      saveThemeEverywhere(next);
      updateThemeToggleButton(next);
    });

    if (userNav) {
      const userMenuContainer = userNav.querySelector(".usermenu-container");
      if (userMenuContainer) {
        userNav.insertBefore(btn, userMenuContainer);
      } else {
        userNav.appendChild(btn);
      }
    } else if (document.body) {
      btn.className = "my-beef-b2026-theme-fab";
      document.body.appendChild(btn);
    }

    updateThemeToggleButton(getStoredThemeMode());
  }
}

function readCollapseState(key: string, defaultOpen: boolean): boolean {
  try {
    const raw = window.localStorage?.getItem(COLLAPSE_STORAGE_PREFIX + key);
    if (raw === "true") return true;
    if (raw === "false") return false;
  } catch {}
  return defaultOpen;
}

function saveCollapseState(key: string, isOpen: boolean): void {
  try {
    window.localStorage?.setItem(COLLAPSE_STORAGE_PREFIX + key, String(isOpen));
  } catch {}
}

/**
 * 指定コンテナの子要素を既存のイベントを壊さず <details> で折りたたみラップする
 */
function wrapChildrenInCollapsible(
  container: Element | null,
  summaryText: string,
  storageKey: string,
  options: { compact?: boolean; defaultOpen?: boolean } = {},
): void {
  if (!container || container.getAttribute("data-my-beef-collapsed") === "true") return;
  const children = Array.from(container.childNodes);
  if (children.length === 0) return;

  container.setAttribute("data-my-beef-collapsed", "true");

  const details = document.createElement("details");
  details.className = options.compact
    ? "my-beef-b2026-collapse my-beef-b2026-collapse-compact"
    : "my-beef-b2026-collapse";
  details.open = readCollapseState(storageKey, options.defaultOpen ?? false);

  const summary = document.createElement("summary");
  summary.className = "my-beef-b2026-collapse-summary";
  summary.textContent = summaryText;

  const body = document.createElement("div");
  body.className = "my-beef-b2026-collapse-body";

  for (const child of children) {
    body.appendChild(child);
  }

  details.appendChild(summary);
  details.appendChild(body);
  details.addEventListener("toggle", () => {
    saveCollapseState(storageKey, details.open);
  });

  container.appendChild(details);
}

/**
 * サイトホーム (/) のノイズ削減（長文案内・カテゴリ一覧・ログイン済み時の管理者用ログインを折りたたみ）
 * ※ 編集モード (body.editing) 時や非サイトホームでは動作しない
 */
export function enhanceBeef2026SiteHome(): void {
  const body = document.body;
  if (!body || body.id !== "page-site-index" || body.classList.contains("editing")) {
    return;
  }

  // 1. 対象科目一覧・利用案内 (.sitetopic)
  const sitetopic = document.querySelector("#region-main .course-content .sitetopic");
  wrapChildrenInCollapsible(
    sitetopic,
    "BEEF2026 対象科目一覧・利用案内（クリックで展開）",
    "sitetopic",
  );

  // 2. コースカテゴリ一覧 (#frontpage-category-names)
  const categorySection = document.getElementById("frontpage-category-names");
  if (categorySection) {
    const heading = categorySection.querySelector(":scope > h2");
    const title = heading?.textContent?.trim() || "コースカテゴリ";
    if (heading) heading.remove();
    wrapChildrenInCollapsible(
      categorySection,
      `${title}（クリックで展開）`,
      "categories",
    );
  }

  // 3. ログイン済み学生向けの不要な「管理者用ログイン」HTMLブロックを折りたたみ
  const isLoggedIn =
    !body.classList.contains("notloggedin") &&
    Boolean(document.querySelector("#usernavigation .usermenu"));
  if (isLoggedIn) {
    const htmlBlocks = document.querySelectorAll('.block_html[data-block="html"]');
    for (const block of htmlBlocks) {
      if (!block.querySelector('form[action*="/login/index.php"]')) continue;
      const cardText = block.querySelector(".card-text, .content");
      wrapChildrenInCollapsible(cardText, "フォームを表示（管理者用）", "admin_login", {
        compact: true,
        defaultOpen: false,
      });
    }
  }
}

/**
 * 講義ページ (/course/view.php 等) で最初はすべてのセクションアコーディオンを閉じた状態にする
 * ※ トグルボタンが存在するセクションのみ対象とし、編集モード時や #section-N ハッシュ指定時は除外する
 */
export function collapseCourseSectionsInitially(): void {
  const body = document.body;
  if (!body || !body.classList.contains("pagelayout-course") || body.classList.contains("editing")) {
    return;
  }

  const hashMatch = window.location.hash.match(/^#(section-\d+)$/);
  const targetSectionId = hashMatch ? hashMatch[1] : null;

  const sections = document.querySelectorAll("li.section.course-section.main");
  let collapsedAny = false;

  for (const section of sections) {
    if (targetSectionId && section.id === targetSectionId) continue;

    const toggler = section.querySelector<HTMLElement>(
      'a[data-toggle="collapse"][data-for="sectiontoggler"]',
    );
    const content = section.querySelector<HTMLElement>(
      ".content.course-content-item-content.collapse",
    );
    if (!toggler || !content) continue;

    if (content.classList.contains("show")) {
      content.classList.remove("show", "collapsing");
      content.style.height = "";
      collapsedAny = true;
    }
    toggler.classList.add("collapsed");
    toggler.setAttribute("aria-expanded", "false");
  }

  if (collapsedAny && !targetSectionId) {
    const toggleAll = document.querySelector<HTMLElement>(
      '#collapsesections[data-toggle="toggleall"]',
    );
    if (toggleAll) {
      toggleAll.classList.add("collapsed");
      toggleAll.setAttribute("aria-expanded", "false");
    }
  }
}

export function runBeef2026DomEnhancements(): void {
  mountBeef2026NavbarEnhancements();
  enhanceBeef2026SiteHome();
  collapseCourseSectionsInitially();
}
