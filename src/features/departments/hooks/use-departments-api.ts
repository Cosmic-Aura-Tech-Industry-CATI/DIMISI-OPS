/**
 * React Query hooks for the Departments module.
 * Wraps service functions with automatic cache invalidation.
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
import type { MessageResponse } from "@/types/api";
import { departmentsService } from "../services/departments.service";
import type {
  Department,
  CreateDepartmentPayload,
  UpdateDepartmentPayload,
} from "../types";

type MutationOpts<TData, TVars> = Omit<
  UseMutationOptions<TData, ApiError, TVars>,
  "mutationFn"
>;

/** GET /api/v1/departments */
export function useDepartmentsQuery(
  options?: Omit<UseQueryOptions<Department[], ApiError>, "queryKey" | "queryFn">,
) {
  return useQuery<Department[], ApiError>({
    queryKey: queryKeys.departments.all,
    queryFn: () => departmentsService.getDepartments(),
    staleTime: 30_000,
    ...options,
  });
}

/** GET /api/v1/departments/:id */
export function useDepartmentQuery(
  id: string,
  options?: Omit<UseQueryOptions<Department, ApiError>, "queryKey" | "queryFn">,
) {
  return useQuery<Department, ApiError>({
    queryKey: queryKeys.departments.detail(id),
    queryFn: () => departmentsService.getDepartment(id),
    enabled: Boolean(id),
    ...options,
  });
}

/** POST /api/v1/departments */
export function useCreateDepartment(
  options?: MutationOpts<Department, CreateDepartmentPayload>,
) {
  const queryClient = useQueryClient();
  return useMutation<Department, ApiError, CreateDepartmentPayload>({
    mutationKey: ["departments", "create"],
    mutationFn: (payload) => departmentsService.createDepartment(payload),
    ...options,
    onSuccess: (...args) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.departments.all });
      options?.onSuccess?.(...args);
    },
  });
}

/** PATCH /api/v1/departments/:id */
export function useUpdateDepartment(
  options?: MutationOpts<Department, { id: string; payload: UpdateDepartmentPayload }>,
) {
  const queryClient = useQueryClient();
  return useMutation<Department, ApiError, { id: string; payload: UpdateDepartmentPayload }>({
    mutationKey: ["departments", "update"],
    mutationFn: ({ id, payload }) => departmentsService.updateDepartment(id, payload),
    ...options,
    onSuccess: (...args) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.departments.all });
      options?.onSuccess?.(...args);
    },
  });
}

/** DELETE /api/v1/departments/:id */
export function useDeactivateDepartment(
  options?: MutationOpts<MessageResponse, string>,
) {
  const queryClient = useQueryClient();
  return useMutation<MessageResponse, ApiError, string>({
    mutationKey: ["departments", "delete"],
    mutationFn: (id) => departmentsService.deactivateDepartment(id),
    ...options,
    onSuccess: (...args) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.departments.all });
      options?.onSuccess?.(...args);
    },
  });
}
