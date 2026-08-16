import { useEffect, useState } from "react";
import { Archive, FolderPlus, Loader2, Save, Trash2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IdBadge } from "@/components/id-badge";
import { useTasksQuery } from "@/features/tasks";
import { projectStats } from "@/lib/projects";
import {
  useCreateProject,
  useDeleteProject,
  useUpdateProject,
  projectColors,
  type Project,
  type FrontendProjectStatus as ProjectStatus,
} from "@/features/projects";

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function ColorPicker({ value, onChange }: { value?: string; onChange: (c: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {projectColors.map((c) => (
        <button
          key={c}
          type="button"
          aria-label={`Colour ${c}`}
          onClick={() => onChange(c)}
          style={{ backgroundColor: c }}
          className={`h-7 w-7 rounded-md border transition-transform ${
            value === c ? "border-primary scale-110" : "border-border/60 hover:scale-105"
          }`}
        />
      ))}
    </div>
  );
}

/** Create New Project */
export function CreateProjectDialog({
  open,
  onOpenChange,
  onCreated,
  createdBy = "Admin",
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated?: (p: Project) => void;
  createdBy?: string;
}) {
  const createMutation = useCreateProject();

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [manager, setManager] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [color, setColor] = useState<string>(projectColors[0]);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (open) {
      setName("");
      setCode("");
      setDescription("");
      setManager("");
      setStatus("active");
      setColor(projectColors[0]);
      setError(undefined);
    }
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError("Project name is required");

    try {
      const newProject = await createMutation.mutateAsync({
        name: name.trim(),
        code: code.trim() || undefined,
        description: description.trim() || undefined,
        managerId: manager.trim() || undefined,
        manager: manager.trim() || undefined,
        status: status,
        color: color,
        createdBy: createdBy,
      });

      onOpenChange(false);
      toast.success("Project created", {
        description: `${newProject.name} · ${newProject.code}`,
      });
      onCreated?.(newProject);
    } catch (err: unknown) {
      const apiErr = err as { message?: string; response?: { data?: { message?: string } } };
      const msg = apiErr?.message || apiErr?.response?.data?.message || "Failed to create project";
      setError(msg);
      toast.error("Failed to create project", { description: msg });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">Create New Project</DialogTitle>
          <DialogDescription>Projects group related tasks employees can pick up.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Project name *" error={error}>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(undefined);
              }}
              placeholder="e.g. Atlas CRM"
              className="h-11"
              autoFocus
              disabled={createMutation.isPending}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Project code (optional)">
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. DMS-001"
                className="h-11 font-mono"
                disabled={createMutation.isPending}
              />
            </Field>
            <Field label="Project manager ID (optional)">
              <Input
                value={manager}
                onChange={(e) => setManager(e.target.value)}
                placeholder="Manager User ID"
                className="h-11"
                disabled={createMutation.isPending}
              />
            </Field>
          </div>
          <Field label="Project description">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="What this project covers…"
              disabled={createMutation.isPending}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Project status">
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as typeof status)}
                disabled={createMutation.isPending}
              >
                <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Project colour (optional)">
              <ColorPicker value={color} onChange={setColor} />
            </Field>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="rounded-md"
              onClick={() => onOpenChange(false)}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="rounded-md shadow-glow"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <FolderPlus className="mr-1.5 h-4 w-4" />
                  Create project
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Rename / edit an existing project */
export function EditProjectDialog({
  open,
  onOpenChange,
  project,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  project?: Project;
}) {
  const updateMutation = useUpdateProject();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [manager, setManager] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("active");
  const [color, setColor] = useState<string | undefined>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (open && project) {
      setName(project.name);
      setDescription(project.description);
      setManager(
        typeof project.managerId === "string"
          ? project.managerId
          : project.managerId?._id || project.manager || ""
      );
      setStatus(project.status);
      setColor(project.color);
      setError(undefined);
    }
  }, [open, project]);

  if (!project) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError("Project name is required");

    try {
      const targetId = project._id || project.id;
      const updated = await updateMutation.mutateAsync({
        id: targetId,
        payload: {
          name: name.trim(),
          description: description.trim(),
          managerId: manager.trim() || null,
          status: status,
          color: color,
        },
      });

      onOpenChange(false);
      toast.success("Project updated", {
        description: `${updated.name} · ${updated.code}`,
      });
    } catch (err: unknown) {
      const apiErr = err as { message?: string; response?: { data?: { message?: string } } };
      const msg = apiErr?.message || apiErr?.response?.data?.message || "Failed to update project";
      setError(msg);
      toast.error("Failed to update project", { description: msg });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">Edit Project</DialogTitle>
          <DialogDescription>Changes apply everywhere this project is referenced.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="flex items-center justify-between rounded-md border border-border/60 bg-card/40 px-3 py-2.5">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Project ID</span>
            <IdBadge id={project.code} />
          </div>
          <Field label="Project name *" error={error}>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(undefined);
              }}
              className="h-11"
              autoFocus
              disabled={updateMutation.isPending}
            />
          </Field>
          <Field label="Project description">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              disabled={updateMutation.isPending}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Project manager ID">
              <Input
                value={manager}
                onChange={(e) => setManager(e.target.value)}
                className="h-11"
                placeholder="Manager User ID"
                disabled={updateMutation.isPending}
              />
            </Field>
            <Field label="Project status">
              <Select
                value={status.toLowerCase()}
                onValueChange={(v) => setStatus(v as ProjectStatus)}
                disabled={updateMutation.isPending}
              >
                <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Project colour">
            <ColorPicker value={color} onChange={setColor} />
          </Field>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="rounded-md"
              onClick={() => onOpenChange(false)}
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="rounded-md shadow-glow"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-1.5 h-4 w-4" />
                  Save changes
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Archive or delete a project, with guard rails around active work. */
export function ArchiveProjectDialog({
  open,
  onOpenChange,
  project,
  onRemoved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  project?: Project;
  onRemoved?: (id: string) => void;
}) {
  const deleteMutation = useDeleteProject();
  const { data: tasks = [] } = useTasksQuery();

  if (!project) return null;
  const targetId = project._id || project.id;
  const stats = projectStats(tasks, targetId);
  const blocked = stats.hasActiveWork;

  const handleArchive = async () => {
    try {
      await deleteMutation.mutateAsync(targetId);
      onOpenChange(false);
      toast.success("Project archived", {
        description: `${project.name} no longer accepts new tasks.`,
      });
      onRemoved?.(targetId);
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      toast.error("Failed to archive project", {
        description: apiErr?.message || "Operation failed",
      });
    }
  };

  const handleDelete = async () => {
    if (blocked) {
      toast.error("This project contains active tasks and cannot be deleted.");
      return;
    }
    try {
      await deleteMutation.mutateAsync(targetId);
      onOpenChange(false);
      toast.success("Project deleted", {
        description: `${project.name} was removed.`,
      });
      onRemoved?.(targetId);
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      toast.error("Failed to delete project", {
        description: apiErr?.message || "Operation failed",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Archive or delete “{project.name}”?</DialogTitle>
          <DialogDescription>
            Archiving keeps history, reports and completed tasks intact — the project simply stops
            accepting new tasks and disappears from the employee project list.
          </DialogDescription>
        </DialogHeader>

        <dl className="grid grid-cols-3 gap-2 rounded-md border border-border/60 bg-card/40 p-3 text-xs">
          <div><dt className="text-muted-foreground">Pending</dt><dd className="mt-0.5 font-medium">{stats.pending}</dd></div>
          <div><dt className="text-muted-foreground">In review</dt><dd className="mt-0.5 font-medium">{stats.inReview}</dd></div>
          <div><dt className="text-muted-foreground">Employees</dt><dd className="mt-0.5 font-medium">{stats.employees}</dd></div>
        </dl>

        {blocked && (
          <p className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            This project contains active tasks and cannot be deleted.
          </p>
        )}

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            className="rounded-md"
            onClick={() => onOpenChange(false)}
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            className="rounded-md"
            disabled={deleteMutation.isPending}
            onClick={handleArchive}
          >
            {deleteMutation.isPending ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Archive className="mr-1.5 h-4 w-4" />
            )}
            Archive project
          </Button>
          <Button
            variant="destructive"
            className="rounded-md"
            disabled={blocked || deleteMutation.isPending}
            onClick={handleDelete}
          >
            {deleteMutation.isPending ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-1.5 h-4 w-4" />
            )}
            Delete project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
