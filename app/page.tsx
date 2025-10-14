// 'use client';

// import Link from "next/link";
// import { useState } from "react";

// export default function Home() {
//   const [openFaq, setOpenFaq] = useState<number | null>(null);

//   const toggleFaq = (index: number) => {
//     setOpenFaq(openFaq === index ? null : index);
//   };

//   return (
//     <div className="min-h-screen">
//       {/* Hero Section */}
//       <section className="relative overflow-hidden bg-white pt-16 pb-24">
        
        
//         <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="text-center">
//             <h1 className="text-5xl lg:text-7xl font-bold tracking-tight mb-8 animate-fade-in-up">
//               <span className="block text-zinc-900">AutoReach Monitor</span>
//               <span className="block bg-[#155DFC] bg-clip-text text-transparent">
//                 AI Brand Visibility Platform
//               </span>
//             </h1>
//             <p className="text-xl lg:text-2xl text-zinc-600 max-w-3xl mx-auto mb-6 animate-fade-in-up animation-delay-200">
//               Track how AI models rank your brand against competitors
//             </p>
//             <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up animation-delay-400">
//               <Link
//                 href="/brand-monitor"
//                 className="btn-firecrawl-orange inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[10px] text-base font-medium transition-all duration-200 h-12 px-8"
//               >
//                 Start Brand Analysis
//               </Link>
//               {/* <Link
//                 href="/plans"
//                 className="btn-firecrawl-default inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[10px] text-base font-medium transition-all duration-200 h-12 px-8"
//               >
//                 View Pricing
//               </Link> */}
//             </div>
//             <p className="mt-6 text-sm text-zinc-500 animate-fade-in-up animation-delay-600">
//               Powered by AI • Real-time Analysis • Competitor Tracking • SEO Insights
//             </p>
//           </div>

//           {/* Stats */}
//           <div className="mt-20 bg-zinc-900 rounded-[20px] p-12 animate-fade-in-scale animation-delay-800">
//             <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
//               <div className="text-center animate-fade-in-up animation-delay-1000">
//                 <div className="text-4xl font-bold text-white">ChatGPT</div>
//                 <div className="text-sm text-zinc-400 mt-1">Claude, Perplexity & More</div>
//               </div>
//               <div className="text-center animate-fade-in-up animation-delay-1000" style={{animationDelay: '1100ms'}}>
//                 <div className="text-4xl font-bold text-white">Real-time</div>
//                 <div className="text-sm text-zinc-400 mt-1">Analysis</div>
//               </div>
//               <div className="text-center animate-fade-in-up animation-delay-1000" style={{animationDelay: '1200ms'}}>
//                 <div className="text-4xl font-bold text-white">Competitor</div>
//                 <div className="text-sm text-zinc-400 mt-1">Tracking</div>
//               </div>
//               <div className="text-center animate-fade-in-up animation-delay-1000" style={{animationDelay: '1300ms'}}>
//                 <div className="text-4xl font-bold text-white">Actionable</div>
//                 <div className="text-sm text-zinc-400 mt-1">Insights</div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/*  */}


//       {/* CTA Section 1 */}
//       <section className="py-20 bg-white">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-[30px] p-16 text-center">
//             <h2 className="text-4xl font-bold text-white mb-6">
//               See How AI Models Rank Your Brand
//             </h2>
//             <p className="text-xl text-blue-100 mb-8">
//               Monitor your brand visibility across ChatGPT, Claude, Perplexity and more
//             </p>
//             <Link
//               href="/brand-monitor"
//               className="btn-firecrawl-default inline-flex items-center justify-center whitespace-nowrap rounded-[10px] text-base font-medium transition-all duration-200 h-12 px-8"
//             >
//               Start Free Analysis
//             </Link>
//           </div>
//         </div>
//       </section>


//       {/* FAQs */}
//       {/* Final CTA */}
//       <section className="py-24 bg-zinc-900">
//         <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
//           <h2 className="text-4xl font-bold text-white mb-6">
//             Start Monitoring Your AI Brand Visibility
//           </h2>
//           <p className="text-xl text-zinc-400 mb-8">
//             Take control of how AI models present your brand
//           </p>
//           <div className="flex flex-col sm:flex-row gap-4 justify-center">
//             <Link
//               href="/brand-monitor"
//               className="btn-firecrawl-orange inline-flex items-center justify-center whitespace-nowrap rounded-[10px] text-base font-medium transition-all duration-200 h-12 px-8"
//             >
//               Analyze Your Brand
//             </Link>
//             <Link
//               href="/plans"
//               className="inline-flex items-center justify-center whitespace-nowrap rounded-[10px] text-base font-medium transition-all duration-200 h-12 px-8 bg-zinc-800 text-white hover:bg-zinc-700"
//             >
//               View Pricing
//             </Link>
//           </div>
//         </div>
//       </section>
//     </div>
//   );
// }

// "use client";

// import Link from "next/link";
// import { useEffect, useMemo, useRef, useState } from "react";
// import { useRouter } from 'next/navigation';

// export default function Home() {
//   const router = useRouter();

//   // Hero text remains as requested

//   // Form state (merged & adjusted)
//   const [email, setEmail] = useState("");
//   const [url, setUrl] = useState("");
//   const [categories, setCategories] = useState("");
//   const [prompt, setPrompt] = useState("");
//   const [competitorInput, setCompetitorInput] = useState("");
//   const [competitors, setCompetitors] = useState<string[]>([]);
//   const [sending, setSending] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [successMessage, setSuccessMessage] = useState<string | null>(null);

//   // helpers for competitors
//   function addCompetitor() {
//     const trimmed = competitorInput.trim();
//     if (!trimmed) return;
//     setCompetitors(prev => Array.from(new Set([...prev, trimmed])));
//     setCompetitorInput("");
//   }
//   function removeCompetitor(c: string) { setCompetitors(prev => prev.filter(x => x !== c)); }

//   async function onSubmit(e?: React.FormEvent) {
//     if (e) e.preventDefault();
//     setError(null);

//     // validation: make email, url, categories, competitors compulsory
//     if (!email || !url || !categories || competitors.length === 0) {
//       setError('Please fill Email, URL, Categories and add at least one Competitor.');
//       return;
//     }

//     try {
//       setSending(true);
//       const body = { email, url, categories, competitors, prompt };

//       const res = await fetch('/api/generate-files-status', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(body),
//       });

//       const data = await res.json().catch(()=>null);

//       if (!res.ok) {
//         throw new Error(data?.error || 'Request failed');
//       }

//       // If API returns something indicating success, you can show message then navigate
//       setSuccessMessage('Request submitted. Redirecting...');

//       // short delay so user sees feedback (optional)
//       setTimeout(() => {
//         router.push('/brand-monitor');
//       }, 500);

//     } catch (err:any) {
//       setError(err?.message || 'Unexpected error');
//     } finally {
//       setSending(false);
//     }
//   }

//   return (
//     <div className="min-h-screen">
//       {/* Hero Section - keep the two lines exactly as requested */}
//       <section className="relative overflow-hidden bg-white pt-16 pb-12">
//         <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="text-center">
//             <h1 className="text-5xl lg:text-7xl font-bold tracking-tight mb-4">
//               <span className="block text-zinc-900">AutoReach Monitor</span>
//               <span className="block bg-[#155DFC] bg-clip-text text-transparent">
//                 AI Brand Visibility Platform
//               </span>
//             </h1>
//             <p className="text-lg text-zinc-600 max-w-3xl mx-auto mb-6">
//               Track how AI models rank your brand against competitors
//             </p>

//             {/* CTA (keeps the look of the Start Brand Analysis button but will submit form) */}
//             <div className="flex flex-col sm:flex-row gap-4 justify-center">
//               <button
//                 onClick={() => onSubmit()}
//                 disabled={sending}
//                 className="btn-firecrawl-orange inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[10px] text-base font-medium transition-all duration-200 h-12 px-8"
//                 aria-label="Submit and go to Brand Monitor"
//               >
//                 {sending ? 'Submitting…' : 'Start Brand Analysis'}
//               </button>

//               {/* Optional: keep View Pricing as in the original but non-essential - removed per request */}
//             </div>

//           </div>
//         </div>
//       </section>

//       {/* Main content: Form (kept minimal, no navbar/footer) */}
//       <section className="py-12 bg-white">
//         <div className="max-w-3xl mx-auto p-6">
//           {successMessage && (
//             <div className="mb-4 rounded border border-green-300 bg-green-50 text-green-800 px-4 py-2">
//               {successMessage}
//             </div>
//           )}
//           {error && (
//             <div className="mb-4 rounded border border-red-300 bg-red-50 text-red-800 px-4 py-2">
//               {error}
//             </div>
//           )}

//           <form onSubmit={onSubmit} className="space-y-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700">Email *</label>
//               <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" placeholder="you@example.com" required />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700">URL *</label>
//               <input type="url" value={url} onChange={e=>setUrl(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" placeholder="https://example.com" required />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700">Categories *</label>
//               <input type="text" value={categories} onChange={e=>setCategories(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" placeholder="e.g. SaaS, E‑commerce" required />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700">Competitors * (add at least one)</label>
//               <div className="flex gap-2">
//                 <input value={competitorInput} onChange={e=>setCompetitorInput(e.target.value)} className="flex-1 border rounded px-3 py-2" placeholder="https://competitor.com" />
//                 <button type="button" onClick={addCompetitor} className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200">Add</button>
//               </div>
//               {!!competitors.length && (
//                 <div className="mt-2 flex flex-wrap gap-2">
//                   {competitors.map(c=> (
//                     <span key={c} className="inline-flex items-center gap-1 text-sm bg-gray-100 px-2 py-1 rounded">
//                       {c}
//                       <button type="button" onClick={()=>removeCompetitor(c)} className="text-gray-500 hover:text-gray-700">×</button>
//                     </span>
//                   ))}
//                 </div>
//               )}
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700">Prompts</label>
//               <textarea value={prompt} onChange={e=>setPrompt(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" rows={4} placeholder="Describe what files you want generated..." />
//             </div>

//             <div className="flex items-center justify-between">
//               {/* The primary CTA here is the button that looks like the earlier Start Brand Analysis link */}
//               <button type="submit" disabled={sending} className="btn-firecrawl-default inline-flex items-center justify-center whitespace-nowrap rounded-[10px] text-base font-medium transition-all duration-200 h-12 px-8">
//                 {sending ? 'Submitting…' : 'Submit & Open Brand Monitor'}
//               </button>
//             </div>
//           </form>
//         </div>
//       </section>

//       {/* Final CTA / Footer area removed per request */}
//     </div>
//   );
// }



"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  // Form state
  const [email, setEmail] = useState("");
  const [url, setUrl] = useState("");
  const [categories, setCategories] = useState("");
  const [prompt, setPrompt] = useState("");
  const [competitorInput, setCompetitorInput] = useState("");
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // helpers for competitors
  function addCompetitor() {
    const trimmed = competitorInput.trim();
    if (!trimmed) return;
    setCompetitors((prev) => Array.from(new Set([...prev, trimmed])));
    setCompetitorInput("");
  }
  function removeCompetitor(c: string) {
    setCompetitors((prev) => prev.filter((x) => x !== c));
  }

  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setError(null);

    // validation: make email, url, categories, competitors compulsory
    if (!email || !url || !categories || competitors.length === 0) {
      setError("Please fill Email, URL, Categories and add at least one Competitor.");
      return;
    }

    try {
      setSending(true);
      const body = { email, url, categories, competitors, prompts: prompt };

      const res = await fetch("/api/generate-files-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "Request failed");
      }

      setSuccessMessage("Request submitted — opening Brand Monitor...");
      // navigate to brand-monitor after short feedback
      setTimeout(() => {
        router.push("/brand-monitor");
      }, 400);
    } catch (err: any) {
      setError(err?.message || "Unexpected error");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section - keep hero text lines */}
      <section className="relative overflow-hidden bg-white pt-16 pb-12">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight mb-4">
              <span className="block text-zinc-900">AutoReach Monitor</span>
              <span className="block bg-[#155DFC] bg-clip-text text-transparent">
                AI Brand Visibility Platform
              </span>
            </h1>
            <p className="text-lg text-zinc-600 max-w-3xl mx-auto mb-6">
              Track how AI models rank your brand against competitors
            </p>
            {/* NOTE: Hero CTA removed per request */}
          </div>
        </div>
      </section>

      {/* Main content: Form */}
      <section className="py-12 bg-white">
        <div className="max-w-3xl mx-auto p-6">
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full border rounded px-3 py-2"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">URL *</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="mt-1 w-full border rounded px-3 py-2"
                placeholder="https://example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Categories *</label>
              <input
                type="text"
                value={categories}
                onChange={(e) => setCategories(e.target.value)}
                className="mt-1 w-full border rounded px-3 py-2"
                placeholder="e.g. SaaS, E-commerce"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Competitors * (add at least one)
              </label>
              <div className="flex gap-2">
                <input
                  value={competitorInput}
                  onChange={(e) => setCompetitorInput(e.target.value)}
                  className="flex-1 border rounded px-3 py-2"
                  placeholder="https://competitor.com"
                />
                <button
                  type="button"
                  onClick={addCompetitor}
                  className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200"
                >
                  Add
                </button>
              </div>
              {!!competitors.length && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {competitors.map((c) => (
                    <span key={c} className="inline-flex items-center gap-1 text-sm bg-gray-100 px-2 py-1 rounded">
                      {c}
                      <button
                        type="button"
                        onClick={() => removeCompetitor(c)}
                        className="text-gray-500 hover:text-gray-700 ml-2"
                        aria-label={`Remove ${c}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Prompts</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="mt-1 w-full border rounded px-3 py-2"
                rows={4}
                placeholder="Describe what files you want generated..."
              />
            </div>

            <div className="flex items-center justify-between">
              {/* PRIMARY CTA: submits to API and navigates to /brand-monitor on success */}
              <button
                type="submit"
                disabled={sending}
                className="btn-firecrawl-orange inline-flex items-center justify-center whitespace-nowrap rounded-[10px] text-base font-medium transition-all duration-200 h-12 px-8"
              >
                {sending ? "Submitting…" : "Submit & Open Brand Monitor"}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}