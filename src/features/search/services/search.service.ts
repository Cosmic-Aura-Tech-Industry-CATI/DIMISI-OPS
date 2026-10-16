/**
 * Type-safe search service interacting with backend Atlas Search endpoints:
 * - GET /api/v1/search (Global multi-model search)
 * - GET /api/v1/search/users (Users search)
 * - GET /api/v1/search/tasks (Tasks search)
 * - GET /api/v1/search/projects (Projects search)
 */
import { apiClient } from "@/api/client/client";
import { API_ENDPOINTS } from "@/api/client/endpoints";
import type {
  GlobalSearchApiResponse,
  GlobalSearchResults,
  ProjectSearchResult,
  SearchPaginationMeta,
  SearchProjectFilters,
  SearchProjectsApiResponse,
  SearchTaskFilters,
  SearchTasksApiResponse,
  SearchUserFilters,
  SearchUsersApiResponse,
  TaskSearchResult,
  UserSearchResult,
} from "../types";

const { search: searchEndpoints } = API_ENDPOINTS;

/**
 * Executes a global navbar search across Users, Tasks, and Projects concurrently.
 * GET /api/v1/search?q=...&limit=...
 */
export async function globalSearch(
  query: string,
  limit: number = 5,
): Promise<{ data: GlobalSearchResults; totalResults: number; executionTimeMs: number }> {
  const trimmed = query.trim();
  if (!trimmed) {
    return {
      data: { users: [], tasks: [], projects: [] },
      totalResults: 0,
      executionTimeMs: 0,
    };
  }

  const response = await apiClient.get<GlobalSearchApiResponse>(searchEndpoints.global, {
    params: { q: trimmed, limit },
  });

  return {
    data: response.data?.data || { users: [], tasks: [], projects: [] },
    totalResults: response.data?.totalResults || 0,
    executionTimeMs: response.data?.executionTimeMs || 0,
  };
}

/**
 * Searches users with optional role and pagination.
 * GET /api/v1/search/users?q=...&page=...&limit=...&role=...
 */
export async function searchUsers(
  query: string,
  filters?: SearchUserFilters,
): Promise<{ users: UserSearchResult[]; pagination: SearchPaginationMeta; total: number }> {
  const response = await apiClient.get<SearchUsersApiResponse>(searchEndpoints.users, {
    params: {
      q: query.trim(),
      page: filters?.page ?? 1,
      limit: filters?.limit ?? 10,
      role: filters?.role,
    },
  });

  const payload = response.data;
  return {
    users: payload?.data?.users || [],
    pagination: payload?.pagination || {
      currentPage: 1,
      totalPages: 1,
      totalItems: payload?.data?.users?.length || 0,
      limit: filters?.limit ?? 10,
      hasNextPage: false,
      hasPrevPage: false,
    },
    total: payload?.pagination?.totalItems ?? payload?.results ?? 0,
  };
}

/**
 * Searches tasks with optional status, priority, and pagination.
 * GET /api/v1/search/tasks?q=...&page=...&limit=...&status=...&priority=...
 */
export async function searchTasks(
  query: string,
  filters?: SearchTaskFilters,
): Promise<{ tasks: TaskSearchResult[]; pagination: SearchPaginationMeta; total: number }> {
  const response = await apiClient.get<SearchTasksApiResponse>(searchEndpoints.tasks, {
    params: {
      q: query.trim(),
      page: filters?.page ?? 1,
      limit: filters?.limit ?? 10,
      status: filters?.status,
      priority: filters?.priority,
    },
  });

  const payload = response.data;
  return {
    tasks: payload?.data?.tasks || [],
    pagination: payload?.pagination || {
      currentPage: 1,
      totalPages: 1,
      totalItems: payload?.data?.tasks?.length || 0,
      limit: filters?.limit ?? 10,
      hasNextPage: false,
      hasPrevPage: false,
    },
    total: payload?.pagination?.totalItems ?? payload?.results ?? 0,
  };
}

/**
 * Searches projects with optional status and pagination.
 * GET /api/v1/search/projects?q=...&page=...&limit=...&status=...
 */
export async function searchProjects(
  query: string,
  filters?: SearchProjectFilters,
): Promise<{ projects: ProjectSearchResult[]; pagination: SearchPaginationMeta; total: number }> {
  const response = await apiClient.get<SearchProjectsApiResponse>(searchEndpoints.projects, {
    params: {
      q: query.trim(),
      page: filters?.page ?? 1,
      limit: filters?.limit ?? 10,
      status: filters?.status,
    },
  });

  const payload = response.data;
  return {
    projects: payload?.data?.projects || [],
    pagination: payload?.pagination || {
      currentPage: 1,
      totalPages: 1,
      totalItems: payload?.data?.projects?.length || 0,
      limit: filters?.limit ?? 10,
      hasNextPage: false,
      hasPrevPage: false,
    },
    total: payload?.pagination?.totalItems ?? payload?.results ?? 0,
  };
}

export const searchService = {
  globalSearch,
  searchUsers,
  searchTasks,
  searchProjects,
};
