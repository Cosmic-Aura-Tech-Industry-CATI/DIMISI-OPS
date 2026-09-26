import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowUpDown,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  FileText,
  FileUp,
  Landmark,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useAccountsQuery,
  useAccountStatsQuery,
  CreateAccountEntryDialog,
  EditAccountEntryDialog,
  UploadEntriesDialog,
  DeleteAccountEntryDialog,
  type AccountEntry,
} from "@/features/accounts";

export const Route = createFileRoute("/admin/accounts")({
  head: () => ({ meta: [{ title: "Accounts & Ledger — Dimisi" }] }),
  component: AccountsPage,
});

type SortKey = "date" | "name" | "credit" | "debit" | "balance";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 8;

function formatCurrency(val: number): string {
  if (val === 0) return "₹0.00";
  return `₹${val.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function SortHeaderButton({
  label,
  active,
  dir,
  onClick,
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 transition-colors hover:text-foreground ${
        active ? "text-primary font-semibold" : "text-muted-foreground"
      }`}
    >
      <span>{label}</span>
      <ArrowUpDown className="h-3 w-3" />
    </button>
  );
}

function AccountsPage() {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "credit" | "debit" | "uploaded" | "manual">(
    "all",
  );
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);

  // Dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<AccountEntry | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<AccountEntry | null>(null);

  const {
    data: entries = [],
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useAccountsQuery({
    query: query || undefined,
    type: typeFilter,
  });

  const { data: stats } = useAccountStatsQuery();

  // Sorting
  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortKey === "date") {
        return (new Date(a.date).getTime() - new Date(b.date).getTime()) * dir;
      }
      if (sortKey === "name") {
        return a.name.localeCompare(b.name) * dir;
      }
      if (sortKey === "credit") {
        return (a.credit - b.credit) * dir;
      }
      if (sortKey === "debit") {
        return (a.debit - b.debit) * dir;
      }
      if (sortKey === "balance") {
        return (a.balance - b.balance) * dir;
      }
      return 0;
    });
  }, [entries, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
    setPage(1);
  };

  // Pagination
  const totalResults = sortedEntries.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedEntries = sortedEntries.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const clearFilters = () => {
    setQuery("");
    setTypeFilter("all");
    setPage(1);
  };

  return (
    <>
      <PageHeader
        title="Accounts & Ledger"
        subtitle="Manage financial vouchers, credit/debit transactions, and imported statements."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="rounded-md"
              onClick={() => void refetch()}
              disabled={isLoading || isRefetching}
              title="Refresh ledger"
            >
              <RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
            </Button>
            <Button
              variant="outline"
              className="rounded-md gap-1.5"
              onClick={() => setUploadOpen(true)}
            >
              <FileUp className="h-4 w-4 text-primary" />
              Upload Entries
            </Button>
            <Button
              className="rounded-md shadow-glow gap-1.5"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Create Entry
            </Button>
          </div>
        }
      />

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Balance Card */}
        <div className="glass flex items-center justify-between rounded-2xl p-5">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Current Balance
            </p>
            <h3 className="font-mono text-2xl font-bold tracking-tight text-foreground">
              {formatCurrency(stats?.totalBalance ?? 0)}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Net running ledger balance
            </p>
          </div>
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
            <Wallet className="h-6 w-6" />
          </div>
        </div>

        {/* Total Credit */}
        <div className="glass flex items-center justify-between rounded-2xl p-5">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-emerald-500">
              Total Inflow (Credit)
            </p>
            <h3 className="font-mono text-2xl font-bold tracking-tight text-emerald-500">
              {formatCurrency(stats?.totalCredit ?? 0)}
            </h3>
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-emerald-500" /> Revenue & Receivables
            </div>
          </div>
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-500/10 text-emerald-500">
            <ArrowDownLeft className="h-6 w-6" />
          </div>
        </div>

        {/* Total Debit */}
        <div className="glass flex items-center justify-between rounded-2xl p-5">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-rose-500">
              Total Outflow (Debit)
            </p>
            <h3 className="font-mono text-2xl font-bold tracking-tight text-rose-500">
              {formatCurrency(stats?.totalDebit ?? 0)}
            </h3>
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <TrendingDown className="h-3 w-3 text-rose-500" /> Expenses & Disbursements
            </div>
          </div>
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-rose-500/10 text-rose-500">
            <ArrowUpRight className="h-6 w-6" />
          </div>
        </div>

        {/* Ledger Entries Breakdown */}
        <div className="glass flex items-center justify-between rounded-2xl p-5">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Total Records
            </p>
            <h3 className="font-display text-2xl font-bold tracking-tight text-foreground">
              {stats?.entryCount ?? 0}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              <span className="text-primary font-medium">{stats?.uploadedCount ?? 0} PDF</span> ·{" "}
              {stats?.manualCount ?? 0} manual
            </p>
          </div>
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
            <Landmark className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="glass flex flex-col gap-3 rounded-2xl p-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search by party name, purpose, amount, or date..."
            className="h-10 rounded-full border-border/60 bg-background/50 pl-10 text-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={typeFilter}
            onValueChange={(val: any) => {
              setTypeFilter(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-10 w-[170px] rounded-full border-border/60">
              <SelectValue placeholder="All entries" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All transactions</SelectItem>
              <SelectItem value="credit">Credit (+) only</SelectItem>
              <SelectItem value="debit">Debit (-) only</SelectItem>
              <SelectItem value="uploaded">Uploaded PDF only</SelectItem>
              <SelectItem value="manual">Manual vouchers</SelectItem>
            </SelectContent>
          </Select>

          {(query || typeFilter !== "all") && (
            <Button
              variant="outline"
              className="h-10 rounded-md text-xs"
              onClick={clearFilters}
            >
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="glass space-y-3 rounded-2xl p-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <h3 className="font-semibold text-destructive">Failed to load accounts ledger</h3>
          <p className="text-sm text-muted-foreground">
            {error?.message || "An unexpected error occurred while loading transactions."}
          </p>
          <Button variant="outline" onClick={() => void refetch()}>
            Retry
          </Button>
        </div>
      ) : totalResults === 0 ? (
        <EmptyState
          icon={FileSpreadsheet}
          title={query || typeFilter !== "all" ? "No matching entries" : "No ledger entries yet"}
          description={
            query || typeFilter !== "all"
              ? "Try adjusting your search criteria or type filter."
              : "Click 'Create Entry' or 'Upload Entries' above to add your first financial transaction."
          }
          action={
            <div className="flex gap-2">
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="mr-1.5 h-4 w-4" /> Create Entry
              </Button>
              <Button variant="outline" onClick={() => setUploadOpen(true)}>
                <FileUp className="mr-1.5 h-4 w-4" /> Upload PDF
              </Button>
            </div>
          }
        />
      ) : (
        /* Ledger Table */
        <div className="glass overflow-hidden rounded-2xl">
          <div className="flex items-center justify-between border-b border-border/60 px-5 py-3 text-xs text-muted-foreground">
            <span>
              Showing {paginatedEntries.length} of {totalResults} entries
            </span>
            <span>
              Page {currentPage} of {totalPages}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap text-left text-sm">
              <thead className="border-b border-border/60 bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">
                    <SortHeaderButton
                      label="Date"
                      active={sortKey === "date"}
                      dir={sortDir}
                      onClick={() => toggleSort("date")}
                    />
                  </th>
                  <th className="px-5 py-3 font-medium">
                    <SortHeaderButton
                      label="Name / Party"
                      active={sortKey === "name"}
                      dir={sortDir}
                      onClick={() => toggleSort("name")}
                    />
                  </th>
                  <th className="px-5 py-3 font-medium text-right">
                    <SortHeaderButton
                      label="Credit (+)"
                      active={sortKey === "credit"}
                      dir={sortDir}
                      onClick={() => toggleSort("credit")}
                    />
                  </th>
                  <th className="px-5 py-3 font-medium text-right">
                    <SortHeaderButton
                      label="Debit (-)"
                      active={sortKey === "debit"}
                      dir={sortDir}
                      onClick={() => toggleSort("debit")}
                    />
                  </th>
                  <th className="px-5 py-3 font-medium text-right">
                    <SortHeaderButton
                      label="Balance"
                      active={sortKey === "balance"}
                      dir={sortDir}
                      onClick={() => toggleSort("balance")}
                    />
                  </th>
                  <th className="px-5 py-3 font-medium">Reason / Purpose</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {paginatedEntries.map((entry) => (
                  <tr
                    key={entry.id}
                    className="transition-colors hover:bg-muted/40"
                  >
                    {/* Date */}
                    <td className="px-5 py-3.5 text-xs text-muted-foreground font-sans">
                      {formatDate(entry.date)}
                    </td>

                    {/* Name / Party */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{entry.name}</span>
                        {entry.isUploaded && (
                          <Badge
                            variant="outline"
                            className="h-5 px-1.5 border-primary/30 bg-primary/10 text-[10px] text-primary"
                            title="Imported from PDF statement"
                          >
                            <FileText className="mr-0.5 h-2.5 w-2.5" /> PDF
                          </Badge>
                        )}
                      </div>
                    </td>

                    {/* Credit (+) */}
                    <td className="px-5 py-3.5 text-right font-mono font-medium text-xs">
                      {entry.credit > 0 ? (
                        <span className="text-emerald-500 font-semibold">
                          +{formatCurrency(entry.credit)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </td>

                    {/* Debit (-) */}
                    <td className="px-5 py-3.5 text-right font-mono font-medium text-xs">
                      {entry.debit > 0 ? (
                        <span className="text-rose-500 font-semibold">
                          -{formatCurrency(entry.debit)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </td>

                    {/* Balance */}
                    <td className="px-5 py-3.5 text-right font-mono font-bold text-xs text-foreground">
                      {formatCurrency(entry.balance)}
                    </td>

                    {/* Reason */}
                    <td
                      className="px-5 py-3.5 max-w-[260px] truncate text-muted-foreground text-xs"
                      title={entry.reason}
                    >
                      {entry.reason}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2.5 text-xs rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                          onClick={() => setEditingEntry(entry)}
                        >
                          <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2.5 text-xs rounded-md text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeletingEntry(entry)}
                        >
                          <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border/60 px-5 py-3 text-xs text-muted-foreground">
              <span>
                Page {currentPage} of {totalPages} ({totalResults} total entries)
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                >
                  Next <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dialogs */}
      <CreateAccountEntryDialog open={createOpen} onOpenChange={setCreateOpen} />

      <EditAccountEntryDialog
        open={Boolean(editingEntry)}
        entry={editingEntry}
        onOpenChange={(open) => {
          if (!open) setEditingEntry(null);
        }}
      />

      <UploadEntriesDialog open={uploadOpen} onOpenChange={setUploadOpen} />

      <DeleteAccountEntryDialog
        open={Boolean(deletingEntry)}
        entry={editingEntry ? null : deletingEntry}
        onOpenChange={(open) => {
          if (!open) setDeletingEntry(null);
        }}
      />
    </>
  );
}
