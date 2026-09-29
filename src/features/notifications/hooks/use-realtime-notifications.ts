/**
 * Hook for managing real-time notifications via WebSocket.
 * Listens for backend `notification_created` and `user_event` signals,
 * updates TanStack React Query cache instantaneously, and triggers toasts.
 */
import { useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/api/client/query-keys";
import { useAuth } from "@/lib/auth";
import { socketService } from "../services/socket.service";
import type { NotificationItem, SocketUserEvent } from "../types";

export function useRealtimeNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const handleNotificationCreated = useCallback(
    (notification: NotificationItem | any) => {
      if (!notification) return;

      const formattedNotification: NotificationItem = {
        _id: String(notification._id || notification.id || `notif_${Date.now()}`),
        id: String(notification.id || notification._id || `notif_${Date.now()}`),
        recipientId: String(notification.recipientId || user?.id || ""),
        recipientType: notification.recipientType || "User",
        title: notification.title || "New Notification",
        message: notification.message || "",
        type: notification.type || "task_assignment",
        isRead: Boolean(notification.isRead),
        createdAt: notification.createdAt ? new Date(notification.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: notification.updatedAt ? new Date(notification.updatedAt).toISOString() : undefined,
        taskId: notification.taskId || notification.metadata?.taskId || notification.dynamicData?.taskId || undefined,
        metadata: notification.metadata || notification.dynamicData || {},
      };

      // 1. Optimistically prepend new notification to active cache
      queryClient.setQueryData<NotificationItem[]>(
        queryKeys.notifications.list(),
        (oldData = []) => {
          const exists = oldData.some(
            (item) => item._id === formattedNotification._id || (item.id && item.id === formattedNotification.id),
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

    // Connect and join room
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

    return () => {
      unsubCreated();
      unsubUserEvent();
    };
  }, [user?.id, handleNotificationCreated]);

  return {
    socket: socketService.getSocket(),
  };
}
