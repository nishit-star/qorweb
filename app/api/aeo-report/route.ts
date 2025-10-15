import { NextRequest, NextResponse } from 'next/server';
import { buildAuditBundle } from '../../../lib/aeo/auditBundle';
import { renderAeoJsonToHtml, AeoModelOutput } from '../../../lib/aeo/aeoReportFromPrompt';
import { renderSchemaAuditToHtml, SchemaAuditOutput } from '../../../lib/aeo/schemaReportFromPrompt';
import { buildBasicSectionFromAudit } from '../../../lib/aeo/basicFromAudit';
import { callLLMJSON } from '../../../lib/providers/llm';
import { SCHEMA_AUDIT_PROMPT } from '../../../lib/aeo/prompts/schemaAuditPrompt';
import { db } from '../../../lib/db';
import { aeoReports } from '../../../lib/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '../../../lib/auth';

interface AEOReportRequest {
  url: string;
  customerName?: string;
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

const AUDITOR_PROMPT_PREFIX = `You are an expert AEO (Answer Engine Optimization) auditor assistant. I will provide the extracted content of one or more webpages, including:
- Headings, paragraphs, lists
- Images with alt text or captions
- Structured data (JSON-LD, Microdata, RDFa)
- Optional: metadata like title, meta description
Your task is to produce a **comprehensive, human-readable, structured JSON report per page** that is easy for a non-technical person to understand.
FOR EACH PAGE, OUTPUT:
{
  "url": "...",
  "structuredContent": [
    {
      "type": "FAQPage|HowTo|Article|Product|Service|Review|Person|Organization|Breadcrumb",
      "textOrSummary": "...",
      "status": "valid|missing|incorrect",
      "issues": ["..."],
      "recommendedChanges": "..."
    }
  ],
  "unstructuredContent": [
    {
      "contentType": "paragraph|heading|list|image",
      "textOrAlt": "...",
      "suggestedAeoType": "FAQPage|HowTo|Article|Product|Service|Review|Person|Organization|Breadcrumb",
      "reasonItIsImportant": "...",
      "recommendation": "markup it with JSON-LD / optimize for AEO/GEO"
    }
  ],
  "optimizationSuggestions": [
    {
      "existingContent": "...",
      "problem": "too generic / missing schema / poor snippet / missing alt text",
      "suggestedFix": "..."
    }
  ],
  "newContentRecommendations": [
    {
      "contentType": "paragraph|heading|list|image",
      "suggestedTopicOrText": "...",
      "aeoType": "FAQPage|HowTo|Article|Product|Service|Review|Person|Organization|Breadcrumb",
      "reasonForAdding": "..."
    }
  ],
  "summaryScore": {
      "structuredCoverage": 0-100,
      "unstructuredCoverage": 0-100,
      "optimizationOpportunities": 0-100,
      "overallAEOReadiness": 0-100
  }
}
RULES:
1. Do NOT invent facts. Use placeholders like COMPANY_NAME, SERVICE_NAME if information is missing.
2. Identify **all content relevant for AEO**, whether structured or unstructured.
3. Clearly separate **already structured content**, **unstructured but AEO-relevant content**, **content that needs optimization**, and **suggested new content**.
4. Provide concise explanations for each recommendation so a **non-technical person** can understand.
5. Include JSON-LD validation hints for each structured block (e.g., "validate with Google Rich Results Test").
6. Keep output **strictly valid JSON**, no extra text, commentary, or formatting outside the JSON.`;

export async function POST(request: NextRequest) {
  try {
    const body: AEOReportRequest = await request.json();
    const { url, maxPages = 5 } = body;
    let { customerName } = body;
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }
    if (!customerName) customerName = deriveCustomerNameFromUrl(url);

    // Get session via Better Auth
    let userId: string | null = null;
    let userEmail: string | null = null;
    try {
      const session = await auth.api.getSession({ headers: request.headers as any });
      if (session?.user) {
        userId = session.user.id || null;
        userEmail = session.user.email || null;
      }
    } catch {
      // no session, continue
    }

    // 1) Build audit bundle once
    const cappedMaxPages = Math.max(1, Math.min(Number(maxPages) || 5, 5));
    const audit = await buildAuditBundle(url, { maxPages: cappedMaxPages });
    const auditJSON = JSON.stringify(audit);

    // 2) First flow: AEO auditor
    const auditorPrompt = `${AUDITOR_PROMPT_PREFIX}\n\nDATA:\n${auditJSON}`;
    const llmAeo = await callLLMJSON(auditorPrompt);
    if (!llmAeo.ok) {
      return NextResponse.json({ error: 'LLM (AEO auditor) failed', details: llmAeo.error }, { status: 500 });
    }
    let aeoParsed: AeoModelOutput | AeoModelOutput[];
    try {
      const cleaned = extractFirstJsonValue(llmAeo.content);
      aeoParsed = JSON.parse(cleaned);
    } catch (e: any) {
      return NextResponse.json({ error: 'AEO auditor JSON parse failed', details: String(e?.message || e) }, { status: 500 });
    }
    const aeoHtml = renderAeoJsonToHtml(aeoParsed, customerName);

    // 3) Second flow: Schema auditor
    const schemaPrompt = SCHEMA_AUDIT_PROMPT.replace('{{ SEO_AUDIT_JSON }}', auditJSON);
    const llmSchema = await callLLMJSON(schemaPrompt);
    if (!llmSchema.ok) {
      return NextResponse.json({ error: 'LLM (Schema auditor) failed', details: llmSchema.error }, { status: 500 });
    }
    let schemaParsed: SchemaAuditOutput;
    try {
      const cleaned = extractFirstJsonValue(llmSchema.content);
      schemaParsed = JSON.parse(cleaned);
    } catch (e: any) {
      return NextResponse.json({ error: 'Schema auditor JSON parse failed', details: String(e?.message || e) }, { status: 500 });
    }
    const schemaHtml = renderSchemaAuditToHtml(schemaParsed, customerName);

undefined

    // 4.5) Third flow: Basic SEO (from audit bundle)
    const basicFromAuditHtml = buildBasicSectionFromAudit(audit);

    // 5) Merge all three sections into one HTML wrapper with headings
    const mergedHtml = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>AEO Report - ${escapeHtml(customerName)}</title>
    <style>
      :root{--primary:#155DFC;--text:#111;--muted:#6b7280;--bg:#ffffff;--card:#ffffff;--border:#e5e7eb}
      *{box-sizing:border-box}
      html,body{height:100%}
      body{font-family:Arial,Helvetica,sans-serif;margin:0;color:var(--text);background:var(--bg)}
      .container{max-width:1024px;margin:0 auto;padding:24px}
      header.report-header{border-bottom:3px solid var(--primary);padding:16px 0;margin-bottom:20px}
      header.report-header h1{margin:0;font-size:28px;color:#000}
      header.report-header .meta{color:var(--muted);font-size:14px}
      .badge{display:inline-block;background:var(--primary);color:#fff;border-radius:999px;padding:4px 10px;font-size:12px;margin-left:8px}
      .section{margin:16px 0;break-inside:avoid}
      .section h2{font-size:20px;border-left:6px solid var(--primary);padding-left:10px;margin:0 0 10px 0}
      .grid{display:grid;grid-template-columns:repeat(12,1fr);gap:12px}
      .col-12{grid-column:span 12}
      .col-6{grid-column:span 12}
      @media screen and (min-width:900px){.col-6{grid-column:span 6}}
      .card{background:var(--card);border:1px solid var(--border);padding:14px;border-radius:10px;box-shadow:0 1px 2px rgba(0,0,0,0.04);margin-bottom:12px}
      .card h3{margin-top:0;color:#000}
      ul{margin:0;padding-left:18px}
      pre{background:#0b1220;color:#e5e7eb;padding:12px;border-radius:8px;overflow:auto;border:1px solid #111827}
      code{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace}

      /* Print optimization */
      @media print{
        body{background:#fff}
        .container{padding:12px}
        header.report-header{page-break-after:avoid}
        .section{page-break-inside:avoid}
        .card{page-break-inside:avoid}
        pre{white-space:pre-wrap;word-wrap:break-word}
        /* Limit overly long lists/tables per page */
        .limit-page{max-height:1100px;overflow:hidden}
      }

      /* Manual page-break helpers if needed in content */
      .page-break{page-break-before:always}
      .avoid-break{break-inside:avoid}
    </style>
  </head>
  <body>
    <div class="container">
      <header class="report-header">
        <h1>AEO Combined Report <span class="badge">AI + Schema + Basic</span></h1>
        <div class="meta">Customer: ${escapeHtml(customerName)} | URL: ${escapeHtml(url)} | Generated: ${new Date().toLocaleString()}</div>
      </header>

      <div class="section">
        <h2>Basic SEO Summary</h2>
        ${basicFromAuditHtml}
      </div>

      <div class="section">
        <h2>AEO Audit (AI)</h2>
        ${aeoHtml}
      </div>

      <div class="section">
        <h2>Schema Audit & Optimized JSON-LD</h2>
        ${schemaHtml}
      </div>
    </div>
  </body>
</html>`;

    // 6) Insert into DB
    try {
      await db.insert(aeoReports).values({
        userId: userId || null,
        userEmail: userEmail || null,
        customerName,
        url,
        html: mergedHtml,
      });
    } catch (e) {
      console.error('Failed to insert aeo_report:', e);
    }

    return NextResponse.json({ success: true, htmlContent: mergedHtml, customerName, reportType: 'combined-ai', generatedAt: new Date().toISOString() });
  } catch (error) {
    console.error('AEO Report generation error (combined flows):', error);
    return NextResponse.json({ error: 'Failed to generate AEO report', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

// Keep GET for basic quick summary
import { buildBasicReport } from '../../../lib/aeo/basicReport';
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }
    const customerName = deriveCustomerNameFromUrl(url);
    const htmlContent = await buildBasicReport(url);
    return NextResponse.json({ success: true, htmlContent, customerName, reportType: 'basic' });
  } catch (error) {
    console.error('AEO Report retrieval error:', error);
    return NextResponse.json({ error: 'Failed to retrieve AEO report', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

function escapeHtml(s: string) { return String(s||'').replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'} as any)[c] || c); }

function extractFirstJsonValue(raw: string): string {
  let s = String(raw ?? '').trim();

  // Strip BOM
  if (s.length && s.charCodeAt(0) === 0xFEFF) s = s.slice(1);

  // Strip markdown code fences like ```json ... ``` or ``` ... ```
  if (s.startsWith('```')) {
    const firstLineEnd = s.indexOf('\n');
    if (firstLineEnd !== -1) {
      const fenceLang = s.slice(3, firstLineEnd).trim().toLowerCase();
      if (fenceLang === '' || fenceLang === 'json') {
        s = s.slice(firstLineEnd + 1);
        const closing = s.lastIndexOf('```');
        if (closing !== -1) {
          s = s.slice(0, closing);
        }
      }
    }
    s = s.trim();
  }

  // Find first non-whitespace
  let i = 0;
  while (i < s.length && /\s/.test(s[i])) i++;
  if (i >= s.length) return s;

  // Ensure we start at '{' or '['
  let startIdx = i;
  if (s[startIdx] !== '{' && s[startIdx] !== '[') {
    const jObj = s.indexOf('{', startIdx);
    const jArr = s.indexOf('[', startIdx);
    const j = (jObj === -1) ? jArr : (jArr === -1 ? jObj : Math.min(jObj, jArr));
    if (j === -1) return s.trim();
    startIdx = j;
  }

  const openChar = s[startIdx];
  const closeChar = openChar === '{' ? '}' : ']';
  let depth = 0;
  let inString = false;
  let escape = false;

  for (let k = startIdx; k < s.length; k++) {
    const ch = s[k];

    if (inString) {
      if (escape) {
        escape = false;
      } else if (ch === '\\') {
        escape = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === openChar) depth++;
    else if (ch === closeChar) depth--;

    if (depth === 0) {
      return s.slice(startIdx, k + 1).trim();
    }
  }

  // Unclosed JSON, return what we have (will still throw on parse)
  return s.slice(startIdx).trim();
}
