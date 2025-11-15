/**
 * ffmpeg ユーティリティ
 * fluent-ffmpeg + ffmpeg-static を使用
 */

import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import path from 'path';

// ffmpeg-staticのパスを設定
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}

/**
 * 動画の情報を取得
 */
export async function getVideoInfo(videoPath: string): Promise<{
  duration: number;
  width: number;
  height: number;
  fps: number;
}> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }

      const videoStream = metadata.streams?.find((s) => s.codec_type === 'video');
      if (!videoStream) {
        reject(new Error('No video stream found'));
        return;
      }

      resolve({
        duration: metadata.format?.duration || 0,
        width: videoStream.width || 0,
        height: videoStream.height || 0,
        fps: eval(videoStream.r_frame_rate || '30/1') as number,
      });
    });
  });
}

/**
 * 動画をエクスポート
 */
export async function exportVideo(
  inputPath: string,
  outputPath: string,
  options?: {
    startTime?: number;
    duration?: number;
    filters?: string[];
  }
): Promise<void> {
  return new Promise((resolve, reject) => {
    let command = ffmpeg(inputPath);

    if (options?.startTime !== undefined) {
      command = command.seekInput(options.startTime);
    }

    if (options?.duration !== undefined) {
      command = command.duration(options.duration);
    }

    if (options?.filters && options.filters.length > 0) {
      command = command.videoFilters(options.filters);
    }

    command
      .output(outputPath)
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .run();
  });
}

/**
 * サムネイルを生成
 */
export async function generateThumbnail(
  videoPath: string,
  outputPath: string,
  timeInSeconds: number = 1
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .screenshots({
        timestamps: [timeInSeconds],
        filename: path.basename(outputPath),
        folder: path.dirname(outputPath),
        size: '1280x720',
      })
      .on('end', () => resolve())
      .on('error', (err) => reject(err));
  });
}

/**
 * 無音区間を検出
 */
export async function detectSilence(videoPath: string): Promise<Array<{ start: number; end: number }>> {
  return new Promise((resolve, reject) => {
    const silenceRanges: Array<{ start: number; end: number }> = [];
    let currentStart: number | null = null;

    ffmpeg(videoPath)
      .audioFilters('silencedetect=noise=-30dB:duration=0.5')
      .format('null')
      .on('stderr', (stderrLine: string) => {
        // silencedetectの出力をパース
        const startMatch = stderrLine.match(/silence_start: ([\d.]+)/);
        const endMatch = stderrLine.match(/silence_end: ([\d.]+)/);

        if (startMatch) {
          currentStart = parseFloat(startMatch[1]);
        }

        if (endMatch && currentStart !== null) {
          silenceRanges.push({
            start: currentStart,
            end: parseFloat(endMatch[1]),
          });
          currentStart = null;
        }
      })
      .on('end', () => resolve(silenceRanges))
      .on('error', (err) => reject(err))
      .save('/dev/null');
  });
}
