/**
 * 共通型定義
 */

export type VideoStatus = 'queued' | 'processing' | 'completed' | 'failed';

export type StepStatus = 'pending' | 'processing' | 'done' | 'failed';

export interface VideoMetadata {
  video_id: string;
  status: VideoStatus;
  steps: {
    upload: boolean;
    transcribe: boolean;
    cut: boolean;
    subtitle: boolean;
    bgm: boolean;
    export: boolean;
    thumbnail: boolean;
  };
  result: {
    video: string | null;
    thumbnail: string | null;
    transcript: string | null;
  };
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  created_at: string;
  updated_at: string;
}

export interface VideoStatusResponse {
  video_id: string;
  status: VideoStatus;
  progress: number;
  steps: Array<{
    name: string;
    status: StepStatus;
  }>;
}

export interface VideoResultResponse {
  video_id: string;
  status: VideoStatus;
  download_url?: string;
  thumbnail_url?: string;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface VideoTitleResponse {
  video_id: string;
  titles: string[];
}

export interface VideoUploadRequest {
  file: File;
  platform_hint?: string;
  max_duration_seconds?: number;
}

export interface VideoUploadResponse {
  video_id: string;
  status: VideoStatus;
}

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

export interface TranscriptData {
  segments: TranscriptSegment[];
  full_text: string;
}

export interface JobData {
  video_id: string;
  video_path: string;
  metadata_path: string;
}
