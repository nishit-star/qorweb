import { NextRequest, NextResponse } from 'next/server';
import { crawlSite } from '../../../lib/aeo/crawl';
import { summarize } from '../../../lib/aeo/insights';
import { buildAEOSection } from '../../../lib/aeo/aeoPrompt';
import { buildSchemaSection } from '../../../lib/aeo/schemaPrompt';
import { buildBasicReport } from '../../../lib/aeo/basicReport';
import { renderCombinedHtml } from '../../../lib/aeo/combine';

interface AEOReportRequest {
  url: string; // primary input now
  customerName?: string; // optional, derived from url if absent
  reportType?: 'combined' | 'extended' | 'schema' | 'aeo' | 'basic';
  inputData?: string; // optional JSON for prompt-based scripts
  domainRegex?: string;
  maxPages?: number;
}

function deriveCustomerNameFromUrl(u: string): string {
  try {
    const { hostname } = new URL(u);
    const base = hostname.replace(/^www\./, '');
    const name = base.split('.')[0] || 'client';
    return name.charAt(0).toUpperCase() + name.slice(1);
  } catch {
    return 'Client';
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: AEOReportRequest = await request.json();
    let { url, customerName, reportType = 'combined', domainRegex, maxPages = 50 } = body;

    if (!url && (reportType === 'combined' || reportType === 'extended' || reportType === 'basic')) {
      return NextResponse.json(
        { error: 'URL is required for this report type' },
        { status: 400 }
      );
    }

    if (!customerName && url) {
      customerName = deriveCustomerNameFromUrl(url);
    }

    // Crawl (extended) if url provided
    let crawlHtml = '';
    let insightsHtml = '';
    let insightsData = null as any;

    if (url) {
      const domainRe = domainRegex ? new RegExp(domainRegex) : undefined;
      const crawl = await crawlSite({ startUrl: url!, domainRegex: domainRe, maxPages });
      const insights = summarize(crawl);
      insightsData = insights;

      // Build small extended section table
      const topPages = crawl.pages.slice(0, 20);
      const rows = topPages.map(p => `<tr><td>${escapeHtml(p.url)}</td><td>${p.status ?? '—'}</td><td>${p.timeMs ?? '—'}</td><td>${escapeHtml(p.title || '')}</td><td>${p.metaDescription ? 'Yes' : 'No'}</td></tr>`).join('');
      crawlHtml = `<section class="card">
        <h2>Extended Crawl Summary</h2>
        <table>
          <thead><tr><th>URL</th><th>Status</th><th>Time (ms)</th><th>Title</th><th>Meta</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </section>`;

      const insightItems = insights.insights.map(i => `<li><strong>${i.title}</strong> (${i.severity}) – ${i.description} <em>Fix:</em> ${i.recommendation}</li>`).join('');
      insightsHtml = `<section class="card"><h2>SEO Insights</h2><ul>${insightItems || '<li>No major issues detected.</li>'}</ul></section>`;
    }

    // AEO & Schema sections (rule-based for now)
    const aeoHtml = buildAEOSection(insightsData ?? { metrics: {totalPages:0,okPages:0,errorPages:0,avgResponseMs:0,missingTitles:0,missingMeta:0,avgWordCount:0,statusBuckets:{}}, insights: [] }, { customerName: customerName!, url: url! });
    const schemaHtml = buildSchemaSection({ customerName: customerName!, url: url! });

    // Basic section (from homepage)
    const basicHtml = url ? await buildBasicReport(url) : '';

    const combined = renderCombinedHtml({ customerName: customerName!, url: url!, sections: [crawlHtml, insightsHtml, aeoHtml, schemaHtml, basicHtml], insights: insightsData ?? { metrics: {totalPages:0,okPages:0,errorPages:0,avgResponseMs:0,missingTitles:0,missingMeta:0,avgWordCount:0,statusBuckets:{}}, insights: [] } });

    return NextResponse.json({ success: true, htmlContent: combined, customerName, reportType: 'combined', generatedAt: new Date().toISOString() });

  } catch (error) {
    console.error('AEO Report generation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate AEO report',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint for basic summary only
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    const customerName = deriveCustomerNameFromUrl(url);
    const htmlContent = await buildBasicReport(url);
    return NextResponse.json({ success: true, htmlContent, customerName, reportType: 'basic' });

  } catch (error) {
    console.error('AEO Report retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve AEO report', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function escapeHtml(s: string) { return s.replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'} as any)[c]); }
