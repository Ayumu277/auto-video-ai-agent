/**
 * Step 1: Whisperで文字起こし
 */

import { transcribeVideo } from '../utils/whisper';
import { getTranscriptPath, readMetadata, writeMetadata } from '@/backend/libs/storage';
import type { JobData } from '@/shared/types';

export async function transcribe(jobData: JobData): Promise<void> {
  const { video_id, video_path } = jobData;

  console.log(`[transcribe] Starting transcription for video: ${video_id}`);

  // メタデータを更新
  const metadata = await readMetadata(video_id);
  if (!metadata) {
    throw new Error(`Metadata not found for video: ${video_id}`);
  }

  metadata.steps.transcribe = true;
  metadata.status = 'processing';
  metadata.updated_at = new Date().toISOString();
  await writeMetadata(video_id, metadata);

  // 文字起こしを実行
  const transcriptPath = getTranscriptPath(video_id);
  const transcript = await transcribeVideo(video_path, transcriptPath, {
    model: 'base',
    language: 'ja',
  });

  // メタデータにトランスクリプトパスを保存
  metadata.result.transcript = transcriptPath;
  metadata.updated_at = new Date().toISOString();
  await writeMetadata(video_id, metadata);

  console.log(`[transcribe] Transcription completed for video: ${video_id}`);
}
