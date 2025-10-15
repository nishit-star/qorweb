import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { fileGenerationJobs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import { auth } from '@/lib/auth';

const N8N_WEBHOOK = 'https://n8n.welz.in/webhook/2bb2921f-d673-4a5b-8574-cfb9303b0b44';
const WEBHOOK_SECRET = process.env.FILES_WEBHOOK_SECRET || '';

function hmacSign(input: string, secret: string) {
  return crypto.createHmac('sha256', secret).update(input).digest('hex');
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const body = await req.json();
    const { url, brand = '', category = '', competitors = [], prompts = '' } = body || {};

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Invalid url' }, { status: 400 });
    }
    if (!brand || typeof brand !== 'string') {
      return NextResponse.json({ error: 'Invalid brand' }, { status: 400 });
    }
    if (!category || typeof category !== 'string') {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    const userId = session.user.id;
    const userEmail = session.user.email || '';

    // Create job with nonce
    const nonce = crypto.randomBytes(16).toString('hex');
    const [job] = await db.insert(fileGenerationJobs).values({
      userId,
      userEmail,
      url,
      brand,
      category,
      competitors,
      prompts,
      status: 'pending',
      nonce,
    }).returning();

    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || ''}/api/files/callback`;
    const timestamp = Date.now();

    const stringToSign = `${job.id}:${userId}:${timestamp}:${nonce}`;
    const signature = WEBHOOK_SECRET ? hmacSign(stringToSign, WEBHOOK_SECRET) : '';

    const payload = {
      jobId: job.id,
      user: { id: userId, email: userEmail },
      data: { url, brand, category, competitors, prompts },
      callbackUrl,
      timestamp,
      nonce,
      signature,
    };

    // dev log for verification
    if (process.env.NODE_ENV !== 'production') {
      console.log('[files/jobs] webhook payload preview:', JSON.stringify(payload));
    }

    // fire-and-forget to n8n
    let responseCode = '';
    try {
      const res = await fetch(N8N_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      responseCode = `${res.status}`;
      await db.update(fileGenerationJobs).set({ webhookAttemptedAt: new Date(), webhookResponseCode: responseCode, status: 'in_progress' }).where(eq(fileGenerationJobs.id, job.id));
    } catch (e) {
      await db.update(fileGenerationJobs).set({ webhookAttemptedAt: new Date(), webhookResponseCode: responseCode || 'ERR', status: 'failed', error: 'Failed to reach webhook' }).where(eq(fileGenerationJobs.id, job.id));
      return NextResponse.json({ jobId: job.id, status: 'failed', error: 'Failed to trigger workflow' }, { status: 500 });
    }

    return NextResponse.json({ jobId: job.id, status: 'in_progress' });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
