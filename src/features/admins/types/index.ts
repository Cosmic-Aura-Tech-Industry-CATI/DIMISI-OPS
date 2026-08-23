import type { AuthUser } from "@/auth/types/auth";

export interface AdminStats {
  totalAdmins: number;
  activeAdmins: number;
  revokedAdmins: number;
  [key: string]: unknown;
}

export interface AdminFilters {
  search?: string;
  department?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  [key: string]: unknown;
}

export interface AdminPagination {
  totalRecords: number;
  currentPage: number;
  totalPages: number;
  limit: number;
}

export interface AdminListResponse {
  admins: AuthUser[];
  pagination?: AdminPagination;
}

export interface AdminSingleResponse {
  admin: AuthUser;
}

export interface AdminStatsResponse {
  stats: AdminStats;
}

export interface UpdateAdminPayload {
  name?: string;
  email?: string;
  phone?: string;
  department?: string;
  designation?: string;
  isActive?: boolean;
  [key: string]: unknown;
}

