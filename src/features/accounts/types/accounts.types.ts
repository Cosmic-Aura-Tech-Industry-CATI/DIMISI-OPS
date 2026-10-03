/**
 * Type definitions for the Accounts (Financial Ledger) module.
 * Aligned 1:1 with backend schemas and API contracts.
 */

export interface AccountCreator {
  _id: string;
  name?: string;
  email?: string;
  role?: string;
}

export interface AccountTransaction {
  _id: string;
  id?: string;
  transactionDate: string;
  partyName?: string;
  purpose?: string;
  creditAmount: number;
  debitAmount: number;
  runningBalance: number;
  isUploaded: boolean;
  createdBy?: string | AccountCreator;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalPages: number;
  total?: number;
  totalRecords?: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedTransactionsResponse {
  success: boolean;
  results: number;
  pagination: PaginationMeta;
  transactions: AccountTransaction[];
}

export interface CreateTransactionPayload {
  transactionDate: string;
  partyName: string;
  purpose?: string;
  creditAmount?: number;
  debitAmount?: number;
}

export interface UpdateTransactionPayload {
  transactionDate?: string;
  partyName?: string;
  purpose?: string;
  creditAmount?: number;
  debitAmount?: number;
}

export interface UploadPdfResponse {
  jobId: string;
  status: "queued";
  message: string;
}

export type TimeframeFilter = "weekly" | "monthly" | "quarterly" | "yearly";

export interface AccountEstimateData {
  format: "pdf";
  timeframe: TimeframeFilter;
  fromDate?: string;
  toDate?: string;
  rows: number;
  threshold: number;
  recommended: "sync" | "async";
  estimatedSeconds: number;
}

export interface AccountFilters {
  page?: number;
  limit?: number;
  type?: "credit" | "debit" | "all";
  isUploaded?: boolean;
  query?: string;
  fromDate?: string;
  toDate?: string;
}

export type DownloadJobStatus = "queued" | "processing" | "completed" | "failed" | "expired";

export interface DownloadJobStatusResult {
  jobId: string;
  status: DownloadJobStatus;
  progress?: number;
  downloadUrl?: string;
  error?: string;
  format?: string;
  createdAt?: string;
  completedAt?: string;
}

export interface DownloadJobCreationResult {
  jobId: string;
  status: "queued" | "processing";
  message?: string;
}

/** Legacy/Compatibility Aliases */
export type AccountEntry = AccountTransaction;
export type CreateAccountEntryPayload = CreateTransactionPayload;
export type UpdateAccountEntryPayload = UpdateTransactionPayload;
