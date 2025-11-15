/**
 * BullMQ ジョブキュー管理
 */

import { Queue, Worker, QueueEvents } from 'bullmq';
import Redis from 'ioredis';
import type { JobData } from '@/shared/types';

const redisConnection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
});

/**
 * Video処理用のキュー
 */
export const videoQueue = new Queue<JobData>('video.process', {
  connection: redisConnection,
});

/**
 * Video処理用のキューイベント
 */
export const videoQueueEvents = new QueueEvents('video.process', {
  connection: redisConnection,
});

/**
 * ジョブを追加
 */
export async function addVideoJob(data: JobData) {
  return await videoQueue.add('process', data, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  });
}

/**
 * ジョブの進捗を取得
 */
export async function getJobProgress(jobId: string) {
  const job = await videoQueue.getJob(jobId);
  if (!job) {
    return null;
  }

  const state = await job.getState();
  const progress = job.progress || 0;

  return {
    id: job.id,
    state,
    progress: typeof progress === 'number' ? progress : 0,
    data: job.data,
  };
}
