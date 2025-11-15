/**
 * Video ID生成ユーティリティ
 */

/**
 * 一意のvideo_idを生成
 * 形式: vid_{timestamp}_{random}
 */
export function generateVideoId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `vid_${timestamp}_${random}`;
}

/**
 * video_idのバリデーション
 */
export function isValidVideoId(videoId: string): boolean {
  return /^vid_\d+_[a-z0-9]+$/.test(videoId);
}
