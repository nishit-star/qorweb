import { NextRequest } from 'next/server';
import { getFilesCollection, mapNameToField, VirtualFileName } from '@/lib/mongo';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get('name') as VirtualFileName | null;
  if (!name || !['llm.txt','robots.txt','schema.org','faq.txt'].includes(name)) {
    return new Response('Invalid file name', { status: 400 });
  }

  const col = await getFilesCollection();
  const doc = await col.find({}).sort({ _id: -1 }).limit(1).next();
  if (!doc) return new Response('Not found', { status: 404 });

  const field = mapNameToField(name) as 'llm'|'robots'|'schema'|'faq';
  const content = doc[field] ?? '';
  const body = typeof content === 'string' ? content : JSON.stringify(content, null, 2);

  let contentType = 'text/plain; charset=utf-8';
  if (name === 'schema.org') contentType = 'application/ld+json; charset=utf-8';

  return new Response(body, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${name}"`,
      'Cache-Control': 'no-store'
    }
  });
}
