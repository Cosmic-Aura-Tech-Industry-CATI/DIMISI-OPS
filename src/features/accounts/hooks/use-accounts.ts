/**
 * React Query hooks for Accounts module.
 */
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";
import type { ApiError } from "@/api/client/errors";
import type { MessageResponse } from "@/types/api";
import { accountsService } from "../services/accounts.service";
import type {
  AccountEntry,
  AccountFilters,
  AccountStats,
  CreateAccountEntryPayload,
  UpdateAccountEntryPayload,
} from "../types";

export const accountQueryKeys = {
  all: ["accounts"] as const,
  lists: () => ["accounts", "list"] as const,
  list: (filters?: AccountFilters) => ["accounts", "list", filters] as const,
  stats: () => ["accounts", "stats"] as const,
  detail: (id: string) => ["accounts", "detail", id] as const,
};

type MutationOpts<TData, TVars> = Omit<UseMutationOptions<TData, ApiError, TVars>, "mutationFn">;

/** GET /accounts */
export function useAccountsQuery(
  filters?: AccountFilters,
  options?: Omit<UseQueryOptions<AccountEntry[], ApiError>, "queryKey" | "queryFn">,
) {
  return useQuery<AccountEntry[], ApiError>({
    queryKey: accountQueryKeys.list(filters),
    queryFn: () => accountsService.getAccountEntries(filters),
    staleTime: 15_000,
    ...options,
  });
}

/** GET /accounts/stats */
export function useAccountStatsQuery(
  options?: Omit<UseQueryOptions<AccountStats, ApiError>, "queryKey" | "queryFn">,
) {
  return useQuery<AccountStats, ApiError>({
    queryKey: accountQueryKeys.stats(),
    queryFn: () => accountsService.getAccountStats(),
    staleTime: 15_000,
    ...options,
  });
}

/** POST /accounts (Create Entry) */
export function useCreateAccountEntry(
  options?: MutationOpts<AccountEntry, CreateAccountEntryPayload>,
) {
  const queryClient = useQueryClient();
  return useMutation<AccountEntry, ApiError, CreateAccountEntryPayload>({
    mutationKey: ["accounts", "create"],
    mutationFn: (payload) => accountsService.createAccountEntry(payload),
    ...options,
    onSuccess: (...args) => {
      void queryClient.invalidateQueries({ queryKey: accountQueryKeys.all });
      options?.onSuccess?.(...args);
    },
  });
}

/** PATCH /accounts/:id (Edit Entry) */
export function useUpdateAccountEntry(
  options?: MutationOpts<AccountEntry, { id: string; payload: UpdateAccountEntryPayload }>,
) {
  const queryClient = useQueryClient();
  return useMutation<AccountEntry, ApiError, { id: string; payload: UpdateAccountEntryPayload }>({
    mutationKey: ["accounts", "update"],
    mutationFn: ({ id, payload }) => accountsService.updateAccountEntry(id, payload),
    ...options,
    onSuccess: (...args) => {
      void queryClient.invalidateQueries({ queryKey: accountQueryKeys.all });
      options?.onSuccess?.(...args);
    },
  });
}

/** DELETE /accounts/:id (Delete Entry) */
export function useDeleteAccountEntry(options?: MutationOpts<MessageResponse, string>) {
  const queryClient = useQueryClient();
  return useMutation<MessageResponse, ApiError, string>({
    mutationKey: ["accounts", "delete"],
    mutationFn: (id) => accountsService.deleteAccountEntry(id),
    ...options,
    onSuccess: (...args) => {
      void queryClient.invalidateQueries({ queryKey: accountQueryKeys.all });
      options?.onSuccess?.(...args);
    },
  });
}

/** POST /accounts/upload (Upload Entries batch) */
export function useUploadAccountEntries(
  options?: MutationOpts<AccountEntry[], CreateAccountEntryPayload[]>,
) {
  const queryClient = useQueryClient();
  return useMutation<AccountEntry[], ApiError, CreateAccountEntryPayload[]>({
    mutationKey: ["accounts", "upload"],
    mutationFn: (items) => accountsService.uploadAccountEntries(items),
    ...options,
    onSuccess: (...args) => {
      void queryClient.invalidateQueries({ queryKey: accountQueryKeys.all });
      options?.onSuccess?.(...args);
    },
  });
}
