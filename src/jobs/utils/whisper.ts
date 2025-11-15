/**
 * Whisper ユーティリティ
 * ローカルCLIまたはwhisper.cppを使用
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { readFile } from 'fs/promises';
import type { TranscriptData, TranscriptSegment } from '@/shared/types';

const execAsync = promisify(exec);

/**
 * Whisper CLIのパス（環境変数から取得、デフォルトはwhisper）
 */
const WHISPER_CMD = process.env.WHISPER_CMD || 'whisper';

/**
 * 動画を文字起こし
 */
export async function transcribeVideo(
  videoPath: string,
  outputPath: string,
  options?: {
    model?: string;
    language?: string;
  }
): Promise<TranscriptData> {
  const model = options?.model || 'base';
  const language = options?.language || 'ja';

  try {
    // Whisper CLIを実行
    // 出力形式をJSONに指定
    const command = `${WHISPER_CMD} "${videoPath}" --model ${model} --language ${language} --output_format json --output_dir "${path.dirname(outputPath)}"`;

    await execAsync(command);

    // JSONファイルを読み込む
    // Whisperは入力ファイル名に基づいて出力ファイル名を生成する
    const baseName = path.basename(videoPath, path.extname(videoPath));
    const jsonPath = path.join(path.dirname(outputPath), `${baseName}.json`);

    const jsonContent = await readFile(jsonPath, 'utf-8');
    const whisperOutput = JSON.parse(jsonContent);

    // Whisperの出力形式をTranscriptDataに変換
    const segments: TranscriptSegment[] = (whisperOutput.segments || []).map((seg: any) => ({
      start: seg.start,
      end: seg.end,
      text: seg.text.trim(),
    }));

    const fullText = whisperOutput.text || segments.map((s) => s.text).join(' ');

    // 指定されたパスに保存
    const transcriptData: TranscriptData = {
      segments,
      full_text: fullText,
    };

    // カスタムパスに保存（既存のJSONファイルはそのまま残す）
    const { writeFile } = await import('fs/promises');
    await writeFile(outputPath, JSON.stringify(transcriptData, null, 2), 'utf-8');

    return transcriptData;
  } catch (error) {
    // whisper.cppを使用する場合の代替実装
    if (error instanceof Error && error.message.includes('command not found')) {
      throw new Error(
        'Whisper CLI not found. Please install whisper or set WHISPER_CMD environment variable.'
      );
    }
    throw error;
  }
}

/**
 * whisper.cppを使用する場合の実装（オプション）
 */
export async function transcribeWithWhisperCpp(
  videoPath: string,
  outputPath: string,
  options?: {
    model?: string;
  }
): Promise<TranscriptData> {
  // TODO: whisper.cppの実装を追加
  // これは別の実装例として残しておく
  throw new Error('whisper.cpp implementation not yet implemented');
}
