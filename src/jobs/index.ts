/**
 * Worker エントリーポイント
 * BullMQ Workerを起動してジョブを処理
 */

import { Worker } from 'bullmq';
import Redis from 'ioredis';
import { processVideo } from './videoProcessor';
import type { JobData } from '@/shared/types';

const redisConnection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
});

// Workerを作成
const worker = new Worker<JobData>(
  'video.process',
  async (job) => {
    console.log(`[Worker] Processing job ${job.id} for video: ${job.data.video_id}`);

    // 進捗を更新
    await job.updateProgress(0);

    try {
      // 動画処理パイプラインを実行
      await processVideo(job.data);

      // 進捗を100%に更新
      await job.updateProgress(100);

      console.log(`[Worker] Job ${job.id} completed successfully`);
      return { success: true, video_id: job.data.video_id };
    } catch (error) {
      console.error(`[Worker] Job ${job.id} failed:`, error);
      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: parseInt(process.env.WORKER_CONCURRENCY || '1', 10),
    limiter: {
      max: 5,
      duration: 10000, // 10秒間に最大5ジョブ
    },
  }
);

// イベントハンドラ
worker.on('completed', (job) => {
  console.log(`[Worker] Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed:`, err);
});

worker.on('error', (err) => {
  console.error('[Worker] Worker error:', err);
});

console.log('[Worker] Video processing worker started');

// グレースフルシャットダウン
process.on('SIGTERM', async () => {
  console.log('[Worker] SIGTERM received, closing worker...');
  await worker.close();
  await redisConnection.quit();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[Worker] SIGINT received, closing worker...');
  await worker.close();
  await redisConnection.quit();
  process.exit(0);
});
