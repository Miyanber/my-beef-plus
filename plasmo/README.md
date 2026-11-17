# My BEEF+ (`plasmo`)

[My BEEF+](../README.md) の Chrome 拡張機能本体（Plasmo Framework / Manifest V3）のディレクトリです。

ビルド手順、機能概要、アーキテクチャ、およびコントリビューション方法については、リポジトリルートのドキュメントを参照してください。

- [ルート README](../README.md)
- [製品要求仕様書 (PRD)](../docs/PRD.md)
- [プライバシーポリシー](../docs/PRIVACY.md)
- [コントリビューションガイド](../CONTRIBUTING.md)

## クイックコマンド

```bash
pnpm install
pnpm dev          # 開発ビルド (build/chrome-mv3-dev)
pnpm tsc --noEmit # TypeScript 型チェック
pnpm build        # 本番ビルド (build/chrome-mv3-prod)
pnpm package      # 配布用 zip 作成
```
