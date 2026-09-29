/** API services for the notifications module (Real database integration, zero demo data). */
import { http } from "@/api/client/client";
import { API_ENDPOINTS } from "@/api/client/endpoints";
import type { NotificationItem } from "../types";

export const notificationsService = {
  /**
   * Fetches real in-app notifications from the backend database for the authenticated user.
   */
  getNotifications: async (): Promise<NotificationItem[]> => {
    try {
      const res = await http.get<any>(API_ENDPOINTS.notifications.list);
      let items: any[] = [];

      if (Array.isArray(res)) {
        items = res;
      } else if (res?.data && Array.isArray(res.data)) {
        items = res.data;
      } else if (res?.notifications && Array.isArray(res.notifications)) {
        items = res.notifications;
      } else if (res?.data?.notifications && Array.isArray(res.data.notifications)) {
        items = res.data.notifications;
      }

      return items.map((item: any) => ({
        _id: String(item._id || item.id || ""),
        id: String(item.id || item._id || ""),
        recipientId: String(item.recipientId || ""),
        recipientType: item.recipientType || "User",
        title: item.title || "Notification",
        message: item.message || "",
        type: item.type || "task_assignment",
        isRead: Boolean(item.isRead),
        createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: item.updatedAt ? new Date(item.updatedAt).toISOString() : undefined,
        taskId: item.taskId || item.metadata?.taskId || item.dynamicData?.taskId || undefined,
        metadata: item.metadata || item.dynamicData || {},
      }));
    } catch (err) {
      console.error("[notificationsService] Failed to fetch real database notifications:", err);
      return [];
    }
  },

  /**
   * Marks a single notification as read in the database.
   */
  markAsRead: async (notificationId: string): Promise<{ message: string }> => {
    const res = await http.patch<{ message: string }>(
      API_ENDPOINTS.notifications.markRead(notificationId),
    );
    return res;
  },

  /**
   * Marks all user notifications as read in the database.
   */
  markAllAsRead: async (): Promise<{ message: string }> => {
    const res = await http.patch<{ message: string }>(
      API_ENDPOINTS.notifications.readAll,
    );
    return res;
  },
};
