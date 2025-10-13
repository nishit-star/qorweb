"use client";
import { useEffect, useMemo, useRef, useState } from "react";

export default function GenerateFilesPage() {
  const [email, setEmail] = useState("");
  const [url, setUrl] = useState("");
  const [prompt, setPrompt] = useState("");
  const [competitorInput, setCompetitorInput] = useState("");
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [waiting, setWaiting] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const stopPollingRef = useRef(false);

  // Restore state from localStorage when navigating back to this page
  useEffect(() => {
    try {
      const saved = localStorage.getItem('gf_state');
      if (saved) {
        const st = JSON.parse(saved);
        setEmail(st.email || '');
        setUrl(st.url || '');
        setPrompt(st.prompt || '');
        setCompetitors(st.competitors || []);
        setWaiting(!!st.waiting);
        setStartedAt(st.startedAt || null);
      }
    } catch {}
  }, []);

  // If user navigates away and back while waiting, resume polling automatically
  useEffect(() => {
    if (waiting && url && startedAt && !stopPollingRef.current) {
      // fire-and-forget, do not await
      pollStatus(url);
    }
  }, [waiting]);

  // Persist state changes
  useEffect(() => {
    const st = { email, url, prompt, competitors, waiting, startedAt };
    try { localStorage.setItem('gf_state', JSON.stringify(st)); } catch {}
  }, [email, url, prompt, competitors, waiting, startedAt]);

  // Timer handling
  useEffect(() => {
    if (waiting && startedAt) {
      const update = () => setElapsed(Math.floor((Date.now() - startedAt) / 1000));
      update();
      timerRef.current = window.setInterval(update, 1000);
      return () => { if (timerRef.current) window.clearInterval(timerRef.current); };
    }
  }, [waiting, startedAt]);

  const elapsedFmt = useMemo(() => {
    const s = elapsed % 60;
    const m = Math.floor(elapsed / 60) % 60;
    const h = Math.floor(elapsed / 3600);
    const pad = (n:number) => n.toString().padStart(2,'0');
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  }, [elapsed]);

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
    if (!email || !url) { setError('Email and URL are required'); return; }

    try {
      setSending(true);
      const body = { email, url, competitors, prompts: prompt };
      const res = await fetch('/api/generate-files-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data?.error || 'Failed to send email');

      setSending(false);
      setWaiting(true);
      setStartedAt(Date.now());
      setSuccessMessage(null);
      stopPollingRef.current = false;
      await pollStatus(url);
    } catch (err:any) {
      setError(err.message || 'Unexpected error');
      setSending(false);
    }
  }

  async function pollStatus(targetUrl: string) {
    const start = Date.now();
    const maxMs = 60 * 60 * 1000;
    const intervalMs = 15000;

    while (!stopPollingRef.current && Date.now() - start < maxMs) {
      try {
        const res = await fetch('/api/generate-files-status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: targetUrl }) });
        if (res.ok) {
          const data = await res.json();
          if ((data?.available || data?.success) && (data?.message === 'files are available' || data?.message === 'delivered' || data?.success) && data?.url === targetUrl) {
            setWaiting(false);
            if (timerRef.current) window.clearInterval(timerRef.current);
            setSuccessMessage('Files have been delivered to your inbox.');
            // clear persisted waiting state
            try { localStorage.removeItem('gf_state'); } catch {}
            return;
          }
        }
      } catch {}
      await new Promise(r => setTimeout(r, intervalMs));
    }

    setWaiting(false);
    if (timerRef.current) window.clearInterval(timerRef.current);
    if (!stopPollingRef.current) setError('Stopped waiting. If you receive the email later, please check your inbox.');
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Generate Files</h1>

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

      {!waiting ? (
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" placeholder="you@example.com" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">URL</label>
            <input type="url" value={url} onChange={e=>setUrl(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" placeholder="https://example.com" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Competitors</label>
            <div className="flex gap-2">
              <input value={competitorInput} onChange={e=>setCompetitorInput(e.target.value)} className="flex-1 border rounded px-3 py-2" placeholder="https://competitor.com" />
              <button type="button" onClick={addCompetitor} className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200">Add</button>
            </div>
            {!!competitors.length && (
              <div className="mt-2 flex flex-wrap gap-2">
                {competitors.map(c=> (
                  <span key={c} className="inline-flex items-center gap-1 text-sm bg-gray-100 px-2 py-1 rounded">
                    {c}
                    <button type="button" onClick={()=>removeCompetitor(c)} className="text-gray-500 hover:text-gray-700">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Prompts</label>
            <textarea value={prompt} onChange={e=>setPrompt(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" rows={4} placeholder="Describe what files you want generated..." />
          </div>

          <div className="flex items-center justify-between">
            <button type="submit" disabled={sending} className="btn-firecrawl-default">{sending ? 'Sending…' : 'Send Request'}</button>
          </div>
        </form>
      ) : (
        <div className="flex items-center justify-between border rounded px-4 py-3 bg-gray-50">
          <div className="text-sm text-gray-900 font-semibold">
            Email sent. Generating files…
          </div>
          <div className="text-sm text-gray-900 font-bold">Elapsed <span className="font-mono">{elapsedFmt}</span></div>
        </div>
      )}
    </div>
  );
}
