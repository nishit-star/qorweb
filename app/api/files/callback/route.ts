import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { fileGenerationJobs } from '@/lib/db/schema.files';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { jobId, status, files, error } = body || {};
    if (!jobId) return NextResponse.json({ error: 'Missing jobId' }, { status: 400 });

    const updates: any = { updatedAt: new Date() };
    if (status) updates.status = status;
    if (files) updates.result = { files };
    if (error) updates.error = error;

    await db.update(fileGenerationJobs).set(updates).where(eq(fileGenerationJobs.id, jobId));

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('[files/callback] error', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
