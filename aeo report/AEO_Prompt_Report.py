#!/usr/bin/env python3
"""
AEO_Prompt_Report.py

Saves stdin to ./output/logs/<YYYY-MM-DD>/<Customer>/aeo/<Customer>_AEO_PageAudit.json
Then converts that JSON into a single, self-contained HTML dashboard (images + CSS inlined)
and saves the HTML into the same directory.

Place this file (and optional report_style.css) in /home/cygwin/GEO/pycode on your Linux server.
"""
from __future__ import annotations
import sys
import os
import argparse
import json
import re
import math
import base64
import io
from pathlib import Path
from datetime import datetime

# ensure matplotlib works headless
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

# --------------------
# Robust JSON loader (handles quoted/escaped JSON and code fences)
# --------------------
def robust_load_json_v2(path: Path | str):
    raw = Path(path).read_text(encoding='utf-8').strip()
    if not raw:
        raise ValueError("Empty input JSON.")
    if raw.startswith('"') and raw.endswith('"'):
        inner = raw[1:-1]
        try:
            unescaped = bytes(inner, "utf-8").decode("unicode_escape")
        except Exception:
            unescaped = inner
        raw = unescaped.strip()
    if raw.startswith("```json"):
        raw = raw[len("```json"):].lstrip("\n")
    if raw.startswith("```"):
        raw = raw[3:].lstrip("\n")
    if raw.endswith("```"):
        raw = raw[:-3].rstrip("\n")
    try:
        return json.loads(raw)
    except Exception as e:
        m = re.search(r"(\{.*\})", raw, flags=re.DOTALL)
        if m:
            try:
                return json.loads(m.group(1))
            except Exception as e2:
                raise ValueError(f"Failed to parse JSON via fallback: {e2}")
        raise ValueError(f"Failed to parse JSON: {e}")

# --------------------
# Helpers
# --------------------
def slugify(name: str) -> str:
    return "".join(c if c.isalnum() else "_" for c in name).lower()

def summarize_report(data: dict) -> dict:
    summary = {}
    scores = data.get("summaryScore", {}) if isinstance(data, dict) else {}
    summary['structuredCoverage'] = scores.get('structuredCoverage', None)
    summary['unstructuredCoverage'] = scores.get('unstructuredCoverage', None)
    summary['optimizationOpportunities'] = scores.get('optimizationOpportunities', None)
    summary['overallAEOReadiness'] = scores.get('overallAEOReadiness', None)

    structured = data.get("structuredContent", []) if isinstance(data, dict) else []
    scount = {'valid':0,'incorrect':0,'missing':0,'other':0}
    for s in structured:
        st = (s.get("status","other") or "other").lower()
        if st in scount:
            scount[st]+=1
        else:
            scount['other']+=1
    summary['schema_counts'] = scount
    summary['total_schemas'] = len(structured)

    unstr = data.get("unstructuredContent", []) if isinstance(data, dict) else []
    ucounts = {}
    for u in unstr:
        t = u.get("contentType","unknown")
        ucounts[t] = ucounts.get(t,0)+1
    summary['unstructured_counts'] = ucounts
    summary['total_unstructured'] = len(unstr)

    opt = data.get("optimizationSuggestions", []) if isinstance(data, dict) else []
    summary['optimization_count'] = len(opt)

    case_metrics = []
    for u in unstr:
        txt = (u.get("textOrAlt") or "") + " " + (u.get("reasonItIsImportant") or "")
        for tok in txt.split():
            if tok.endswith('%') and tok[:-1].replace('.','',1).isdigit():
                case_metrics.append(tok)
    summary['case_metrics_found'] = case_metrics
    return summary

# --------------------
# Chart generation (in-memory -> data URI)
# --------------------
def fig_to_data_uri(fig) -> str:
    buf = io.BytesIO()
    fig.savefig(buf, format='png', dpi=150, bbox_inches='tight')
    plt.close(fig)
    data = base64.b64encode(buf.getvalue()).decode('ascii')
    return f"data:image/png;base64,{data}"

def make_bar_chart_datauri(schema_counts: dict) -> str:
    labels = list(schema_counts.keys())
    values = [schema_counts.get(k, 0) for k in labels]
    fig, ax = plt.subplots(figsize=(6,3.5))
    ax.bar(labels, values)
    ax.set_title("Schema Status Counts")
    ax.set_ylabel("Count")
    for i,v in enumerate(values):
        ax.text(i, v+0.05, str(v), ha='center', va='bottom')
    fig.tight_layout()
    return fig_to_data_uri(fig)

def make_radar_chart_datauri(metrics: dict) -> str:
    labels = list(metrics.keys()) or ["Structured", "Unstructured", "Optimization", "Overall"]
    values = [metrics.get(k, 0) if metrics.get(k) is not None else 0 for k in labels]
    N = len(labels)
    angles = np.linspace(0, 2*np.pi, N, endpoint=False).tolist()
    values = values + values[:1]
    angles = np.concatenate((angles, [angles[0]])) if hasattr(np, 'concatenate') else angles + angles[:1]
    fig = plt.figure(figsize=(5,5))
    ax = fig.add_subplot(111, polar=True)
    ax.plot(angles, values, marker='o')
    ax.fill(angles, values, alpha=0.25)
    ax.set_thetagrids(np.degrees(np.array(angles[:-1])), labels)
    ax.set_ylim(0,100)
    ax.set_title("AEO Readiness Radar", y=1.08)
    fig.tight_layout()
    return fig_to_data_uri(fig)

def make_gauge_datauri(value, title="Overall AEO Readiness"):
    fig, ax = plt.subplots(figsize=(6,3))
    ax.axis('off')
    theta = np.linspace(0, np.pi, 100)
    ax.plot(np.cos(theta), np.sin(theta), linewidth=4)
    val = (value if value is not None else 0)
    ang = math.pi * (1 - (val/100 if isinstance(val, (int,float)) else 0))
    ax.arrow(0,0, math.cos(ang)*0.7, math.sin(ang)*0.7, width=0.02)
    ax.text(0, -0.15, f"{val}%", ha='center', fontsize=14, fontweight='bold')
    ax.set_title(title)
    fig.tight_layout()
    return fig_to_data_uri(fig)

# --------------------
# HTML generator (inlines images and CSS)
# --------------------
def generate_html_report(data: dict, summary: dict, out_dir: Path, customer_name: str, css_path: Path | None = None) -> Path:
    client_name = customer_name
    slug = slugify(client_name)
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    # create in-memory images as data URIs
    bar_uri = make_bar_chart_datauri(summary.get('schema_counts', {}))
    metrics_for_radar = {
        "Structured": summary.get('structuredCoverage') or 0,
        "Unstructured": summary.get('unstructuredCoverage') or 0,
        "Optimization": summary.get('optimizationOpportunities') or 0,
        "Overall": summary.get('overallAEOReadiness') or 0,
    }
    radar_uri = make_radar_chart_datauri(metrics_for_radar)
    gauge_uri = make_gauge_datauri(summary.get('overallAEOReadiness') or 0)

    # inline CSS (if css_path exists, use it; else fallback)
    if css_path and Path(css_path).exists():
        css_content = Path(css_path).read_text(encoding='utf-8')
        css_block = f"<style>\n{css_content}\n</style>"
    else:
        css_block = """
        <style>
        body{font-family:Arial,Helvetica,sans-serif;margin:20px;color:#111}
        .container{max-width:960px;margin:0 auto}
        .top-metrics{display:flex;gap:12px;flex-wrap:wrap}
        .metric{background:#f7f7f7;padding:10px;border-radius:6px;flex:1;min-width:150px;text-align:center}
        .card{background:#fff;border:1px solid #e4e4e4;padding:12px;margin-top:12px;border-radius:6px}
        table{width:100%;border-collapse:collapse}
        th,td{padding:6px;border:1px solid #ddd;text-align:left}
        </style>
        """

    # Build HTML (images embedded as data URIs)
    html = f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
    <title>AEO Dashboard - {client_name}</title>{css_block}</head><body>
    <header><h1>AEO Dashboard</h1><p>Client: {client_name} — Generated: {datetime.utcnow().isoformat()} UTC</p></header>
    <div class="container">
      <div class="top-metrics">
        <div class="metric"><h3>Structured Coverage</h3><span>{summary.get('structuredCoverage') or 'N/A'}%</span></div>
        <div class="metric"><h3>Unstructured Coverage</h3><span>{summary.get('unstructuredCoverage') or 'N/A'}%</span></div>
        <div class="metric"><h3>Optimization Opportunities</h3><span>{summary.get('optimizationOpportunities') or 'N/A'}%</span></div>
        <div class="metric"><h3>Overall Readiness</h3><span>{summary.get('overallAEOReadiness') or 'N/A'}%</span></div>
      </div>
      <div class="card">
        <h2>Executive Summary (surface → deeper → root causes)</h2>
        <p class="summary"><strong>Surface:</strong> Overall AEO Readiness is <strong>{summary.get('overallAEOReadiness') or 'N/A'}%</strong>.</p>
        <p class="summary"><strong>Deeper:</strong> {summary['total_schemas']} schema objects audited; {summary['schema_counts'].get('valid',0)} valid, {summary['schema_counts'].get('incorrect',0)} incorrect, {summary['schema_counts'].get('missing',0)} missing.</p>
        <p class="summary"><strong>Root causes:</strong> e.g. missing OfferCatalog, misplaced FAQ, and weak image alt text reduce rich-result eligibility.</p>
      </div>
      <div class="card"><h2>Visuals</h2>
        <p>Schema status counts:</p><img src="{bar_uri}" alt="Schema bar chart">
        <p>Readiness radar:</p><img src="{radar_uri}" alt="Readiness radar">
        <p>Overall readiness gauge:</p><img src="{gauge_uri}" alt="Readiness gauge">
      </div>
      <div class="card"><h2>Counts & Key Numbers</h2>
        <table><tr><th>Metric</th><th>Value</th></tr>
          <tr><td>Total schema objects audited</td><td>{summary['total_schemas']}</td></tr>
          <tr><td>Valid schemas</td><td>{summary['schema_counts'].get('valid',0)}</td></tr>
          <tr><td>Incorrect schemas</td><td>{summary['schema_counts'].get('incorrect',0)}</td></tr>
          <tr><td>Missing schemas</td><td>{summary['schema_counts'].get('missing',0)}</td></tr>
          <tr><td>Total unstructured blocks</td><td>{summary['total_unstructured']}</td></tr>
          <tr><td>Optimization suggestions</td><td>{summary['optimization_count']}</td></tr>
        </table>
      </div>
      <div class="card"><h2>Business Impact (root causes → impact)</h2>
        <ul>
          <li>Missing OfferCatalog → reduced visibility for individual services. (Est. reach loss: 20–30%)</li>
          <li>FAQ schema on wrong page → lower CTR from FAQ snippets. (Est. CTR loss: 10–15%)</li>
          <li>Poor image alt text → lower image search traffic. (Est. loss: 5–8%)</li>
        </ul>
      </div>
      <div class="card"><h2>Raw Findings</h2><table><tr><th>Type</th><th>Summary</th><th>Status</th><th>Recommendation</th></tr>
    """
    for s in data.get("structuredContent", []):
        typ = s.get("type","-")
        summ = (s.get("textOrSummary") or "").replace("<","&lt;").replace(">","&gt;")
        status = s.get("status","-")
        rec = (s.get("recommendedChanges") or "").replace("<","&lt;").replace(">","&gt;")
        html += f"<tr><td>{typ}</td><td>{summ}</td><td>{status}</td><td>{rec}</td></tr>\n"
    html += "</table></div></div></body></html>"

    out_html = out_dir / f"{slug}_aeo_dashboard.html"
    out_html.write_text(html, encoding='utf-8')
    return out_html

# --------------------
# Conversion wrapper
# --------------------
def convert_saved_json_to_html(json_path: Path, customer_name: str, css_path: Path | None = None):
    data = robust_load_json_v2(json_path)

    # ✅ handle case where JSON is a list
    if isinstance(data, list) and len(data) > 0:
        data = data[0]

    summary = summarize_report(data)
    out_dir = json_path.parent
    out_html = generate_html_report(data, summary, out_dir=out_dir, customer_name=customer_name, css_path=css_path)
    return out_html


# --------------------
# Main: save stdin JSON and convert
# --------------------
def main(customer_name: str, css_path: str | None = None):
    # folder same as seo_audit_extd.py
    date_str = datetime.now().strftime("%Y-%m-%d")
    log_dir = Path(f"./output/logs/{date_str}/{customer_name.capitalize()}")
    output_dir = log_dir / "aeo"
    output_dir.mkdir(parents=True, exist_ok=True)

    # filename
    file_path = output_dir / f"{customer_name.capitalize()}_AEO_PageAudit.json"

    # read stdin fully
    input_data = sys.stdin.read()
    if not input_data or not input_data.strip():
        print(" No input received on stdin. Provide JSON via stdin (e.g. cat file.json | python AEO_Prompt_Report.py clientname)")
        sys.exit(2)

    # save JSON (overwrite behavior - 'w' mode)
    file_path.write_text(input_data, encoding='utf-8')
    #print(f" Saved PageAudit JSON to {file_path}")

    # convert and save the HTML (inline images & css)
    try:
        css_path_obj = Path(css_path) if css_path else None
        out_html = convert_saved_json_to_html(file_path, customer_name, css_path=css_path_obj)
        #print(f" Generated HTML dashboard at {out_html}")
        html_content = out_html.read_text(encoding='utf-8')
        print(html_content)
    except Exception as e:
        print(f" Conversion failed: {e}")
        raise

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Save AEO JSON (from stdin) and convert to self-contained HTML dashboard.")
    parser.add_argument("customer_name", type=str, help="Customer name (used for file/folder names).")
    parser.add_argument("--css", default="/home/cygwin/GEO/pycode/report_style.css",
                        help="Optional path to report_style.css to embed in the HTML. Defaults to /home/cygwin/GEO/pycode/report_style.css")
    args = parser.parse_args()
    main(args.customer_name, css_path=args.css)
