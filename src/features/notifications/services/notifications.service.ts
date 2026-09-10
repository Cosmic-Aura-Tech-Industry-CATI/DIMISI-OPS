/** API services for the notifications module. */
import { http } from "@/api/client/client";
import { API_ENDPOINTS } from "@/api/client/endpoints";
import type { NotificationItem } from "../types";

export const notificationsService = {
  getNotifications: async (): Promise<NotificationItem[]> => {
    const res = await http.get<NotificationItem[] | { data: NotificationItem[] }>(
      API_ENDPOINTS.notifications.list,
    );
    if (Array.isArray(res)) return res;
    return (res as any)?.data || [];
  },

  markAsRead: async (notificationId: string): Promise<{ message: string }> => {
    const res = await http.patch<{ message: string }>(
      API_ENDPOINTS.notifications.markRead(notificationId),
    );
    return res;
  },

  markAllAsRead: async (): Promise<{ message: string }> => {
    const res = await http.patch<{ message: string }>(
      API_ENDPOINTS.notifications.readAll,
    );
    return res;
  },
};
