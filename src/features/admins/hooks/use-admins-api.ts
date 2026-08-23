/**
 * React Query hooks for the Admin Management module.
 * Provides query and mutation hooks with automated cache invalidation.
 */
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";

import type { ApiError } from "@/api/client/errors";
import { queryKeys } from "@/api/client/query-keys";
import type { AuthUser } from "@/auth/types/auth";
import type { MessageResponse } from "@/types/api";
import { adminsService } from "../services/admins.service";
import type {
  AdminFilters,
  AdminListResponse,
  AdminStats,
  UpdateAdminPayload,
} from "../types";

type MutationOpts<TData, TVars> = Omit<
  UseMutationOptions<TData, ApiError, TVars>,
  "mutationFn"
>;

/** GET /api/v1/admins/stats */
export function useAdminStatsQuery(
  options?: Omit<UseQueryOptions<AdminStats, ApiError>, "queryKey" | "queryFn">,
) {
  return useQuery<AdminStats, ApiError>({
    queryKey: queryKeys.admins.stats(),
    queryFn: () => adminsService.getAdminStats(),
    staleTime: 30_000,
    ...options,
  });
}

/** GET /api/v1/admins */
export function useAdminsQuery(
  filters?: AdminFilters,
  options?: Omit<UseQueryOptions<AdminListResponse, ApiError>, "queryKey" | "queryFn">,
) {
  return useQuery<AdminListResponse, ApiError>({
    queryKey: queryKeys.admins.list(filters),
    queryFn: () => adminsService.getAdmins(filters),
    staleTime: 30_000,
    ...options,
  });
}

/** GET /api/v1/admins/:id */
export function useAdminDetailsQuery(
  id: string,
  options?: Omit<UseQueryOptions<AuthUser, ApiError>, "queryKey" | "queryFn">,
) {
  return useQuery<AuthUser, ApiError>({
    queryKey: queryKeys.admins.detail(id),
    queryFn: () => adminsService.getAdminDetails(id),
    enabled: Boolean(id),
    ...options,
  });
}

/** PATCH /api/v1/admins/:id */
export function useUpdateAdminDetails(
  options?: MutationOpts<AuthUser, { id: string; payload: UpdateAdminPayload }>,
) {
  const queryClient = useQueryClient();
  return useMutation<AuthUser, ApiError, { id: string; payload: UpdateAdminPayload }>({
    mutationKey: ["admins", "update"],
    mutationFn: ({ id, payload }) => adminsService.updateAdminDetails(id, payload),
    ...options,
    onSuccess: (...args) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admins.all });
      if (args[1]?.id) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.admins.detail(args[1].id),
        });
      }
      options?.onSuccess?.(...args);
    },
  });
}

/** PATCH /api/v1/admins/:id/revoke */
export function useRevokeAdminAccess(
  options?: MutationOpts<MessageResponse, string>,
) {
  const queryClient = useQueryClient();
  return useMutation<MessageResponse, ApiError, string>({
    mutationKey: ["admins", "revoke"],
    mutationFn: (id) => adminsService.revokeAdminAccess(id),
    ...options,
    onSuccess: (...args) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admins.all });
      options?.onSuccess?.(...args);
    },
  });
}

