/**
 * Step 6: サムネイル生成
 */

import { getVideoPath, readMetadata, writeMetadata } from '@/backend/libs/storage';
import { generateThumbnail } from '../utils/ffmpeg';
import type { JobData } from '@/shared/types';

export async function generateThumbnailStep(jobData: JobData): Promise<void> {
  const { video_id } = jobData;

  console.log(`[thumbnail] Starting thumbnail generation for video: ${video_id}`);

  // メタデータを更新
  const metadata = await readMetadata(video_id);
  if (!metadata) {
    throw new Error(`Metadata not found for video: ${video_id}`);
  }

  metadata.steps.thumbnail = true;
  metadata.status = 'processing';
  metadata.updated_at = new Date().toISOString();
  await writeMetadata(video_id, metadata);

  // サムネイルを生成（動画の1秒目から）
  const videoPath = getVideoPath(video_id, 'edited.mp4');
  const thumbnailPath = getVideoPath(video_id, 'thumb.jpg');

  await generateThumbnail(videoPath, thumbnailPath, 1);

  // メタデータに結果を保存
  metadata.result.thumbnail = thumbnailPath;
  metadata.status = 'completed';
  metadata.updated_at = new Date().toISOString();
  await writeMetadata(video_id, metadata);

  console.log(`[thumbnail] Thumbnail generation completed for video: ${video_id}`);
}
