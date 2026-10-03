/**
 * React Query hooks for the Accounts module.
 * Standardized caching, background refetching, and automatic cache invalidation.
 */

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";
import type { ApiError } from "@/api/client/errors";
import { queryKeys } from "@/api/client/query-keys";
import { accountsApi } from "../services/accounts.api";
import type {
  AccountEstimateData,
  AccountFilters,
  AccountTransaction,
  CreateTransactionPayload,
  PaginatedTransactionsResponse,
  TimeframeFilter,
  UpdateTransactionPayload,
  UploadPdfResponse,
} from "../types/accounts.types";

export const accountQueryKeys = {
  all: queryKeys.accounts.all,
  lists: () => ["accounts", "list"] as const,
  list: (filters?: AccountFilters) => ["accounts", "list", filters] as const,
  estimate: (params?: Record<string, unknown>) => ["accounts", "estimate", params] as const,
  detail: (id: string) => queryKeys.accounts.detail(id),
};

type MutationOpts<TData, TVars> = Omit<
  UseMutationOptions<TData, ApiError, TVars>,
  "mutationFn"
>;

/**
 * 1. GET /api/v1/accounts/all
 * Fetches paginated ledger transactions with filter persistence.
 */
export function useAccountsQuery(
  filters?: AccountFilters,
  options?: Omit<
    UseQueryOptions<PaginatedTransactionsResponse, ApiError>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: accountQueryKeys.list(filters),
    queryFn: () => accountsApi.getTransactions(filters),
    placeholderData: keepPreviousData,
    staleTime: 10_000,
    ...options,
  });
}

/**
 * 2. POST /api/v1/accounts/create
 * Creates a new transaction and automatically invalidates the accounts cache.
 */
export function useCreateTransactionMutation(
  options?: MutationOpts<AccountTransaction, CreateTransactionPayload>,
) {
  const queryClient = useQueryClient();
  return useMutation<AccountTransaction, ApiError, CreateTransactionPayload>({
    mutationKey: ["accounts", "create"],
    mutationFn: (payload) => accountsApi.createTransaction(payload),
    ...options,
    onSuccess: (...args) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
      options?.onSuccess?.(...args);
    },
  });
}

/**
 * 3. PATCH /api/v1/accounts/:id/update
 * Updates an existing transaction and invalidates cache.
 */
export function useUpdateTransactionMutation(
  options?: MutationOpts<
    AccountTransaction,
    { id: string; payload: UpdateTransactionPayload }
  >,
) {
  const queryClient = useQueryClient();
  return useMutation<
    AccountTransaction,
    ApiError,
    { id: string; payload: UpdateTransactionPayload }
  >({
    mutationKey: ["accounts", "update"],
    mutationFn: ({ id, payload }) => accountsApi.updateTransaction(id, payload),
    ...options,
    onSuccess: (...args) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
      options?.onSuccess?.(...args);
    },
  });
}

/**
 * 4. PATCH /api/v1/accounts/:id/delete
 * Soft deletes a transaction and invalidates cache.
 */
export function useDeleteTransactionMutation(
  options?: MutationOpts<AccountTransaction, string>,
) {
  const queryClient = useQueryClient();
  return useMutation<AccountTransaction, ApiError, string>({
    mutationKey: ["accounts", "delete"],
    mutationFn: (id) => accountsApi.deleteTransaction(id),
    ...options,
    onSuccess: (...args) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
      options?.onSuccess?.(...args);
    },
  });
}

/**
 * 5. POST /api/v1/accounts/upload-pdf
 * Uploads a statement PDF file.
 */
export function useUploadPdfMutation(
  options?: MutationOpts<
    UploadPdfResponse,
    { file: File; onProgress?: (percent: number) => void }
  >,
) {
  const queryClient = useQueryClient();
  return useMutation<
    UploadPdfResponse,
    ApiError,
    { file: File; onProgress?: (percent: number) => void }
  >({
    mutationKey: ["accounts", "upload-pdf"],
    mutationFn: ({ file, onProgress }) =>
      accountsApi.uploadPdfStatement(file, onProgress),
    ...options,
    onSuccess: (...args) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
      options?.onSuccess?.(...args);
    },
  });
}

/**
 * 6. GET /api/v1/accounts/estimate
 * Fetches PDF export estimate.
 */
export function useAccountEstimateQuery(
  params?: {
    format?: "pdf";
    timeframe?: TimeframeFilter;
    fromDate?: string;
    toDate?: string;
  },
  options?: Omit<
    UseQueryOptions<AccountEstimateData, ApiError>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: accountQueryKeys.estimate(params as Record<string, unknown>),
    queryFn: () => accountsApi.getAccountEstimate(params),
    staleTime: 30_000,
    ...options,
  });
}

/** Legacy aliases */
export const useCreateAccountEntry = useCreateTransactionMutation;
export const useUpdateAccountEntry = useUpdateTransactionMutation;
export const useDeleteAccountEntry = useDeleteTransactionMutation;
