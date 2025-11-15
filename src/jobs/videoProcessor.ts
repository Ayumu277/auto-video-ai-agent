/**
 * メインパイプライン: 動画処理の各ステップを順次実行
 */

import type { JobData } from '@/shared/types';
import { readMetadata, writeMetadata } from '@/backend/libs/storage';
import { transcribe } from './steps/transcribe';
import { cutSilence } from './steps/cutSilence';
import { generateSubtitle } from './steps/subtitle';
import { addBgm } from './steps/bgm';
import { exportFinal } from './steps/export';
import { generateThumbnailStep } from './steps/thumbnail';

export async function processVideo(jobData: JobData): Promise<void> {
  const { video_id } = jobData;

  console.log(`[videoProcessor] Starting video processing pipeline for: ${video_id}`);

  try {
    // メタデータを読み込む
    const metadata = await readMetadata(video_id);
    if (!metadata) {
      throw new Error(`Metadata not found for video: ${video_id}`);
    }

    // ステップ1: 文字起こし
    if (!metadata.steps.transcribe) {
      await transcribe(jobData);
    }

    // ステップ2: 無音カット
    if (!metadata.steps.cut) {
      await cutSilence(jobData);
    }

    // ステップ3: テロップ生成
    if (!metadata.steps.subtitle) {
      await generateSubtitle(jobData);
    }

    // ステップ4: BGM追加
    if (!metadata.steps.bgm) {
      await addBgm(jobData);
    }

    // ステップ5: 最終書き出し
    if (!metadata.steps.export) {
      await exportFinal(jobData);
    }

    // ステップ6: サムネイル生成
    if (!metadata.steps.thumbnail) {
      await generateThumbnailStep(jobData);
    }

    console.log(`[videoProcessor] Video processing completed successfully for: ${video_id}`);
  } catch (error) {
    console.error(`[videoProcessor] Error processing video ${video_id}:`, error);

    // エラーをメタデータに保存
    const metadata = await readMetadata(video_id);
    if (metadata) {
      metadata.status = 'failed';
      metadata.error = {
        code: 'PROCESSING_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: {
          stack: error instanceof Error ? error.stack : undefined,
        },
      };
      metadata.updated_at = new Date().toISOString();
      await writeMetadata(video_id, metadata);
    }

    throw error;
  }
}
