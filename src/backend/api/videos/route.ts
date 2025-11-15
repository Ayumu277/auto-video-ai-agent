/**
 * POST /api/videos
 * 動画アップロード＆処理ジョブ作成
 */

import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { generateVideoId } from '@/backend/libs/videoId';
import { ensureVideoDir, getVideoPath, getMetadataPath, writeMetadata, createInitialMetadata } from '@/backend/libs/storage';
import { addVideoJob } from '@/backend/libs/jobQueue';
import type { VideoUploadResponse } from '@/shared/types';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: { code: 'MISSING_FILE', message: 'File is required' } },
        { status: 400 }
      );
    }

    // video_idを生成
    const videoId = generateVideoId();

    // ディレクトリを作成
    await ensureVideoDir(videoId);

    // ファイルを保存
    const videoPath = getVideoPath(videoId, 'raw.mp4');
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(videoPath, buffer);

    // メタデータを作成・保存
    const metadata = createInitialMetadata(videoId);
    metadata.steps.upload = true;
    await writeMetadata(videoId, metadata);

    // ジョブをキューに追加
    await addVideoJob({
      video_id: videoId,
      video_path: videoPath,
      metadata_path: getMetadataPath(videoId),
    });

    const response: VideoUploadResponse = {
      video_id: videoId,
      status: 'queued',
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error uploading video:', error);
    return NextResponse.json(
      {
        error: {
          code: 'UPLOAD_FAILED',
          message: error instanceof Error ? error.message : 'Failed to upload video',
        },
      },
      { status: 500 }
    );
  }
}
