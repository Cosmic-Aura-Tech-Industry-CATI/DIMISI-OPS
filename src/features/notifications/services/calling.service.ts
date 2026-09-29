/**
 * Calling Service: Handles Audio/Video call events, ringtone synthesis, and call actions.
 */
import { socketService } from "./socket.service";
import type {
  CallStatus,
  CallType,
  IncomingCallPayload,
  OutgoingCallPayload,
  CallSignalPayload,
  CallEndedPayload,
} from "../types";

type CallStateListener = (state: {
  status: CallStatus;
  incomingCall: IncomingCallPayload | null;
  activeCall: IncomingCallPayload | OutgoingCallPayload | null;
}) => void;

class CallingService {
  private status: CallStatus = "idle";
  private incomingCall: IncomingCallPayload | null = null;
  private activeCall: IncomingCallPayload | OutgoingCallPayload | null = null;
  private stateListeners: Set<CallStateListener> = new Set();

  private audioCtx: AudioContext | null = null;
  private ringIntervalId: any = null;

  constructor() {
    this.setupSocketListeners();
  }

  private setupSocketListeners() {
    socketService.on("incoming_call", (payload: IncomingCallPayload) => {
      this.handleIncomingCall(payload);
    });

    socketService.on("call_accepted", (data: any) => {
      this.handleCallAccepted(data);
    });

    socketService.on("call_rejected", (data: any) => {
      this.handleCallRejected(data);
    });

    socketService.on("call_ended", (payload: CallEndedPayload) => {
      this.handleCallEnded(payload);
    });
  }

  private notifyStateChange() {
    const currentState = {
      status: this.status,
      incomingCall: this.incomingCall,
      activeCall: this.activeCall,
    };
    this.stateListeners.forEach((listener) => {
      try {
        listener(currentState);
      } catch (err) {
        console.error("[CallingService] Listener error:", err);
      }
    });
  }

  subscribe(listener: CallStateListener): () => void {
    this.stateListeners.add(listener);
    listener({
      status: this.status,
      incomingCall: this.incomingCall,
      activeCall: this.activeCall,
    });
    return () => {
      this.stateListeners.delete(listener);
    };
  }

  /* ------------------------------ Sound System ------------------------------ */

  private startRingtone() {
    if (typeof window === "undefined") return;
    this.stopRingtone();

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      this.audioCtx = new AudioContextClass();

      const playRingChime = () => {
        if (!this.audioCtx || this.audioCtx.state === "closed") return;
        const now = this.audioCtx.currentTime;

        const osc1 = this.audioCtx.createOscillator();
        const gain1 = this.audioCtx.createGain();
        osc1.type = "sine";
        osc1.frequency.setValueAtTime(440, now);
        gain1.gain.setValueAtTime(0.12, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
        osc1.connect(gain1);
        gain1.connect(this.audioCtx.destination);
        osc1.start(now);
        osc1.stop(now + 0.8);

        const osc2 = this.audioCtx.createOscillator();
        const gain2 = this.audioCtx.createGain();
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(480, now + 0.15);
        gain2.gain.setValueAtTime(0.12, now + 0.15);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.95);
        osc2.connect(gain2);
        gain2.connect(this.audioCtx.destination);
        osc2.start(now + 0.15);
        osc2.stop(now + 0.95);
      };

      playRingChime();
      this.ringIntervalId = setInterval(playRingChime, 2500);
    } catch {
      // Audio autoplay policy handled gracefully
    }
  }

  private stopRingtone() {
    if (this.ringIntervalId) {
      clearInterval(this.ringIntervalId);
      this.ringIntervalId = null;
    }
    if (this.audioCtx) {
      try {
        void this.audioCtx.close();
      } catch {}
      this.audioCtx = null;
    }
  }

  /* ----------------------------- Call Handlers ----------------------------- */

  private handleIncomingCall(payload: IncomingCallPayload) {
    if (this.status !== "idle") {
      socketService.emitCallRejected({
        callId: payload.callId,
        reason: "busy",
      });
      return;
    }

    this.status = "incoming";
    this.incomingCall = payload;
    this.activeCall = payload;
    this.startRingtone();
    this.notifyStateChange();
  }

  private handleCallAccepted(_data: any) {
    this.stopRingtone();
    this.status = "connected";
    this.incomingCall = null;
    this.notifyStateChange();
  }

  private handleCallRejected(_data: any) {
    this.stopRingtone();
    this.status = "declined";
    this.incomingCall = null;
    this.activeCall = null;
    this.notifyStateChange();

    setTimeout(() => {
      if (this.status === "declined") {
        this.status = "idle";
        this.notifyStateChange();
      }
    }, 1500);
  }

  private handleCallEnded(_payload: CallEndedPayload) {
    this.stopRingtone();
    this.status = "ended";
    this.incomingCall = null;
    this.activeCall = null;
    this.notifyStateChange();

    setTimeout(() => {
      if (this.status === "ended") {
        this.status = "idle";
        this.notifyStateChange();
      }
    }, 1500);
  }

  /* ------------------------------ Public API ------------------------------ */

  /**
   * Initiate an outgoing call
   */
  startCall(params: {
    recipientId: string;
    recipientName: string;
    recipientAvatar?: string;
    callType: CallType;
    roomUrl?: string;
  }) {
    const callId = `call_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const payload: OutgoingCallPayload = {
      callId,
      recipientId: params.recipientId,
      recipientName: params.recipientName,
      recipientAvatar: params.recipientAvatar,
      callType: params.callType,
      roomUrl: params.roomUrl,
    };

    this.status = "outgoing";
    this.activeCall = payload;
    this.incomingCall = null;
    this.notifyStateChange();

    socketService.emitIncomingCall({
      callId,
      callerId: params.recipientId,
      callerName: params.recipientName,
      callerAvatar: params.recipientAvatar,
      callType: params.callType,
      roomUrl: params.roomUrl,
      timestamp: Date.now(),
    });

    return callId;
  }

  /**
   * Accept an incoming call
   */
  acceptCall(callId?: string) {
    const id = callId || this.incomingCall?.callId;
    this.stopRingtone();
    if (id) {
      socketService.emitCallAccepted({ callId: id });
    }
    this.status = "connected";
    this.incomingCall = null;
    this.notifyStateChange();
  }

  /**
   * Reject / decline an incoming call
   */
  rejectCall(callId?: string, reason = "declined") {
    const id = callId || this.incomingCall?.callId;
    this.stopRingtone();
    if (id) {
      socketService.emitCallRejected({ callId: id, reason });
    }
    this.status = "declined";
    this.incomingCall = null;
    this.activeCall = null;
    this.notifyStateChange();

    setTimeout(() => {
      this.status = "idle";
      this.notifyStateChange();
    }, 1000);
  }

  /**
   * End an ongoing or active call
   */
  endCall(callId?: string) {
    const id = callId || this.activeCall?.callId;
    this.stopRingtone();
    if (id) {
      socketService.emitCallEnded({ callId: id, reason: "normal" });
    }
    this.status = "ended";
    this.incomingCall = null;
    this.activeCall = null;
    this.notifyStateChange();

    setTimeout(() => {
      this.status = "idle";
      this.notifyStateChange();
    }, 1000);
  }

  /**
   * Send WebRTC signal payload
   */
  sendSignal(payload: CallSignalPayload) {
    socketService.emitCallSignal(payload);
  }

  /**
   * Helper for testing/triggering an incoming call locally
   */
  simulateIncomingCall(override?: Partial<IncomingCallPayload>) {
    const mockCall: IncomingCallPayload = {
      callId: `call_${Date.now()}`,
      callerId: "sim-user-1",
      callerName: "Sarah Jenkins (Director)",
      callerAvatar: "SJ",
      callerRole: "Director of Operations",
      callType: "audio",
      timestamp: Date.now(),
      ...override,
    };
    this.handleIncomingCall(mockCall);
  }

  getStatus(): CallStatus {
    return this.status;
  }

  getIncomingCall(): IncomingCallPayload | null {
    return this.incomingCall;
  }

  getActiveCall(): IncomingCallPayload | OutgoingCallPayload | null {
    return this.activeCall;
  }
}

export const callingService = new CallingService();
