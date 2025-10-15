import nextDynamic from 'next/dynamic';
export const dynamic = 'force-dynamic';

const ElapsedTimer = nextDynamic(() => import('@/components/files/ElapsedTimer'), { ssr: false });
const MarkReady = nextDynamic(() => import('@/components/files/MarkReady'), { ssr: false });
const BrandIndustryForm = nextDynamic(() => import('@/components/files/BrandIndustryForm'), { ssr: false });

async function fetchFiles() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/files/list`, { cache: 'no-store' });
  if (!res.ok) return { files: [] } as { files: { name: string; url: string; size?: number }[] };
  return res.json();
}

export default async function FilesPage() {
  const { files } = await fetchFiles();
  const waiting = files.length === 0;
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Files</h1>
      <BrandIndustryForm />
      <ElapsedTimer active={waiting} />
      {!waiting && <MarkReady />}
      {files.length === 0 ? (
        <p className="text-gray-500">No files available yet. Waiting for callback…</p>
      ) : (
        <ul className="space-y-3">
          {files.map((f) => (
            <li key={f.name} className="flex items-center justify-between border rounded p-3">
              <div>
                <div className="font-medium">{f.name}</div>
                {typeof f.size === 'number' && <div className="text-xs text-gray-500">{f.size} bytes</div>}
              </div>
              <a
                href={f.url}
                className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                download
              >
                Download
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
