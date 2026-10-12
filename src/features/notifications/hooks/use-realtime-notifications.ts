/**
 * Hook for managing real-time notifications via WebSocket.
 * Listens for backend `notification_created` and `user_event` signals,
 * updates TanStack React Query cache instantaneously, triggers toasts,
 * deduplicates alerts, and handles reconnection recovery.
 */
import { useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/api/client/query-keys";
import { useAuth } from "@/lib/auth";
import { socketService } from "../services/socket.service";
import type { NotificationItem, SocketUserEvent } from "../types";

/** Module-level deduplication set to prevent duplicate notifications/toasts across components */
const seenNotificationIds = new Set<string>();

export function useRealtimeNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const handleNotificationCreated = useCallback(
    (notification: NotificationItem | any) => {
      if (!notification) return;

      const rawId = String(
        notification._id || notification.id || `notif_${Date.now()}`,
      );

      // Deduplicate: If this notification was already processed recently, skip
      if (rawId && seenNotificationIds.has(rawId)) {
        return;
      }
      if (rawId) {
        seenNotificationIds.add(rawId);
        if (seenNotificationIds.size > 200) {
          const first = seenNotificationIds.keys().next().value;
          if (first) seenNotificationIds.delete(first);
        }
      }

      // Check recipient match if recipientId is present
      const recipientId = String(notification.recipientId || "");
      if (recipientId && user?.id && recipientId !== user.id) {
        return;
      }

      const formattedNotification: NotificationItem = {
        _id: rawId,
        id: rawId,
        recipientId: recipientId || user?.id || "",
        recipientType: notification.recipientType || "User",
        title: notification.title || "New Notification",
        message: notification.message || "",
        type: notification.type || "task_assignment",
        isRead: Boolean(notification.isRead),
        createdAt: notification.createdAt
          ? new Date(notification.createdAt).toISOString()
          : new Date().toISOString(),
        updatedAt: notification.updatedAt
          ? new Date(notification.updatedAt).toISOString()
          : undefined,
        taskId:
          notification.taskId ||
          notification.metadata?.taskId ||
          notification.dynamicData?.taskId ||
          undefined,
        metadata: notification.metadata || notification.dynamicData || {},
      };

      // 1. Optimistically prepend new notification to active TanStack Query cache
      queryClient.setQueryData<NotificationItem[]>(
        queryKeys.notifications.list(),
        (oldData = []) => {
          const exists = oldData.some(
            (item) =>
              item._id === formattedNotification._id ||
              (item.id && item.id === formattedNotification.id),
          );
          if (exists) return oldData;
          return [formattedNotification, ...oldData];
        },
      );

      // 2. Invalidate query to ensure full DB sync
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });

      // 3. Display instant notification toast
      toast.info(formattedNotification.title, {
        description: formattedNotification.message,
        duration: 5000,
      });
    },
    [queryClient, user?.id],
  );

  useEffect(() => {
    if (!user?.id) {
      socketService.disconnect();
      return;
    }

    // Connect and join user's private updates room
    socketService.connect(user.id);
    socketService.joinUserRoom(user.id);

    // Listen for notification events
    const unsubCreated = socketService.on("notification_created", (data: any) => {
      const item = data?.notification || data;
      handleNotificationCreated(item);
    });

    const unsubUserEvent = socketService.on("user_event", (payload: SocketUserEvent) => {
      if (payload?.event === "notification_created" && payload?.notification) {
        handleNotificationCreated(payload.notification);
      }
    });

    // Reconnection & missed-notification recovery
    const unsubReconnected = socketService.on("reconnected", () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    });

    return () => {
      unsubCreated();
      unsubUserEvent();
      unsubReconnected();
    };
  }, [user?.id, handleNotificationCreated, queryClient]);

  return {
    socket: socketService.getSocket(),
  };
}
