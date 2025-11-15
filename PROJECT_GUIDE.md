# Auto-Video-AI Agent – Project Guide

## 1. プロジェクト概要
Auto-Video-AI Agent は、「撮影した動画をアップするだけで、SNS向けショート動画が完成する」ことを実現する個人向けAI動画編集エージェントである。

本プロダクトは、特に**フルタイムで働きながらSNS発信を継続したい人**を対象とし、編集という最大の負担を完全自動化することで「撮るだけで投稿できる」状態を実現する。

## 2. 想定ユーザー（N=1 からの拡張）
中心となるペルソナは以下：

- 22〜35歳の社会人
- YouTube / TikTok / X で発信したい
- でも編集が重くて継続できていない
- iPhoneで自撮りした素材を活かしたい
- スモビジ/AIツール紹介/学習ログ系クリエイター志望

N=1（Ayumu本人）の課題を核とし、同様の社会人クリエイター層へ横展開する。

## 3. 解決する課題
- 編集の意思決定負荷が高すぎて続かない
- 撮影→編集→投稿という導線が長すぎる
- 喋る構成が毎回ゼロベース
- クオリティが安定しない
- 動画編集ツールが“補助止まり”で全自動にならない

## 4. プロダクトのコア機能
### ◎ MVP（最小構成で価値が出る機能）
1. 動画アップロード
2. 文字起こし（Whisper）
3. 自動カット（無音区間・噛み・言い直しの削除）
4. 自動テロップ生成（字幕焼き込み or Overlays）
5. 自動BGM付与
6. 自動サムネ抽出
7. 自動タイトル案生成
8. 完成動画のDL

### ◎ フル版で追加予定の機能
- 台本テンプレート生成（Hook→Body→CTA）
- 内容補正（AIによる論理構成・冗長削除）
- AI編集スタイルプリセット
- 投稿プラットフォーム別の最適化（15/30/60秒）
- Project管理（作品・台本の保存）

## 5. 技術スタック（予定）
### Backend
- FastAPI or Next.js API Routes
- Python（Whisper, moviepy, ffmpeg）
- OpenAI API / Claude API / Gemini API（内容補正）
- Supabase / S3（動画保存）

### Frontend
- Next.js 15
- TailwindCSS
- React Server Components

## 6. 開発フロー（AI利用前提）
1. Issueを立てる
2. docs/requirements → docs/api → docs/architecture を AI が更新
3. その後コード生成
4. PRメッセージ・テストもAIが生成
5. 変更があれば docs にも反映

## 7. docs 配下の構造
- requirements/ … 要件定義
- design/ … 画面設計
- api/ … API仕様（OpenAPI風）
- architecture/ … システム構成
- meetings/ … 日次ログ、議事録

## 8. AIアシスタントへ
- まずこのファイルを読み、プロジェクト全体の目的を理解すること
- docs 配下へ必ず反映しながらコードを生成すること
- 設計変更が発生したら docs → code の順で更新すること
