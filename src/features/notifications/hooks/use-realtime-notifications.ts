/**
 * Hook for managing real-time notifications via Socket.IO events.
 * Listens for backend `notification_created` events using the shared Socket.IO instance,
 * updates TanStack Query cache immediately, updates unread count,
 * displays toasts, prevents duplicate alerts, and handles reconnection recovery.
 */
import { useEffect } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Socket } from "socket.io-client";
import { queryKeys } from "@/api/client/query-keys";
import { useAuth } from "@/lib/auth";
import { socketService } from "../services/socket.service";
import type { NotificationItem, SocketUserEvent } from "../types";

/** Module-level deduplication set to prevent duplicate notifications/toasts across components */
const seenNotificationIds = new Set<string>();

/** Reference-counting subscriber manager to prevent duplicate socket subscriptions */
let subscriberCount = 0;
let activeSocket: Socket | null = null;
let activeQueryClient: QueryClient | null = null;
let activeUserId: string | null = null;

/**
 * Extracts and normalizes the notification payload from various backend socket event shapes.
 * Handles `{ event: "notification_created", notification: { ... } }`, `{ notification: { ... } }`,
 * or direct `{ _id: "...", title: "..." }`.
 */
export function extractNotificationPayload(data: unknown): unknown {
  if (!data) return null;
  let parsed = data;
  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return null;
    }
  }
  if (!parsed || typeof parsed !== "object") return null;

  const obj = parsed as Record<string, unknown>;
  if (obj.notification && typeof obj.notification === "object") {
    return obj.notification;
  }
  if (obj.data && typeof obj.data === "object") {
    const nested = obj.data as Record<string, unknown>;
    if (nested.notification && typeof nested.notification === "object") {
      return nested.notification;
    }
    return obj.data;
  }
  return obj;
}

/**
 * Converts a raw backend notification object into the typed frontend NotificationItem.
 */
export function normalizeNotification(raw: unknown): NotificationItem | null {
  const item = extractNotificationPayload(raw);
  if (!item || typeof item !== "object") return null;
  const doc = item as Record<string, unknown>;

  const rawId = String(
    doc._id ||
      doc.id ||
      (doc as any).notificationId ||
      `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
  );

  return {
    _id: rawId,
    id: rawId,
    recipientId: String(doc.recipientId || ""),
    recipientType: typeof doc.recipientType === "string" ? doc.recipientType : "User",
    title: typeof doc.title === "string" && doc.title.trim() ? doc.title.trim() : "New Notification",
    message: typeof doc.message === "string" ? doc.message : "",
    type: (doc.type as string) || "task_assignment",
    isRead: Boolean(doc.isRead),
    createdAt: doc.createdAt
      ? new Date(doc.createdAt as string).toISOString()
      : new Date().toISOString(),
    updatedAt: doc.updatedAt
      ? new Date(doc.updatedAt as string).toISOString()
      : undefined,
    taskId: (doc.taskId || (doc.metadata as any)?.taskId || (doc.dynamicData as any)?.taskId) as string | undefined,
    metadata: (doc.metadata as Record<string, unknown>) || (doc.dynamicData as Record<string, unknown>) || {},
  };
}

/**
 * Dispatches a toast alert using sonner with tone matching the notification category.
 * Sonner's `id` option natively prevents duplicate active toasts with the same ID.
 */
function showNotificationToast(notification: NotificationItem) {
  const toastId = `notification-${notification._id || notification.id}`;
  const title = notification.title;
  const description = notification.message;
  const typeStr = String(notification.type || "").toLowerCase();

  const toastOptions = {
    id: toastId,
    description,
    duration: 5000,
  };

  if (typeStr.includes("approved") || typeStr.includes("points") || typeStr.includes("success")) {
    toast.success(title, toastOptions);
  } else if (typeStr.includes("rejected") || typeStr.includes("error")) {
    toast.error(title, toastOptions);
  } else if (typeStr.includes("deadline") || typeStr.includes("warning")) {
    toast.warning(title, toastOptions);
  } else {
    toast.info(title, toastOptions);
  }
}

/**
 * Stable handler function for incoming `notification_created` Socket.IO events.
 * Used identically for both registration (`socket.on`) and cleanup (`socket.off`).
 */
function handleNotificationCreated(data: unknown) {
  if (!data) return;

  const notification = normalizeNotification(data);
  if (!notification) return;

  // Deduplicate: If this notification was already processed recently, skip
  if (seenNotificationIds.has(notification._id)) {
    return;
  }
  seenNotificationIds.add(notification._id);
  if (seenNotificationIds.size > 500) {
    const first = seenNotificationIds.keys().next().value;
    if (first) seenNotificationIds.delete(first);
  }

  // Recipient verification: Ignore if targeted to a different user
  if (notification.recipientId && activeUserId && notification.recipientId !== activeUserId) {
    return;
  }

  // 1. Immediately update TanStack Query cache without page refresh
  if (activeQueryClient) {
    activeQueryClient.setQueryData<NotificationItem[]>(
      queryKeys.notifications.list(),
      (oldData = []) => {
        const exists = oldData.some(
          (item) =>
            item._id === notification._id ||
            (item.id && item.id === notification.id),
        );
        if (exists) return oldData;
        return [notification, ...oldData];
      },
    );
  }

  // 2. Display instant notification toast with tone and deduplication
  showNotificationToast(notification);

  // 3. Immediately invalidate related tasks, dashboard, and leaderboard caches
  if (activeQueryClient) {
    const typeStr = String(notification.type || "").toLowerCase();
    if (
      typeStr.includes("approved") ||
      typeStr.includes("points") ||
      typeStr.includes("assignment") ||
      typeStr.includes("submission")
    ) {
      void activeQueryClient.invalidateQueries({ queryKey: ["tasks"] });
      void activeQueryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      void activeQueryClient.invalidateQueries({ queryKey: queryKeys.employeeDashboard.all });
      void activeQueryClient.invalidateQueries({ queryKey: queryKeys.leaderboard.all });
    }
  }
}

/**
 * Stable handler for Redis Pub/Sub `user_event` stream forwarding.
 */
function handleUserEvent(payload: SocketUserEvent) {
  if (payload?.event === "notification_created" && payload?.notification) {
    handleNotificationCreated(payload.notification);
  }
}

/**
 * Stable handler for socket reconnection.
 * Re-joins the user-specific room and invalidates the notifications query to recover missed alerts.
 */
function handleReconnect() {
  if (activeUserId) {
    socketService.joinUserRoom(activeUserId);
  }
  if (activeQueryClient) {
    void activeQueryClient.invalidateQueries({
      queryKey: queryKeys.notifications.all,
    });
  }
}

/**
 * React hook to bind the real-time notification listener to the shared Socket.IO instance.
 * Automatically manages listener registration and cleanup without creating duplicate subscriptions.
 */
export function useRealtimeNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.id) {
      if (subscriberCount === 0) {
        socketService.disconnect();
      }
      return;
    }

    // Keep active query client and user ID updated
    activeQueryClient = queryClient;
    activeUserId = user.id;

    // Connect and obtain shared Socket.IO instance
    const socket = socketService.connect(user.id);
    if (!socket) return;

    subscriberCount++;

    // Only register the socket listener once when the first subscriber mounts
    if (subscriberCount === 1) {
      activeSocket = socket;
      socket.on("notification_created", handleNotificationCreated);
      socket.on("user_event", handleUserEvent as any);
      socket.on("reconnect", handleReconnect);
      socketService.on("reconnected", handleReconnect);
    }

    // Clean up when the component unmounts
    return () => {
      subscriberCount--;
      if (subscriberCount === 0 && activeSocket) {
        // Clean up with exact same handler references
        activeSocket.off("notification_created", handleNotificationCreated);
        activeSocket.off("user_event", handleUserEvent as any);
        activeSocket.off("reconnect", handleReconnect);
        socketService.off("reconnected", handleReconnect);
        activeSocket = null;
        // Do NOT disconnect shared socket on unmount — preserved for background use
      }
    };
  }, [user?.id, queryClient]);

  return {
    socket: socketService.getSocket(),
  };
}
