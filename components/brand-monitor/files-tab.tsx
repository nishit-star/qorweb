"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "@/lib/auth-client";
import { FileText, Settings, Code, HelpCircle } from "lucide-react";

export function FilesTab({ prefill }: { prefill?: { url?: string; customerName?: string } | null }) {
  const { data: session } = useSession();
  const userEmail = session?.user?.email || "";

  const [email, setEmail] = useState("");
  const [url, setUrl] = useState("");
  const [prompt, setPrompt] = useState("");
  const [brand, setBrand] = useState("");
  const [industry, setIndustry] = useState("");
  const [competitorInput, setCompetitorInput] = useState("");
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Files list state
  const [files, setFiles] = useState<any[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [showForm, setShowForm] = useState(true);

  const normalizeUrl = (u: string) => {
    try {
      const obj = new URL(u);
      obj.hostname = obj.hostname.toLowerCase();
      let s = obj.toString();
      if (s.endsWith('/')) s = s.replace(/\/+$/, '');
      return s;
    } catch {
      return u.trim().replace(/\/+$/, '');
    }
  };
  const cacheKey = (u: string) => `gf_files_${normalizeUrl(u)}`;

  // Initialize from session / prefill
  useEffect(() => {
    setEmail(userEmail || "");
  }, [userEmail]);
  useEffect(() => {
    if (prefill?.url) setUrl(prefill.url);
  }, [prefill?.url]);

  // Fetch files for URL (with cache)
  useEffect(() => {
    const run = async () => {
      if (!url) return;
      setFilesLoading(true);
      // show cached immediately
      try {
        const cached = localStorage.getItem(cacheKey(url));
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) {
            setFiles(parsed);
            setShowForm(false);
          }
        }
      } catch {}
      // fetch fresh
      try {
        const res = await fetch(`/api/files/list?url=${encodeURIComponent(url)}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.files)) {
            setFiles(data.files);
            if (data.files.length > 0) setShowForm(false);
            try { localStorage.setItem(cacheKey(url), JSON.stringify(data.files)); } catch {}
          }
        }
      } catch {}
      setFilesLoading(false);
    };
    run();
  }, [url]);


  // Helper function to get icon for each file type
  function getFileIcon(filename: string) {
    const name = filename.toLowerCase();
    if (name.includes('llm')) return <FileText className="w-5 h-5 text-blue-600" />;
    if (name.includes('robots')) return <Settings className="w-5 h-5 text-gray-600" />;
    if (name.includes('schema')) return <Code className="w-5 h-5 text-purple-600" />;
    if (name.includes('faq')) return <HelpCircle className="w-5 h-5 text-green-600" />;
    return <FileText className="w-5 h-5 text-gray-600" />;
  }

  function addCompetitor() {
    const trimmed = competitorInput.trim();
    if (!trimmed) return;
    setCompetitors(prev => Array.from(new Set([...prev, trimmed])));
    setCompetitorInput("");
  }
  function removeCompetitor(c: string) { setCompetitors(prev => prev.filter(x => x !== c)); }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const finalEmail = userEmail || email; // prefer session email
    if (!finalEmail || !url || !brand.trim() || !industry.trim()) {
      setError('Email, URL, Brand name and Industry are required');
      return;
    }

    try {
      setSending(true);
      const body = { url, competitors, prompts: prompt, brand: brand.trim(), category: industry.trim() };
      const res = await fetch('/api/files/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (!res.ok || !data.jobId) {
        throw new Error(data?.error || 'Failed to create job');
      }

      // Show success message
      setSuccessMessage('File generation request submitted successfully! Files will be delivered to your inbox.');

      // Reset form
      setUrl('');
      setPrompt('');
      setBrand('');
      setIndustry('');
      setCompetitors([]);
      setCompetitorInput('');

      setSending(false);
    } catch (err: any) {
      setError(err.message || 'Unexpected error');
      setSending(false);
    }
  }

  return (
    <div className="bg-white rounded-lg border p-8 min-h-[50vh]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Files</h2>
        <div className="flex gap-2">
          {/* Navigation to other tabs is handled by parent via setActiveTab */}
        </div>
      </div>

      {successMessage && (
        <div className="mb-4 rounded border border-green-300 bg-green-50 text-green-800 px-4 py-2">
          {successMessage}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded border border-red-300 bg-red-50 text-red-800 px-4 py-2">
          {error}
        </div>
      )}

      {files.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">Previously generated files</h3>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowForm(s => !s)}>{showForm ? 'Hide form' : 'Regenerate files'}</Button>
              <Button variant="secondary" onClick={async () => {
                setFilesLoading(true);
                try {
                  const res = await fetch(`/api/files/list?url=${encodeURIComponent(url)}`);
                  const data = await res.json();
                  if (res.ok && Array.isArray(data.files)) {
                    setFiles(data.files);
                    try { localStorage.setItem(cacheKey(url), JSON.stringify(data.files)); } catch {}
                  }
                } finally { setFilesLoading(false); }
              }}>Refresh</Button>
            </div>
          </div>
          {filesLoading ? (
            <div className="text-sm text-gray-600">Loading files…</div>
          ) : files.length === 0 ? (
            <div className="text-sm text-gray-500">No files found for this URL.</div>
          ) : (
            <ul className="divide-y border rounded">
              {files.map((f:any, idx:number) => (
                <li key={f.id || f._id || idx} className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      {getFileIcon(f.name || f.filename || f.title || '')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{f.name || f.filename || f.title || `File ${idx+1}`}</div>
                      <div className="text-xs text-gray-500">
                        {f.size ? `${Math.round((f.size/1024) * 10)/10} KB` : ''} {f.createdAt ? `• ${new Date(f.createdAt).toLocaleString()}` : ''}
                      </div>
                    </div>
                  </div>
                  {f.url || f.downloadUrl ? (
                    <a href={(f.url || f.downloadUrl) as string} target="_blank" rel="noopener" className="text-blue-600 hover:text-blue-800 hover:underline font-medium flex-shrink-0">Download</a>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {(showForm || files.length === 0) && (
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="filesEmail">Email</Label>
              <Input id="filesEmail" type="email" value={userEmail || email} disabled className="bg-gray-100" />
              {!userEmail && (
                <p className="text-xs text-amber-700">No session email detected. Please ensure you are logged in.</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="filesUrl">Website URL *</Label>
              <Input id="filesUrl" type="url" value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://example.com" required />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="filesBrand">Brand name *</Label>
              <Input id="filesBrand" value={brand} onChange={e=>setBrand(e.target.value)} placeholder="e.g., Welzin" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="filesIndustry">Industry *</Label>
              <Input id="filesIndustry" value={industry} onChange={e=>setIndustry(e.target.value)} placeholder="e.g., SaaS, Healthcare" required />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Competitors</Label>
            <div className="flex gap-2">
              <Input value={competitorInput} onChange={e=>setCompetitorInput(e.target.value)} placeholder="https://competitor.com" />
              <Button type="button" variant="secondary" onClick={addCompetitor}>Add</Button>
            </div>
            {!!competitors.length && (
              <div className="mt-2 flex flex-wrap gap-2">
                {competitors.map(c => (
                  <span key={c} className="inline-flex items-center gap-1 text-sm bg-gray-100 px-2 py-1 rounded">
                    {c}
                    <button type="button" onClick={()=>removeCompetitor(c)} className="text-gray-500 hover:text-gray-700">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="filesPrompt">Prompts</Label>
            <textarea id="filesPrompt" value={prompt} onChange={e=>setPrompt(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" rows={4} placeholder="Describe what files you want generated..." />
          </div>

          <div className="flex items-center justify-between">
            <Button type="submit" disabled={sending} className="btn-firecrawl-default h-9 px-4">{sending ? 'Sending…' : 'Send Request'}</Button>
          </div>
        </form>
      )}
    </div>
  );
}
