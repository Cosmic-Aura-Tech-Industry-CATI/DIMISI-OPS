import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/api/client/query-keys";
import { notificationsService } from "../services/notifications.service";
import { useRealtimeNotifications, filterNotificationsByPreferences } from "./use-realtime-notifications";
import type { NotificationItem } from "../types";
import type { UserPreferences } from "@/features/settings/types";
import { useAuth } from "@/lib/auth";

/**
 * Fetch notifications from the API.
 * Pass `type` to filter by NotificationType on the backend.
 */
export function useNotificationsQuery(type?: string) {
  // Automatically attaches real-time websocket listener for live DB updates
  useRealtimeNotifications();

  return useQuery({
    queryKey: queryKeys.notifications.list(type),
    queryFn: () => notificationsService.getNotifications(type),
    staleTime: 60 * 1000,
    refetchInterval: false, // Long polling replaced by real-time Socket.IO events
  });
}

export function useMarkNotificationReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => notificationsService.markAsRead(notificationId),
    onMutate: async (notificationId: string) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.all });
      const previous = queryClient.getQueryData<NotificationItem[]>(queryKeys.notifications.list());

      if (previous) {
        queryClient.setQueryData<NotificationItem[]>(
          queryKeys.notifications.list(),
          previous.map((n) => (n._id === notificationId || n.id === notificationId ? { ...n, isRead: true } : n)),
        );
      }

      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.notifications.list(), context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

export function useMarkAllNotificationsReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationsService.markAllAsRead(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.all });
      const previous = queryClient.getQueryData<NotificationItem[]>(queryKeys.notifications.list());

      if (previous) {
        queryClient.setQueryData<NotificationItem[]>(
          queryKeys.notifications.list(),
          previous.map((n) => ({ ...n, isRead: true })),
        );
      }

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.notifications.list(), context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

/**
 * Fetches notifications and filters them client-side based on the user's
 * active in-app notification preferences and role.
 * Drop-in replacement for useNotificationsQuery in the bell-menu component.
 */
export function useFilteredNotificationsQuery() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useRealtimeNotifications();

  return useQuery({
    queryKey: queryKeys.notifications.list(),
    queryFn: () => notificationsService.getNotifications(),
    staleTime: 60 * 1000,
    refetchInterval: false,
    select: (data: NotificationItem[]) => {
      const prefs = queryClient.getQueryData<UserPreferences>(
        queryKeys.settings.preferences(),
      );
      return filterNotificationsByPreferences(
        data,
        prefs?.notifications?.inApp,
        user?.role,
      );
    },
  });
}
