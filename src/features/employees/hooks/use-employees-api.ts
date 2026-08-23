/**
 * React Query hooks for the Employee Management module.
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
import { employeesService } from "../services/employees.service";
import type {
  EmployeeFilters,
  EmployeeListResponse,
  UpdateEmployeePayload,
} from "../types";

type MutationOpts<TData, TVars> = Omit<
  UseMutationOptions<TData, ApiError, TVars>,
  "mutationFn"
>;

/** GET /api/v1/employees */
export function useEmployeesQuery(
  filters?: EmployeeFilters,
  options?: Omit<UseQueryOptions<EmployeeListResponse, ApiError>, "queryKey" | "queryFn">,
) {
  return useQuery<EmployeeListResponse, ApiError>({
    queryKey: queryKeys.employees.list(filters),
    queryFn: () => employeesService.getEmployees(filters),
    staleTime: 30_000,
    ...options,
  });
}

/** GET /api/v1/employees/:id */
export function useEmployeeDetailsQuery(
  id: string,
  options?: Omit<UseQueryOptions<AuthUser, ApiError>, "queryKey" | "queryFn">,
) {
  return useQuery<AuthUser, ApiError>({
    queryKey: queryKeys.employees.detail(id),
    queryFn: () => employeesService.getEmployeeDetails(id),
    enabled: Boolean(id),
    ...options,
  });
}

/** PATCH /api/v1/employees/:id */
export function useUpdateEmployeeDetails(
  options?: MutationOpts<AuthUser, { id: string; payload: UpdateEmployeePayload }>,
) {
  const queryClient = useQueryClient();
  return useMutation<AuthUser, ApiError, { id: string; payload: UpdateEmployeePayload }>({
    mutationKey: ["employees", "update"],
    mutationFn: ({ id, payload }) => employeesService.updateEmployeeDetails(id, payload),
    ...options,
    onSuccess: (...args) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.employees.all });
      if (args[1]?.id) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.employees.detail(args[1].id),
        });
      }
      options?.onSuccess?.(...args);
    },
  });
}

/** PATCH /api/v1/employees/:id/revoke */
export function useRevokeEmployeeAccess(
  options?: MutationOpts<MessageResponse, string>,
) {
  const queryClient = useQueryClient();
  return useMutation<MessageResponse, ApiError, string>({
    mutationKey: ["employees", "revoke"],
    mutationFn: (id) => employeesService.revokeEmployeeAccess(id),
    ...options,
    onSuccess: (...args) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.employees.all });
      options?.onSuccess?.(...args);
    },
  });
}

