import { InsightsResult } from './insights';

export function renderCombinedHtml(params: { customerName: string; url?: string; sections: string[]; insights: InsightsResult; }): string {
  const { customerName, url, sections, insights } = params;
  const labels = Object.keys(insights.metrics.statusBuckets);
  const values = labels.map(k => insights.metrics.statusBuckets[k]);

  return `<!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8" />
    <title>AEO Combined Report - ${customerName}</title>
    <style>
      body{font-family:Arial,Helvetica,sans-serif;margin:20px;color:#111;background:#fafafa}
      header{border-bottom:2px solid #0a5bd3;padding-bottom:10px;margin-bottom:20px}
      .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px}
      .card{background:#fff;border:1px solid #e4e4e4;padding:12px;border-radius:8px;box-shadow:0 1px 2px rgba(0,0,0,0.04)}
      table{width:100%;border-collapse:collapse}
      th,td{border:1px solid #eaeaea;padding:6px;text-align:left}
      th{background:#f5f5f5}
      pre{background:#f8f8f8;padding:10px;border-radius:6px;overflow:auto}
    </style>
  </head>
  <body>
    <header>
      <h1>AEO Combined Report</h1>
      <p>Customer: ${customerName}${url ? ' | URL: ' + url : ''} | Generated: ${new Date().toLocaleString()}</p>
    </header>

    <section class="grid">
      <div class="card">
        <h2>Overview</h2>
        <ul>
          <li>Total pages: ${insights.metrics.totalPages}</li>
          <li>OK pages: ${insights.metrics.okPages}</li>
          <li>Error pages: ${insights.metrics.errorPages}</li>
          <li>Avg response: ${insights.metrics.avgResponseMs} ms</li>
          <li>Avg word count: ${insights.metrics.avgWordCount}</li>
          <li>Missing titles: ${insights.metrics.missingTitles}</li>
          <li>Missing meta: ${insights.metrics.missingMeta}</li>
        </ul>
      </div>
      <div class="card">
        <h2>Status Codes</h2>
        <canvas id="statusChart" height="180"></canvas>
      </div>
      <div class="card">
        <h2>Top Insights</h2>
        <ul>
          ${insights.insights.map(i => `<li><strong>${i.title}</strong> (${i.severity}) – ${i.description}</li>`).join('') || '<li>No major issues detected</li>'}
        </ul>
      </div>
    </section>

    ${sections.join('\n')}

    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <script>
      (function(){
        const ctx = document.getElementById('statusChart');
        if (!ctx) return;
        new Chart(ctx, {
          type: 'bar',
          data: {
            labels: ${JSON.stringify(labels)},
            datasets: [{ label: 'Pages', data: ${JSON.stringify(values)}, backgroundColor: '#0a5bd3' }]
          },
          options: { scales: { y: { beginAtZero: true } } }
        });
      })();
    </script>
  </body>
  </html>`;
}
