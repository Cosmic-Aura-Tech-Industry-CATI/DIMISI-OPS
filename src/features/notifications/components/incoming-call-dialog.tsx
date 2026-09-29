/**
 * Interactive Incoming and Active Call dialog.
 */
import { Phone, PhoneOff, Video, Mic, MicOff, Volume2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCallingEvents } from "../hooks/use-calling-events";
import { cn } from "@/lib/utils";

export function IncomingCallDialog() {
  const { incomingCall, activeCall, isIncoming, isConnected, acceptCall, rejectCall, endCall } =
    useCallingEvents();

  const [isMuted, setIsMuted] = useState(false);

  if (!isIncoming && !isConnected) return null;

  if (isIncoming && incomingCall) {
    const isVideo = incomingCall.callType === "video";
    const initials = incomingCall.callerName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
        <div className="glass relative w-full max-w-sm rounded-3xl border border-primary/30 p-6 text-center shadow-2xl animate-in zoom-in-95">
          <div className="relative mx-auto mb-5 flex h-24 w-24 items-center justify-center">
            <div className="absolute h-full w-full animate-ping rounded-full bg-primary/20 duration-1000" />
            <div className="absolute h-20 w-20 animate-pulse rounded-full bg-primary/30" />
            <Avatar className="relative h-18 w-18 border-2 border-primary ring-4 ring-background shadow-lg">
              {incomingCall.callerAvatar?.startsWith("http") ? (
                <AvatarImage src={incomingCall.callerAvatar} alt={incomingCall.callerName} />
              ) : null}
              <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-lg">
                {initials || "U"}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary text-[10px] uppercase tracking-wider">
              {isVideo ? <Video className="mr-1 h-3 w-3" /> : <Phone className="mr-1 h-3 w-3" />}
              Incoming {isVideo ? "Video" : "Audio"} Call
            </Badge>
          </div>

          <h3 className="text-lg font-bold tracking-tight text-foreground truncate">{incomingCall.callerName}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{incomingCall.callerRole || "Team Member"}</p>

          <p className="mt-4 text-xs font-medium text-primary animate-pulse flex items-center justify-center gap-1.5">
            <Volume2 className="h-3.5 w-3.5" /> Ringing…
          </p>

          <div className="mt-6 flex items-center justify-center gap-4">
            <Button
              variant="destructive"
              size="lg"
              onClick={() => rejectCall(incomingCall.callId)}
              className="h-12 w-12 rounded-full p-0 shadow-md hover:scale-105 transition-transform"
              title="Decline Call"
            >
              <PhoneOff className="h-5 w-5" />
            </Button>

            <Button
              variant="default"
              size="lg"
              onClick={() => acceptCall(incomingCall.callId)}
              className="h-14 w-14 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white p-0 shadow-lg hover:scale-105 transition-transform ring-4 ring-emerald-500/20"
              title="Accept Call"
            >
              {isVideo ? <Video className="h-6 w-6" /> : <Phone className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isConnected && activeCall) {
    const callerName = "callerName" in activeCall ? activeCall.callerName : (activeCall as any).recipientName || "Call";

    return (
      <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5">
        <div className="glass flex items-center gap-3.5 rounded-full border border-emerald-500/40 bg-background/90 px-4 py-2.5 shadow-2xl backdrop-blur-lg">
          <div className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
          </div>

          <div className="flex flex-col min-w-0 pr-2">
            <span className="text-xs font-semibold text-foreground truncate max-w-[140px]">{callerName}</span>
            <span className="text-[10px] text-emerald-500 font-medium">Connected</span>
          </div>

          <Button
            size="icon"
            variant="ghost"
            className={cn("h-8 w-8 rounded-full", isMuted && "bg-destructive/20 text-destructive")}
            onClick={() => setIsMuted(!isMuted)}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>

          <Button
            size="icon"
            variant="destructive"
            className="h-8 w-8 rounded-full shadow"
            onClick={() => endCall(activeCall.callId)}
            title="End Call"
          >
            <PhoneOff className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
