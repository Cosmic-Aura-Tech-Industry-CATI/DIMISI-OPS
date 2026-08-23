/**
 * React Query hooks for the Notice Announcement module.
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
import type { MessageResponse } from "@/types/api";
import { noticesService } from "../services/notices.service";
import type {
  CreateNoticeInput,
  Notice,
  NoticeFilters,
  UpdateNoticeInput,
} from "../types";

type MutationOpts<TData, TVars> = Omit<
  UseMutationOptions<TData, ApiError, TVars>,
  "mutationFn"
>;

/** GET /api/v1/notices */
export function useNoticesQuery(
  filters?: NoticeFilters,
  options?: Omit<UseQueryOptions<Notice[], ApiError>, "queryKey" | "queryFn">,
) {
  return useQuery<Notice[], ApiError>({
    queryKey: queryKeys.notices.list(filters),
    queryFn: () => noticesService.getNotices(filters),
    staleTime: 30_000,
    ...options,
  });
}

/** GET /api/v1/notices/:id */
export function useNoticeQuery(
  id: string,
  options?: Omit<UseQueryOptions<Notice, ApiError>, "queryKey" | "queryFn">,
) {
  return useQuery<Notice, ApiError>({
    queryKey: queryKeys.notices.detail(id),
    queryFn: () => noticesService.getNotice(id),
    enabled: Boolean(id),
    ...options,
  });
}

/** POST /api/v1/notices */
export function useCreateNotice(
  options?: MutationOpts<Notice, CreateNoticeInput | FormData>,
) {
  const queryClient = useQueryClient();
  return useMutation<Notice, ApiError, CreateNoticeInput | FormData>({
    mutationKey: ["notices", "create"],
    mutationFn: (input) => noticesService.createNotice(input),
    ...options,
    onSuccess: (...args) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.notices.all });
      options?.onSuccess?.(...args);
    },
  });
}

/** PATCH /api/v1/notices/:id */
export function useUpdateNotice(
  options?: MutationOpts<Notice, { id: string; input: UpdateNoticeInput | FormData }>,
) {
  const queryClient = useQueryClient();
  return useMutation<Notice, ApiError, { id: string; input: UpdateNoticeInput | FormData }>({
    mutationKey: ["notices", "update"],
    mutationFn: ({ id, input }) => noticesService.updateNotice(id, input),
    ...options,
    onSuccess: (...args) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.notices.all });
      if (args[1]?.id) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.notices.detail(args[1].id),
        });
      }
      options?.onSuccess?.(...args);
    },
  });
}

/** DELETE /api/v1/notices/:id */
export function useDeleteNotice(
  options?: MutationOpts<MessageResponse, string>,
) {
  const queryClient = useQueryClient();
  return useMutation<MessageResponse, ApiError, string>({
    mutationKey: ["notices", "delete"],
    mutationFn: (id) => noticesService.deleteNotice(id),
    ...options,
    onSuccess: (...args) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.notices.all });
      options?.onSuccess?.(...args);
    },
  });
}

