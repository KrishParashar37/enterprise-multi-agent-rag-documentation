/**
 * generate-report.ts
 * Generates a beautiful green-themed 2-page HTML report for a document
 * and opens it in a new window to trigger browser print/save as PDF.
 */

export type ReportDoc = {
  name: string;
  originalName?: string;
  type: string;
  department?: string;
  category?: string;
  status: string;
  version?: string;
  accessLevel?: string;
  fileSize: number;
  pageCount?: number;
  chunkCount?: number;
  tags?: string[];
  description?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
};

function formatBytesReport(bytes: number): string {
  if (!bytes) return "0 B";
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(2)} MB`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(1)} KB`;
  return `${bytes} B`;
}

function formatDateReport(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function getStatusColor(status: string): string {
  switch (status?.toUpperCase()) {
    case "INDEXED": return "#10b981";
    case "PROCESSING": return "#f59e0b";
    case "FAILED": return "#ef4444";
    case "UPLOADING": return "#06b6d4";
    default: return "#6b7280";
  }
}

export function generateAndPrintReport(doc: ReportDoc): void {
  const generatedAt = new Date().toLocaleString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  const statusColor = getStatusColor(doc.status);
  const tags = (doc.tags || []).filter(Boolean);

  // Chunk progress bar fill (visual estimate)
  const chunkFill = Math.min(100, ((doc.chunkCount || 0) / 300) * 100);
  const sizeFillMB = Math.min(100, ((doc.fileSize || 0) / (10 * 1024 * 1024)) * 100);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Document Report — ${doc.name}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #ffffff;
      color: #1a2e1a;
      print-color-adjust: exact;
      -webkit-print-color-adjust: exact;
    }

    /* ── PAGE LAYOUT ── */
    .page {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: 0;
      position: relative;
      background: #fff;
      page-break-after: always;
    }
    .page:last-child { page-break-after: auto; }

    /* ── HEADER BANNER ── */
    .header {
      background: linear-gradient(135deg, #064e3b 0%, #065f46 40%, #047857 70%, #059669 100%);
      padding: 36px 48px 32px;
      position: relative;
      overflow: hidden;
    }
    .header::before {
      content: '';
      position: absolute;
      top: -60px; right: -60px;
      width: 200px; height: 200px;
      border-radius: 50%;
      background: rgba(255,255,255,0.05);
    }
    .header::after {
      content: '';
      position: absolute;
      bottom: -40px; left: 40%;
      width: 300px; height: 300px;
      border-radius: 50%;
      background: rgba(255,255,255,0.03);
    }
    .header-brand {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
    }
    .brand-icon {
      width: 36px; height: 36px;
      background: rgba(255,255,255,0.15);
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      font-size: 18px;
    }
    .brand-text { color: rgba(255,255,255,0.8); font-size: 11px; font-weight: 500; letter-spacing: 2px; text-transform: uppercase; }
    .header-title { color: #fff; font-size: 24px; font-weight: 800; line-height: 1.2; margin-bottom: 6px; }
    .header-subtitle { color: rgba(255,255,255,0.65); font-size: 12px; font-weight: 400; }
    .header-badges {
      display: flex; gap: 8px; margin-top: 18px; flex-wrap: wrap;
    }
    .badge {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }
    .badge-type { background: rgba(255,255,255,0.15); color: #fff; }
    .badge-status { background: ${statusColor}; color: #fff; }
    .badge-dept { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.85); border: 1px solid rgba(255,255,255,0.2); }

    /* ── BODY ── */
    .body { padding: 36px 48px; }

    /* ── SECTION TITLE ── */
    .section-title {
      font-size: 10px;
      font-weight: 700;
      color: #059669;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 14px;
      padding-bottom: 6px;
      border-bottom: 2px solid #d1fae5;
      display: flex; align-items: center; gap: 6px;
    }
    .section-title::before {
      content: '';
      display: inline-block;
      width: 3px; height: 14px;
      background: #059669;
      border-radius: 2px;
    }

    /* ── METADATA GRID ── */
    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 32px;
    }
    .meta-card {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 10px;
      padding: 14px 16px;
    }
    .meta-label { font-size: 9px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; margin-bottom: 4px; }
    .meta-value { font-size: 14px; font-weight: 700; color: #064e3b; }
    .meta-value.large { font-size: 22px; color: #059669; }

    /* ── DETAIL TABLE ── */
    .detail-table { width: 100%; border-collapse: collapse; margin-bottom: 28px; }
    .detail-table tr { border-bottom: 1px solid #f0fdf4; }
    .detail-table tr:last-child { border-bottom: none; }
    .detail-table td { padding: 9px 0; font-size: 12px; }
    .detail-table td:first-child { color: #6b7280; font-weight: 500; width: 140px; }
    .detail-table td:last-child { color: #064e3b; font-weight: 600; }

    /* ── PROGRESS BAR ── */
    .progress-section { margin-bottom: 28px; }
    .progress-item { margin-bottom: 14px; }
    .progress-header { display: flex; justify-content: space-between; margin-bottom: 5px; }
    .progress-label { font-size: 11px; color: #374151; font-weight: 500; }
    .progress-value { font-size: 11px; color: #059669; font-weight: 700; }
    .progress-track {
      height: 8px; background: #d1fae5; border-radius: 99px; overflow: hidden;
    }
    .progress-fill {
      height: 100%; border-radius: 99px;
      background: linear-gradient(90deg, #059669, #10b981);
      transition: width 0.3s;
    }

    /* ── TAGS ── */
    .tags-wrap { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 24px; }
    .tag-pill {
      padding: 4px 12px;
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      border-radius: 20px;
      font-size: 10px;
      font-weight: 600;
      color: #065f46;
    }

    /* ── DESCRIPTION BOX ── */
    .desc-box {
      background: #f0fdf4;
      border-left: 4px solid #059669;
      border-radius: 0 10px 10px 0;
      padding: 16px 20px;
      margin-bottom: 28px;
    }
    .desc-box p { font-size: 12px; color: #374151; line-height: 1.7; }

    /* ── ANALYTICS BOXES ── */
    .analytics-row { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; margin-bottom: 28px; }
    .analytics-card {
      background: linear-gradient(135deg, #064e3b, #047857);
      border-radius: 12px;
      padding: 16px;
      text-align: center;
      color: #fff;
    }
    .analytics-num { font-size: 28px; font-weight: 800; }
    .analytics-label { font-size: 9px; opacity: 0.75; margin-top: 2px; text-transform: uppercase; letter-spacing: 1px; }

    /* ── FOOTER ── */
    .footer {
      background: #f0fdf4;
      border-top: 2px solid #bbf7d0;
      padding: 16px 48px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .footer-left { font-size: 9px; color: #6b7280; }
    .footer-brand { font-size: 10px; color: #059669; font-weight: 700; }
    .footer-right { font-size: 9px; color: #9ca3af; }

    /* ── PAGE 2 HEADER ── */
    .page2-header {
      background: linear-gradient(90deg, #064e3b, #047857);
      padding: 18px 48px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .page2-header-title { color: #fff; font-size: 14px; font-weight: 700; }
    .page2-header-sub { color: rgba(255,255,255,0.6); font-size: 10px; }

    /* ── DIVIDER ── */
    .divider { border: none; border-top: 1px solid #d1fae5; margin: 20px 0; }

    /* ── STATUS INDICATOR ── */
    .status-row {
      display: flex; align-items: center; gap: 10px; 
      padding: 12px 16px;
      background: #ecfdf5;
      border-radius: 10px;
      border: 1px solid #a7f3d0;
      margin-bottom: 20px;
    }
    .status-dot { width: 10px; height: 10px; border-radius: 50%; background: ${statusColor}; }
    .status-text { font-size: 12px; font-weight: 600; color: #064e3b; }
    .status-sub { font-size: 10px; color: #6b7280; margin-left: auto; }

    /* ── PRINT ── */
    @media print {
      body { margin: 0; }
      .page { margin: 0; width: 100%; page-break-after: always; }
      .no-print { display: none !important; }
    }

    /* ── PRINT BTN (screen only) ── */
    .print-btn-bar {
      position: fixed; top: 0; left: 0; right: 0;
      background: #064e3b;
      padding: 10px 20px;
      display: flex; align-items: center; justify-content: space-between;
      z-index: 999;
    }
    .print-btn {
      background: #10b981; color: #fff;
      border: none; border-radius: 8px;
      padding: 8px 20px; font-size: 13px; font-weight: 600;
      cursor: pointer; font-family: inherit;
    }
    .print-btn:hover { background: #059669; }
    .print-spacer { height: 52px; }
    @media print { .print-btn-bar, .print-spacer { display: none !important; } }
  </style>
</head>
<body>

<!-- Print Bar -->
<div class="print-btn-bar no-print">
  <span style="color:rgba(255,255,255,0.8); font-size:12px;">📄 Document Report Preview</span>
  <button class="print-btn" onclick="window.print()">⬇ Save as PDF / Print</button>
</div>
<div class="print-spacer no-print"></div>

<!-- ═══════════════════ PAGE 1 ═══════════════════ -->
<div class="page">

  <!-- Header -->
  <div class="header">
    <div class="header-brand">
      <div class="brand-icon">🏢</div>
      <span class="brand-text">Enterprise AI Platform · Document Report</span>
    </div>
    <div class="header-title">${doc.name}</div>
    <div class="header-subtitle">${doc.originalName || doc.name}</div>
    <div class="header-badges">
      <span class="badge badge-type">${doc.type}</span>
      <span class="badge badge-status">${doc.status}</span>
      ${doc.department ? `<span class="badge badge-dept">${doc.department}</span>` : ""}
      ${doc.category ? `<span class="badge badge-dept">${doc.category}</span>` : ""}
    </div>
  </div>

  <div class="body">

    <!-- Quick Analytics -->
    <div class="section-title">Overview</div>
    <div class="analytics-row">
      <div class="analytics-card">
        <div class="analytics-num">${doc.pageCount ?? "—"}</div>
        <div class="analytics-label">Pages</div>
      </div>
      <div class="analytics-card">
        <div class="analytics-num">${doc.chunkCount ?? "—"}</div>
        <div class="analytics-label">Vector Chunks</div>
      </div>
      <div class="analytics-card">
        <div class="analytics-num">${formatBytesReport(doc.fileSize)}</div>
        <div class="analytics-label">File Size</div>
      </div>
    </div>

    <!-- Status Row -->
    <div class="status-row">
      <div class="status-dot"></div>
      <span class="status-text">Status: ${doc.status}</span>
      <span class="status-sub">Last updated: ${formatDateReport(doc.updatedAt)}</span>
    </div>

    <!-- Metadata Grid -->
    <div class="section-title">Metadata</div>
    <div class="meta-grid">
      <div class="meta-card">
        <div class="meta-label">Department</div>
        <div class="meta-value">${doc.department || "—"}</div>
      </div>
      <div class="meta-card">
        <div class="meta-label">Category</div>
        <div class="meta-value">${doc.category || "—"}</div>
      </div>
      <div class="meta-card">
        <div class="meta-label">Version</div>
        <div class="meta-value">${doc.version || "1.0"}</div>
      </div>
      <div class="meta-card">
        <div class="meta-label">Access Level</div>
        <div class="meta-value">${doc.accessLevel || "employee"}</div>
      </div>
    </div>

    <!-- Detailed Table -->
    <div class="section-title">Document Details</div>
    <table class="detail-table">
      <tr><td>File Name</td><td>${doc.originalName || doc.name}</td></tr>
      <tr><td>File Type</td><td>${doc.type}</td></tr>
      <tr><td>File Size</td><td>${formatBytesReport(doc.fileSize)}</td></tr>
      <tr><td>Total Pages</td><td>${doc.pageCount ?? "—"}</td></tr>
      <tr><td>Vector Chunks</td><td>${doc.chunkCount ?? "—"}</td></tr>
      <tr><td>Ingestion Status</td><td>${doc.status}</td></tr>
      <tr><td>Access Level</td><td>${doc.accessLevel || "employee"}</td></tr>
      <tr><td>Version</td><td>${doc.version || "1.0"}</td></tr>
      <tr><td>Upload Date</td><td>${formatDateReport(doc.createdAt)}</td></tr>
      <tr><td>Last Modified</td><td>${formatDateReport(doc.updatedAt)}</td></tr>
    </table>

  </div>

  <!-- Footer -->
  <div class="footer">
    <div class="footer-left">Page 1 of 2 · Confidential</div>
    <div class="footer-brand">Enterprise AI Platform</div>
    <div class="footer-right">Generated: ${generatedAt}</div>
  </div>

</div>

<!-- ═══════════════════ PAGE 2 ═══════════════════ -->
<div class="page">

  <!-- Page 2 Header -->
  <div class="page2-header">
    <div>
      <div class="page2-header-title">${doc.name}</div>
      <div class="page2-header-sub">Document Analytics & Details · Page 2</div>
    </div>
    <div style="color:rgba(255,255,255,0.5); font-size:10px;">Enterprise AI Platform</div>
  </div>

  <div class="body">

    <!-- Progress / Stats -->
    <div class="section-title">Storage & Indexing Metrics</div>
    <div class="progress-section">
      <div class="progress-item">
        <div class="progress-header">
          <span class="progress-label">Vector Chunks Indexed</span>
          <span class="progress-value">${doc.chunkCount ?? 0} chunks</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" style="width: ${chunkFill.toFixed(1)}%"></div>
        </div>
      </div>
      <div class="progress-item">
        <div class="progress-header">
          <span class="progress-label">Storage Usage</span>
          <span class="progress-value">${formatBytesReport(doc.fileSize)}</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" style="width: ${sizeFillMB.toFixed(1)}%"></div>
        </div>
      </div>
      <div class="progress-item">
        <div class="progress-header">
          <span class="progress-label">Indexing Completion</span>
          <span class="progress-value">${doc.status === "INDEXED" ? "100%" : doc.status === "PROCESSING" ? "In Progress" : "—"}</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" style="width: ${doc.status === "INDEXED" ? "100" : "45"}%"></div>
        </div>
      </div>
    </div>

    <hr class="divider" />

    <!-- Description -->
    ${doc.description ? `
    <div class="section-title">Description</div>
    <div class="desc-box">
      <p>${doc.description}</p>
    </div>
    ` : ""}

    <!-- Tags -->
    ${tags.length > 0 ? `
    <div class="section-title">Tags & Keywords</div>
    <div class="tags-wrap">
      ${tags.map((t) => `<span class="tag-pill">${t}</span>`).join("")}
    </div>
    <hr class="divider" />
    ` : ""}

    <!-- Summary Table -->
    <div class="section-title">Summary</div>
    <div class="meta-grid">
      <div class="meta-card">
        <div class="meta-label">Report Generated</div>
        <div class="meta-value" style="font-size:11px">${generatedAt}</div>
      </div>
      <div class="meta-card">
        <div class="meta-label">Document ID</div>
        <div class="meta-value" style="font-size:11px; font-family: monospace">${doc.name.replace(/\s+/g,"_").toLowerCase().slice(0,20)}</div>
      </div>
    </div>

    <!-- Disclaimer -->
    <div style="margin-top: 24px; padding: 14px 18px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px;">
      <p style="font-size: 10px; color: #92400e; line-height: 1.6;">
        ⚠️ <strong>Confidential:</strong> This document report contains proprietary enterprise information. 
        Distribution is restricted to authorized personnel only. Generated by Enterprise AI Platform RAG System.
      </p>
    </div>

  </div>

  <!-- Footer -->
  <div class="footer">
    <div class="footer-left">Page 2 of 2 · Confidential</div>
    <div class="footer-brand">Enterprise AI Platform</div>
    <div class="footer-right">Generated: ${generatedAt}</div>
  </div>

</div>

<script>
  // Auto-trigger print after a short delay so fonts load
  // window.addEventListener('load', () => setTimeout(() => window.print(), 800));
</script>
</body>
</html>`;

  const win = window.open("", "_blank", "width=900,height=700");
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}
