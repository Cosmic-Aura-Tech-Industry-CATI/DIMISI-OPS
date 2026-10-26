import { apiClient, http } from "@/api/client/client";
import { API_ENDPOINTS } from "@/api/client/endpoints";
import type { NotificationItem } from "../types";

export const notificationsService = {
  /**
   * Fetches real in-app notifications from the backend database for the authenticated user.
   */
  getNotifications: async (type?: string): Promise<NotificationItem[]> => {
    try {
      const url = type && type !== "all"
        ? `${API_ENDPOINTS.notifications.list}?type=${encodeURIComponent(type)}`
        : API_ENDPOINTS.notifications.list;
      const res = await apiClient.get<any>(url);
      const raw = res.data;
      let items: any[] = [];

      if (Array.isArray(raw)) {
        items = raw;
      } else if (raw && typeof raw === "object") {
        if (Array.isArray(raw.data)) {
          items = raw.data;
        } else if (Array.isArray(raw.notifications)) {
          items = raw.notifications;
        } else if (raw.data && typeof raw.data === "object") {
          if (Array.isArray(raw.data.notifications)) {
            items = raw.data.notifications;
          } else if (Array.isArray(raw.data.data)) {
            items = raw.data.data;
          }
        }
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
