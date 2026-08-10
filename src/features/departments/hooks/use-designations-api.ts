/**
 * React Query hooks — one per endpoint for the Designations module.
 * Components should use these instead of calling services directly.
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
import { designationsService } from "../services/designations.service";
import type {
  Designation,
  CreateDesignationPayload,
  UpdateDesignationPayload,
} from "../types";

type MutationOpts<TData, TVars> = Omit<
  UseMutationOptions<TData, ApiError, TVars>,
  "mutationFn"
>;

/** GET /api/v1/designations */
export function useDesignationsQuery(
  options?: Omit<UseQueryOptions<Designation[], ApiError>, "queryKey" | "queryFn">,
) {
  return useQuery<Designation[], ApiError>({
    queryKey: queryKeys.designations.all,
    queryFn: () => designationsService.getDesignations(),
    staleTime: 30_000,
    ...options,
  });
}

/** GET /api/v1/designations/department/:departmentId */
export function useDesignationsByDepartmentQuery(
  departmentId?: string | null,
  options?: Omit<UseQueryOptions<Designation[], ApiError>, "queryKey" | "queryFn">,
) {
  const deptId = departmentId ? String(departmentId).trim() : "";
  return useQuery<Designation[], ApiError>({
    queryKey: queryKeys.designations.byDepartment(deptId),
    queryFn: () => designationsService.getDesignationsByDepartment(deptId),
    enabled: Boolean(deptId),
    staleTime: 30_000,
    ...options,
  });
}

/** GET /api/v1/designations/:id */
export function useDesignationQuery(
  id?: string | null,
  options?: Omit<UseQueryOptions<Designation, ApiError>, "queryKey" | "queryFn">,
) {
  const desigId = id ? String(id).trim() : "";
  return useQuery<Designation, ApiError>({
    queryKey: queryKeys.designations.detail(desigId),
    queryFn: () => designationsService.getDesignation(desigId),
    enabled: Boolean(desigId),
    ...options,
  });
}

/** POST /api/v1/designations */
export function useCreateDesignation(
  options?: MutationOpts<Designation, CreateDesignationPayload>,
) {
  const queryClient = useQueryClient();
  return useMutation<Designation, ApiError, CreateDesignationPayload>({
    mutationKey: ["designations", "create"],
    mutationFn: (payload) => designationsService.createDesignation(payload),
    ...options,
    onSuccess: (...args) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.designations.all });
      if (args[1]?.departmentId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.designations.byDepartment(args[1].departmentId),
        });
      }
      options?.onSuccess?.(...args);
    },
  });
}

/** PATCH /api/v1/designations/:id */
export function useUpdateDesignation(
  options?: MutationOpts<
    Designation,
    { id: string; payload: UpdateDesignationPayload; departmentId?: string }
  >,
) {
  const queryClient = useQueryClient();
  return useMutation<
    Designation,
    ApiError,
    { id: string; payload: UpdateDesignationPayload; departmentId?: string }
  >({
    mutationKey: ["designations", "update"],
    mutationFn: ({ id, payload }) => designationsService.updateDesignation(id, payload),
    ...options,
    onSuccess: (...args) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.designations.all });
      const deptId =
        args[1]?.departmentId ||
        args[1]?.payload?.departmentId ||
        args[0]?.departmentId;
      if (deptId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.designations.byDepartment(deptId),
        });
      }
      options?.onSuccess?.(...args);
    },
  });
}

/** DELETE /api/v1/designations/:id */
export function useDeactivateDesignation(
  options?: MutationOpts<
    MessageResponse,
    { id: string; departmentId?: string } | string
  >,
) {
  const queryClient = useQueryClient();
  return useMutation<
    MessageResponse,
    ApiError,
    { id: string; departmentId?: string } | string
  >({
    mutationKey: ["designations", "delete"],
    mutationFn: (vars) => {
      const id = typeof vars === "string" ? vars : vars.id;
      return designationsService.deactivateDesignation(id);
    },
    ...options,
    onSuccess: (...args) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.designations.all });
      const deptId = typeof args[1] === "object" ? args[1].departmentId : undefined;
      if (deptId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.designations.byDepartment(deptId),
        });
      }
      options?.onSuccess?.(...args);
    },
  });
}
