/** React Query hooks for the notifications module with real-time websocket sync. */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/api/client/query-keys";
import { notificationsService } from "../services/notifications.service";
import { useRealtimeNotifications } from "./use-realtime-notifications";
import type { NotificationItem } from "../types";

export function useNotificationsQuery() {
  // Automatically attaches real-time websocket listener for live DB updates
  useRealtimeNotifications();

  return useQuery({
    queryKey: queryKeys.notifications.list(),
    queryFn: () => notificationsService.getNotifications(),
    staleTime: 10 * 1000,
    refetchInterval: 20 * 1000, // Background polling fallback
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
