/**
 * ローカルストレージ管理ユーティリティ
 * 後でS3に移行可能なように抽象化
 */

import { promises as fs } from 'fs';
import path from 'path';
import type { VideoMetadata } from '@/shared/types';

const BASE_STORAGE_PATH = '/tmp/videos';

/**
 * 動画ディレクトリのパスを取得
 */
export function getVideoDir(videoId: string): string {
  return path.join(BASE_STORAGE_PATH, videoId);
}

/**
 * 動画ファイルのパスを取得
 */
export function getVideoPath(videoId: string, filename: string = 'raw.mp4'): string {
  return path.join(getVideoDir(videoId), filename);
}

/**
 * メタデータファイルのパスを取得
 */
export function getMetadataPath(videoId: string): string {
  return path.join(getVideoDir(videoId), 'meta.json');
}

/**
 * トランスクリプトファイルのパスを取得
 */
export function getTranscriptPath(videoId: string): string {
  return path.join(getVideoDir(videoId), 'transcript.json');
}

/**
 * 動画ディレクトリを作成
 */
export async function ensureVideoDir(videoId: string): Promise<void> {
  const dir = getVideoDir(videoId);
  await fs.mkdir(dir, { recursive: true });
}

/**
 * メタデータを読み込む
 */
export async function readMetadata(videoId: string): Promise<VideoMetadata | null> {
  try {
    const metadataPath = getMetadataPath(videoId);
    const content = await fs.readFile(metadataPath, 'utf-8');
    return JSON.parse(content) as VideoMetadata;
  } catch (error) {
    return null;
  }
}

/**
 * メタデータを保存
 */
export async function writeMetadata(videoId: string, metadata: VideoMetadata): Promise<void> {
  const metadataPath = getMetadataPath(videoId);
  await ensureVideoDir(videoId);
  await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
}

/**
 * ファイルが存在するかチェック
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * 初期メタデータを作成
 */
export function createInitialMetadata(videoId: string): VideoMetadata {
  const now = new Date().toISOString();
  return {
    video_id: videoId,
    status: 'queued',
    steps: {
      upload: false,
      transcribe: false,
      cut: false,
      subtitle: false,
      bgm: false,
      export: false,
      thumbnail: false,
    },
    result: {
      video: null,
      thumbnail: null,
      transcript: null,
    },
    created_at: now,
    updated_at: now,
  };
}
