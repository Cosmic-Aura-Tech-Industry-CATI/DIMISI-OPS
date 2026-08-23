import type { AuthUser } from "@/auth/types/auth";

export interface EmployeeFilters {
  search?: string;
  department?: string;
  designation?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  [key: string]: unknown;
}

export interface EmployeePagination {
  totalRecords: number;
  currentPage: number;
  totalPages: number;
  limit: number;
}

export interface EmployeeListResponse {
  employees: AuthUser[];
  pagination?: EmployeePagination;
}

export interface EmployeeSingleResponse {
  employee: AuthUser;
}

export interface UpdateEmployeePayload {
  name?: string;
  email?: string;
  phone?: string;
  department?: string;
  designation?: string;
  isActive?: boolean;
  [key: string]: unknown;
}

