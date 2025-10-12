#!/usr/bin/env python3
import sys
import json
import re
import html

def parse_llm_output(raw_output: str):
    """
    Parse messy LLM output (possibly double-encoded JSON, with or without ```json wrappers).
    """
    raw_output = raw_output.strip()

    # Step 1: Remove code fences
    cleaned = re.sub(r"^```[a-zA-Z]*|```$", "", raw_output, flags=re.MULTILINE).strip()

    # Step 2: If input is quoted JSON (string inside string), try to decode once
    # Example: "{\"auditReport\": {...}}" or "{'auditReport': {...}}"
    try:
        temp = json.loads(cleaned)
        # If temp is a string (means one extra encoding level), decode again
        if isinstance(temp, str):
            cleaned = temp
    except Exception:
        # not valid JSON at first level — fall through
        pass

    # Step 3: Extract actual JSON block
    match = re.search(r'\{[\s\S]*\}', cleaned)
    if not match:
        raise ValueError("No JSON object found in LLM output.")
    json_str = match.group(0)

    # Step 4: Parse final JSON
    try:
        data = json.loads(json_str)
    except json.JSONDecodeError:
        # Sometimes quotes are single; fix them
        fixed = json_str.replace("'", '"')
        data = json.loads(fixed)

    return data


def build_sections(report_dict):
    """
    Extract and format sections (missing, outdated, etc.) from parsed JSON.
    """
    report = report_dict.get("auditReport", {})
    def format_items(section):
        items = report.get(section, [])
        formatted = []
        for item in items:
            if isinstance(item, dict):
                key = item.get("element") or item.get("improvement") or item.get("gain") or "Item"
                desc = item.get("description") or ""
                formatted.append(f"<b>{html.escape(key)}</b>: {html.escape(desc)}")
            elif isinstance(item, str):
                formatted.append(html.escape(item))
        return formatted

    return {
        "missing": format_items("missingElements"),
        "outdated": format_items("outdatedElements"),
        "enhancements": format_items("enhancements"),
        "gains": format_items("visibilityGains"),
        "recommendations": format_items("finalRecommendations"),
    }

def compute_metrics(sections):
    """
    Derive quantitative metrics from section lengths.
    """
    missing = len(sections["missing"])
    outdated = len(sections["outdated"])
    enhancements = len(sections["enhancements"])
    gains = len(sections["gains"])
    score = max(100 - (missing * 5 + outdated * 3), 0)

    return {
        "health_score": score,
        "missing_count": missing,
        "outdated_count": outdated,
        "enhancements_count": enhancements,
        "potential_gain": min(100, gains * 10)
    }

def generate_html(client_name, data):
    """
    Generate final HTML report string.
    """
    schema = data.get("optimizedSchema", {})
    sections = build_sections(data)
    metrics = compute_metrics(sections)

    css_style = """
    body {font-family: Arial, sans-serif; background:#fafafa; margin:0; padding:0; color:#222;}
    header {background:#004d99; color:#fff; padding:20px 40px;}
    h1 {margin:0; font-size:24px;}
    .container {padding:20px 40px;}
    .metric-grid {display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:15px; margin-bottom:30px;}
    .metric {background:#fff; border-radius:10px; box-shadow:0 2px 4px rgba(0,0,0,0.1); padding:15px; text-align:center;}
    .metric h3 {margin:0; font-size:16px; color:#444;}
    .metric span {display:block; font-size:22px; margin-top:5px; color:#0073e6; font-weight:bold;}
    section.card {background:#fff; border-radius:12px; padding:20px; margin-bottom:20px; box-shadow:0 2px 6px rgba(0,0,0,0.08);}
    h2 {color:#004d99; font-size:18px; border-bottom:1px solid #eee; padding-bottom:8px;}
    ul, ol {margin-left:20px;}
    pre {background:#f2f2f2; padding:10px; border-radius:8px; overflow-x:auto;}
    """

    def render_list(items):
        return "<p>No issues found.</p>" if not items else "".join(f"<li>{i}</li>" for i in items)

    schema_json = html.escape(json.dumps(schema, indent=2))

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{html.escape(client_name)} Schema Audit Report</title>
    <style>{css_style}</style>
</head>
<body>
    <header>
        <h1>{html.escape(client_name)} Schema Audit Report</h1>
        <p>Automated Schema & Visibility Review</p>
    </header>

    <div class="container">
        <div class="metric-grid">
            <div class="metric"><h3>Health Score</h3><span>{metrics['health_score']}/100</span></div>
            <div class="metric"><h3>Missing</h3><span>{metrics['missing_count']}</span></div>
            <div class="metric"><h3>Outdated</h3><span>{metrics['outdated_count']}</span></div>
            <div class="metric"><h3>Enhancements</h3><span>{metrics['enhancements_count']}</span></div>
            <div class="metric"><h3>Potential Gain</h3><span>{metrics['potential_gain']}%</span></div>
        </div>

        <section class="card"><h2>Missing Elements</h2><ul>{render_list(sections['missing'])}</ul></section>
        <section class="card"><h2>Outdated Elements</h2><ul>{render_list(sections['outdated'])}</ul></section>
        <section class="card"><h2>Enhancements</h2><ul>{render_list(sections['enhancements'])}</ul></section>
        <section class="card"><h2>Visibility Gains</h2><ul>{render_list(sections['gains'])}</ul></section>
        <section class="card"><h2>Final Recommendations</h2><ol>{render_list(sections['recommendations'])}</ol></section>

        <section class="card">
            <h2>Optimized Schema JSON</h2>
            <details><summary>View Schema</summary><pre>{schema_json}</pre></details>
        </section>
    </div>
</body>
</html>"""
    return html_content


if __name__ == "__main__":
    # Client name comes from CLI argument
    if len(sys.argv) < 2:
        print("Usage: python Schema_Prompt_Report.py <client_name>", file=sys.stderr)
        sys.exit(1)

    client_name = sys.argv[1]

    # Read entire stdin input
    raw_input = sys.stdin.read()

    try:
        data = parse_llm_output(raw_input)
        html_output = generate_html(client_name, data)
        # Print HTML to stdout
        print(html_output)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
