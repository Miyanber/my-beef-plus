import { useEffect, useState, type ReactNode } from "react"
import {
  Bell,
  BookOpen,
  ChevronDown,
  CircleAlert,
  ClipboardList,
  Download,
  ExternalLink,
  FilePenLine,
  FileText,
  FolderOpen,
  Link2,
  LoaderCircle,
  Mail,
  MessageSquare,
  Paperclip,
  Users,
  Video,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { downloadMaterial } from "@/lib/download"
import { formatDateTime, formatRange, getDeadlineInfo, type Urgency } from "@/lib/format"
import { loadAnnouncementDetail } from "@/lib/native"
import type {
  ActionLink,
  Announcement,
  Assignment,
  Attachment,
  BulletinBoardItem,
  CourseDetail,
  LectureMaterial,
  Message,
  Quiz,
  Survey,
} from "@/lib/timetable-data"

// ---------------------------------------------------------------------------
// 共通パーツ
// ---------------------------------------------------------------------------

type Tone = "danger" | "success" | "warning" | "info" | "muted"

const TONES: Record<Tone, string> = {
  danger: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  warning: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  info: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  muted: "bg-muted text-muted-foreground",
}

function StatusBadge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span className={cn("inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium", TONES[tone])}>
      {children}
    </span>
  )
}

const URGENCY_TONE: Record<Urgency, Tone> = {
  overdue: "muted",
  today: "danger",
  soon: "warning",
  week: "info",
  later: "muted",
  none: "muted",
}

interface SectionCardProps {
  title: string
  icon: ReactNode
  /** アイコン背景色 (Tailwindのクラス) */
  accent: string
  count?: number
  action?: ReactNode
  children: ReactNode
}

function SectionCard({ title, icon, accent, count, action, children }: SectionCardProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <header className="flex items-center gap-2.5 border-b border-border px-4 py-3">
        <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-lg text-white [&_svg]:size-4", accent)}>
          {icon}
        </span>
        <h2 className="text-sm font-bold text-foreground">{title}</h2>
        {count !== undefined && count > 0 && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{count}</span>
        )}
        {action && <div className="ml-auto">{action}</div>}
      </header>
      {children}
    </section>
  )
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="px-4 py-6 text-center text-sm text-muted-foreground">{children}</p>
}

/** 件数が多いリストを「もっと見る」で折りたたむ */
function useLimited<T>(items: T[], limit: number) {
  const [expanded, setExpanded] = useState(false)
  const shown = expanded ? items : items.slice(0, limit)
  const hiddenCount = items.length - shown.length
  return { shown, hiddenCount, expanded, toggle: () => setExpanded((v) => !v), canToggle: items.length > limit }
}

function MoreToggle({ limited }: { limited: ReturnType<typeof useLimited> }) {
  if (!limited.canToggle) return null
  return (
    <button
      type="button"
      onClick={limited.toggle}
      className="flex w-full items-center justify-center gap-1 border-t border-border/60 px-4 py-2.5 text-xs font-medium text-primary hover:bg-muted"
    >
      {limited.expanded ? "折りたたむ" : `さらに ${limited.hiddenCount} 件を表示`}
      <ChevronDown className={cn("size-3.5 transition-transform", limited.expanded && "rotate-180")} />
    </button>
  )
}

function ItemLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  if (!href) return <span className={cn("font-medium text-foreground", className)}>{children}</span>
  return (
    <a href={href} className={cn("font-medium text-foreground hover:text-primary hover:underline", className)}>
      {children}
    </a>
  )
}

function Actions({ actions }: { actions: ActionLink[] }) {
  if (actions.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1.5">
      {actions.map((a) => (
        <a
          key={a.url}
          href={a.url}
          className="rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          {a.label}
        </a>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// お知らせ
// ---------------------------------------------------------------------------

interface AnnouncementDetailState {
  title: string
  html: string | null
  loading: boolean
}

function AnnouncementDialog({ detail, onClose }: { detail: AnnouncementDetailState; onClose: () => void }) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start gap-3 border-b border-border px-5 py-4">
          <h3 className="flex-1 text-base font-bold leading-snug text-foreground">{detail.title}</h3>
          <button
            type="button"
            aria-label="閉じる"
            onClick={onClose}
            className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </header>
        <div className="overflow-y-auto px-5 py-4">
          {detail.loading && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <LoaderCircle className="size-4 animate-spin" /> 読み込み中…
            </p>
          )}
          {!detail.loading && detail.html && <div className="rich-text" dangerouslySetInnerHTML={{ __html: detail.html }} />}
          {!detail.loading && !detail.html && (
            <p className="text-sm text-muted-foreground">
              お知らせの本文を取得できませんでした。フッターの「標準画面」から BEEF+ の元の画面で確認してください。
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function AnnouncementSection({ items }: { items: Announcement[] }) {
  const [detail, setDetail] = useState<AnnouncementDetailState | null>(null)

  const open = async (a: Announcement) => {
    setDetail({ title: a.title, html: null, loading: true })
    const html = await loadAnnouncementDetail(a.id)
    setDetail({ title: a.title, html, loading: false })
  }

  return (
    <SectionCard title="お知らせ" icon={<Bell />} accent="bg-amber-500" count={items.length}>
      {items.length === 0 ? (
        <Empty>お知らせはありません</Empty>
      ) : (
        <ul className="divide-y divide-border/60">
          {items.map((a) => (
            <li key={a.id || a.title}>
              <button
                type="button"
                onClick={() => open(a)}
                className="flex w-full flex-col gap-0.5 px-4 py-3 text-left hover:bg-muted"
              >
                <span className="text-sm font-medium text-foreground">{a.title}</span>
                <span className="text-xs text-muted-foreground">{formatRange(a.postingPeriod)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {detail && <AnnouncementDialog detail={detail} onClose={() => setDetail(null)} />}
    </SectionCard>
  )
}

// ---------------------------------------------------------------------------
// 教材
// ---------------------------------------------------------------------------

function AttachmentRow({ courseId, attachment }: { courseId: string; attachment: Attachment }) {
  const [state, setState] = useState<{ loading: boolean; error: string }>({ loading: false, error: "" })

  const handleDownload = async () => {
    setState({ loading: true, error: "" })
    try {
      await downloadMaterial(courseId, attachment)
      setState({ loading: false, error: "" })
    } catch (e) {
      console.error("[my-beef-plus] download failed", e)
      setState({ loading: false, error: e instanceof Error ? e.message : "ダウンロードに失敗しました" })
    }
  }

  const isFile = attachment.kind === "file"
  const Icon = isFile ? FileText : attachment.kind === "video" ? Video : Link2
  const rowClass = "group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-muted"
  const content = (
    <>
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-foreground group-hover:text-primary">
          {attachment.title}
        </span>
        {attachment.comment && <span className="block truncate text-xs text-muted-foreground">{attachment.comment}</span>}
        {state.error && (
          <span className="flex items-center gap-1 text-xs text-destructive">
            <CircleAlert className="size-3" />
            {state.error}
          </span>
        )}
      </span>
      {attachment.updatedAt && <span className="hidden text-xs text-muted-foreground sm:block">{attachment.updatedAt}</span>}
      {isFile ? (
        state.loading ? (
          <LoaderCircle className="size-4 shrink-0 animate-spin text-muted-foreground" />
        ) : (
          <Download className="size-4 shrink-0 text-muted-foreground group-hover:text-primary" />
        )
      ) : (
        <ExternalLink className="size-4 shrink-0 text-muted-foreground group-hover:text-primary" />
      )}
    </>
  )

  if (isFile) {
    return (
      <button type="button" className={rowClass} onClick={handleDownload} disabled={state.loading}>
        {content}
      </button>
    )
  }
  return (
    <a className={rowClass} href={attachment.href} target="_blank" rel="noreferrer">
      {content}
    </a>
  )
}

function MaterialSection({ courseId, materials }: { courseId: string; materials: LectureMaterial[] }) {
  return (
    <SectionCard title="教材" icon={<FolderOpen />} accent="bg-sky-500" count={materials.length}>
      {materials.length === 0 ? (
        <Empty>教材はありません</Empty>
      ) : (
        <div className="divide-y divide-border/60">
          {materials.map((m, index) => (
            <details key={`${m.title}-${index}`} className="group/material" open={index === 0}>
              <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 hover:bg-muted [&::-webkit-details-marker]:hidden">
                <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open/material:rotate-180" />
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">{m.title}</span>
                {m.attachments.length > 0 && (
                  <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                    <Paperclip className="size-3" />
                    {m.attachments.length}
                  </span>
                )}
                <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">
                  {formatDateTime(m.publicationPeriod.start)}
                </span>
              </summary>
              <div className="flex flex-col gap-2 px-4 pb-4">
                {m.publicationPeriod.start && (
                  <p className="text-xs text-muted-foreground">公開期間：{formatRange(m.publicationPeriod)}</p>
                )}
                {m.description && <div className="rich-text text-sm" dangerouslySetInnerHTML={{ __html: m.description }} />}
                {m.attachments.length > 0 ? (
                  <div className="flex flex-col rounded-xl border border-border/70 p-1">
                    {m.attachments.map((a) => (
                      <AttachmentRow key={a.materialId} courseId={courseId} attachment={a} />
                    ))}
                  </div>
                ) : (
                  !m.description && <p className="text-xs text-muted-foreground">資料はありません</p>
                )}
              </div>
            </details>
          ))}
        </div>
      )}
    </SectionCard>
  )
}

// ---------------------------------------------------------------------------
// 課題 / テスト / アンケート / 掲示板 / メッセージ
// ---------------------------------------------------------------------------

function submissionBadge(a: Assignment) {
  switch (a.submissionStatus) {
    case "NOT_SUBMITTED_YET":
      return <StatusBadge tone="danger">{a.statusText || "未提出"}</StatusBadge>
    case "SUBMITTED_ON_TIME":
      return <StatusBadge tone="success">{a.statusText || "提出済"}</StatusBadge>
    case "SUBMITTED_OUT_TIME":
      return <StatusBadge tone="warning">{a.statusText || "期限後提出"}</StatusBadge>
    default:
      return a.statusText ? <StatusBadge tone="muted">{a.statusText}</StatusBadge> : null
  }
}

function DeadlineChip({ end }: { end: string }) {
  const info = getDeadlineInfo(end)
  if (!info.label) return null
  return <StatusBadge tone={URGENCY_TONE[info.urgency]}>{info.label}</StatusBadge>
}

function AssignmentSection({ items }: { items: Assignment[] }) {
  // 未提出を先頭に出す（それ以外は BEEF+ の並び順を維持）
  const sorted = [...items].sort(
    (a, b) =>
      Number(b.submissionStatus === "NOT_SUBMITTED_YET") - Number(a.submissionStatus === "NOT_SUBMITTED_YET"),
  )
  const limited = useLimited(sorted, 6)
  const pending = items.filter((a) => a.submissionStatus === "NOT_SUBMITTED_YET").length

  return (
    <SectionCard
      title="課題"
      icon={<FileText />}
      accent="bg-rose-500"
      count={items.length}
      action={pending > 0 ? <StatusBadge tone="danger">未提出 {pending}</StatusBadge> : undefined}
    >
      {items.length === 0 ? (
        <Empty>課題はありません</Empty>
      ) : (
        <>
          <ul className="divide-y divide-border/60">
            {limited.shown.map((a) => (
              <li key={a.id || a.title} className="flex flex-col gap-1.5 px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <ItemLink href={a.url} className="text-sm">
                    {a.title}
                  </ItemLink>
                  {submissionBadge(a)}
                </div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                  <span>{formatRange(a.submissionPeriod)}</span>
                  {a.submissionStatus === "NOT_SUBMITTED_YET" && <DeadlineChip end={a.submissionPeriod.end} />}
                </div>
              </li>
            ))}
          </ul>
          <MoreToggle limited={limited} />
        </>
      )}
    </SectionCard>
  )
}

function quizBadge(q: Quiz) {
  const tone: Tone = q.status === "COMPLETED" ? "success" : q.status === "UNANSWERED" ? "danger" : "muted"
  return q.statusText ? <StatusBadge tone={tone}>{q.statusText}</StatusBadge> : null
}

function QuizSection({ items }: { items: Quiz[] }) {
  const limited = useLimited(items, 5)
  return (
    <SectionCard title="テスト" icon={<FilePenLine />} accent="bg-indigo-500" count={items.length}>
      {items.length === 0 ? (
        <Empty>テストはありません</Empty>
      ) : (
        <>
          <ul className="divide-y divide-border/60">
            {limited.shown.map((q) => (
              <li key={q.id} className="flex flex-col gap-1.5 px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <ItemLink href={q.url} className="text-sm">
                    {q.title}
                  </ItemLink>
                  {quizBadge(q)}
                </div>
                <p className="text-xs text-muted-foreground">{formatRange(q.examinationPeriod)}</p>
                <Actions actions={q.actions.filter((a) => a.url !== q.url)} />
              </li>
            ))}
          </ul>
          <MoreToggle limited={limited} />
        </>
      )}
    </SectionCard>
  )
}

function SurveySection({ items }: { items: Survey[] }) {
  return (
    <SectionCard title="アンケート" icon={<ClipboardList />} accent="bg-emerald-500" count={items.length}>
      {items.length === 0 ? (
        <Empty>アンケートはありません</Empty>
      ) : (
        <ul className="divide-y divide-border/60">
          {items.map((s) => (
            <li key={s.id || s.title} className="flex flex-col gap-1.5 px-4 py-3">
              <ItemLink href={s.url} className="text-sm">
                {s.title}
              </ItemLink>
              <p className="text-xs text-muted-foreground">{formatRange(s.period)}</p>
              <Actions actions={s.actions} />
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  )
}

function ForumSection({ items }: { items: BulletinBoardItem[] }) {
  return (
    <SectionCard title="掲示板" icon={<MessageSquare />} accent="bg-teal-500" count={items.length}>
      {items.length === 0 ? (
        <Empty>掲示板のテーマはありません</Empty>
      ) : (
        <ul className="divide-y divide-border/60">
          {items.map((f) => (
            <li key={f.id || f.title} className="flex flex-col gap-1 px-4 py-3">
              <ItemLink href={f.url} className="text-sm">
                {f.title}
              </ItemLink>
              <p className="text-xs text-muted-foreground">{formatRange(f.postingPeriod)}</p>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  )
}

function MessageSection({ items, newMessageUrl }: { items: Message[]; newMessageUrl?: string }) {
  return (
    <SectionCard
      title="担当へのメッセージ"
      icon={<Mail />}
      accent="bg-green-600"
      count={items.length}
      action={
        newMessageUrl ? (
          <a
            href={newMessageUrl}
            className="rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            新規メッセージ
          </a>
        ) : undefined
      }
    >
      {items.length === 0 ? (
        <Empty>メッセージはありません</Empty>
      ) : (
        <ul className="divide-y divide-border/60">
          {items.map((m) => (
            <li key={m.url || m.title} className="flex flex-col gap-1 px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <ItemLink href={m.url} className="text-sm">
                  {m.title}
                </ItemLink>
                {m.status && <StatusBadge tone="info">{m.status}</StatusBadge>}
              </div>
              {m.createdAt && <p className="text-xs text-muted-foreground">{m.createdAt}</p>}
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  )
}

// ---------------------------------------------------------------------------
// ページ本体
// ---------------------------------------------------------------------------

export function CourseView({ course }: { course: CourseDetail }) {
  const header = course.header
  const schedule = header?.schedule.replace(/\//g, " ・ ") ?? ""

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      {/* 科目ヘッダー */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {header?.semesterLabel && <StatusBadge tone="info">{header.semesterLabel}</StatusBadge>}
          {header?.code && <span className="font-mono">{header.code}</span>}
          {schedule && <span>{schedule}</span>}
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">{header?.name ?? "講義詳細"}</h1>
        {header && header.teachers.length > 0 && (
          <p className="mt-2 flex items-start gap-1.5 text-sm text-muted-foreground">
            <Users className="mt-0.5 size-4 shrink-0" />
            <span>{header.teachers.join("、")}</span>
          </p>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        {/* 左: 講義の中身 */}
        <div className="flex min-w-0 flex-col gap-6">
          {course.courseSummary && (
            <SectionCard title="コースの概要" icon={<BookOpen />} accent="bg-violet-500">
              <div className="rich-text px-4 py-4 text-sm" dangerouslySetInnerHTML={{ __html: course.courseSummary.rawHTML }} />
            </SectionCard>
          )}
          {course.classDetails && (
            <SectionCard
              title="授業情報"
              icon={<Bell />}
              accent="bg-blue-500"
              action={
                course.classDetails.updatedAt ? (
                  <span className="text-xs text-muted-foreground">更新: {course.classDetails.updatedAt}</span>
                ) : undefined
              }
            >
              <div className="rich-text px-4 py-4 text-sm" dangerouslySetInnerHTML={{ __html: course.classDetails.rawHTML }} />
            </SectionCard>
          )}
          <MaterialSection courseId={course.id} materials={course.lectureMaterials} />
        </div>

        {/* 右: お知らせ・提出物など */}
        <div className="flex min-w-0 flex-col gap-6">
          <AnnouncementSection items={course.announcements} />
          <AssignmentSection items={course.assignments} />
          <QuizSection items={course.quizzes} />
          <SurveySection items={course.surveys} />
          <ForumSection items={course.bulletinBoardItems} />
          <MessageSection items={course.messages} newMessageUrl={course.newMessageUrl} />
        </div>
      </div>
    </div>
  )
}

