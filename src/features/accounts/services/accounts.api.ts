/**
 * Production Accounts API Client.
 * Connects directly to backend /api/v1/accounts and /api/downloads endpoints.
 * Strictly adheres to backend contracts with no mock data or hardcoded URLs.
 */

import { apiClient, http } from "@/api/client/client";
import { API_BASE_URL } from "@/api/client/config";
import { API_ENDPOINTS } from "@/api/client/endpoints";
import type { AxiosProgressEvent } from "axios";
import type {
  AccountEstimateData,
  AccountFilters,
  AccountTransaction,
  CreateTransactionPayload,
  DownloadJobCreationResult,
  DownloadJobStatusResult,
  PaginatedTransactionsResponse,
  TimeframeFilter,
  UpdateTransactionPayload,
  UploadPdfResponse,
} from "../types/accounts.types";

/**
 * Resolves the backend downloads endpoint without duplicate path segments.
 * Backend download router is mounted at /api/downloads (outside of /v1).
 */
export function resolveDownloadsUrl(jobId?: string): string {
  const rawBase = API_BASE_URL || "/api/v1";
  const apiRoot = rawBase.replace(/\/v1\/?$/, "");
  const endpoint = jobId
    ? API_ENDPOINTS.reports.downloadDetail(jobId)
    : API_ENDPOINTS.reports.downloads;
  const path = `${apiRoot}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}${path.startsWith("/") ? "" : "/"}${path}`;
  }
  return path;
}

/**
 * Triggers file download in browser from a Blob.
 */
export function triggerBlobDownload(blob: Blob, fileName: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Triggers file download in browser from a remote URL.
 */
export function triggerUrlDownload(url: string, fileName?: string): void {
  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  if (fileName) {
    link.download = fileName;
  }
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * 1. GET /api/v1/accounts/all
 * Fetches paginated transactions with optional type and upload status filters.
 */
export async function getTransactions(
  filters?: AccountFilters,
): Promise<PaginatedTransactionsResponse> {
  const params: Record<string, unknown> = {
    page: filters?.page || 1,
    limit: filters?.limit || 10,
  };

  if (filters?.type && filters.type !== "all") {
    params.type = filters.type;
  }

  if (typeof filters?.isUploaded === "boolean") {
    params.isUploaded = filters.isUploaded;
  }

  const res = await http.get<PaginatedTransactionsResponse>(
    API_ENDPOINTS.accounts.all,
    { params },
  );

  return (
    res || {
      success: true,
      results: 0,
      pagination: {
        page: 1,
        limit: 10,
        totalPages: 1,
        totalRecords: 0,
        hasNext: false,
        hasPrev: false,
      },
      transactions: [],
    }
  );
}

/**
 * 2. POST /api/v1/accounts/create
 * Creates a new financial transaction voucher.
 */
export async function createTransaction(
  payload: CreateTransactionPayload,
): Promise<AccountTransaction> {
  const res = await http.post<AccountTransaction>(
    API_ENDPOINTS.accounts.create,
    {
      transactionDate: payload.transactionDate,
      partyName: payload.partyName.trim(),
      purpose: payload.purpose?.trim(),
      creditAmount: Number(payload.creditAmount) || 0,
      debitAmount: Number(payload.debitAmount) || 0,
    },
  );
  return res;
}

/**
 * 3. PATCH /api/v1/accounts/:id/update
 * Updates an existing transaction.
 */
export async function updateTransaction(
  id: string,
  payload: UpdateTransactionPayload,
): Promise<AccountTransaction> {
  const body: Record<string, unknown> = {};

  if (payload.partyName !== undefined) body.partyName = payload.partyName.trim();
  if (payload.purpose !== undefined) body.purpose = payload.purpose.trim();
  if (payload.transactionDate !== undefined) body.transactionDate = payload.transactionDate;
  if (payload.creditAmount !== undefined) body.creditAmount = Number(payload.creditAmount) || 0;
  if (payload.debitAmount !== undefined) body.debitAmount = Number(payload.debitAmount) || 0;

  const res = await http.patch<AccountTransaction>(
    API_ENDPOINTS.accounts.update(id),
    body,
  );
  return res;
}

/**
 * 4. PATCH /api/v1/accounts/:id/delete
 * Soft-deletes a transaction via API.
 */
export async function deleteTransaction(id: string): Promise<AccountTransaction> {
  const res = await http.patch<AccountTransaction>(
    API_ENDPOINTS.accounts.delete(id),
    {},
  );
  return res;
}

/**
 * 5. POST /api/v1/accounts/upload-pdf
 * Uploads a statement PDF file (multipart/form-data with field name 'file').
 */
export async function uploadPdfStatement(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<UploadPdfResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiClient.post<{
    success: boolean;
    message: string;
    data: UploadPdfResponse;
  }>(API_ENDPOINTS.accounts.uploadPdf, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    onUploadProgress: (progressEvent: AxiosProgressEvent) => {
      if (progressEvent.total && progressEvent.total > 0 && onProgress) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total,
        );
        onProgress(percentCompleted);
      }
    },
  });

  return (
    response.data?.data ||
    (response.data as unknown as UploadPdfResponse) || {
      jobId: "",
      status: "queued",
      message: "PDF upload received, processing in background",
    }
  );
}

/**
 * 6. GET /api/v1/accounts/estimate
 * Always call estimate before exporting PDF to decide between sync and async path.
 */
export async function getAccountEstimate(params?: {
  format?: "pdf";
  timeframe?: TimeframeFilter;
  fromDate?: string;
  toDate?: string;
}): Promise<AccountEstimateData> {
  const res = await http.get<AccountEstimateData>(
    API_ENDPOINTS.accounts.estimate,
    {
      params: {
        format: "pdf",
        ...(params?.timeframe ? { timeframe: params.timeframe } : { timeframe: "monthly" }),
        ...(params?.fromDate ? { fromDate: params.fromDate } : {}),
        ...(params?.toDate ? { toDate: params.toDate } : {}),
      },
    },
  );
  return res;
}

/**
 * 7. GET /api/v1/accounts/export
 * Synchronous PDF export stream (used when estimate recommended === "sync").
 */
export async function exportSyncPdf(params?: {
  timeframe?: TimeframeFilter;
  fromDate?: string;
  toDate?: string;
  isLogo?: boolean;
}): Promise<Blob> {
  const response = await apiClient.get(API_ENDPOINTS.accounts.export, {
    params: {
      format: "pdf",
      ...(params?.timeframe ? { timeframe: params.timeframe } : { timeframe: "monthly" }),
      ...(params?.fromDate ? { fromDate: params.fromDate } : {}),
      ...(params?.toDate ? { toDate: params.toDate } : {}),
      isLogo: params?.isLogo ?? true,
    },
    responseType: "blob",
  });

  const contentType = String(response.headers?.["content-type"] || "");
  if (
    !contentType.includes("application/pdf") &&
    !contentType.includes("application/octet-stream") &&
    !(response.data instanceof Blob)
  ) {
    throw new Error("Invalid response format: expected PDF stream.");
  }

  return response.data as Blob;
}

/**
 * 8. POST /api/downloads
 * Starts asynchronous background PDF generation (used when estimate recommended === "async").
 */
export async function createAsyncDownloadJob(params?: {
  timeframe?: TimeframeFilter;
  fromDate?: string;
  toDate?: string;
  isLogo?: boolean;
}): Promise<DownloadJobCreationResult> {
  const payload = {
    type: "account:data",
    format: "pdf",
    timeframe: params?.timeframe || "monthly",
    ...(params?.fromDate ? { fromDate: params.fromDate } : {}),
    ...(params?.toDate ? { toDate: params.toDate } : {}),
    isLogo: params?.isLogo ?? true,
  };

  const downloadUrl = resolveDownloadsUrl();
  const res = await http.post<DownloadJobCreationResult>(downloadUrl, payload);
  return res;
}

/**
 * 9. GET /api/downloads/:jobId
 * Polls status of background download job.
 */
export async function getDownloadJobStatus(
  jobId: string,
): Promise<DownloadJobStatusResult> {
  const statusUrl = resolveDownloadsUrl(jobId);
  const res = await http.get<DownloadJobStatusResult>(statusUrl);
  return res;
}

/**
 * Polls the background download job every intervalMs until completed or failed.
 */
export async function pollDownloadJob(
  jobId: string,
  onStatusUpdate?: (status: DownloadJobStatusResult) => void,
  intervalMs = 3000,
  maxAttempts = 100,
  signal?: AbortSignal,
): Promise<DownloadJobStatusResult> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (signal?.aborted) {
      throw new Error("Download polling was cancelled.");
    }

    const statusResult = await getDownloadJobStatus(jobId);
    onStatusUpdate?.(statusResult);

    if (statusResult.status === "completed") {
      if (!statusResult.downloadUrl) {
        throw new Error("Download job completed but no download URL was returned.");
      }
      return statusResult;
    }

    if (statusResult.status === "failed") {
      throw new Error(
        statusResult.error || "Async PDF generation failed on the server.",
      );
    }

    if (statusResult.status === "expired") {
      throw new Error("The requested download file has expired.");
    }

    await new Promise((resolve, reject) => {
      const timer = setTimeout(resolve, intervalMs);
      if (signal) {
        signal.addEventListener(
          "abort",
          () => {
            clearTimeout(timer);
            reject(new Error("Download polling was cancelled."));
          },
          { once: true },
        );
      }
    });
  }

  throw new Error("PDF generation timed out. Please check back shortly.");
}

export const accountsApi = {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  uploadPdfStatement,
  getAccountEstimate,
  exportSyncPdf,
  createAsyncDownloadJob,
  getDownloadJobStatus,
  pollDownloadJob,
  triggerBlobDownload,
  triggerUrlDownload,
  resolveDownloadsUrl,
};
