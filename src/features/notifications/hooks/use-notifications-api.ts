import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/api/client/query-keys";
import { useAuth } from "@/lib/auth";
import { useUserPreferencesQuery } from "@/features/settings/hooks/use-settings-api";
import { notificationsService } from "../services/notifications.service";
import { filterNotificationsByPreferences, useRealtimeNotifications } from "./use-realtime-notifications";
import type { NotificationItem } from "../types";

export function useNotificationsQuery() {
  // Automatically attaches real-time websocket listener for live DB updates
  useRealtimeNotifications();

  return useQuery({
    queryKey: queryKeys.notifications.list(),
    queryFn: () => notificationsService.getNotifications(),
    staleTime: 60 * 1000,
    refetchInterval: false, // Long polling replaced by real-time Socket.IO events
  });
}

/**
 * Hook providing notifications filtered by the user's role and their active in-app preferences.
 */
export function useFilteredNotificationsQuery() {
  const { user } = useAuth();
  const { data: preferences, isLoading: isPrefsLoading } = useUserPreferencesQuery();
  const notifsQuery = useNotificationsQuery();

  const rawNotifications = notifsQuery.data || [];
  const filteredNotifications = useMemo(() => {
    return filterNotificationsByPreferences(
      rawNotifications,
      preferences?.notifications?.inApp,
      user?.role,
    );
  }, [rawNotifications, preferences?.notifications?.inApp, user?.role]);

  return {
    ...notifsQuery,
    rawNotifications,
    data: filteredNotifications,
    isPreferencesLoading: isPrefsLoading,
  };
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
