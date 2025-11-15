# API仕様書（endpoints）

**Auto Video AI Agent**

本ドキュメントは、Auto Video AI Agent のバックエンドAPI仕様のたたきである。
MVPのコアユースケースである「動画アップロード → 自動編集 → 完成動画DL」を中心に定義する。

---

## 1. 共通仕様

- **Base URL（ローカル開発時の想定）**
  `http://localhost:8000/api`（FastAPI想定）

- **認証**
  - MVPでは認証なし
  - Phase2 以降で API キー or JWT を追加予定

- **リクエスト/レスポンス形式**
  - JSON
  - 動画アップロードは multipart/form-data

- **エラーレスポンス（共通フォーマット）**

```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": {}
  }
}
```

---

## 2. エンドポイント一覧（MVP）

| 区分 | メソッド | パス | 説明 |
|------|---------|------|------|
| 動画アップロード | POST | /videos | 元動画アップロード＆処理ジョブ作成 |
| 処理ステータス取得 | GET | /videos/{video_id}/status | ジョブの進捗確認 |
| 完成動画取得 | GET | /videos/{video_id}/result | 完成動画のダウンロードURL取得 |
| タイトル案生成 | GET | /videos/{video_id}/title | Whisper＋LLMでタイトル生成 |

---

## 3. エンドポイント詳細

### 3.1 動画アップロード＆処理ジョブ作成

**POST /videos**

#### 概要
撮影した動画ファイルをアップロードし、自動編集処理のジョブを作成する。
処理は非同期で、レスポンスでは video_id を返す。

#### Request（multipart/form-data）

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| file | binary | ✅ | mp4 などの動画ファイル |
| platform_hint | string | ❌ | "tiktok" / "shorts" / "reels" |
| max_duration_seconds | int | ❌ | 最終動画の最大秒数（例：60） |

#### Response 例

```json
{
  "video_id": "vid_1234567890",
  "status": "queued"
}
```

---

### 3.2 処理ステータス取得

**GET /videos/{video_id}/status**

#### パスパラメータ

| 名前 | 型 | 必須 | 説明 |
|------|-----|------|------|
| video_id | string | ✅ | 動画ID |

#### Response 例

```json
{
  "video_id": "vid_1234567890",
  "status": "processing",
  "progress": 45,
  "steps": [
    { "name": "upload",     "status": "done" },
    { "name": "transcribe", "status": "done" },
    { "name": "cut",        "status": "processing" },
    { "name": "subtitle",   "status": "pending" },
    { "name": "bgm",        "status": "pending" },
    { "name": "export",     "status": "pending" }
  ]
}
```

**status の値：**
- `queued`
- `processing`
- `completed`
- `failed`

---

### 3.3 完成動画取得（ダウンロードリンク）

**GET /videos/{video_id}/result**

#### Response（completed 時）

```json
{
  "video_id": "vid_1234567890",
  "status": "completed",
  "download_url": "https://storage.example.com/vid_1234567890/output.mp4",
  "thumbnail_url": "https://storage.example.com/vid_1234567890/thumbnail.jpg"
}
```

#### Error（まだ処理中）

```json
{
  "error": {
    "code": "VIDEO_NOT_READY",
    "message": "Video is still processing."
  }
}
```

#### Error（失敗）

```json
{
  "video_id": "vid_1234567890",
  "status": "failed",
  "error": {
    "code": "PROCESSING_FAILED",
    "message": "ffmpeg error ...",
    "details": {}
  }
}
```

---

### 3.4 タイトル案生成

**GET /videos/{video_id}/title**

#### クエリパラメータ

| 名前 | 型 | 必須 | 説明 |
|------|-----|------|------|
| limit | int | ❌ | 最大候補数（デフォルト 3） |
| tone | string | ❌ | "casual" / "serious" / "hype" など |

#### Response 例

```json
{
  "video_id": "vid_1234567890",
  "titles": [
    "【神ツール】撮るだけで自動編集してくれるAIを作った",
    "忙しい社会人でも毎日投稿できる『自動編集AI』の話",
    "編集ゼロでショート動画が量産できる時代が来た件"
  ]
}
```

---

## 4. 今後追加予定のエンドポイント（メモ）

- **POST /templates**
  編集スタイルテンプレートの新規作成

- **GET /videos/{video_id}/transcript**
  文字起こしデータの取得

- **POST /videos/{video_id}/regenerate**
  設定変更による再生成（別テンプレート / BGM変更など）

---

## 5. 更新ポリシー

- エンドポイントを追加・変更する場合は、必ず **このドキュメントを先に更新**
- その後、backend 実装を更新する
- PR では API 仕様と実装の一致を必ずチェックする
- 破壊的変更時はバージョン記載＋レビュー必須
- MVP フェーズでは仕様を簡素にして高速に改善する
