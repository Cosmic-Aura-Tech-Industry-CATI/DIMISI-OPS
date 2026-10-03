import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowUpDown,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  FileDown,
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
  User,
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
  CreateAccountEntryDialog,
  EditAccountEntryDialog,
  UploadEntriesDialog,
  DeleteAccountEntryDialog,
  ExportAccountDialog,
  formatCurrency,
  formatDate,
  getCreatorDisplay,
  type AccountTransaction,
} from "@/features/accounts";

export const Route = createFileRoute("/admin/accounts")({
  head: () => ({ meta: [{ title: "Accounts & Financial Ledger — Dimisi" }] }),
  component: AccountsPage,
});

type SortKey = "date" | "name" | "credit" | "debit" | "balance";
type SortDir = "asc" | "desc";

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
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [typeFilter, setTypeFilter] = useState<"all" | "credit" | "debit">("all");
  const [sourceFilter, setSourceFilter] = useState<"all" | "uploaded" | "manual">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Dialog states
  const [createOpen, setCreateOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<AccountTransaction | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<AccountTransaction | null>(null);

  // Backend Query
  const isUploadedParam =
    sourceFilter === "uploaded" ? true : sourceFilter === "manual" ? false : undefined;

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useAccountsQuery({
    page,
    limit,
    type: typeFilter,
    isUploaded: isUploadedParam,
  });

  const transactions = data?.transactions || [];
  const rawPagination = data?.pagination;
  const totalCount =
    typeof rawPagination?.total === "number"
      ? rawPagination.total
      : typeof rawPagination?.totalRecords === "number"
        ? rawPagination.totalRecords
        : transactions.length || 0;

  const totalPages =
    typeof rawPagination?.totalPages === "number" && rawPagination.totalPages > 0
      ? rawPagination.totalPages
      : 1;

  const currentPage =
    typeof rawPagination?.page === "number" && rawPagination.page > 0
      ? rawPagination.page
      : page;

  const hasNext =
    typeof rawPagination?.hasNext === "boolean"
      ? rawPagination.hasNext
      : currentPage < totalPages;

  const hasPrev =
    typeof rawPagination?.hasPrev === "boolean"
      ? rawPagination.hasPrev
      : currentPage > 1;

  const pagination = {
    page: currentPage,
    limit: rawPagination?.limit || limit || 10,
    totalPages,
    total: totalCount,
    totalRecords: totalCount,
    hasNext,
    hasPrev,
  };

  // Client-side search filtering if active
  const filteredTransactions = useMemo(() => {
    if (!searchQuery.trim()) return transactions;
    const q = searchQuery.toLowerCase().trim();
    return transactions.filter((t) => {
      const party = (t.partyName || "").toLowerCase();
      const purpose = (t.purpose || "").toLowerCase();
      const credit = String(t.creditAmount || "");
      const debit = String(t.debitAmount || "");
      const balance = String(t.runningBalance || "");
      const creator = getCreatorDisplay(t.createdBy).toLowerCase();
      const formattedD = formatDate(t.transactionDate).toLowerCase();
      return (
        party.includes(q) ||
        purpose.includes(q) ||
        credit.includes(q) ||
        debit.includes(q) ||
        balance.includes(q) ||
        creator.includes(q) ||
        formattedD.includes(q)
      );
    });
  }, [transactions, searchQuery]);

  // Client-side sorting for current page
  const sortedTransactions = useMemo(() => {
    return [...filteredTransactions].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortKey === "date") {
        return (
          (new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime()) * dir
        );
      }
      if (sortKey === "name") {
        return (a.partyName || "").localeCompare(b.partyName || "") * dir;
      }
      if (sortKey === "credit") {
        return ((a.creditAmount || 0) - (b.creditAmount || 0)) * dir;
      }
      if (sortKey === "debit") {
        return ((a.debitAmount || 0) - (b.debitAmount || 0)) * dir;
      }
      if (sortKey === "balance") {
        return ((a.runningBalance || 0) - (b.runningBalance || 0)) * dir;
      }
      return 0;
    });
  }, [filteredTransactions, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  // Calculate live KPI statistics from the latest fetched data
  const stats = useMemo(() => {
    const totalCredit = transactions.reduce(
      (sum, t) => sum + (Number(t.creditAmount) || 0),
      0,
    );
    const totalDebit = transactions.reduce(
      (sum, t) => sum + (Number(t.debitAmount) || 0),
      0,
    );
    const latestBalance = transactions.length > 0 ? transactions[0].runningBalance : 0;
    const uploadedCount = transactions.filter((t) => t.isUploaded).length;
    const manualCount = transactions.length - uploadedCount;

    return {
      currentBalance: latestBalance,
      totalCredit,
      totalDebit,
      uploadedCount,
      manualCount,
      totalRecords: totalCount,
    };
  }, [transactions, totalCount]);

  const clearFilters = () => {
    setSearchQuery("");
    setTypeFilter("all");
    setSourceFilter("all");
    setPage(1);
  };

  return (
    <>
      <PageHeader
        title="Accounts & Financial Ledger"
        subtitle="Manage financial vouchers, credit/debit transactions, and reconciled bank statements."
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
              onClick={() => setExportOpen(true)}
              disabled={isLoading || pagination.totalRecords === 0}
              title="Export ledger entries to PDF"
            >
              <FileDown className="h-4 w-4 text-primary" />
              Export PDF
            </Button>
            <Button
              variant="outline"
              className="rounded-md gap-1.5"
              onClick={() => setUploadOpen(true)}
            >
              <FileUp className="h-4 w-4 text-primary" />
              Upload Statement
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
              Current Ledger Balance
            </p>
            <h3 className="font-mono text-2xl font-bold tracking-tight text-foreground">
              {formatCurrency(stats.currentBalance)}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Real-time running balance
            </p>
          </div>
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
            <Wallet className="h-6 w-6" />
          </div>
        </div>

        {/* Total Inflow */}
        <div className="glass flex items-center justify-between rounded-2xl p-5">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-emerald-500">
              Total Inflow (Credit)
            </p>
            <h3 className="font-mono text-2xl font-bold tracking-tight text-emerald-500">
              {formatCurrency(stats.totalCredit)}
            </h3>
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-emerald-500" /> Page revenue & receivables
            </div>
          </div>
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-500/10 text-emerald-500">
            <ArrowDownLeft className="h-6 w-6" />
          </div>
        </div>

        {/* Total Outflow */}
        <div className="glass flex items-center justify-between rounded-2xl p-5">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-rose-500">
              Total Outflow (Debit)
            </p>
            <h3 className="font-mono text-2xl font-bold tracking-tight text-rose-500">
              {formatCurrency(stats.totalDebit)}
            </h3>
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <TrendingDown className="h-3 w-3 text-rose-500" /> Page expenses & disbursements
            </div>
          </div>
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-rose-500/10 text-rose-500">
            <ArrowUpRight className="h-6 w-6" />
          </div>
        </div>

        {/* Total Ledger Records */}
        <div className="glass flex items-center justify-between rounded-2xl p-5">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Total Transactions
            </p>
            <h3 className="font-display text-2xl font-bold tracking-tight text-foreground">
              {stats.totalRecords.toLocaleString()}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              <span className="text-primary font-medium">{stats.uploadedCount} PDF</span> ·{" "}
              {stats.manualCount} manual (page)
            </p>
          </div>
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
            <Landmark className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="glass flex flex-col gap-3 rounded-2xl p-4 lg:flex-row lg:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by party, purpose, amount, or creator..."
            className="h-10 rounded-full border-border/60 bg-background/50 pl-10 text-sm"
          />
        </div>

        {/* Type Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={typeFilter}
            onValueChange={(val: "all" | "credit" | "debit") => {
              setTypeFilter(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-10 w-[150px] rounded-full border-border/60">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="credit">Credit (+) only</SelectItem>
              <SelectItem value="debit">Debit (-) only</SelectItem>
            </SelectContent>
          </Select>

          {/* Source Filter */}
          <Select
            value={sourceFilter}
            onValueChange={(val: "all" | "uploaded" | "manual") => {
              setSourceFilter(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-10 w-[160px] rounded-full border-border/60">
              <SelectValue placeholder="All sources" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sources</SelectItem>
              <SelectItem value="uploaded">Uploaded PDF</SelectItem>
              <SelectItem value="manual">Manual vouchers</SelectItem>
            </SelectContent>
          </Select>

          {/* Page Size */}
          <Select
            value={String(limit)}
            onValueChange={(val) => {
              setLimit(Number(val));
              setPage(1);
            }}
          >
            <SelectTrigger className="h-10 w-[110px] rounded-full border-border/60">
              <SelectValue placeholder="10 / page" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 / page</SelectItem>
              <SelectItem value="20">20 / page</SelectItem>
              <SelectItem value="50">50 / page</SelectItem>
            </SelectContent>
          </Select>

          {(searchQuery || typeFilter !== "all" || sourceFilter !== "all") && (
            <Button
              variant="outline"
              className="h-10 rounded-full text-xs"
              onClick={clearFilters}
            >
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
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
      ) : sortedTransactions.length === 0 ? (
        <EmptyState
          icon={FileSpreadsheet}
          title={
            searchQuery || typeFilter !== "all" || sourceFilter !== "all"
              ? "No matching ledger vouchers"
              : "No ledger entries recorded yet"
          }
          description={
            searchQuery || typeFilter !== "all" || sourceFilter !== "all"
              ? "Try adjusting your search criteria or type filters."
              : "Create your first financial voucher or upload a bank PDF statement to begin reconciliation."
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
              Showing {sortedTransactions.length} of {pagination.totalRecords} total records
            </span>
            <span>
              Page {pagination.page} of {pagination.totalPages}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap text-left text-sm">
              <thead className="border-b border-border/60 bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">
                    <SortHeaderButton
                      label="Transaction Date"
                      active={sortKey === "date"}
                      dir={sortDir}
                      onClick={() => toggleSort("date")}
                    />
                  </th>
                  <th className="px-5 py-3 font-medium">
                    <SortHeaderButton
                      label="Party Name"
                      active={sortKey === "name"}
                      dir={sortDir}
                      onClick={() => toggleSort("name")}
                    />
                  </th>
                  <th className="px-5 py-3 font-medium">Purpose</th>
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
                      label="Running Balance"
                      active={sortKey === "balance"}
                      dir={sortDir}
                      onClick={() => toggleSort("balance")}
                    />
                  </th>
                  <th className="px-5 py-3 font-medium">Source</th>
                  <th className="px-5 py-3 font-medium">Created By</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {sortedTransactions.map((tx) => {
                  const id = tx._id || tx.id || "";
                  return (
                    <tr
                      key={id}
                      className="transition-colors hover:bg-muted/40"
                    >
                      {/* 1. Transaction Date */}
                      <td className="px-5 py-3.5 text-xs text-muted-foreground font-sans">
                        {formatDate(tx.transactionDate)}
                      </td>

                      {/* 2. Party Name */}
                      <td className="px-5 py-3.5">
                        <span className="font-medium text-foreground">
                          {tx.partyName || "—"}
                        </span>
                      </td>

                      {/* 3. Purpose */}
                      <td
                        className="px-5 py-3.5 max-w-[240px] truncate text-muted-foreground text-xs"
                        title={tx.purpose}
                      >
                        {tx.purpose || "—"}
                      </td>

                      {/* 4. Credit (+) */}
                      <td className="px-5 py-3.5 text-right font-mono font-medium text-xs">
                        {tx.creditAmount > 0 ? (
                          <span className="text-emerald-500 font-semibold">
                            +{formatCurrency(tx.creditAmount)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/40">—</span>
                        )}
                      </td>

                      {/* 5. Debit (-) */}
                      <td className="px-5 py-3.5 text-right font-mono font-medium text-xs">
                        {tx.debitAmount > 0 ? (
                          <span className="text-rose-500 font-semibold">
                            -{formatCurrency(tx.debitAmount)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/40">—</span>
                        )}
                      </td>

                      {/* 6. Running Balance */}
                      <td className="px-5 py-3.5 text-right font-mono font-bold text-xs text-foreground">
                        {formatCurrency(tx.runningBalance)}
                      </td>

                      {/* 7. Uploaded Status */}
                      <td className="px-5 py-3.5">
                        {tx.isUploaded ? (
                          <Badge
                            variant="outline"
                            className="h-5 px-1.5 border-primary/30 bg-primary/10 text-[10px] text-primary"
                            title="Imported from PDF statement"
                          >
                            <FileText className="mr-0.5 h-2.5 w-2.5" /> PDF Statement
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="h-5 px-1.5 border-border/60 text-[10px] text-muted-foreground"
                          >
                            Manual Voucher
                          </Badge>
                        )}
                      </td>

                      {/* 8. Created By */}
                      <td className="px-5 py-3.5 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <User className="h-3 w-3 text-muted-foreground/60" />
                          <span>{getCreatorDisplay(tx.createdBy)}</span>
                        </div>
                      </td>

                      {/* 9. Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2.5 text-xs rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                            onClick={() => setEditingEntry(tx)}
                          >
                            <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2.5 text-xs rounded-md text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setDeletingEntry(tx)}
                          >
                            <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Backend Pagination Footer */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border/60 px-5 py-3 text-xs text-muted-foreground">
              <span>
                Page {pagination.page} of {pagination.totalPages} ({pagination.totalRecords} total
                records)
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!pagination.hasPrev || page <= 1}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!pagination.hasNext || page >= pagination.totalPages}
                >
                  Next <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dialogs */}
      <CreateAccountEntryDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
      />

      <EditAccountEntryDialog
        open={Boolean(editingEntry)}
        entry={editingEntry}
        onOpenChange={(open) => {
          if (!open) setEditingEntry(null);
        }}
      />

      <UploadEntriesDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
      />

      <DeleteAccountEntryDialog
        open={Boolean(deletingEntry)}
        entry={deletingEntry}
        onOpenChange={(open) => {
          if (!open) setDeletingEntry(null);
        }}
      />

      <ExportAccountDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
      />
    </>
  );
}
