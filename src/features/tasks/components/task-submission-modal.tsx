import React, { useState, useEffect, useRef } from "react";
import { Send, FileText, AlertCircle, Trophy, Calendar } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TaskPriorityBadge } from "@/components/task-status-badge";
import { useSubmitTaskMutation } from "../hooks/use-tasks-api";
import type { Task } from "../types";

interface TaskSubmissionModalProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function TaskSubmissionModal({
  task,
  open,
  onOpenChange,
  onSuccess,
}: TaskSubmissionModalProps) {
  const [notes, setNotes] = useState("");
  const [touched, setTouched] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const submitMutation = useSubmitTaskMutation({
    onSuccess: () => {
      onOpenChange(false);
      setNotes("");
      setTouched(false);
      onSuccess?.();
    },
  });

  useEffect(() => {
    if (open && task) {
      setNotes(task.notes && !task.notes.includes("Admin Feedback:") ? task.notes : "");
      setTouched(false);
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [open, task]);

  if (!task) return null;

  const trimmed = notes.trim();
  const isValidLength = trimmed.length >= 10 && trimmed.length <= 5000;
  const isTooShort = touched && trimmed.length > 0 && trimmed.length < 10;
  const isTooLong = trimmed.length > 5000;
  const isEmpty = touched && trimmed.length === 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);

    if (!trimmed) {
      toast.error("Submission notes required", {
        description: "Please describe your completed work or deliverables before submitting.",
      });
      textareaRef.current?.focus();
      return;
    }

    if (trimmed.length < 10) {
      toast.error("Submission notes too short", {
        description: "Please enter at least 10 characters describing your work.",
      });
      textareaRef.current?.focus();
      return;
    }

    if (trimmed.length > 5000) {
      toast.error("Submission notes too long", {
        description: "Character limit exceeded (maximum 5000 characters).",
      });
      return;
    }

    const taskId = task._id || task.id;
    if (!taskId) {
      toast.error("Unable to identify task ID for submission.");
      return;
    }

    submitMutation.mutate({
      id: taskId,
      notes: trimmed,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl sm:rounded-3xl border-border/60 bg-background/95 backdrop-blur-xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <DialogHeader className="space-y-1.5 text-left">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary">
                <FileText className="h-4 w-4" />
              </span>
              <DialogTitle className="font-display text-xl font-bold">
                Submit Task For Review
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Provide detailed notes, repository links, or execution logs. An admin will review your submission to approve points.
            </DialogDescription>
          </DialogHeader>

          {/* Task Summary Banner */}
          <div className="rounded-2xl border border-border/50 bg-card/40 p-4 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h4 className="font-semibold text-sm line-clamp-1">{task.title}</h4>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{task.description}</p>
              </div>
              <TaskPriorityBadge priority={task.priority} />
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-muted-foreground border-t border-border/30">
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3 w-3 text-primary" />
                Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No deadline"}
              </span>
              <span className="inline-flex items-center gap-1 font-medium text-warning">
                <Trophy className="h-3 w-3" />
                {task.points || task.rewardPoints || 0} Reward Points
              </span>
            </div>
          </div>

          {/* Submission Notes Field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="submission-notes" className="text-sm font-medium">
                Work Summary & Deliverables <span className="text-destructive">*</span>
              </Label>
              <span className={`text-xs ${trimmed.length > 5000 ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
                {trimmed.length} / 5000 chars
              </span>
            </div>

            <Textarea
              id="submission-notes"
              ref={textareaRef}
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                setTouched(true);
              }}
              onBlur={() => setTouched(true)}
              rows={6}
              disabled={submitMutation.isPending}
              placeholder={`Completed employee attendance module.\n\nImplemented APIs.\nFixed validation bugs.\n\nPR:\nhttps://github.com/company/repo/pull/52`}
              className={`rounded-2xl resize-none font-sans text-sm ${
                isTooShort || isTooLong || isEmpty ? "border-destructive focus-visible:ring-destructive" : ""
              }`}
            />

            {/* Validation Feedback */}
            {isEmpty && (
              <p className="flex items-center gap-1 text-xs text-destructive">
                <AlertCircle className="h-3 w-3" /> Submission notes are required.
              </p>
            )}
            {isTooShort && (
              <p className="flex items-center gap-1 text-xs text-destructive">
                <AlertCircle className="h-3 w-3" /> Please enter at least 10 characters describing your completed work.
              </p>
            )}
            {isTooLong && (
              <p className="flex items-center gap-1 text-xs text-destructive">
                <AlertCircle className="h-3 w-3" /> Character limit exceeded (max 5000).
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitMutation.isPending}
              className="rounded-full"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitMutation.isPending}
              className="rounded-full bg-primary text-primary-foreground shadow-glow hover:bg-primary/90"
            >
              {submitMutation.isPending ? (
                "Submitting…"
              ) : (
                <>
                  <Send className="mr-1.5 h-4 w-4" /> Submit For Review
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
