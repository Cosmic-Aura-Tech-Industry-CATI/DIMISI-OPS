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
    try {
      const res = await http.get<any>(
        API_ENDPOINTS.activity.personal,
        { params: filters },
      );
      const data = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.logs)
            ? res.logs
            : Array.isArray(res?.data?.data)
              ? res.data.data
              : [];
      const total = res?.total ?? res?.data?.total ?? data.length;
      const page = res?.page ?? res?.data?.page ?? 1;
      const totalPages = res?.totalPages ?? res?.data?.totalPages ?? 1;
      return { data, total, page, totalPages };
    } catch (err) {
      console.warn("[activityService.getPersonalLogs] Failed:", err);
      return { data: [], total: 0, page: 1, totalPages: 0 };
    }
  },

  getAdminLogs: async (
    filters?: ActivityQueryFilters,
  ): Promise<PaginatedActivityResponse> => {
    try {
      const res = await http.get<any>(
        API_ENDPOINTS.activity.admin,
        { params: filters },
      );
      const data = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.logs)
            ? res.logs
            : Array.isArray(res?.data?.data)
              ? res.data.data
              : [];
      const total = res?.total ?? res?.data?.total ?? data.length;
      const page = res?.page ?? res?.data?.page ?? 1;
      const totalPages = res?.totalPages ?? res?.data?.totalPages ?? 1;
      return { data, total, page, totalPages };
    } catch (err) {
      console.warn("[activityService.getAdminLogs] Failed:", err);
      return { data: [], total: 0, page: 1, totalPages: 0 };
    }
  },

  getOrgLogs: async (
    filters?: ActivityQueryFilters,
  ): Promise<PaginatedActivityResponse> => {
    try {
      const res = await http.get<any>(
        API_ENDPOINTS.activity.org,
        { params: filters },
      );
      const data = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.logs)
            ? res.logs
            : Array.isArray(res?.data?.data)
              ? res.data.data
              : [];
      const total = res?.total ?? res?.data?.total ?? data.length;
      const page = res?.page ?? res?.data?.page ?? 1;
      const totalPages = res?.totalPages ?? res?.data?.totalPages ?? 1;
      return { data, total, page, totalPages };
    } catch (err) {
      console.warn("[activityService.getOrgLogs] Failed:", err);
      return { data: [], total: 0, page: 1, totalPages: 0 };
    }
  },
};
