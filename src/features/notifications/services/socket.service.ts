/**
 * Real-time Socket.io service for Notifications and Calling events.
 * Connects to the backend WebSocket server with JWT authentication
 * and handles user updates and call events.
 */
import { io, Socket } from "socket.io-client";
import { getAccessToken } from "@/api/client/token-store";
import type {
  CallEventName,
  IncomingCallPayload,
  CallSignalPayload,
  CallEndedPayload,
  SocketUserEvent,
} from "../types";

type EventCallback<T = any> = (data: T) => void;

class RealtimeSocketService {
  private socket: Socket | null = null;
  private currentUserId: string | null = null;
  private eventListeners: Map<string, Set<EventCallback>> = new Map();
  private isConnecting = false;

  /**
   * Resolves the WebSocket server URL based on the environment configuration.
   */
  private getSocketUrl(): string {
    if (import.meta.env.VITE_SOCKET_URL) {
      return import.meta.env.VITE_SOCKET_URL;
    }
    if (import.meta.env.VITE_DEV_BACKEND_URL) {
      return import.meta.env.VITE_DEV_BACKEND_URL;
    }
    if (import.meta.env.VITE_API_BASE_URL) {
      try {
        const url = new URL(import.meta.env.VITE_API_BASE_URL, typeof window !== "undefined" ? window.location.href : "http://localhost:5000");
        return url.origin;
      } catch {
        // Continue to fallback
      }
    }
    if (typeof window !== "undefined") {
      return window.location.origin;
    }
    return "http://127.0.0.1:5000";
  }

  /**
   * Connects to the Socket.io server with JWT authentication.
   */
  connect(userId?: string): Socket | null {
    if (typeof window === "undefined") return null;

    const token = getAccessToken();
    if (!token) {
      this.disconnect();
      return null;
    }

    if (userId) {
      this.currentUserId = userId;
    }

    if (this.socket && this.socket.connected) {
      if (this.currentUserId) {
        this.joinUserRoom(this.currentUserId);
      }
      return this.socket;
    }

    if (this.isConnecting) return this.socket;
    this.isConnecting = true;

    try {
      const socketUrl = this.getSocketUrl();
      this.socket = io(socketUrl, {
        auth: { token },
        extraHeaders: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        autoConnect: true,
      });

      this.socket.on("connect", () => {
        this.isConnecting = false;
        console.log("[Socket] Connected with ID:", this.socket?.id);
        if (this.currentUserId) {
          this.joinUserRoom(this.currentUserId);
        }
      });

      this.socket.on("connect_error", (error) => {
        this.isConnecting = false;
        console.warn("[Socket] Connection notice:", error.message);
      });

      this.socket.on("disconnect", (reason) => {
        this.isConnecting = false;
        console.log("[Socket] Disconnected:", reason);
      });

      // Handle Redis Pub/Sub multi-worker user_event stream
      this.socket.on("user_event", (payload: SocketUserEvent) => {
        if (!payload) return;
        this.dispatchLocalEvent("user_event", payload);
        if (payload.event) {
          this.dispatchLocalEvent(payload.event, payload);
        }
        if (payload.event === "notification_created" && payload.notification) {
          this.dispatchLocalEvent("notification_created", payload.notification);
        }
      });

      // Register standard call and notification event forwarding
      const forwardEvents: CallEventName[] = [
        "notification_created",
        "incoming_call",
        "call_accepted",
        "call_rejected",
        "call_ended",
        "call_signal",
        "call_missed",
        "call_ringing",
        "call_busy",
      ];

      forwardEvents.forEach((eventName) => {
        this.socket?.on(eventName, (data: any) => {
          this.dispatchLocalEvent(eventName, data);
        });
      });

      return this.socket;
    } catch (err) {
      this.isConnecting = false;
      console.error("[Socket] Failed to initialize socket connection:", err);
      return null;
    }
  }

  /**
   * Joins the user-specific room on backend (`user_updates:${userId}`)
   */
  joinUserRoom(userId: string) {
    this.currentUserId = userId;
    if (this.socket && this.socket.connected) {
      const roomName = `user_updates:${userId}`;
      this.socket.emit("join_room", roomName);
      console.log(`[Socket] Joined user room: ${roomName}`);
    }
  }

  /**
   * Leaves user-specific room
   */
  leaveUserRoom(userId: string) {
    if (this.socket && this.socket.connected) {
      const roomName = `user_updates:${userId}`;
      this.socket.emit("leave_room", roomName);
    }
  }

  /**
   * Subscribes to a real-time event. Returns an unsubscribe cleanup callback.
   */
  on<T = any>(eventName: string, callback: EventCallback<T>): () => void {
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, new Set());
    }
    this.eventListeners.get(eventName)!.add(callback);

    return () => {
      this.off(eventName, callback);
    };
  }

  /**
   * Removes an event listener
   */
  off<T = any>(eventName: string, callback: EventCallback<T>) {
    const listeners = this.eventListeners.get(eventName);
    if (listeners) {
      listeners.delete(callback);
      if (listeners.size === 0) {
        this.eventListeners.delete(eventName);
      }
    }
  }

  /**
   * Internal dispatcher for registered local event listeners
   */
  private dispatchLocalEvent(eventName: string, data: any) {
    const listeners = this.eventListeners.get(eventName);
    if (listeners) {
      listeners.forEach((cb) => {
        try {
          cb(data);
        } catch (e) {
          console.error(`[Socket] Listener error for ${eventName}:`, e);
        }
      });
    }
  }

  /* ---------------------- Calling Event Emitters ---------------------- */

  /**
   * Emits an incoming call event
   */
  emitIncomingCall(payload: IncomingCallPayload) {
    if (this.socket && this.socket.connected) {
      this.socket.emit("incoming_call", payload);
    }
    this.dispatchLocalEvent("incoming_call", payload);
  }

  /**
   * Emits a call accepted event
   */
  emitCallAccepted(payload: { callId: string; recipientId?: string; acceptedBy?: string }) {
    if (this.socket && this.socket.connected) {
      this.socket.emit("call_accepted", payload);
    }
    this.dispatchLocalEvent("call_accepted", payload);
  }

  /**
   * Emits a call rejected event
   */
  emitCallRejected(payload: { callId: string; reason?: string; rejectedBy?: string }) {
    if (this.socket && this.socket.connected) {
      this.socket.emit("call_rejected", payload);
    }
    this.dispatchLocalEvent("call_rejected", payload);
  }

  /**
   * Emits a call ended event
   */
  emitCallEnded(payload: CallEndedPayload) {
    if (this.socket && this.socket.connected) {
      this.socket.emit("call_ended", payload);
    }
    this.dispatchLocalEvent("call_ended", payload);
  }

  /**
   * Emits a WebRTC signal payload
   */
  emitCallSignal(payload: CallSignalPayload) {
    if (this.socket && this.socket.connected) {
      this.socket.emit("call_signal", payload);
    }
  }

  /**
   * Disconnects the socket
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnecting = false;
    this.currentUserId = null;
  }

  /**
   * Returns active socket
   */
  getSocket(): Socket | null {
    return this.socket;
  }
}

export const socketService = new RealtimeSocketService();
