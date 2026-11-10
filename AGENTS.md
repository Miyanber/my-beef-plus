# AGENTS.md — My BEEF+ (`my-beef-plus`) 開発ガイドライン

本ファイルは、AI コーディングエージェント（Antigravity, Claude, Codex, Cursor 等）が本リポジトリで安全・迅速・正確に開発を行うための規範とアーキテクチャ原則をまとめた仕様書です。
コードの追加・修正を行う前に必ず本ガイドラインおよび [docs/PRD.md](file:///c:/Users/Miyanber/Desktop/dev/repos/my-beef-plus/docs/PRD.md) を確認してください。

---

## 1. プロジェクト概要 & コア設計思想

**My BEEF+** は、神戸大学の公式学習管理システム（LMS）「**BEEF+**」の UI/UX を刷新し、学生の学習効率と操作性を飛躍的に高めるブラウザ拡張機能（Google Chrome Extension / Manifest V3）です。

### 🚨 最重要鉄則：『ハイブリッド・アーキテクチャ』
本プロダクトは、全画面を React で置き換えるのではなく、画面の責務に応じて実装方式を明確に二分しています。

```
┌────────────────────────────────────────────────────────────────────────┐
│                        My BEEF+ ハイブリッド設計                       │
├──────────────────────────────────┬─────────────────────────────────────┤
│   【独自React UI (CSUI)】        │       【CSSインジェクション】       │
│   ・時間割 (/lms/timetable*)     │   ・課題提出 (/lms/course/report/*) │
│   ・講義トップ (/lms/course?...) │   ・小テスト (/lms/course/quiz/*)   │
│   ・課題一覧 (/lms/task*)        │   ・メッセージ送信 (/lms/message/*) │
├──────────────────────────────────┼─────────────────────────────────────┤
│ 目的: 情報集約・圧倒的UX向上     │ 目的: ネイティブ機構で安全性100%担保│
└──────────────────────────────────┴─────────────────────────────────────┘
```

> [!CAUTION]
> **エージェントへの絶対禁止事項**:
> 課題提出フォームや小テスト解答画面を React 独自 UI で再実装しては**絶対にいけません**。
> 学生の成績や単位に関わる重要トランザクションは、BEEF+ 本体のネイティブ DOM とフォーム送信機構を 100% 保持したまま、`legacy-theme.css` によるスタイリング（ダークモード・UI整形）のみを適用してください。

---

## 2. ディレクトリ構成 & 各役割

本リポジトリはモノレポ構成（独立した 2 つの Node プロジェクト + サンプル/ドキュメント）です。

```plaintext
my-beef-plus/
├── plasmo/          # Chrome拡張機能本体（Plasmo Framework / MV3）★最重要
│   ├── src/
│   │   ├── contents/        # Content Scripts（app.tsx, legacy-theme-toggle.tsx）
│   │   ├── components/      # React コンポーネント（timetable, course, task, ui）
│   │   ├── pages/           # 各画面のレイアウト・ルート（timetable, course, task）
│   │   ├── lib/             # パーサー、ルーター、キャッシュ、DL処理
│   │   │   ├── parsers/     # HTML DOM スクレイピング・パーサー群
│   │   │   ├── router.ts    # SPA遷移・URL判定・データ再検証エンジン
│   │   │   ├── download.ts  # BEEF+ 一時API連携による1クリックDL
│   │   │   └── storage-cache.ts # chrome.storage.local キャッシュ層
│   │   ├── style.css        # 独自UI用 Tailwind CSS & OKLCH 変数定義
│   │   ├── legacy-theme.css # ネイティブ画面用ダークテーマ（shadcn Zinc調）
│   │   └── content.ts       # document_start で即座にスタイル注入を行うスクリプト
│   └── package.json
├── next/            # Webプロトタイプ & UIモックアップ開発環境（Next.js 16 + React 19）
│   ├── app/                 # Next.js App Router 画面群
│   ├── components/          # プロトタイプ用コンポーネント（plasmo への移植元）
│   └── package.json
├── samples/         # BEEF+実機から保存した検証用 HTML / アセット群
│   ├── lms/                 # 実機画面のHTML構造（timetable, task, course, submission）
│   └── static/              # BEEF+ オリジナルの CSS / JS / 画像
└── docs/            # 仕様書・設計書（PRD.md 等）
```

---

## 3. 開発コマンドリファレンス

> [!IMPORTANT]
> パッケージマネージャには必ず **`pnpm`** を使用してください（`npm` や `yarn` は禁止）。

### 3.1 拡張機能本体 (`plasmo`)

```bash
cd plasmo

# 依存パッケージインストール
pnpm install

# 開発ビルド（ホットリロード有効）
pnpm dev
# -> plasmo/build/chrome-mv3-dev/ に出力される

# 本番用ビルド
pnpm build
# -> plasmo/build/chrome-mv3-prod/ に出力される

# ストア公開用パッケージング (.zip)
pnpm package

# TypeScript 型チェック（コミット前必須）
pnpm tsc --noEmit
```

### 3.2 UIプロトタイプ環境 (`next`)

```bash
cd next

# 依存パッケージインストール
pnpm install

# 開発サーバー起動 (http://localhost:3000)
pnpm dev

# 静的解析・リント
pnpm lint

# ビルド
pnpm build
```

---

## 4. 画面別ルーティングと責務分離ポリシー

拡張機能の画面判定は [`plasmo/src/lib/router.ts`](file:///c:/Users/Miyanber/Desktop/dev/repos/my-beef-plus/plasmo/src/lib/router.ts) の `parseRoute()` で一元管理されています。

| 画面種別 | 対象URLパターン | 処理方式 | 実装コンポーネント / スタイル |
| :--- | :--- | :--- | :--- |
| **時間割画面** | `/lms/timetable*` | **独自React UI (CSUI)** | `TimetablePage` (`src/pages/timetable-page.tsx`) |
| **講義詳細・教材** | `/lms/course?idnumber=...` | **独自React UI (CSUI)** | `CoursePage` (`src/pages/course-page.tsx`) |
| **未提出タスク一覧** | `/lms/task*` | **独自React UI (CSUI)** | `TaskPage` (`src/pages/task-page.tsx`) |
| **課題提出フォーム** | `/lms/course/report/submission*` | **ネイティブ + CSS** | `src/legacy-theme.css` による整形 |
| **小テスト・解答** | `/lms/course/quiz/take*` | **ネイティブ + CSS** | `src/legacy-theme.css` による整形 |
| **教員メッセージ** | `/lms/message/*` | **ネイティブ + CSS** | `src/legacy-theme.css` による整形 |
| **その他設定・ポータル**| `/portal/*`, その他 `/lms/*` | **ネイティブ + CSS** | `src/legacy-theme.css` + `legacy-theme-toggle.tsx` |

---

## 5. 主要アーキテクチャ & 実装パターン

### 5.1 ネイティブ DOM 隠蔽 & SPA ナビゲーション
- 独自 UI 画面では、ネイティブの `#contentsWrapper`, `#page_head`, `#page_footer` などを非表示（`setNativeHidden(true)`）にし、Plasmo の React CSUI をマウントします。
- `CustomLink`（またはリンク横取り機構）により、独自 UI 間をリロードなしの SPA で高速遷移します。
- **裏側でのネイティブ DOM 更新**: `revalidatePage()` 内で遷移先 HTML を fetch してパースし、キャッシュを更新すると同時に、裏にあるネイティブの `#contentsWrapper` も最新 DOM に差し替えます。これにより教材ダウンロード等のフォーム送信がそのまま機能します。

### 5.2 パーサー・スクレイピング設計 (`plasmo/src/lib/parsers/`)
- BEEF+ の HTML は年代や講義種別によって構造が揺らぐことがあります。
- セレクタ追加・変更の際は、必ず `samples/lms/` の実機 HTML（`timetable.html`, `course/`, `task.html`, `submission/`）を確認してください。
- **防御的実装**: `querySelector` が null を返す可能性を常に考慮し、オプショナルチェイニング (`?.`) や安全なフォールバック値を設けてください。パースエラーで画面全体がクラッシュしないように `try-catch` で保護します。

### 5.3 教材 1クリックダウンロード機構 (`plasmo/src/lib/download.ts`)
- ユーザーのログインセッションをそのまま活用し、自前で認証情報を保存・送信しません。
- 処理フロー:
  1. `/lms/course/make/tempfile?fileName=...&id=...&idnumber=...` に fetch リクエストして一時 `fileId` を取得。
  2. ネイティブの隠しフォーム `#materialsSetDownFileForm` に `fileName`, `fileId`, `resourceId`, `contentId`, `endDate` を代入。
  3. `form.action` を `/lms/course/material/setfiledown/...` に設定して `form.submit()` を実行。

### 5.4 テーマ & スタイリング規約
- **独自 UI (`style.css`)**:
  - Shadow DOM コンテナ内で動作。OKLCH カラー変数によるテーマ切り替え。
  - `next-themes` を用いたライト / ダーク / システム連動。
- **ネイティブ画面 (`legacy-theme.css`)**:
  - 白シャドウ・立体装飾を全廃し、shadcn/ui 準拠の Zinc 系シャープデザイン（`#09090b` / `#d4d4d8` / `#27272a`）。
  - `document_start`（[`plasmo/src/content.ts`](file:///c:/Users/Miyanber/Desktop/dev/repos/my-beef-plus/plasmo/src/content.ts)）で即座に `<style>` 注入し、ページ読み込み時の白飛び（FOUC）を 0ms で根絶。
  - 独自 UI 画面とネイティブ画面の間でテーマ切り替えイベント（`beef-plus-theme-change` / `storage`）を同期。

---

## 6. エージェントの作業チェックリスト

作業を完了とする前に、以下の各項目を満たしているか確認してください。

- [ ] **責務分離の厳守**: 課題提出・テスト・メッセージ画面に React UI を適用していないか？
- [ ] **型チェックの通過**: `cd plasmo && pnpm tsc --noEmit` を実行し、TypeScript エラーが 0 件であるか？
- [ ] **パス記法 & エイリアス**:
  - Plasmo 側: `~lib/...`, `~components/...`, `~pages/...` のチルダエイリアスを使用しているか？
  - Next.js 側: `@/components/...`, `@/lib/...` のエイリアスを使用しているか？
- [ ] **セッション & セキュリティ**: 認証情報（パスワードやクッキー）をローカルに平文保存・外部送信していないか？
- [ ] **サンプル保護**: `samples/` ディレクトリ内の実機サンプルを不要に編集・削除していないか？
- [ ] **ダークテーマ調和**: 新規追加した UI 要素がライト/ダークの両モードで破綻なく視認できるか？

