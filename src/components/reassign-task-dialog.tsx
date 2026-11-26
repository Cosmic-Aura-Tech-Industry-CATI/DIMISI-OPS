import { useMemo, useState, useEffect } from "react";
import { Calendar, Loader2, UserCheck, AlertTriangle } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IdBadge } from "@/components/id-badge";
import { UserAvatar, getAvatarUrl } from "@/components/user-avatar";
import { useEmployeesQuery } from "@/features/employees";
import { useReassignTask, type Task } from "@/features/tasks";

interface ReassignTaskDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (updatedTask: Task) => void;
}

export function ReassignTaskDialog({
  task,
  open,
  onOpenChange,
  onSuccess,
}: ReassignTaskDialogProps) {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [newDeadline, setNewDeadline] = useState<string>("");

  const reassignMutation = useReassignTask();

  // Fetch active employees
  const { data: employeeData, isLoading: isEmployeesLoading } = useEmployeesQuery({
    limit: 100,
    status: "active",
  });

  const activeEmployees = useMemo(() => {
    const list = employeeData?.employees || (Array.isArray(employeeData) ? employeeData : []);
    return list.filter(
      (e) =>
        e.isActive !== false &&
        (e.status === undefined || e.status.toLowerCase() === "active"),
    );
  }, [employeeData]);

  // Set default deadline to 3 days from now whenever the dialog opens
  useEffect(() => {
    if (open) {
      setSelectedEmployeeId("");
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 3);
      setNewDeadline(defaultDate.toISOString().slice(0, 10));
    }
  }, [open, task]);

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;
    if (!selectedEmployeeId) {
      toast.error("Please select an employee to reassign this task to.");
      return;
    }

    const selectedEmp = activeEmployees.find(
      (e) => (e._id || e.id) === selectedEmployeeId,
    );
    const empName = selectedEmp?.name || "Employee";

    try {
      const updated = await reassignMutation.mutateAsync({
        id: task.id || task._id,
        employeeId: selectedEmployeeId,
        deadline: newDeadline || undefined,
        status: "assigned",
      });

      toast.success(`Task reassigned to ${empName} successfully!`);
      onSuccess?.(updated);
      onOpenChange(false);
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : "An error occurred while reassigning the task.";
      toast.error("Failed to reassign task", { description: errorMsg });
    }
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-warning" />
              Reassign Overdue Task
            </DialogTitle>
            <DialogDescription>
              Assign this task to another team member and provide an extended deadline.
            </DialogDescription>
          </DialogHeader>

          {/* Overdue Task Context Card */}
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3.5 text-xs space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="font-semibold text-foreground text-sm block truncate">
                  {task.title}
                </span>
                <span className="text-muted-foreground flex items-center gap-1 mt-0.5">
                  <IdBadge id={task.id} /> • {task.category}
                </span>
              </div>
              <span className="shrink-0 rounded-sm bg-destructive/15 px-2 py-0.5 font-medium text-destructive uppercase tracking-wider text-[10px]">
                Overdue
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/40 text-muted-foreground">
              <div>
                <span className="block text-[10px] uppercase">Current Assignee</span>
                <span className="font-medium text-foreground truncate block">
                  {task.assignee || "Unassigned"}
                </span>
              </div>
              <div>
                <span className="block text-[10px] uppercase">Past Deadline</span>
                <span className="font-medium text-destructive truncate block">
                  {task.dueDate || "Not set"}
                </span>
              </div>
            </div>
          </div>

          {/* New Assignee Select */}
          <div className="space-y-1.5">
            <Label htmlFor="assignee-select" className="text-xs font-medium">
              New Assignee <span className="text-destructive">*</span>
            </Label>
            <Select
              value={selectedEmployeeId}
              onValueChange={setSelectedEmployeeId}
              disabled={isEmployeesLoading || reassignMutation.isPending}
            >
              <SelectTrigger id="assignee-select" className="w-full">
                <SelectValue placeholder={isEmployeesLoading ? "Loading employees..." : "Choose teammate..."} />
              </SelectTrigger>
              <SelectContent className="max-h-56">
                {activeEmployees.map((emp) => {
                  const empId = emp._id || emp.id || "";
                  const code = emp.empId || emp.code;
                  return (
                    <SelectItem key={empId} value={empId}>
                      <div className="flex items-center gap-2">
                        <UserAvatar user={emp} name={emp.name} className="h-5 w-5" />
                        <span className="font-medium">{emp.name}</span>
                        {code && <span className="text-xs text-muted-foreground">({code})</span>}
                        {emp.department && (
                          <span className="text-xs text-muted-foreground/80">
                            • {typeof emp.department === "object" ? emp.department.name : emp.department}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* New Deadline Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="reassign-deadline" className="text-xs font-medium">
                New Deadline
              </Label>
              <span className="text-[10px] text-muted-foreground">Must be today or later</span>
            </div>
            <div className="relative">
              <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="reassign-deadline"
                type="date"
                min={todayStr}
                value={newDeadline}
                onChange={(e) => setNewDeadline(e.target.value)}
                className="pl-9 text-xs"
                disabled={reassignMutation.isPending}
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Resets the task status from Overdue to Assigned and grants the new assignee time to complete it.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={reassignMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!selectedEmployeeId || reassignMutation.isPending}
              className="rounded-md shadow-glow"
            >
              {reassignMutation.isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Reassigning...
                </>
              ) : (
                <>
                  <UserCheck className="mr-1.5 h-4 w-4" /> Reassign Task
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
