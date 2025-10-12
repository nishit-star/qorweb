import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

interface AEOReportRequest {
  url: string; // primary input now
  customerName?: string; // optional, derived from url if absent
  reportType?: 'combined' | 'extended' | 'schema' | 'aeo' | 'basic';
  inputData?: string; // optional JSON for prompt-based scripts
  domainRegex?: string;
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

function resolvePythonInterpreter(baseDir: string) {
  try {
    if (process.platform === 'win32') {
      const venvPython = path.join(baseDir, '.venv', 'Scripts', 'python.exe');
      if (fs.existsSync(venvPython)) return venvPython;
    } else {
      const venvPython = path.join(baseDir, '.venv', 'bin', 'python');
      if (fs.existsSync(venvPython)) return venvPython;
    }
  } catch {
    // ignore
  }
  return 'python';
}

export async function POST(request: NextRequest) {
  try {
    const body: AEOReportRequest = await request.json();
    let { url, customerName, reportType = 'combined', inputData, domainRegex } = body;

    // Only require URL for extended crawl. Combined also needs URL for the extended section.
    if ((reportType === 'extended' || reportType === 'combined') && !url) {
      return NextResponse.json(
        { error: 'URL is required for extended/combined report' },
        { status: 400 }
      );
    }

    if (!customerName && url) {
      customerName = deriveCustomerNameFromUrl(url);
    }

    const pythonScriptPath = path.join(process.cwd(), 'aeo report');
    const wrapperScript = path.join(pythonScriptPath, 'aeo_api_wrapper.py');
    const pythonExe = resolvePythonInterpreter(pythonScriptPath);

    // Always generate the combined report regardless of reportType input, per product decision
    // Combined: run extended crawl-based report, then merge with prompt-based reports
    const parts: string[] = [];

    if (url) {
      const extArgs = ['extended', customerName!, '--url', url];
      if (domainRegex) extArgs.push('--domain_regex', domainRegex);
      const extended = await executePythonWrapper(wrapperScript, extArgs, pythonExe);
      if (!extended.success) {
        return NextResponse.json({ error: 'Python script execution failed (extended)', details: extended.error }, { status: 500 });
      }
      if (extended.html) parts.push(extended.html);
    }

    // Prompt-based reports do not strictly require url
    const aeoArgs = ['aeo', customerName!];
    if (inputData) aeoArgs.push('--input_data', inputData);
    const aeoRes = await executePythonWrapper(wrapperScript, aeoArgs, pythonExe);
    if (aeoRes.success && aeoRes.html) parts.push(aeoRes.html);

    const schemaArgs = ['schema', customerName!];
    if (inputData) schemaArgs.push('--input_data', inputData);
    const schemaRes = await executePythonWrapper(wrapperScript, schemaArgs, pythonExe);
    if (schemaRes.success && schemaRes.html) parts.push(schemaRes.html);

    const combinedHtml = wrapCombinedHtml(customerName!, parts);
    return NextResponse.json({ success: true, htmlContent: combinedHtml, customerName, reportType: 'combined', generatedAt: new Date().toISOString() });

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

function executePythonScript(scriptPath: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn('python', [scriptPath, ...args], {
      cwd: path.dirname(scriptPath),
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`Python script failed with code ${code}: ${stderr}`));
      }
    });

    pythonProcess.on('error', (error) => {
      reject(new Error(`Failed to start Python process: ${error.message}`));
    });
  });
}

function executePythonWrapper(scriptPath: string, args: string[], pythonExe = 'python'): Promise<{success: boolean, html: string | null, error: string | null}> {
  return new Promise((resolve) => {
    const pythonProcess = spawn(pythonExe, [scriptPath, ...args], {
      cwd: path.dirname(scriptPath),
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    pythonProcess.on('close', (code) => {
      try {
        if (code === 0 && stdout.trim()) {
          const jsonStart = stdout.indexOf('{');
          const jsonStr = jsonStart >= 0 ? stdout.slice(jsonStart).trim() : stdout.trim();
          const result = JSON.parse(jsonStr);
          resolve(result);
        } else {
          const hint = `Hint: ensure dependencies installed with 'pip install -r requirements.txt' and run 'python -m playwright install chromium' in ${path.dirname(scriptPath)}. Interpreter used: ${pythonExe}`;
          resolve({ success: false, html: null, error: (stderr?.trim() || `Process exited with code ${code}`) + `\n` + hint });
        }
      } catch (parseError) {
        resolve({ success: false, html: null, error: `Failed to parse JSON output: ${String(parseError)}\nRaw stdout (truncated): ${stdout.slice(0,500)}` });
      }
    });

    pythonProcess.on('error', (error) => {
      resolve({ success: false, html: null, error: `Failed to start Python process: ${error.message}. Tried interpreter: ${pythonExe}` });
    });
  });
}

function wrapCombinedHtml(customerName: string, parts: string[]) {
  const body = parts.filter(Boolean).map((p, i) => `<section class="card"><h2>Section ${i + 1}</h2>${p}</section>`).join('\n');
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>AEO Combined Report - ${customerName}</title>
  <style>
    body{font-family:Arial,Helvetica,sans-serif;margin:20px;color:#111}
    .card{background:#fff;border:1px solid #e4e4e4;padding:12px;margin:12px 0;border-radius:6px}
  </style>
  </head><body>
    <header><h1>AEO Combined Report</h1><p>Customer: ${customerName} | Generated: ${new Date().toISOString()}</p></header>
    ${body || '<p>No sections produced.</p>'}
  </body></html>`;
}

// GET endpoint to retrieve existing reports
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    const reportType = searchParams.get('reportType') || 'basic';

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    const customerName = deriveCustomerNameFromUrl(url);

    if (reportType === 'basic') {
      const pythonScriptPath = path.join(process.cwd(), 'aeo report');
      const scriptPath = path.join(pythonScriptPath, 'Seo_basic_Report.py');
      try {
        const htmlContent = await executePythonScript(scriptPath, [customerName]);
        return NextResponse.json({ success: true, htmlContent, customerName, reportType });
      } catch (error) {
        return NextResponse.json(
          { error: 'Report not found or could not be read', details: error instanceof Error ? error.message : 'Unknown error' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Report type not supported for GET requests' },
      { status: 400 }
    );

  } catch (error) {
    console.error('AEO Report retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve AEO report', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
