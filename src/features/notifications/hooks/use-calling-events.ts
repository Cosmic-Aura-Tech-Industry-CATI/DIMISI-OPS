/**
 * Hook for managing Audio/Video Calling events and real-time state.
 */
import { useEffect, useState, useCallback } from "react";
import { callingService } from "../services/calling.service";
import type {
  CallStatus,
  CallType,
  IncomingCallPayload,
  OutgoingCallPayload,
} from "../types";

export function useCallingEvents() {
  const [callState, setCallState] = useState<{
    status: CallStatus;
    incomingCall: IncomingCallPayload | null;
    activeCall: IncomingCallPayload | OutgoingCallPayload | null;
  }>({
    status: callingService.getStatus(),
    incomingCall: callingService.getIncomingCall(),
    activeCall: callingService.getActiveCall(),
  });

  useEffect(() => {
    const unsubscribe = callingService.subscribe((newState) => {
      setCallState(newState);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const acceptCall = useCallback((callId?: string) => {
    callingService.acceptCall(callId);
  }, []);

  const rejectCall = useCallback((callId?: string, reason?: string) => {
    callingService.rejectCall(callId, reason);
  }, []);

  const endCall = useCallback((callId?: string) => {
    callingService.endCall(callId);
  }, []);

  const startCall = useCallback(
    (params: {
      recipientId: string;
      recipientName: string;
      recipientAvatar?: string;
      callType: CallType;
      roomUrl?: string;
    }) => {
      return callingService.startCall(params);
    },
    [],
  );

  const simulateIncomingCall = useCallback(
    (override?: Partial<IncomingCallPayload>) => {
      callingService.simulateIncomingCall(override);
    },
    [],
  );

  return {
    status: callState.status,
    incomingCall: callState.incomingCall,
    activeCall: callState.activeCall,
    isIncoming: callState.status === "incoming",
    isOutgoing: callState.status === "outgoing",
    isConnected: callState.status === "connected",
    isIdle: callState.status === "idle",
    acceptCall,
    rejectCall,
    endCall,
    startCall,
    simulateIncomingCall,
  };
}
