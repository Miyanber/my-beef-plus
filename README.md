# My BEEF+ (`my-beef-plus`)

神戸大学の学修管理システム（LMS）「**BEEF+**」のUI/UXを刷新し、学生の学習効率と操作性を飛躍的に高める非公式ブラウザ拡張機能（Google Chrome Extension）です。

> **Note**: 本拡張機能は神戸大学および関連組織とは一切関係のない、個人が開発した非公式オープンソースプロジェクトです。詳細は[免責事項](#免責事項-disclaimer)をご確認ください。

情報閲覧・集約を行うダッシュボード画面は**独自のモダンReact UI**、提出やテスト解答など安全性が最優先されるトランザクション画面は**CSSインジェクション**を適用する「**ハイブリッド・アーキテクチャ**」を採用しています。

詳細な要件や設計思想は [docs/PRD.md](file:///c:/Users/Miyanber/Desktop/dev/repos/my-beef-plus/docs/PRD.md) をご覧ください。

---

## ディレクトリ構成

```plaintext
my-beef-plus/
├── plasmo/          # Chrome拡張機能本体（Plasmo + React + Tailwind CSS + shadcn/ui）
├── samples/         # BEEF+ / BEEF2026 実機から保存したサンプルHTML・アセット（パーサー検証用・.gitignore対象）
└── docs/            # 仕様書・設計書（PRD.md 等）
```

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

## ビルド & 実行方法

### 1. Chrome拡張機能 (`plasmo`)

拡張機能本体の開発・ビルドは `plasmo` ディレクトリで行います。

```bash
cd plasmo

# 依存パッケージのインストール
pnpm install
```

#### 開発モード（ホットリロード）
```bash
pnpm dev
```
- ビルド成果物が `plasmo/build/chrome-mv3-dev/` に生成されます。
- コードを変更すると自動的に再ビルドされます。

#### 本番ビルド
```bash
pnpm build
```
- 最適化された本番バンドルが `plasmo/build/chrome-mv3-prod/` に出力されます。

#### ストア配布用パッケージ作成（ZIP化）
```bash
pnpm package
```
- 配布用の `.zip` ファイルが `plasmo/build/` 配下に出力されます。

---

### 2. Chromeブラウザへの拡張機能の読み込み手順

1. Google Chrome を開き、URLバーに `chrome://extensions/` と入力してアクセスします。
2. 右上の「**デベロッパー モード**」のトグルを **ON** にします。
3. 左上に表示される「**パッケージ化されていない拡張機能を読み込む**」をクリックします。
4. プロジェクト内の以下のディレクトリを選択します:
   - 開発時: `my-beef-plus/plasmo/build/chrome-mv3-dev`
   - 本番確認時: `my-beef-plus/plasmo/build/chrome-mv3-prod`
5. 拡張機能一覧に「My BEEF+」が追加されれば準備完了です。

> **Note**: コードを変更した際、マニフェストやバックグラウンド周りの変更時は拡張機能管理画面の更新アイコン（リロードボタン）をクリックして再読み込みしてください。

---

## テスト & 動作検証方法

現在、自動テストフレームワーク（Vitest/Jest等）は未導入のため、**実機ブラウザでの検証**、**サンプルHTMLによるDOMパーサーの整合性確認**、および**型チェック・リント**によって品質を担保しています。

### 1. 実機（BEEF+）での動作検証

拡張機能をChromeにロードした状態で、実際の神戸大学 BEEF+ にアクセスして動作確認を行います。

- **時間割画面**: `https://beefplus.center.kobe-u.ac.jp/lms/timetable`
  - 独自React UIでグリッド表示されるか
- **講義詳細画面**: `https://beefplus.center.kobe-u.ac.jp/lms/course?idnumber=...`
  - 教材一覧の描画および1クリックダウンロードが動作するか
- **未提出課題一覧**: `https://beefplus.center.kobe-u.ac.jp/lms/task`
  - 全講義のタスクが集約・ソートされて表示されるか
- **提出・テスト画面**: `https://beefplus.center.kobe-u.ac.jp/lms/course/report/submission*` 等
  - ネイティブDOMが壊れず表示され、CSSインジェクション（ダークモード等）が正しく適用されているか

#### デバッグモード（キャッシュ無効化）
通常、パース結果は `chrome.storage.local` にキャッシュされます。毎回強制的にスクレイピング・パースを実行させたい場合は、`plasmo/.env` に以下を設定します。

```env
PLASMO_PUBLIC_DEBUG="True"
```

### 2. サンプルHTML (`samples/`) を用いた検証

`samples/` ディレクトリには、BEEF+ および BEEF2026 実機のHTMLファイルがサブフォルダごとに保存されています（`samples/BEEF+/`, `samples/BEEF2026/`）。
- `samples/BEEF+/lms/timetable.html`: 時間割画面のHTML構造
- `samples/BEEF+/lms/task.html`: タスク一覧画面のHTML構造
- `samples/BEEF+/lms/course/`: 講義トップ・教材一覧のHTML構造
- `samples/BEEF+/lms/course/report/submission/`: 課題提出画面のHTML構造
- `samples/BEEF2026/`: BEEF2026 の実機HTMLサンプル

パーサー関数（[`plasmo/src/lib/parsers/`](file:///c:/Users/Miyanber/Desktop/dev/repos/my-beef-plus/plasmo/src/lib/parsers/)）のセレクタ変更や新規パース処理を作成する際は、これらのHTMLのクラス名・DOMツリーを参照して検証してください。

### 3. 型チェック (Type Check)

コミットやプルリクエスト前に型エラーを検証します。

```bash
# 拡張機能の TypeScript 型チェック
cd plasmo
pnpm tsc --noEmit
```

---

## ハイブリッド画面設計方針

| 画面種別 | 対象URLパターン | 方式 | 役割・方針 |
| :--- | :--- | :--- | :--- |
| **時間割画面** | `/lms/timetable*` | **独自React UI (CSUI)** | 曜日×時限のグリッドUI、講義カード、検索絞り込み |
| **講義詳細・教材** | `/lms/course?idnumber=...` | **独自React UI (CSUI)** | 授業情報、お知らせ、教材の1クリックダウンロード |
| **未提出タスク一覧**| `/lms/task*` | **独自React UI (CSUI)** | 全講義の未提出課題・小テストを集約・締切ソート |
| **課題提出フォーム**| `/lms/course/report/submission*` | **CSSインジェクション** | ネイティブ送信機構を100%保持し、提出事故を完全防止 |
| **小テスト・解答**  | `/lms/course/quiz/take*` | **CSSインジェクション** | ラジオボタン選択・タイマー・送信の安全性を担保 |
| **教員メッセージ**  | `/lms/message/*` | **CSSインジェクション** | フォーム・モーダル等のデザインをクリーンに整形 |
| **共通テーマ**      | 全体 | **CSS / next-themes** | OKLCHベースの完全ダークモード対応 |

---

## セキュリティ & プライバシーポリシーへの配慮

- **ゼロ・外部通信**: ユーザーの講義データ、課題情報、提出状況等を開発者を含む外部サーバーへ送信することは一切ありません。
- **認証情報の保護**: パスワードやセッションCookieを拡張機能側で独自に収集・保持することはありません。
- **端末ローカル完結**: 表示高速化のためのキャッシュはすべてブラウザのローカルストレージ（`chrome.storage.local`）にのみ保存されます。

詳細な条項は [プライバシーポリシー (docs/PRIVACY.md)](docs/PRIVACY.md) をご覧ください。

---

## 免責事項 (Disclaimer)

- 本拡張機能は個人によって開発・メンテナンスされている非公式ツールであり、神戸大学、情報基盤センター、および LMS ベンダーとは一切関係ありません。
- 大学側システムの仕様変更・改修により、予告なく一部またはすべての機能が利用できなくなる可能性があります。
- 課題提出・テスト解答画面等は安全担保のため公式のネイティブ画面（DOM）をそのまま利用する「ハイブリッド設計」を採用していますが、本拡張機能の利用により生じたいかなる損害・不利益（課題の未提出、テスト送信エラー、単位取得トラブル等）についても、開発者は一切の責任を負いかねます。自己責任でご利用ください。

---

## ライセンス

[MIT License](LICENSE) © 2026 Miyanber
