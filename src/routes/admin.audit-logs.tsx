import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ScrollText, Search, Download, ChevronLeft, ChevronRight, FileText, FileSpreadsheet, FileType } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RecordCard } from "@/components/record-card";
import { EmptyState } from "@/components/empty-state";
import { cn } from "@/lib/utils";
import {
  auditCategories,
  auditCategoryMeta,
  auditStatusMeta,
  formatAuditTime,
  useAuditLogs,
  type AuditCategory,
  type AuditEntry,
  type AuditStatus,
} from "@/lib/audit-log";
import { exportAuditLogs } from "@/lib/audit-export";

export const Route = createFileRoute("/admin/audit-logs")({
  head: () => ({
    meta: [
      { title: "Audit Logs — Poll" },
      { name: "description", content: "Monitor and review every important administrative action across the organization." },
      { property: "og:title", content: "Audit Logs — Poll" },
      { property: "og:description", content: "Monitor and review every important administrative action across the organization." },
    ],
  }),
  component: AuditLogsPage,
});

type DateRange = "all" | "today" | "7d" | "30d" | "custom";

function CategoryBadge({ category }: { category: AuditCategory }) {
  const meta = auditCategoryMeta[category];
  return (
    <span className={cn("inline-flex items-center rounded-sm px-2 py-0.5 text-[11px] font-medium", meta.className)}>
      {meta.label}
    </span>
  );
}

function StatusBadge({ status }: { status: AuditStatus }) {
  const meta = auditStatusMeta[status];
  return (
    <span className={cn("inline-flex items-center rounded-sm px-2 py-0.5 text-[11px] font-medium", meta.className)}>
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
      {meta.label}
    </span>
  );
}

function AuditLogsPage() {
  const logs = useAuditLogs();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | AuditCategory>("all");
  const [status, setStatus] = useState<"all" | AuditStatus>("all");
  const [range, setRange] = useState<DateRange>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [perPage, setPerPage] = useState(25);
  const [page, setPage] = useState(1);
  const [active, setActive] = useState<AuditEntry | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const now = Date.now();
    return logs.filter((l) => {
      if (category !== "all" && l.category !== category) return false;
      if (status !== "all" && l.status !== status) return false;

      const t = new Date(l.timestamp).getTime();
      if (range === "today" && new Date(l.timestamp).toDateString() !== new Date().toDateString()) return false;
      if (range === "7d" && t < now - 7 * 86400_000) return false;
      if (range === "30d" && t < now - 30 * 86400_000) return false;
      if (range === "custom") {
        if (from && t < new Date(from).getTime()) return false;
        if (to && t > new Date(to).getTime() + 86399_000) return false;
      }

      if (!q) return true;
      return [l.actorName, l.actorId, l.action, l.target, l.targetId, l.details, auditCategoryMeta[l.category].label]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [logs, query, category, status, range, from, to]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const current = Math.min(page, totalPages);
  const rows = filtered.slice((current - 1) * perPage, current * perPage);

  const reset = () => setPage(1);

  return (
    <>
      <PageHeader
        title="Audit Logs"
        subtitle="Monitor and review every important administrative action across the organization."
        icon={ScrollText}
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" className="min-h-11">
                <Download className="mr-2 h-4 w-4" /> Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => { exportAuditLogs(filtered, "csv"); toast.success("Exported as CSV"); }}>
                <FileText className="mr-2 h-4 w-4" /> CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { exportAuditLogs(filtered, "excel"); toast.success("Exported as Excel"); }}>
                <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { exportAuditLogs(filtered, "pdf"); toast.success("Preparing PDF…"); }}>
                <FileType className="mr-2 h-4 w-4" /> PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      {/* Filters */}
      <section className="rounded-md border border-border/60 bg-card/40 p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => { setQuery(e.target.value); reset(); }}
              placeholder="Search admin, ID, task, project, notice…"
              className="pl-9"
            />
          </div>

          <Select value={category} onValueChange={(v) => { setCategory(v as typeof category); reset(); }}>
            <SelectTrigger><SelectValue placeholder="Action type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All action types</SelectItem>
              {auditCategories.map((c) => (
                <SelectItem key={c} value={c}>{auditCategoryMeta[c].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={range} onValueChange={(v) => { setRange(v as DateRange); reset(); }}>
            <SelectTrigger><SelectValue placeholder="Date range" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="custom">Custom range</SelectItem>
            </SelectContent>
          </Select>

          <Select value={status} onValueChange={(v) => { setStatus(v as typeof status); reset(); }}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {range === "custom" && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2 md:max-w-md">
            <div className="space-y-1.5">
              <Label htmlFor="from" className="text-xs">From</Label>
              <Input id="from" type="date" value={from} onChange={(e) => { setFrom(e.target.value); reset(); }} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="to" className="text-xs">To</Label>
              <Input id="to" type="date" value={to} onChange={(e) => { setTo(e.target.value); reset(); }} />
            </div>
          </div>
        )}
      </section>

      {filtered.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="No audit entries found"
          description="Adjust your search, action type, date range or status filters."
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-md border border-border/60 bg-card/40 md:block">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Admin ID</TableHead>
                  <TableHead>Action Type</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead className="hidden xl:table-cell">Details</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((l) => (
                  <TableRow
                    key={l.id}
                    tabIndex={0}
                    onClick={() => setActive(l)}
                    onKeyDown={(e) => e.key === "Enter" && setActive(l)}
                    className="cursor-pointer"
                  >
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{formatAuditTime(l.timestamp)}</TableCell>
                    <TableCell className="font-medium">{l.actorName}</TableCell>
                    <TableCell className="font-mono text-xs tracking-wider text-muted-foreground">{l.actorId}</TableCell>
                    <TableCell><CategoryBadge category={l.category} /></TableCell>
                    <TableCell className="whitespace-nowrap text-sm">{l.action}</TableCell>
                    <TableCell className="max-w-[180px] truncate text-sm">
                      {l.target}
                      {l.targetId && <span className="ml-1.5 font-mono text-[10px] text-muted-foreground">{l.targetId}</span>}
                    </TableCell>
                    <TableCell className="hidden max-w-[280px] truncate text-xs text-muted-foreground xl:table-cell">{l.details}</TableCell>
                    <TableCell><StatusBadge status={l.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile / tablet cards */}
          <div className="grid gap-3 md:hidden">
            {rows.map((l, i) => (
              <button key={l.id} type="button" onClick={() => setActive(l)} className="text-left">
                <RecordCard
                  index={i}
                  title={l.action}
                  subtitle={`${l.target}${l.targetId ? ` · ${l.targetId}` : ""}`}
                  badges={<><CategoryBadge category={l.category} /><StatusBadge status={l.status} /></>}
                  fields={[
                    { label: "Admin", value: l.actorName },
                    { label: "Admin ID", value: l.actorId },
                    { label: "Timestamp", value: formatAuditTime(l.timestamp) },
                  ]}
                />
              </button>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Rows per page</span>
              <Select value={String(perPage)} onValueChange={(v) => { setPerPage(Number(v)); reset(); }}>
                <SelectTrigger className="h-9 w-[84px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <span className="ml-2">
                {(current - 1) * perPage + 1}–{Math.min(current * perPage, filtered.length)} of {filtered.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" disabled={current <= 1} onClick={() => setPage(current - 1)}>
                <ChevronLeft className="mr-1 h-4 w-4" /> Previous
              </Button>
              <span className="text-xs text-muted-foreground">Page {current} of {totalPages}</span>
              <Button variant="ghost" size="sm" disabled={current >= totalPages} onClick={() => setPage(current + 1)}>
                Next <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Detail drawer */}
      <Sheet open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          {active && (
            <>
              <SheetHeader>
                <SheetTitle>{active.action}</SheetTitle>
                <SheetDescription>{formatAuditTime(active.timestamp)}</SheetDescription>
              </SheetHeader>

              <div className="mt-4 flex flex-wrap gap-2">
                <CategoryBadge category={active.category} />
                <StatusBadge status={active.status} />
              </div>

              <dl className="mt-6 space-y-4 text-sm">
                {[
                  ["Admin Name", active.actorName],
                  ["Admin ID", active.actorId],
                  ["Action", active.action],
                  ["Target", `${active.target}${active.targetId ? ` (${active.targetId})` : ""}`],
                  ["Description", active.details || "—"],
                  ...(active.previousValue ? [["Previous Value", active.previousValue]] : []),
                  ...(active.updatedValue ? [["Updated Value", active.updatedValue]] : []),
                  ["Device", active.device],
                  ["Browser", active.browser],
                  ["IP Address", active.ip],
                ].map(([label, value]) => (
                  <div key={label} className="border-b border-border/50 pb-3 last:border-0">
                    <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</dt>
                    <dd className="mt-1 break-words font-medium">{value}</dd>
                  </div>
                ))}
              </dl>

              <p className="mt-6 text-xs text-muted-foreground">
                Audit entries are read-only and cannot be edited or removed.
              </p>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
