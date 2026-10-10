import { apiClient } from "@/api/client/client";
import { API_ENDPOINTS } from "@/api/client/endpoints";
import type {
  ActivityLog,
  ActivityQueryFilters,
  PaginatedActivityResponse,
} from "../types";

/**
 * Parses any backend activity response structure (raw array, { data: [...] }, { logs: [...] }, { total, totalPages, page })
 */
function parseActivityResponse(
  raw: any,
  defaultPage = 1,
  defaultLimit = 10,
): PaginatedActivityResponse {
  if (!raw) {
    return { data: [], total: 0, page: defaultPage, totalPages: 0 };
  }

  let items: ActivityLog[] = [];
  let total = 0;
  let page = defaultPage;
  let totalPages = 1;

  if (Array.isArray(raw)) {
    items = raw;
    total = raw.length;
    totalPages = Math.ceil(total / defaultLimit) || 1;
  } else if (typeof raw === "object") {
    // Check possible locations for items array
    if (Array.isArray(raw.data)) {
      items = raw.data;
    } else if (Array.isArray(raw.logs)) {
      items = raw.logs;
    } else if (Array.isArray(raw.activities)) {
      items = raw.activities;
    } else if (raw.data && typeof raw.data === "object") {
      if (Array.isArray(raw.data.data)) {
        items = raw.data.data;
      } else if (Array.isArray(raw.data.logs)) {
        items = raw.data.logs;
      } else if (Array.isArray(raw.data.activities)) {
        items = raw.data.activities;
      }
    }

    // Extract total
    const parsedTotal = Number(
      raw.total ??
        raw.totalRecords ??
        raw.count ??
        raw.data?.total ??
        raw.data?.totalRecords ??
        raw.data?.count ??
        raw.pagination?.totalRecords ??
        raw.pagination?.total ??
        items.length,
    );
    total = isNaN(parsedTotal) ? items.length : parsedTotal;

    // Extract page
    const parsedPage = Number(
      raw.page ??
        raw.currentPage ??
        raw.data?.page ??
        raw.data?.currentPage ??
        raw.pagination?.currentPage ??
        raw.pagination?.page ??
        defaultPage,
    );
    page = isNaN(parsedPage) || parsedPage < 1 ? defaultPage : parsedPage;

    // Extract totalPages
    const parsedTotalPages = Number(
      raw.totalPages ??
        raw.pages ??
        raw.data?.totalPages ??
        raw.data?.pages ??
        raw.pagination?.totalPages ??
        (Math.ceil(total / defaultLimit) || 1),
    );
    totalPages =
      isNaN(parsedTotalPages) || parsedTotalPages < 1
        ? Math.max(1, Math.ceil(total / defaultLimit))
        : parsedTotalPages;
  }

  return {
    data: items,
    total,
    page,
    totalPages,
  };
}

function cleanActivityFilters(filters?: ActivityQueryFilters): Record<string, unknown> | undefined {
  if (!filters) return undefined;
  const cleaned: Record<string, unknown> = {};

  if (filters.page !== undefined && filters.page !== null && !isNaN(Number(filters.page))) {
    cleaned.page = Math.max(1, Number(filters.page));
  }
  if (filters.limit !== undefined && filters.limit !== null && !isNaN(Number(filters.limit))) {
    cleaned.limit = Math.max(1, Number(filters.limit));
  }
  if (filters.entityType && filters.entityType !== "all") {
    cleaned.entityType = filters.entityType;
  }
  if (filters.startDate) {
    cleaned.startDate = filters.startDate instanceof Date ? filters.startDate.toISOString() : filters.startDate;
  }
  if (filters.endDate) {
    cleaned.endDate = filters.endDate instanceof Date ? filters.endDate.toISOString() : filters.endDate;
  }

  return Object.keys(cleaned).length > 0 ? cleaned : undefined;
}

export const activityService = {
  getPersonalLogs: async (
    filters?: ActivityQueryFilters,
  ): Promise<PaginatedActivityResponse> => {
    try {
      const params = cleanActivityFilters(filters);
      const res = await apiClient.get<any>(API_ENDPOINTS.activity.personal, { params });
      return parseActivityResponse(res.data, filters?.page || 1, filters?.limit || 10);
    } catch (err) {
      console.warn("[activityService.getPersonalLogs] Failed:", err);
      return { data: [], total: 0, page: filters?.page || 1, totalPages: 0 };
    }
  },

  getAdminLogs: async (
    filters?: ActivityQueryFilters,
  ): Promise<PaginatedActivityResponse> => {
    try {
      const params = cleanActivityFilters(filters);
      const res = await apiClient.get<any>(API_ENDPOINTS.activity.admin, { params });
      return parseActivityResponse(res.data, filters?.page || 1, filters?.limit || 10);
    } catch (err) {
      console.warn("[activityService.getAdminLogs] Failed:", err);
      return { data: [], total: 0, page: filters?.page || 1, totalPages: 0 };
    }
  },

  getOrgLogs: async (
    filters?: ActivityQueryFilters,
  ): Promise<PaginatedActivityResponse> => {
    try {
      const params = cleanActivityFilters(filters);
      const res = await apiClient.get<any>(API_ENDPOINTS.activity.org, { params });
      return parseActivityResponse(res.data, filters?.page || 1, filters?.limit || 10);
    } catch (err) {
      console.warn("[activityService.getOrgLogs] Failed:", err);
      return { data: [], total: 0, page: filters?.page || 1, totalPages: 0 };
    }
  },
};
