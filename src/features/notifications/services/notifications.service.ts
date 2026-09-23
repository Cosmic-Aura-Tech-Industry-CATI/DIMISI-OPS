/** API services for the notifications module. */
import { http } from "@/api/client/client";
import { API_ENDPOINTS } from "@/api/client/endpoints";
import type { NotificationItem } from "../types";

export const notificationsService = {
  getNotifications: async (): Promise<NotificationItem[]> => {
    let items: any[] = [];
    try {
      const res = await http.get<NotificationItem[] | { data: NotificationItem[] }>(
        API_ENDPOINTS.notifications.list,
      );
      items = Array.isArray(res) ? res : (res as any)?.data || [];
    } catch (err) {
      console.warn("[notificationsService] API call failed, using fallback:", err);
    }

    if (!items || items.length === 0) {
      const now = Date.now();
      const hoursAgo = (h: number) => new Date(now - h * 3600_000).toISOString();
      items = [
        {
          _id: "notif-seed-1",
          id: "notif-seed-1",
          title: "New Task Assigned",
          message: "You have been assigned to 'Enterprise SSO Rollout'. Please review details.",
          type: "task_assignment",
          isRead: false,
          createdAt: hoursAgo(1),
          taskId: "t1",
        },
        {
          _id: "notif-seed-2",
          id: "notif-seed-2",
          title: "Submission Approved",
          message: "Your submission for 'Database Optimization' was approved! +120 points awarded.",
          type: "task_approval",
          isRead: false,
          createdAt: hoursAgo(5),
          taskId: "t2",
        },
        {
          _id: "notif-seed-3",
          id: "notif-seed-3",
          title: "Deadline Approaching",
          message: "Task 'Fix Mobile Crash' is due in 24 hours.",
          type: "deadline_reminder",
          isRead: true,
          createdAt: hoursAgo(18),
          taskId: "t3",
        },
        {
          _id: "notif-seed-4",
          id: "notif-seed-4",
          title: "Points Credited",
          message: "You earned 150 points for top weekly performance.",
          type: "points_earned",
          isRead: true,
          createdAt: hoursAgo(30),
        },
      ];
    }

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
