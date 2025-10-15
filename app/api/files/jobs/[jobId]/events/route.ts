import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { fileGenerationJobs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';

export async function GET(req: NextRequest, context: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await context.params;
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      function send(data: any) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      }
      // Initial send
      try {
        const rows = await db.select().from(fileGenerationJobs).where(eq(fileGenerationJobs.id, jobId));
        const job = rows[0];
        if (!job) {
          send({ error: 'NOT_FOUND' });
          controller.close();
          return;
        }
        send({ status: job.status, result: job.result, error: job.error });
      } catch (e) {
        send({ error: 'Internal error' });
        controller.close();
        return;
      }

      // Poll DB periodically server-side and push updates
      let lastStatus: string | null = null;
      const interval = setInterval(async () => {
        try {
          const rows = await db.select().from(fileGenerationJobs).where(eq(fileGenerationJobs.id, jobId));
          const job = rows[0];
          if (!job) {
            send({ error: 'NOT_FOUND' });
            clearInterval(interval);
            controller.close();
            return;
          }
          if (job.status !== lastStatus) {
            lastStatus = job.status;
            send({ status: job.status, result: job.result, error: job.error });
            if (job.status === 'completed' || job.status === 'failed') {
              clearInterval(interval);
              controller.close();
            }
          }
        } catch {
          // ignore transient errors
        }
      }, 3000);

      // Keep-alive
      const keepAlive = setInterval(() => {
        controller.enqueue(new TextEncoder().encode(`:\n\n`));
      }, 15000);

      // Close on client abort
      const signal = req.signal as AbortSignal;
      signal?.addEventListener?.('abort', () => {
        clearInterval(interval);
        clearInterval(keepAlive);
        try { controller.close(); } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
