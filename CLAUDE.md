# Claude Guide – Auto Video AI Agent

このガイドは、Claude Code が「Auto Video AI Agent」の開発・設計・更新を行う際に従うべきルールをまとめたものです。
Claude はこのリポジトリを **ドキュメント駆動 + 自走型AI開発プロジェクト** として扱い、以下のポリシーに従います。

---

# 🚀 1. Claude が最初に読むべきファイル
Claude は作業前に、必ず次のファイルを読み込むこと：

1. `PROJECT_GUIDE.md`（プロジェクトの核）
2. `.cursor/rules.mdc`（開発ポリシー）
3. `docs/requirements/*`（要件定義）
4. `docs/api/*`（API仕様）
5. `docs/architecture/*`
6. 作業対象の Issue（あれば）

---

# 🎯 2. Claude の役割（このプロジェクトでの“性格”）
Claude の主な使命は以下：

- 仕様書とコードの **完全整合性** を守る
- ドキュメントを常に最新に保つ
- Issue を読み込み、必要な設計変更 → コード生成を行う
- コード変更の理由や意図を文章で説明する
- フォルダ構造・アーキテクチャを破壊しない
- 不明点は勝手に決めず、選択肢を出して確認する

---

# 🧩 3. 開発フロー（Claude が守るべき順番）

Claude は以下の順序で作業する：

### **Step 1：Issueの内容を理解する**
- 目的
- 要件
- 影響範囲
を読み解く。

### **Step 2：必要であれば docs を修正**
- requirements → api → architecture の順に反映する
- 設計変更を PR のために文章化

### **Step 3：コード生成**
- docs/api の仕様に従ってコードを実装
- 背景説明や設計理由も生成
- 関連するテストも生成

### **Step 4：diff の説明を生成する**
- どこを、なぜ変更したかを文章でまとめる

### **Step 5：README・docs の整合性チェック**
- 必要に応じてドキュメントを更新

---

# 🗂 4. ディレクトリ別のルール

## docs/
Claude はコード変更の前に必ず docs を更新する。

- requirements/ … 追加機能はここから更新
- api/ … エンドポイント更新時に必ず更新
- architecture/ … 構成変更やシーケンス変更時に更新

## backend/
- FastAPI（Python）で構築
- Whisper / ffmpeg / moviepy を使用する場合は utils 層に切り出す
- 外部モデル（OpenAI, Claude, Gemini）は services 層で扱う

## frontend/
- Next.js 15（App Router）+ TypeScript + TailwindCSS
- 画面構成は docs/design/screens.md に基づく
- API呼び出しは `/src/frontend/lib/api.ts` に集約

---

# 📄 5. コミット/PRルール（Claudeが生成する時）
- 原則として PR を作成して説明を記述する
- コミットメッセージは Conventional Commits に従う
  例：
  - `feat: add video upload endpoint`
  - `fix: adjust ffmpeg cut logic`
  - `docs: update API spec`

---

# 🧠 6. 不明点がある場合の対応
Claude はあいまいな仕様を勝手に決めてはならない。
代わりに：

- A案 / B案 / C案 を提示し
- 選択してもらう
- もしくは最終的な仕様を質問する

---

# 🔥 7. 開発スタイル
- Documentation Driven Development（DDD）
- API First
- 一貫したファイル構造
- 設計と実装が常に同期した状態を保つ

---

# 🧪 8. テスト方針
- backend: `tests/`
- frontend: `__tests__/`
- ユニットテスト最低1つを付ける
- APIの入出力検証は基本自動で生成

---

# 🔐 9. 禁止事項
Claude は以下を行ってはならない：

- docs を更新せずにコードだけ変更
- API仕様と矛盾する実装
- フォルダ構造を勝手に変える行為
- 設計とコードの不整合を放置

---

# 🎉 10. 目的
このガイドは、Claude が
**高速かつ一貫した設計・実装・保守を自動で行える状態を作るための基盤** である。

Claude は常に本ファイルと PROJECT_GUIDE.md を参照し、
プロジェクト全体の整合性を維持しながら作業すること。
