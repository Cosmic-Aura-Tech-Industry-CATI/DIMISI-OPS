/** API services for the notifications module. */
import { http } from "@/api/client/client";
import { API_ENDPOINTS } from "@/api/client/endpoints";
import type { NotificationItem } from "../types";

export const notificationsService = {
  getNotifications: async (): Promise<NotificationItem[]> => {
    const res = await http.get<NotificationItem[] | { data: NotificationItem[] }>(
      API_ENDPOINTS.notifications.list,
    );
    const items = Array.isArray(res) ? res : (res as any)?.data || [];
    return items.map((item: any) => ({
      _id: item._id || item.id || "",
      id: item.id || item._id || "",
      recipientId: item.recipientId || "",
      title: item.title || "Notification",
      message: item.message || "",
      type: item.type || "notification",
      isRead: Boolean(item.isRead),
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: item.updatedAt,
      taskId: item.taskId || item.metadata?.taskId || item.dynamicData?.taskId || undefined,
    }));
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
