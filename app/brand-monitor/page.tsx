"use client";

import { BrandMonitor } from "@/components/brand-monitor/brand-monitor";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Menu, X, Plus, Trash2, Loader2 } from "lucide-react";
import { useCustomer, useRefreshCustomer } from "@/hooks/useAutumnCustomer";
import {
  useBrandAnalyses,
  useBrandAnalysis,
  useDeleteBrandAnalysis,
} from "@/hooks/useBrandAnalyses";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useSession } from "@/lib/auth-client";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

/**
 * Tabbed Brand Monitor Page
 *
 * - Hero header unchanged
 * - Tab bar sits below hero (in the light/grey area)
 * - Tab 1: Brand Monitor (renders your existing BrandMonitorContent)
 * - Tab 2: AEO Report (placeholder)
 * - Tab 3: Files (placeholder)
 * - Tab 4: UGC (placeholder)
 *
 * You can later replace placeholders with real components.
 */

/* --------------------- BrandMonitorContent (unchanged logic) --------------------- */
function BrandMonitorContent({ session }: { session: any }) {
  const router = useRouter();
  const { customer, isLoading, error } = useCustomer();
  const refreshCustomer = useRefreshCustomer();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(
    null
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [analysisToDelete, setAnalysisToDelete] = useState<string | null>(
    null
  );

  // Queries and mutations
  const { data: analyses, isLoading: analysesLoading } = useBrandAnalyses();
  const { data: currentAnalysis } = useBrandAnalysis(selectedAnalysisId);
  const deleteAnalysis = useDeleteBrandAnalysis();

  // Get credits from customer data
  const messageUsage = customer?.features?.messages;
  const credits = messageUsage ? (messageUsage.balance || 0) : 0;

  useEffect(() => {
    // If there's an auth error, redirect to login
    if (error?.code === "UNAUTHORIZED" || error?.code === "AUTH_ERROR") {
      router.push("/login");
    }
  }, [error, router]);

  const handleCreditsUpdate = async () => {
    // Use the global refresh to update customer data everywhere
    await refreshCustomer();
  };

  const handleDeleteAnalysis = async (analysisId: string) => {
    setAnalysisToDelete(analysisId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (analysisToDelete) {
      await deleteAnalysis.mutateAsync(analysisToDelete);
      if (selectedAnalysisId === analysisToDelete) {
        setSelectedAnalysisId(null);
      }
      setAnalysisToDelete(null);
    }
  };

  const handleNewAnalysis = () => {
    setSelectedAnalysisId(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header */}
      {/* <div className="relative overflow-hidden bg-white border-b">
        <div className="px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mb-2 animate-fade-in-up">
                  <span className="block text-zinc-900">AutoReach Monitor</span>
                  <span className="block bg-[#155DFC] bg-clip-text text-transparent">
                    AI Brand Visibility Platform
                  </span>
                </h1>
                <p className="text-lg text-zinc-600 animate-fade-in-up animation-delay-200">
                  Track how AI models rank your brand against competitors
                </p>
              </div>
            </div>
          </div>
        </div>
      </div> */}

      {/* --- Main area: sidebar + content (existing) --- */}
      <div className="flex h-[calc(100vh-12rem)] relative">
        {/* Sidebar Toggle Button - Always visible */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={`absolute top-2 z-10 p-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border border-gray-200 ${
            sidebarOpen ? "left-[324px]" : "left-4"
          }`}
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? (
            <X className="h-5 w-5 text-gray-600" />
          ) : (
            <Menu className="h-5 w-5 text-gray-600" />
          )}
        </button>

        {/* Sidebar */}
        <div
          className={`${sidebarOpen ? "w-80" : "w-0"} bg-white border-r overflow-hidden flex flex-col transition-all duration-200`}
        >
          <div className="p-4 border-b">
            <Button onClick={handleNewAnalysis} className="w-full btn-firecrawl-orange">
              <Plus className="w-4 h-4 mr-2" />
              New Analysis
            </Button>
          </div>

          <div className="overflow-y-auto flex-1">
            {analysesLoading ? (
              <div className="p-4 text-center text-gray-500">Loading analyses...</div>
            ) : analyses?.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No analyses yet</div>
            ) : (
              <div className="space-y-1 p-2">
                {analyses?.map((analysis) => (
                  <div
                    key={analysis.id}
                    className={`p-3 rounded-lg cursor-pointer hover:bg-gray-100 ${
                      selectedAnalysisId === analysis.id ? "bg-gray-100" : ""
                    }`}
                    onClick={() => setSelectedAnalysisId(analysis.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{analysis.companyName || "Untitled Analysis"}</p>
                        <p className="text-sm text-gray-500 truncate">{analysis.url}</p>
                        <p className="text-xs text-gray-400">
                          {analysis.createdAt && format(new Date(analysis.createdAt), "MMM d, yyyy")}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteAnalysis(analysis.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 sm:px-8 lg:px-12 py-8">
            <BrandMonitor
              creditsAvailable={credits}
              onCreditsUpdate={handleCreditsUpdate}
              selectedAnalysis={selectedAnalysisId ? currentAnalysis : null}
              onSaveAnalysis={(analysis) => {
                // This will be called when analysis completes
                // We'll implement this in the next step if needed
              }}
            />
          </div>
        </div>
      </div>

      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Analysis"
        description="Are you sure you want to delete this analysis? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        isLoading={deleteAnalysis.isPending}
      />
    </div>
  );
}

/* --------------------- Tabbed Page wrapper --------------------- */
function AeoReportTab() {
  const [customerName, setCustomerName] = useState('');
  const [url, setUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState<{ htmlContent: string; customerName: string; reportType: string; generatedAt: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [reports, setReports] = useState<Array<{ id: string; customerName: string; url: string; createdAt: string }>>([]);
  const [loadingReports, setLoadingReports] = useState(false);

  const fetchReports = async () => {
    setLoadingReports(true);
    try {
      const res = await fetch('/api/aeo-report/list');
      const data = await res.json();
      if (res.ok && Array.isArray(data.reports)) {
        setReports(data.reports);
      }
    } catch (e) {
      // silent fail
    } finally {
      setLoadingReports(false);
    }
  };

  // load on mount
  useEffect(() => { fetchReports(); }, []);

  const generateReport = async () => {
    if (!customerName.trim() || !url.trim()) return;
    setIsGenerating(true);
    try {
      const res = await fetch('/api/aeo-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerName: customerName.trim(), url: url.trim(), reportType: 'combined' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate report');
      setReportData(data);
      // refresh list so the new report appears in sidebar
      fetchReports();
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenReport = async (id: string) => {
    try {
      const res = await fetch(`/api/aeo-report/view?id=${encodeURIComponent(id)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load report');
      setReportData({ htmlContent: data.html, customerName: data.customerName, reportType: 'combined-ai', generatedAt: data.createdAt });
      setSidebarOpen(false);
    } catch (e) {
      // no-op
    }
  };

  const downloadPDF = async () => {
    if (!reportData) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const html = `<!DOCTYPE html><html><head><title>AEO Report - ${reportData.customerName}</title>
      <style>@page{size:A3 landscape;margin:12mm}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.card{page-break-inside:avoid}}</style>
    </head><body>
      <div class="header" style="text-align:center;margin-bottom:20px;border-bottom:2px solid #004d99;padding-bottom:10px">
        <h1 style="margin:0">AEO Report</h1>
        <p style="margin:6px 0 0">Customer: ${reportData.customerName} | Generated: ${new Date(reportData.generatedAt).toLocaleString()}</p>
      </div>
      ${reportData.htmlContent}
    </body></html>`;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => { setTimeout(() => { printWindow.print(); printWindow.close(); }, 500); };
  };

  return (
    <div className="relative min-h-[60vh] bg-white rounded-lg border">
      {/* Sidebar Toggle Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className={`absolute top-3 z-10 m-4 p-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border border-gray-200 ${sidebarOpen ? 'left-[324px]' : 'left-4'}`}
        aria-label="Toggle sidebar"
      >
        {sidebarOpen ? (<X className="h-5 w-5 text-gray-600" />) : (<Menu className="h-5 w-5 text-gray-600" />)}
      </button>

      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} bg-white border-r overflow-hidden flex flex-col transition-all duration-200 h-full absolute left-0 top-0`}> 
        <div className="p-4 border-b">
          <div className="font-semibold">Previous AEO Reports</div>
        </div>
        <div className="overflow-y-auto flex-1">
          {loadingReports ? (
            <div className="p-4 text-center text-gray-500">Loading...</div>
          ) : reports.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No reports yet</div>
          ) : (
            <div className="space-y-1 p-2">
              {reports.map(r => (
                <div key={r.id} className="p-3 rounded-lg cursor-pointer hover:bg-gray-100" onClick={() => handleOpenReport(r.id)}>
                  <p className="font-medium truncate">{r.customerName || 'Untitled'}</p>
                  <p className="text-sm text-gray-500 truncate">{r.url}</p>
                  <p className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="p-8">
      <h2 className="text-2xl font-semibold mb-4">.</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="aeoCustomer">Customer Name *</label>
          <input id="aeoCustomer" className="border rounded-md px-3 py-2 w-full" placeholder="Enter customer name" value={customerName} onChange={e=>setCustomerName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="aeoUrl">Website URL *</label>
          <input id="aeoUrl" className="border rounded-md px-3 py-2 w-full" placeholder="https://example.com" value={url} onChange={e=>setUrl(e.target.value)} />
        </div>
      </div>
      <button onClick={generateReport} disabled={isGenerating} className="btn-firecrawl-default inline-flex items-center justify-center whitespace-nowrap rounded-[10px] text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 h-9 px-4">
        {isGenerating ? 'Generating...' : 'Generate Report'}
      </button>

      {reportData && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm text-gray-600">Generated on {new Date(reportData.generatedAt).toLocaleString()} | Type: {reportData.reportType}</p>
            </div>
            <button onClick={downloadPDF} className="border px-3 py-1.5 rounded-md text-sm">Download PDF</button>
          </div>
          <div className="report-content border rounded-lg p-4 bg-white" dangerouslySetInnerHTML={{ __html: reportData.htmlContent }} />
        </div>
      )}
      </div>{/* end main content padding */}
    </div>
  );
}

export default function BrandMonitorPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  // tabs: 'brand' | 'aeo' | 'files' | 'ugc'
  const [activeTab, setActiveTab] = useState<"brand" | "aeo" | "files" | "ugc">(
    "brand"
  );

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  if (isPending) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please log in to access the brand monitor</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Keep the hero header at top so it's shared across tabs */}
      <div className="relative overflow-hidden bg-white border-b">
        <div className="px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mb-2 animate-fade-in-up">
                  <span className="block text-zinc-900">AutoReach Monitor</span>
                  <span className="block bg-[#155DFC] bg-clip-text text-transparent">
                    AI Brand Visibility Platform
                  </span>
                </h1>
                <p className="text-lg text-zinc-600 animate-fade-in-up animation-delay-200">
                  Track how AI models rank your brand against competitors
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* TAB BAR (placed in the lower grey area under header) */}
        <div className="bg-gray-50 border-t">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav aria-label="Primary" className="mt-6">
              <div className="inline-flex items-end space-x-1">
                {/* Tab button common style */}
                {/** We'll visually 'lift' the active tab to look like a classic tabbed UI */}
                <TabButton
                  title="Brand Monitor"
                  active={activeTab === "brand"}
                  onClick={() => setActiveTab("brand")}
                />
                <TabButton
                  title="AEO Report"
                  active={activeTab === "aeo"}
                  onClick={() => setActiveTab("aeo")}
                />
                <TabButton
                  title="Files"
                  active={activeTab === "files"}
                  onClick={() => setActiveTab("files")}
                />
                <TabButton
                  title="UGC"
                  active={activeTab === "ugc"}
                  onClick={() => setActiveTab("ugc")}
                />
              </div>
            </nav>
          </div>
        </div>
      </div>

      {/* Tab content area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "brand" && <BrandMonitorContent session={session} />}
        {activeTab === "aeo" && <AeoReportTab />}
        {activeTab === "files" && (
          <div className="bg-white rounded-lg border p-8 min-h-[50vh]">
            <h2 className="text-2xl font-semibold mb-4">Files (coming soon)</h2>
            <p className="text-gray-600">This section is under development.</p>
          </div>
        )}
        {activeTab === "ugc" && (
          <div className="bg-white rounded-lg border p-8 min-h-[50vh]">
            <h2 className="text-2xl font-semibold mb-4">UGC (coming soon)</h2>
            <p className="text-gray-600">This section is under development.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* --------------------- TabButton helper component --------------------- */
function TabButton({
  title,
  active,
  onClick,
}: {
  title: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative -mb-6 px-6 py-3 border rounded-t-lg transition-all ${
        active
          ? "bg-white border-gray-300 text-gray-900 shadow"
          : "bg-transparent border-b border-transparent text-gray-600 hover:text-gray-800"
      }`}
      aria-current={active ? "page" : undefined}
    >
      <span className={`${active ? "font-semibold" : "font-medium"}`}>{title}</span>
    </button>
  );
}