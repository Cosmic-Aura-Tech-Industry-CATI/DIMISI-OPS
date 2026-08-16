/**
 * React Query hooks for the Projects module.
 * Wraps service functions with automatic cache invalidation and error handling.
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
import { projectsService } from "../services/projects.service";
import type {
  CreateProjectPayload,
  Project,
  ProjectFilters,
  UpdateProjectPayload,
} from "../types";

type MutationOpts<TData, TVars> = Omit<
  UseMutationOptions<TData, ApiError, TVars>,
  "mutationFn"
>;

/** GET /api/v1/projects — fetches project catalogue */
export function useProjectsQuery(
  filters?: ProjectFilters,
  options?: Omit<UseQueryOptions<Project[], ApiError>, "queryKey" | "queryFn">,
) {
  return useQuery<Project[], ApiError>({
    queryKey: filters ? queryKeys.projects.list(filters) : queryKeys.projects.all,
    queryFn: () => projectsService.getProjects(filters),
    staleTime: 30_000,
    ...options,
  });
}

/** GET /api/v1/projects/:id — fetches a single project */
export function useProjectQuery(
  id: string,
  options?: Omit<UseQueryOptions<Project, ApiError>, "queryKey" | "queryFn">,
) {
  return useQuery<Project, ApiError>({
    queryKey: queryKeys.projects.detail(id),
    queryFn: () => projectsService.getProjectById(id),
    enabled: Boolean(id),
    ...options,
  });
}

/** POST /api/v1/projects — creates a new project */
export function useCreateProject(
  options?: MutationOpts<Project, CreateProjectPayload>,
) {
  const queryClient = useQueryClient();
  return useMutation<Project, ApiError, CreateProjectPayload>({
    mutationKey: ["projects", "create"],
    mutationFn: (payload) => projectsService.createProject(payload),
    ...options,
    onSuccess: (...args) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
      options?.onSuccess?.(...args);
    },
  });
}

/** PATCH /api/v1/projects/:id — updates an existing project */
export function useUpdateProject(
  options?: MutationOpts<Project, { id: string; payload: UpdateProjectPayload }>,
) {
  const queryClient = useQueryClient();
  return useMutation<Project, ApiError, { id: string; payload: UpdateProjectPayload }>({
    mutationKey: ["projects", "update"],
    mutationFn: ({ id, payload }) => projectsService.updateProject(id, payload),
    ...options,
    onSuccess: (...args) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
      if (args[1]?.id) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.projects.detail(args[1].id),
        });
      }
      options?.onSuccess?.(...args);
    },
  });
}

/** DELETE /api/v1/projects/:id — deactivates (soft deletes) a project */
export function useDeleteProject(
  options?: MutationOpts<MessageResponse, string>,
) {
  const queryClient = useQueryClient();
  return useMutation<MessageResponse, ApiError, string>({
    mutationKey: ["projects", "delete"],
    mutationFn: (id) => projectsService.deleteProject(id),
    ...options,
    onSuccess: (...args) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
      options?.onSuccess?.(...args);
    },
  });
}

/** Alias for useDeleteProject */
export const useDeactivateProject = useDeleteProject;

/**
 * Unified hook providing full access to projects queries and mutations.
 */
export function useProjectsApi(filters?: ProjectFilters) {
  const projectsQuery = useProjectsQuery(filters);
  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject();
  const deleteMutation = useDeleteProject();

  return {
    // Data & query state
    projects: projectsQuery.data ?? [],
    isLoading: projectsQuery.isLoading,
    isFetching: projectsQuery.isFetching,
    isError: projectsQuery.isError,
    error: projectsQuery.error,
    refetch: projectsQuery.refetch,

    // Mutations
    createProject: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    createError: createMutation.error,

    updateProject: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,

    deleteProject: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    deleteError: deleteMutation.error,
  };
}
