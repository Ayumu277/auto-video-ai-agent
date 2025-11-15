/**
 * GET /api/videos/[id]/result
 * 完成動画取得
 */

import { NextRequest, NextResponse } from 'next/server';
import { readMetadata, getVideoPath, fileExists } from '@/backend/libs/storage';
import type { VideoResultResponse } from '@/shared/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const videoId = params.id;

    // メタデータを読み込む
    const metadata = await readMetadata(videoId);
    if (!metadata) {
      return NextResponse.json(
        { error: { code: 'VIDEO_NOT_FOUND', message: 'Video not found' } },
        { status: 404 }
      );
    }

    // 処理が完了していない場合
    if (metadata.status !== 'completed') {
      if (metadata.status === 'failed') {
        const response: VideoResultResponse = {
          video_id: videoId,
          status: 'failed',
          error: metadata.error,
        };
        return NextResponse.json(response, { status: 200 });
      }

      return NextResponse.json(
        {
          error: {
            code: 'VIDEO_NOT_READY',
            message: 'Video is still processing.',
          },
        },
        { status: 202 }
      );
    }

    // 完成動画とサムネイルのパスを確認
    const videoPath = metadata.result.video || getVideoPath(videoId, 'edited.mp4');
    const thumbnailPath = metadata.result.thumbnail || getVideoPath(videoId, 'thumb.jpg');

    const videoExists = await fileExists(videoPath);
    const thumbnailExists = await fileExists(thumbnailPath);

    if (!videoExists) {
      return NextResponse.json(
        {
          error: {
            code: 'VIDEO_NOT_FOUND',
            message: 'Processed video file not found',
          },
        },
        { status: 404 }
      );
    }

    // ローカル開発環境ではファイルパスを返す
    // 本番環境ではS3のURLなどを返す
    const response: VideoResultResponse = {
      video_id: videoId,
      status: 'completed',
      download_url: `/api/videos/${videoId}/download`,
      thumbnail_url: thumbnailExists ? `/api/videos/${videoId}/thumbnail` : undefined,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error getting video result:', error);
    return NextResponse.json(
      {
        error: {
          code: 'RESULT_CHECK_FAILED',
          message: error instanceof Error ? error.message : 'Failed to get result',
        },
      },
      { status: 500 }
    );
  }
}
