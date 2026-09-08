/** API services for the activity module. */
import { http } from "@/api/client/client";
import { API_ENDPOINTS } from "@/api/client/endpoints";
import type {
  ActivityQueryFilters,
  PaginatedActivityResponse,
} from "../types";

export const activityService = {
  getPersonalLogs: async (
    filters?: ActivityQueryFilters,
  ): Promise<PaginatedActivityResponse> => {
    const res = await http.get<PaginatedActivityResponse>(
      API_ENDPOINTS.activity.personal,
      { params: filters },
    );
    return res ?? { data: [], total: 0, page: 1, totalPages: 0 };
  },

  getAdminLogs: async (
    filters?: ActivityQueryFilters,
  ): Promise<PaginatedActivityResponse> => {
    const res = await http.get<PaginatedActivityResponse>(
      API_ENDPOINTS.activity.admin,
      { params: filters },
    );
    return res ?? { data: [], total: 0, page: 1, totalPages: 0 };
  },

  getOrgLogs: async (
    filters?: ActivityQueryFilters,
  ): Promise<PaginatedActivityResponse> => {
    const res = await http.get<PaginatedActivityResponse>(
      API_ENDPOINTS.activity.org,
      { params: filters },
    );
    return res ?? { data: [], total: 0, page: 1, totalPages: 0 };
  },
};
