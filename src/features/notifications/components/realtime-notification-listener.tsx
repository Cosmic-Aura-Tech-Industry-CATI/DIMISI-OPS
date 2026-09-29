/**
 * Realtime Notification and Calling Event Listener component.
 * Activates real-time socket subscription and displays call alerts.
 */
import { useRealtimeNotifications } from "../hooks/use-realtime-notifications";
import { IncomingCallDialog } from "./incoming-call-dialog";

export function RealtimeNotificationListener() {
  useRealtimeNotifications();

  return <IncomingCallDialog />;
}
