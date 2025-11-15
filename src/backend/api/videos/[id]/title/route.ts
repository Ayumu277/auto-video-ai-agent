/**
 * GET /api/videos/[id]/title
 * タイトル案生成
 */

import { NextRequest, NextResponse } from 'next/server';
import { readMetadata, getTranscriptPath, fileExists } from '@/backend/libs/storage';
import { readFile } from 'fs/promises';
import type { VideoTitleResponse, TranscriptData } from '@/shared/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const videoId = params.id;
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '3', 10);
    const tone = searchParams.get('tone') || 'casual';

    // メタデータを読み込む
    const metadata = await readMetadata(videoId);
    if (!metadata) {
      return NextResponse.json(
        { error: { code: 'VIDEO_NOT_FOUND', message: 'Video not found' } },
        { status: 404 }
      );
    }

    // トランスクリプトが存在するか確認
    const transcriptPath = getTranscriptPath(videoId);
    if (!(await fileExists(transcriptPath))) {
      return NextResponse.json(
        {
          error: {
            code: 'TRANSCRIPT_NOT_READY',
            message: 'Transcript is not available yet. Please wait for transcription to complete.',
          },
        },
        { status: 400 }
      );
    }

    // トランスクリプトを読み込む
    const transcriptContent = await readFile(transcriptPath, 'utf-8');
    const transcript: TranscriptData = JSON.parse(transcriptContent);

    // LLMでタイトル案を生成
    // ここでは簡易的な実装。実際にはClaude/Gemini APIなどを呼び出す
    const titles = await generateTitles(transcript.full_text, limit, tone);

    const response: VideoTitleResponse = {
      video_id: videoId,
      titles,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error generating titles:', error);
    return NextResponse.json(
      {
        error: {
          code: 'TITLE_GENERATION_FAILED',
          message: error instanceof Error ? error.message : 'Failed to generate titles',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * LLMを使用してタイトル案を生成
 * TODO: 実際のLLM API（Claude/Gemini/OpenAI）を統合
 */
async function generateTitles(
  transcript: string,
  limit: number,
  tone: string
): Promise<string[]> {
  // 簡易的な実装：実際にはLLM APIを呼び出す
  // ここではダミーデータを返す
  const preview = transcript.substring(0, 100);

  // TODO: 実際のLLM API呼び出しに置き換える
  // const response = await fetch('https://api.anthropic.com/v1/messages', {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //     'x-api-key': process.env.ANTHROPIC_API_KEY!,
  //   },
  //   body: JSON.stringify({
  //     model: 'claude-3-5-sonnet-20241022',
  //     max_tokens: 1024,
  //     messages: [{
  //       role: 'user',
  //       content: `以下の動画の文字起こしから、${tone}なトーンで${limit}個のタイトル案を生成してください:\n\n${transcript}`
  //     }]
  //   })
  // });

  return [
    `【自動生成】${preview}...`,
    `動画コンテンツ: ${preview.substring(0, 50)}...`,
    `ショート動画: ${preview.substring(0, 40)}...`,
  ].slice(0, limit);
}
