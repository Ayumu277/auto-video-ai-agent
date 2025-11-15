/**
 * Step 5: 書き出し（最終mp4）
 */

import { getVideoPath, readMetadata, writeMetadata } from '@/backend/libs/storage';
import { exportVideo } from '../utils/ffmpeg';
import type { JobData } from '@/shared/types';

export async function exportFinal(jobData: JobData): Promise<void> {
  const { video_id } = jobData;

  console.log(`[export] Starting final export for video: ${video_id}`);

  // メタデータを更新
  const metadata = await readMetadata(video_id);
  if (!metadata) {
    throw new Error(`Metadata not found for video: ${video_id}`);
  }

  metadata.steps.export = true;
  metadata.status = 'processing';
  metadata.updated_at = new Date().toISOString();
  await writeMetadata(video_id, metadata);

  // 最終動画をエクスポート
  const inputPath = getVideoPath(video_id, 'bgm.mp4');
  const outputPath = getVideoPath(video_id, 'edited.mp4');

  // 最適化された設定でエクスポート
  await exportVideo(inputPath, outputPath, {
    filters: [
      'scale=1280:720', // 解像度を統一
      'fps=30', // フレームレートを統一
    ],
  });

  // メタデータに結果を保存
  metadata.result.video = outputPath;
  metadata.updated_at = new Date().toISOString();
  await writeMetadata(video_id, metadata);

  console.log(`[export] Final export completed for video: ${video_id}`);
}
