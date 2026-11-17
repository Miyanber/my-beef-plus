# コントリビューションガイド (Contributing Guide)

My BEEF+ (`my-beef-plus`) へのコントリビューションを歓迎します！バグ報告、機能提案、ドキュメント改善、プルリクエスト（PR）をお送りいただく前に、以下のガイドラインをご確認ください。

---

## 🚨 最重要ルール

### 1. 個人情報・学内機密データを絶対にコミット / 投稿しない
本プロジェクトは公開（Public）リポジトリです。**Issue、PR、コミット履歴、スクリーンショット**に以下の情報を含めないでください。

- 学籍番号、氏名、メールアドレス、ログイン ID / パスワード / Cookie / CSRF トークン
- BEEF+ / BEEF2026 から保存した未加工の HTML ファイル（`samples/` は `.gitignore` 対象です）
- 授業内の限定URL（Zoom / Teams 会議リンク、パスワード）、限定資料、教員・履修者名を含む未マスクのスクリーンショット
- `.env*` やストア公開用の秘密鍵（`*.pem`, `keys.json`）

パーサー修正のために DOM 構造を共有する場合は、**個人名・科目情報・トークン・リンクを必ずダミー文字列に置換（匿名化）した最小限の HTML スニペット**のみを使用してください。

### 2. 「ハイブリッド・アーキテクチャ」の厳守
本プロダクトでは安全性を最優先するため、以下の責務分離を厳守しています（詳細は [AGENTS.md](AGENTS.md) および [docs/PRD.md](docs/PRD.md) を参照）。

- **独自 React UI (CSUI)**: 時間割 (`/lms/timetable*`)、講義トップ (`/lms/course?idnumber=...`)、課題一覧 (`/lms/task*`)
- **ネイティブ DOM + CSS インジェクション (`legacy-theme.css`)**: 課題提出 (`/lms/course/report/submission*`)、小テスト解答 (`/lms/course/quiz/take*`)、メッセージ送信 (`/lms/message/*`)、その他ポータル等

**課題提出フォームや小テスト解答画面を React で再実装する変更は受け付けられません。**

---

## 開発環境のセットアップ

```bash
git clone https://github.com/Miyanber/my-beef-plus.git
cd my-beef-plus/plasmo
pnpm install
```

- 開発ビルド（ホットリロード）: `pnpm dev`
- 本番ビルド: `pnpm build`
- 型チェック: `pnpm tsc --noEmit`

> [!IMPORTANT]
> パッケージマネージャには **`pnpm`** を使用してください（`npm` / `yarn` による lockfile の追加は避けてください）。

---

## ブランチ・PR の作成手順

1. リポジトリをフォークし、`main` から作業ブランチを作成します（例: `fix/timetable-parser`, `feat/course-filter`）。
2. 変更を実装します。パス参照には `~lib/...` / `~components/...` または `@/...` エイリアスを使用してください。
3. コミット前に型チェックとビルドが通ることを確認します:
   ```bash
   cd plasmo
   pnpm tsc --noEmit
   pnpm build
   ```
4. ライトモード・ダークモードの両方で表示崩れがないか Chrome 実機で確認します。
5. Pull Request を作成し、変更目的・確認内容・影響範囲を記載します。

---

## バグ報告・機能提案 (Issues)

- 既存の Issue と重複していないか事前にご確認ください。
- Issue テンプレートに沿って、再現手順や環境情報（Chrome バージョン等）をご記入ください。
- 大学側 LMS の仕様変更でパーサーが動かなくなった場合は、該当箇所の匿名化済み HTML 構造があると迅速に対応できます。
