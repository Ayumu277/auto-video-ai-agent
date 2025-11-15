/**
 * Step 4: BGM自動付与
 */

import { getVideoPath, readMetadata, writeMetadata } from '@/backend/libs/storage';
import { exportVideo } from '../utils/ffmpeg';
import type { JobData } from '@/shared/types';

export async function addBgm(jobData: JobData): Promise<void> {
  const { video_id } = jobData;

  console.log(`[bgm] Starting BGM addition for video: ${video_id}`);

  // メタデータを更新
  const metadata = await readMetadata(video_id);
  if (!metadata) {
    throw new Error(`Metadata not found for video: ${video_id}`);
  }

  metadata.steps.bgm = true;
  metadata.status = 'processing';
  metadata.updated_at = new Date().toISOString();
  await writeMetadata(video_id, metadata);

  // BGMファイルのパス（デフォルトまたは設定から取得）
  // TODO: BGMファイルの選択ロジックを実装
  const bgmPath = process.env.DEFAULT_BGM_PATH || '';

  const inputPath = getVideoPath(video_id, 'subtitle.mp4');
  const outputPath = getVideoPath(video_id, 'bgm.mp4');

  if (bgmPath && await import('fs/promises').then((fs) => fs.access(bgmPath).then(() => true).catch(() => false))) {
    // BGMを追加（ffmpegで音声をミックス）
    // TODO: 実際のBGM追加処理を実装
    // 現在は単純にコピー（実装の簡略化）
    await exportVideo(inputPath, outputPath);
  } else {
    // BGMなしでコピー
    await exportVideo(inputPath, outputPath);
  }

  metadata.updated_at = new Date().toISOString();
  await writeMetadata(video_id, metadata);

  console.log(`[bgm] BGM addition completed for video: ${video_id}`);
}
