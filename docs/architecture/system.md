# システムアーキテクチャ設計書（Auto Video AI Agent）

**MVP ローカル開発構成**

本ドキュメントは、Auto Video AI Agent の MVP（ローカル開発版）における
全体アーキテクチャ、データフロー、コンポーネント構成、ディレクトリ構成を定義する。

クラウド版（AWS）への移行を前提に、モジュールを疎結合で設計する。

---

# 🏗 1. 全体アーキテクチャ概要

```
+---------------------+
|     Frontend        |
|     (Next.js)       |
+----------+----------+
           |
           | HTTP (REST API)
           v
+-------------------------------+
|       Backend API             |
| (Next.js API Routes / Node)   |
+---------------+---------------+
                |
                | dispatch job
                v
+-------------------------------+
|       Job Queue (BullMQ)      |
|       Redis (local only)      |
+---------------+---------------+
                |
                | execute steps
                v
+-------------------------------+
|          Workers              |
| ffmpeg / whisper / node js    |
+-------------------------------+
                |
                | store output
                v
+-------------------------------+
|   Local Storage (/tmp/videos/)|
+-------------------------------+
```

---

# 🔄 2. 処理フロー（End-to-End）

1. **ユーザーが動画をアップロード（S-01）**
   → `/api/videos` に multipart POST
   → 動画を `/tmp/videos/{video_id}/raw.mp4` に保存
   → Job Queue に `video.process` を登録

2. **ステータス画面（S-02）**
   → `/api/videos/{id}/status` を2秒ごとにpoll
   → Queue内の job.status を返す

3. **バックエンド Worker が処理を進行**

```
Step 1: Whisperで文字起こし
Step 2: 無音カット（ffmpeg -af silencedetect）
Step 3: テロップ生成（Whisper結果からASS生成）
Step 4: BGM自動付与
Step 5: 書き出し（mp4）
Step 6: サムネイル生成
```

4. **処理完了後（S-03）**
   → `/api/videos/{id}/result` で mp4/thumbnail パスを返却
   → Frontend でプレビュー表示・ダウンロード可能

5. **タイトル案生成（S-04）**
   → `/api/videos/{id}/title`
   → Whisperの transcript を元に LLM がタイトル案を生成

---

# 🧱 3. コンポーネント分割

## ■ Frontend（Next.js）
- 画面：S-01〜S-04
- Fetch → API Routes 呼び出し
- Polling（SWR or setInterval）

## ■ Backend（Next.js API Routes）
- `/api/videos`（POST） … 保存 → ジョブ発行
- `/api/videos/[id]/status`（GET）
- `/api/videos/[id]/result`（GET）
- `/api/videos/[id]/title`（GET）

## ■ Jobs（BullMQ + Worker）
`src/jobs/videoProcessor.ts` がメインパイプライン

```
transcribe()
cutSilence()
generateSubtitle()
addBgm()
exportFinal()
generateThumbnail()
```

## ■ Local Storage

```
/tmp/videos/{video_id}/raw.mp4
/tmp/videos/{video_id}/transcript.json
/tmp/videos/{video_id}/edited.mp4
/tmp/videos/{video_id}/thumb.jpg
```

後で S3 に変更可能。

---

# 📁 4. ディレクトリ構成（MVP最適化版）

```
src/
├ frontend/                     # Next.js App Router
│ ├ app/
│ ├ components/
│ ├ hooks/
│ └ utils/
│
├ backend/                      # API Routes
│ ├ api/
│ │ ├ videos/
│ │ │ ├ route.ts               # POST /videos
│ │ │ └ [id]/
│ │ │   ├ status.ts            # GET /videos/{id}/status
│ │ │   ├ result.ts            # GET /videos/{id}/result
│ │ │   └ title.ts             # GET /videos/{id}/title
│ │ └ ...
│ └ libs/
│   ├ storage.ts
│   ├ videoId.ts
│   └ jobQueue.ts
│
├ jobs/                         # 動画処理ジョブ
│ ├ index.ts                    # Worker entrypoint
│ ├ videoProcessor.ts           # パイプライン本体
│ ├ steps/
│ │ ├ transcribe.ts
│ │ ├ cutSilence.ts
│ │ ├ subtitle.ts
│ │ ├ bgm.ts
│ │ └ export.ts
│ └ utils/
│   ├ ffmpeg.ts
│   └ whisper.ts
│
├ shared/                       # 共通型・DTO
│ ├ types.ts
│ └ constants.ts
│
└ scripts/                      # 開発用
  ├ dev.sh
  └ clean.sh
```

後で FastAPI に移行する際、
`jobs/` と `shared/` はそのまま使える。

---

# 💾 5. データ構造（最重要）

## ■ video metadata

`/tmp/videos/{video_id}/meta.json`

```json
{
  "video_id": "abc123",
  "status": "processing",
  "steps": {
    "upload": true,
    "transcribe": false,
    "cut": false,
    "subtitle": false,
    "bgm": false,
    "export": false
  },
  "result": {
    "video": null,
    "thumbnail": null,
    "transcript": null
  }
}
```

## ■ status API のレスポンス

```json
{
  "video_id": "abc123",
  "status": "processing",
  "progress": 45,
  "steps": {
    "upload": true,
    "transcribe": true,
    "cut": false,
    "subtitle": false
  }
}
```

---

# 🔌 6. ジョブ処理パイプライン

```
video.process
    ├── transcribe()       # whisper
    ├── cutSilence()       # ffmpeg
    ├── subtitle()         # ass生成 + ffmpeg overlay
    ├── bgm()              # 背景音追加
    ├── exportFinal()      # 最終mp4
    └── thumbnail()        # 生成
```

---

# 🧰 7. 使用技術

| カテゴリ | 技術 |
|---------|------|
| Frontend | Next.js 14 App Router |
| Backend | Next.js API Routes |
| Video Processing | ffmpeg CLI |
| Speech-to-Text | Whisper (local) |
| Job Queue | BullMQ + Redis (local) |
| Storage | Local FS → その後 S3 |
| LLM | Claude / Gemini / local LLM どれでも |

---

# 🚀 8. 将来のクラウド移行方針（A→B）

- API はそのまま → FastAPI/Lambda に載せ替え可能
- Queue → SQS に置き換え可能
- Storage → S3 に移動
- Worker → ECS/Lambda 化

MVPのコードは後からクラウド構成に"差し替え"できるように、
すべて疎結合で構築する。

---

# 📌 9. 注意点

- ローカルで Whisper / ffmpeg が動くことを前提にする
- ファイルサイズ上限は 200MB
- ファイル名・パスは英数字のみ
- エラー時は meta.json に保存し、フロントで表示

---

# ✅ 10. MVP完成条件

- S-01〜S-04 がローカルで動作
- 動画アップロード→自動編集→ダウンロードが完了
- タイトル案生成が成功
