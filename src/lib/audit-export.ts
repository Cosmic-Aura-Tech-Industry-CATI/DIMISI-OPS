import { auditCategoryMeta, formatAuditTime, type AuditEntry } from "@/lib/audit-log";

const COLUMNS = [
  "Timestamp",
  "Admin",
  "Admin ID",
  "Action Type",
  "Action",
  "Target",
  "Target ID",
  "Details",
  "Status",
  "Device",
  "Browser",
  "IP Address",
];

function row(l: AuditEntry): string[] {
  return [
    formatAuditTime(l.timestamp),
    l.actorName,
    l.actorId,
    auditCategoryMeta[l.category].label,
    l.action,
    l.target,
    l.targetId ?? "",
    l.details,
    l.status,
    l.device,
    l.browser,
    l.ip,
  ];
}

function download(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string);
}

function tableHtml(logs: AuditEntry[]) {
  return `<table border="1" cellspacing="0" cellpadding="6">
  <thead><tr>${COLUMNS.map((c) => `<th>${c}</th>`).join("")}</tr></thead>
  <tbody>${logs
    .map((l) => `<tr>${row(l).map((v) => `<td>${escapeHtml(String(v))}</td>`).join("")}</tr>`)
    .join("")}</tbody></table>`;
}

/** Export the currently filtered audit log set. */
export function exportAuditLogs(logs: AuditEntry[], format: "csv" | "excel" | "pdf") {
  const stamp = new Date().toISOString().slice(0, 10);

  if (format === "csv") {
    const csv = [COLUMNS, ...logs.map(row)]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    download(csv, `audit-logs-${stamp}.csv`, "text/csv;charset=utf-8");
    return;
  }

  if (format === "excel") {
    const html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body>${tableHtml(logs)}</body></html>`;
    download(html, `audit-logs-${stamp}.xls`, "application/vnd.ms-excel");
    return;
  }

  // PDF — open a print-ready document and let the browser save as PDF.
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(`<html><head><title>Audit Logs — ${stamp}</title>
    <style>
      body{font-family:Inter,system-ui,sans-serif;padding:24px;color:#111}
      h1{font-size:18px;margin:0 0 4px}
      p{font-size:12px;color:#555;margin:0 0 16px}
      table{width:100%;border-collapse:collapse;font-size:10px}
      th,td{border:1px solid #ddd;padding:5px;text-align:left;vertical-align:top}
      th{background:#f4f4f4}
    </style></head><body>
    <h1>Audit Logs</h1><p>${logs.length} entries · exported ${stamp}</p>
    ${tableHtml(logs)}
    <script>window.onload=function(){window.print()}<\/script>
    </body></html>`);
  win.document.close();
}
