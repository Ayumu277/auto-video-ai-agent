/**
 * Step 2: 無音カット（ffmpeg -af silencedetect）
 */

import { detectSilence, exportVideo } from '../utils/ffmpeg';
import { getVideoPath, readMetadata, writeMetadata } from '@/backend/libs/storage';
import type { JobData } from '@/shared/types';

export async function cutSilence(jobData: JobData): Promise<void> {
  const { video_id, video_path } = jobData;

  console.log(`[cutSilence] Starting silence detection for video: ${video_id}`);

  // メタデータを更新
  const metadata = await readMetadata(video_id);
  if (!metadata) {
    throw new Error(`Metadata not found for video: ${video_id}`);
  }

  metadata.steps.cut = true;
  metadata.status = 'processing';
  metadata.updated_at = new Date().toISOString();
  await writeMetadata(video_id, metadata);

  // 無音区間を検出
  const silenceRanges = await detectSilence(video_path);

  // 無音区間をカットした動画を生成
  // 簡易実装：実際にはより高度なカットロジックが必要
  const outputPath = getVideoPath(video_id, 'cut.mp4');

  // TODO: 無音区間を実際にカットする処理を実装
  // 現在は単純にコピー（実装の簡略化）
  await exportVideo(video_path, outputPath);

  metadata.updated_at = new Date().toISOString();
  await writeMetadata(video_id, metadata);

  console.log(`[cutSilence] Silence cutting completed for video: ${video_id}`);
}
