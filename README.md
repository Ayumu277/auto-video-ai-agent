# Auto Video AI Agent

撮影した動画をアップするだけで、SNS向けショート動画が完成するAI動画編集エージェント

## セットアップ

### 1. 依存関係のインストール

```bash
pnpm install
```

### 2. 環境変数の設定

`.env.example` を `.env` にコピーして、必要な値を設定してください。

```bash
cp .env.example .env
```

### 3. Redisの起動

ローカルでRedisを起動してください。

```bash
# Dockerを使用する場合
docker run -d -p 6379:6379 redis:7-alpine

# Homebrewでインストールした場合
brew services start redis
```

### 4. Whisperのインストール

Whisperをインストールしてください。

```bash
pip install -U openai-whisper
```

### 5. ffmpegのインストール

ffmpegをインストールしてください（`ffmpeg-static`を使用する場合は不要）。

```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt install ffmpeg
```

## 開発

### フロントエンド＋API

```bash
pnpm dev
```

### Worker（動画処理）

別ターミナルでWorkerを起動してください。

```bash
pnpm worker:dev
```

## アーキテクチャ

詳細は `docs/architecture/system.md` を参照してください。

### ディレクトリ構成

```
src/
├ app/                    # Next.js App Router
│ └ api/                 # API Routes
│   └ videos/
│     ├ route.ts         # POST /api/videos
│     └ [id]/
│       ├ status/        # GET /api/videos/{id}/status
│       ├ result/        # GET /api/videos/{id}/result
│       └ title/         # GET /api/videos/{id}/title
│
├ backend/               # バックエンドライブラリ
│ └ libs/
│   ├ storage.ts
│   ├ videoId.ts
│   └ jobQueue.ts
│
├ jobs/                  # 動画処理ジョブ
│ ├ index.ts            # Worker entrypoint
│ ├ videoProcessor.ts   # パイプライン本体
│ ├ steps/              # 各処理ステップ
│ └ utils/              # ffmpeg, whisperユーティリティ
│
└ shared/                # 共通型・定数
  └ types.ts
```

## API仕様

詳細は `docs/api/endpoints.md` を参照してください。

### エンドポイント

- `POST /api/videos` - 動画アップロード＆処理ジョブ作成
- `GET /api/videos/{id}/status` - 処理ステータス取得
- `GET /api/videos/{id}/result` - 完成動画取得
- `GET /api/videos/{id}/title` - タイトル案生成

## 処理フロー

1. **動画アップロード** → `/tmp/videos/{video_id}/raw.mp4` に保存
2. **文字起こし** → Whisperで文字起こし
3. **無音カット** → ffmpegで無音区間を検出・削除
4. **テロップ生成** → ASS形式の字幕を生成・焼き込み
5. **BGM追加** → 背景音楽を追加
6. **書き出し** → 最終mp4を生成
7. **サムネイル生成** → サムネイル画像を生成

## TODO

- [ ] 無音カットの完全実装
- [ ] BGM追加の完全実装
- [ ] LLM APIによるタイトル生成
- [ ] フロントエンド実装
- [ ] テスト追加
