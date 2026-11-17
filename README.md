# My BEEF+ (`my-beef-plus`)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Manifest V3](https://img.shields.io/badge/Chrome%20Extension-Manifest%20V3-green.svg)](plasmo/package.json)
[![Built with Plasmo](https://img.shields.io/badge/Built%20with-Plasmo-8b5cf6.svg)](https://www.plasmo.com/)

神戸大学の学修管理システム（LMS）「**BEEF+**」の UI/UX を刷新し、時間割確認・教材ダウンロード・課題管理の操作性を高める非公式ブラウザ拡張機能（Google Chrome Extension / Manifest V3）です。

> [!NOTE]
> 本拡張機能は神戸大学および関連組織とは一切関係のない、個人が開発した非公式オープンソースプロジェクトです。詳細は[免責事項](#免責事項-disclaimer)をご確認ください。

情報閲覧・集約を行うダッシュボード画面は**独自のモダン React UI**、課題提出やテスト解答など安全性が最優先されるトランザクション画面は**CSS インジェクション**を適用する「**ハイブリッド・アーキテクチャ**」を採用しています。

詳細な要件や設計思想は [docs/PRD.md](docs/PRD.md) をご覧ください。

---

## 主な機能

- **時間割ダッシュボード (`/lms/timetable*`)**
  - 月〜金 × 1〜6 限の週間グリッド表示、および集中講義・その他科目の表示
  - 開講年度・期間（クォーター / セメスター）の切り替え
  - 科目名・科目コード・担当教員でのインクリメンタル検索
  - 科目単位で登録できる **BEEF2026（Moodle）コース直接リンク** ショートカット
- **講義詳細・教材ビュー (`/lms/course?idnumber=...`)**
  - コース概要、授業情報、お知らせ（モーダルで詳細閲覧）、課題、テスト、アンケート、掲示板、担当へのメッセージを集約表示
  - セクション別の教材一覧と **1 クリック教材ダウンロード**（BEEF+ ネイティブの一時ファイル API と隠しフォームを安全に連携）
  - **BEEF2026 連携 URL 設定モーダル**（BEEF2026 を併用する科目の URL を手動登録・解除）
- **課題・テスト一覧 (`/lms/task*`)**
  - 全講義の未提出課題・小テスト・アンケートを集約し、締切順に自動ソート
  - 緊急度バッジ（期限切れ / 本日締切 / 近日中 / 今週中）、検索、講義・種別フィルタ
  - **BEEF2026 ダッシュボード課題同期（オプトイン）**: スイッチを ON にすると、バックグラウンドタブまたは開いた BEEF2026 ダッシュボード（`https://beef.center.kobe-u.ac.jp/my/`）から締切予定を取り込み、BEEF+ の課題と統合表示・LMS 別フィルタが可能
- **ハイブリッド設計による安全性の担保**
  - 課題提出 (`/lms/course/report/submission*`)、小テスト解答 (`/lms/course/quiz/take*`)、教員メッセージ (`/lms/message/*`)、ポータル (`/portal/*`) などはネイティブ DOM と送信機構を 100% そのまま維持し、`legacy-theme.css` によるデザイン・ダークモード整形のみを適用
- **快適性 & デザイン**
  - Light / Dark / System 連動テーマ（`document_start` 注入により読み込み時の白飛び / FOUC を防止）
  - SPA ナビゲーション + SWR（Stale-While-Revalidate）キャッシュにより、`localStorage` / `chrome.storage.local` から即座に描画しつつバックグラウンドで最新データへ更新
  - 画面幅に応じた折りたたみ式サイドバー（PC）およびスライドインドロワー（モバイル）

---

## ハイブリッド画面設計方針

| 画面種別 | 対象 URL パターン | 方式 | 役割・方針 |
| :--- | :--- | :--- | :--- |
| **時間割画面** | `/lms/timetable*` | **独自 React UI (CSUI)** | 曜日×時限のグリッド UI、講義カード、検索絞り込み、BEEF2026 リンク |
| **講義詳細・教材** | `/lms/course?idnumber=...` | **独自 React UI (CSUI)** | 授業情報、お知らせ詳細、教材の 1 クリック DL、BEEF2026 URL 設定 |
| **未提出タスク一覧** | `/lms/task*` | **独自 React UI (CSUI)** | 全講義の未提出課題・小テストを集約・締切ソート・BEEF2026 同期 |
| **課題提出フォーム** | `/lms/course/report/submission*` | **CSS インジェクション** | ネイティブ送信機構を 100% 保持し、提出事故を防止 |
| **小テスト・解答** | `/lms/course/quiz/take*` | **CSS インジェクション** | ラジオボタン選択・タイマー・送信の安全性を担保 |
| **教員メッセージ** | `/lms/message/*` | **CSS インジェクション** | フォーム・モーダル等のデザインをクリーンに整形 |
| **ポータル・その他** | `/portal/*`, その他 `/lms/*` | **CSS インジェクション** | ネイティブ画面への統一テーマ適用とフローティングテーマ切替 |
| **BEEF2026 同期** | `beef.center.kobe-u.ac.jp/my*` | **データ取得専用スクリプト** | オプトイン時のみタイムライン DOM から締切情報を抽出（UI 上書きなし） |

---

## ディレクトリ構成

```plaintext
my-beef-plus/
├── .github/         # Issue / Pull Request テンプレート
├── docs/            # 仕様書・ポリシー（PRD.md, PRIVACY.md）
├── plasmo/          # Chrome 拡張機能本体（Plasmo + React + Tailwind CSS + shadcn/ui）
│   ├── assets/      # 拡張機能アイコン
│   └── src/
│       ├── background.ts    # BEEF2026 バックグラウンド同期 Service Worker
│       ├── content.ts       # document_start ネイティブテーマ注入スクリプト
│       ├── contents/        # CSUI (app.tsx, legacy-theme-toggle.tsx, beef2026-dashboard.ts)
│       ├── components/      # React コンポーネント (timetable, course, task, ui)
│       ├── pages/           # 各画面レイアウト・ページコンポーネント
│       └── lib/             # パーサー群 (parsers/), ルーター, キャッシュ, DL 処理
├── AGENTS.md        # AI コーディングエージェント向け開発ガイドライン
├── CONTRIBUTING.md  # コントリビューションガイド
├── SECURITY.md      # セキュリティポリシー
├── LICENSE          # MIT License
└── README.md
```

> [!NOTE]
> パーサー検証用の実機 HTML サンプル（`samples/`）は学籍番号・履修情報等の個人情報保護のため `.gitignore` 対象となっており、公開リポジトリには含まれていません。

---

## 前提条件 (Prerequisites)

- **Node.js**: v20.x 以上 推奨
- **pnpm**: v9.x 以上 推奨
  ```bash
  # pnpm が未インストールの場合は corepack または npm でインストール
  corepack enable
  # または
  npm install -g pnpm
  ```
- **Google Chrome**（または Chromium 系ブラウザ）

---

## ビルド & 読み込み方法

### 1. 依存関係のインストールとビルド

拡張機能本体の開発・ビルドは `plasmo` ディレクトリで行います。

```bash
cd plasmo
pnpm install
```

- **開発モード（ホットリロード）**:
  ```bash
  pnpm dev
  ```
  `plasmo/build/chrome-mv3-dev/` に生成され、ファイル変更時に自動再ビルドされます。

- **本番ビルド**:
  ```bash
  pnpm build
  ```
  `plasmo/build/chrome-mv3-prod/` に最適化された本番バンドルが出力されます。

- **配布用パッケージ作成（ZIP 化）**:
  ```bash
  pnpm package
  ```
  `plasmo/build/` 配下に `.zip` ファイルが出力されます。

### 2. Chrome ブラウザへの拡張機能の読み込み手順

1. Google Chrome を開き、URL バーに `chrome://extensions/` と入力してアクセスします。
2. 右上の「**デベロッパー モード**」のトグルを **ON** にします。
3. 左上に表示される「**パッケージ化されていない拡張機能を読み込む**」をクリックします。
4. プロジェクト内の以下のディレクトリを選択します:
   - 開発時: `my-beef-plus/plasmo/build/chrome-mv3-dev`
   - 本番確認時: `my-beef-plus/plasmo/build/chrome-mv3-prod`
5. 拡張機能一覧に「My BEEF+」が追加されれば準備完了です。

> [!TIP]
> `background.ts` やマニフェスト設定を変更した場合は、`chrome://extensions/` 上で拡張機能の更新アイコン（リロードボタン）をクリックしてください。

---

## テスト & 動作検証方法

現在、自動テストフレームワーク（Vitest / Playwright 等）は未導入のため、**型チェック**と**実機ブラウザでの動作検証**によって品質を担保しています。

### 1. TypeScript 型チェック

コミットやプルリクエスト前に必ず型エラーがないことを確認してください。

```bash
cd plasmo
pnpm tsc --noEmit
```

### 2. 実機（BEEF+ / BEEF2026）での動作検証

拡張機能を Chrome に読み込んだ状態で、ログイン済みの BEEF+ にアクセスして以下を確認します。

- **時間割画面**: `https://beefplus.center.kobe-u.ac.jp/lms/timetable`
  - 週間グリッド・検索・年度/期間切替・BEEF2026 リンクが動作するか
- **講義詳細画面**: `https://beefplus.center.kobe-u.ac.jp/lms/course?idnumber=...`
  - お知らせ詳細モーダル、教材一覧、1 クリックダウンロード、BEEF2026 URL 設定が動作するか
- **課題・テスト一覧**: `https://beefplus.center.kobe-u.ac.jp/lms/task`
  - タスクの集約・締切ソート・フィルタが動作するか（必要に応じて BEEF2026 同期スイッチの ON/OFF も確認）
- **提出・テスト・メッセージ画面**: `https://beefplus.center.kobe-u.ac.jp/lms/course/report/submission*` 等
  - ネイティブ DOM が壊れず表示され、`legacy-theme.css` と右上のテーマ切替ボタンが正常に機能するか

パーサー（[plasmo/src/lib/parsers/](plasmo/src/lib/parsers/)）を修正する際は、ローカル環境（`.gitignore` 対象の `samples/` 等）に保存した HTML で DOM セレクタを確認し、**個人情報や実機 HTML をリポジトリにコミットしないようご注意ください**。

---

## セキュリティ & プライバシー

- **ゼロ・外部サーバー通信**: ユーザーの履修・課題・個人情報等を開発者または第三者の外部サーバーへ送信することは一切ありません。
- **認証情報の非保持**: パスワードやセッション Cookie を拡張機能側で独自に収集・保存しません（ログイン済みブラウザセッションをそのまま利用します）。
- **限定された対象ドメイン**: 動作対象は神戸大学公式の `https://beefplus.center.kobe-u.ac.jp/*` および（BEEF2026 同期機能利用時の）`https://beef.center.kobe-u.ac.jp/my*` に限定されています。
- **端末ローカル完結**: 高速表示用キャッシュや設定値（テーマ、サイドバー開閉状態、BEEF2026 連携 URL、同期設定）はすべてブラウザのローカル領域（`chrome.storage.local` / `localStorage`）にのみ保存されます。

詳細は [プライバシーポリシー (docs/PRIVACY.md)](docs/PRIVACY.md) および [セキュリティポリシー (SECURITY.md)](SECURITY.md) をご覧ください。

---

## コントリビューション

バグ報告、機能提案、プルリクエストを歓迎します。開発ルールや PR 作成時の注意点については [CONTRIBUTING.md](CONTRIBUTING.md)（および AI エージェント向け仕様の [AGENTS.md](AGENTS.md)）をご参照ください。

---

## 免責事項 (Disclaimer)

- 本拡張機能は個人によって開発・メンテナンスされている非公式ツールであり、神戸大学、情報基盤センター（ISTC）、および LMS ベンダーとは一切関係ありません。
- 大学側システムの仕様変更・改修により、予告なく一部またはすべての機能が利用できなくなる可能性があります。
- 課題提出・テスト解答画面等は安全担保のため公式のネイティブ画面（DOM）をそのまま利用する「ハイブリッド設計」を採用していますが、本拡張機能の利用により生じたいかなる損害・不利益（課題の未提出、テスト送信エラー、単位取得トラブル等）についても、開発者は一切の責任を負いかねます。自己責任でご利用ください。

---

## ライセンス

[MIT License](LICENSE) © 2026 Miyanber
