/**
 * Search Feature Types & Interfaces
 * Matches backend MongoDB Atlas Search contracts from modules/search/search.interface.ts
 */

export interface SearchPaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface UserSearchResult {
  _id: string;
  name: string;
  email: string;
  empId: string;
  role: string;
  avatar?: string;
  department?: {
    _id: string;
    name: string;
    code?: string;
  } | string;
  designation?: {
    _id: string;
    name: string;
  } | string;
  score?: number;
}

export interface TaskSearchResult {
  _id: string;
  title: string;
  status: string;
  priority: string;
  type: string;
  deadline?: string | Date;
  assignedTo?: {
    _id: string;
    name: string;
    avatar?: string;
  } | string;
  projectId?: {
    _id: string;
    name: string;
    code?: string;
  } | string;
  score?: number;
}

export interface ProjectSearchResult {
  _id: string;
  name: string;
  code?: string;
  status: string;
  color?: string;
  managerId?: {
    _id: string;
    name: string;
    avatar?: string;
  } | string;
  score?: number;
}

export interface GlobalSearchResults {
  users: UserSearchResult[];
  tasks: TaskSearchResult[];
  projects: ProjectSearchResult[];
}

export interface GlobalSearchApiResponse {
  status: string;
  executionTimeMs: number;
  totalResults: number;
  data: GlobalSearchResults;
}

export interface SearchUserFilters {
  page?: number;
  limit?: number;
  role?: string;
}

export interface SearchTaskFilters {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
}

export interface SearchProjectFilters {
  page?: number;
  limit?: number;
  status?: string;
}

export interface SearchUsersApiResponse {
  status: string;
  results: number;
  pagination: SearchPaginationMeta;
  data: {
    users: UserSearchResult[];
  };
}

export interface SearchTasksApiResponse {
  status: string;
  results: number;
  pagination: SearchPaginationMeta;
  data: {
    tasks: TaskSearchResult[];
  };
}

export interface SearchProjectsApiResponse {
  status: string;
  results: number;
  pagination: SearchPaginationMeta;
  data: {
    projects: ProjectSearchResult[];
  };
}
