/**
 * Step 3: テロップ生成（Whisper結果からASS生成）
 */

import { readFile } from 'fs/promises';
import { getVideoPath, getTranscriptPath, readMetadata, writeMetadata } from '@/backend/libs/storage';
import { exportVideo } from '../utils/ffmpeg';
import type { JobData, TranscriptData } from '@/shared/types';

export async function generateSubtitle(jobData: JobData): Promise<void> {
  const { video_id } = jobData;

  console.log(`[subtitle] Starting subtitle generation for video: ${video_id}`);

  // メタデータを更新
  const metadata = await readMetadata(video_id);
  if (!metadata) {
    throw new Error(`Metadata not found for video: ${video_id}`);
  }

  metadata.steps.subtitle = true;
  metadata.status = 'processing';
  metadata.updated_at = new Date().toISOString();
  await writeMetadata(video_id, metadata);

  // トランスクリプトを読み込む
  const transcriptPath = getTranscriptPath(video_id);
  const transcriptContent = await readFile(transcriptPath, 'utf-8');
  const transcript: TranscriptData = JSON.parse(transcriptContent);

  // ASS形式の字幕ファイルを生成
  const assPath = getVideoPath(video_id, 'subtitle.ass');
  const assContent = generateASS(transcript);
  await import('fs/promises').then((fs) => fs.writeFile(assPath, assContent, 'utf-8'));

  // 字幕を動画に焼き込む
  const inputPath = getVideoPath(video_id, 'cut.mp4');
  const outputPath = getVideoPath(video_id, 'subtitle.mp4');

  // ffmpegで字幕をオーバーレイ
  await exportVideo(inputPath, outputPath, {
    filters: [`subtitles=${assPath}`],
  });

  metadata.updated_at = new Date().toISOString();
  await writeMetadata(video_id, metadata);

  console.log(`[subtitle] Subtitle generation completed for video: ${video_id}`);
}

/**
 * ASS形式の字幕ファイルを生成
 */
function generateASS(transcript: TranscriptData): string {
  let ass = `[Script Info]
Title: Auto-generated subtitles
ScriptType: v4.00+

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,24,&Hffffff,&Hffffff,&H0,&H0,0,0,0,0,100,100,0,0,1,2,0,2,10,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  transcript.segments.forEach((segment) => {
    const start = formatASSTime(segment.start);
    const end = formatASSTime(segment.end);
    ass += `Dialogue: 0,${start},${end},Default,,0,0,0,,${segment.text}\n`;
  });

  return ass;
}

/**
 * 秒数をASS形式の時間に変換
 */
function formatASSTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const centiseconds = Math.floor((secs % 1) * 100);

  return `${hours}:${String(minutes).padStart(2, '0')}:${String(Math.floor(secs)).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
}
