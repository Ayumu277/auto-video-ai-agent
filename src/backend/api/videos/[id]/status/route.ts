/**
 * GET /api/videos/[id]/status
 * 処理ステータス取得
 */

import { NextRequest, NextResponse } from 'next/server';
import { readMetadata } from '@/backend/libs/storage';
import { videoQueue } from '@/backend/libs/jobQueue';
import type { VideoStatusResponse } from '@/shared/types';

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

    // ジョブの進捗を取得（簡易版）
    // 実際にはjobIdをメタデータに保存する必要がある
    const progress = calculateProgress(metadata);

    const response: VideoStatusResponse = {
      video_id: videoId,
      status: metadata.status,
      progress,
      steps: [
        { name: 'upload', status: metadata.steps.upload ? 'done' : 'pending' },
        { name: 'transcribe', status: metadata.steps.transcribe ? 'done' : metadata.steps.upload ? 'processing' : 'pending' },
        { name: 'cut', status: metadata.steps.cut ? 'done' : metadata.steps.transcribe ? 'processing' : 'pending' },
        { name: 'subtitle', status: metadata.steps.subtitle ? 'done' : metadata.steps.cut ? 'processing' : 'pending' },
        { name: 'bgm', status: metadata.steps.bgm ? 'done' : metadata.steps.subtitle ? 'processing' : 'pending' },
        { name: 'export', status: metadata.steps.export ? 'done' : metadata.steps.bgm ? 'processing' : 'pending' },
      ],
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error getting video status:', error);
    return NextResponse.json(
      {
        error: {
          code: 'STATUS_CHECK_FAILED',
          message: error instanceof Error ? error.message : 'Failed to get status',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * メタデータから進捗率を計算
 */
function calculateProgress(metadata: any): number {
  const steps = [
    metadata.steps.upload,
    metadata.steps.transcribe,
    metadata.steps.cut,
    metadata.steps.subtitle,
    metadata.steps.bgm,
    metadata.steps.export,
    metadata.steps.thumbnail,
  ];
  const completed = steps.filter(Boolean).length;
  return Math.round((completed / steps.length) * 100);
}
