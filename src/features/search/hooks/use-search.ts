import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import type { ApiError } from "@/api/client/errors";
import { queryKeys } from "@/api/client/query-keys";
import {
  globalSearch,
  searchProjects,
  searchTasks,
  searchUsers,
} from "../services/search.service";
import type {
  GlobalSearchResults,
  ProjectSearchResult,
  SearchPaginationMeta,
  SearchProjectFilters,
  SearchTaskFilters,
  SearchUserFilters,
  TaskSearchResult,
  UserSearchResult,
} from "../types";

/**
 * Hook for global navbar multi-model search.
 * Only fires when query is non-empty unless enabled is explicitly overridden.
 */
export function useGlobalSearch(
  query: string,
  limit: number = 5,
  options?: Omit<
    UseQueryOptions<
      { data: GlobalSearchResults; totalResults: number; executionTimeMs: number },
      ApiError
    >,
    "queryKey" | "queryFn"
  >,
) {
  const trimmed = query.trim();
  return useQuery<{ data: GlobalSearchResults; totalResults: number; executionTimeMs: number }, ApiError>({
    queryKey: queryKeys.search.global(trimmed, limit),
    queryFn: () => globalSearch(trimmed, limit),
    enabled: trimmed.length > 0 && (options?.enabled ?? true),
    staleTime: 15_000,
    ...options,
  });
}

/**
 * Hook for dedicated Users search (employees & admins).
 */
export function useSearchUsers(
  query: string,
  filters?: SearchUserFilters,
  options?: Omit<
    UseQueryOptions<
      { users: UserSearchResult[]; pagination: SearchPaginationMeta; total: number },
      ApiError
    >,
    "queryKey" | "queryFn"
  >,
) {
  const trimmed = query.trim();
  return useQuery<
    { users: UserSearchResult[]; pagination: SearchPaginationMeta; total: number },
    ApiError
  >({
    queryKey: queryKeys.search.users(trimmed, filters as Record<string, unknown>),
    queryFn: () => searchUsers(trimmed, filters),
    enabled: trimmed.length > 0 && (options?.enabled ?? true),
    staleTime: 15_000,
    ...options,
  });
}

/**
 * Hook for dedicated Tasks search.
 */
export function useSearchTasks(
  query: string,
  filters?: SearchTaskFilters,
  options?: Omit<
    UseQueryOptions<
      { tasks: TaskSearchResult[]; pagination: SearchPaginationMeta; total: number },
      ApiError
    >,
    "queryKey" | "queryFn"
  >,
) {
  const trimmed = query.trim();
  return useQuery<
    { tasks: TaskSearchResult[]; pagination: SearchPaginationMeta; total: number },
    ApiError
  >({
    queryKey: queryKeys.search.tasks(trimmed, filters as Record<string, unknown>),
    queryFn: () => searchTasks(trimmed, filters),
    enabled: trimmed.length > 0 && (options?.enabled ?? true),
    staleTime: 15_000,
    ...options,
  });
}

/**
 * Hook for dedicated Projects search.
 */
export function useSearchProjects(
  query: string,
  filters?: SearchProjectFilters,
  options?: Omit<
    UseQueryOptions<
      { projects: ProjectSearchResult[]; pagination: SearchPaginationMeta; total: number },
      ApiError
    >,
    "queryKey" | "queryFn"
  >,
) {
  const trimmed = query.trim();
  return useQuery<
    { projects: ProjectSearchResult[]; pagination: SearchPaginationMeta; total: number },
    ApiError
  >({
    queryKey: queryKeys.search.projects(trimmed, filters as Record<string, unknown>),
    queryFn: () => searchProjects(trimmed, filters),
    enabled: trimmed.length > 0 && (options?.enabled ?? true),
    staleTime: 15_000,
    ...options,
  });
}
