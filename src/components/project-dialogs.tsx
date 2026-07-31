import { useEffect, useState } from "react";
import { Archive, FolderPlus, Save, Trash2, TriangleAlert } from "lucide-react";
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
import { useAllTasks } from "@/lib/task-store";
import { projectStats } from "@/lib/projects";
import {
  archiveProject,
  createProject,
  deleteProject,
  isNameTaken,
  nextProjectCode,
  projectColors,
  updateProject,
  type Project,
  type ProjectStatus,
} from "@/lib/project-store";

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
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [manager, setManager] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [color, setColor] = useState<string>(projectColors[0]);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (open) {
      setName(""); setCode(""); setDescription(""); setManager("");
      setStatus("active"); setColor(projectColors[0]); setError(undefined);
    }
  }, [open]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError("Project name is required");
    if (isNameTaken(name)) return setError("A project with this name already exists");
    const project = createProject({ name, code, description, manager, status, color, createdBy });
    onOpenChange(false);
    toast.success("Project created", { description: `${project.name} · ${project.code}` });
    onCreated?.(project);
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
            <Input value={name} onChange={(e) => { setName(e.target.value); setError(undefined); }} placeholder="e.g. Atlas CRM" className="h-11" autoFocus />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Project code (optional)">
              <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder={nextProjectCode()} className="h-11 font-mono" />
            </Field>
            <Field label="Project manager (optional)">
              <Input value={manager} onChange={(e) => setManager(e.target.value)} placeholder="e.g. Aarav Mehta" className="h-11" />
            </Field>
          </div>
          <Field label="Project description">
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="What this project covers…" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Project status">
              <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
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
            <Button type="button" variant="outline" className="rounded-md" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="rounded-md shadow-glow"><FolderPlus className="mr-1.5 h-4 w-4" /> Create project</Button>
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
      setManager(project.manager ?? "");
      setStatus(project.status);
      setColor(project.color);
      setError(undefined);
    }
  }, [open, project]);

  if (!project) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError("Project name is required");
    if (isNameTaken(name, project.id)) return setError("A project with this name already exists");
    updateProject(project.id, { name: name.trim(), description: description.trim(), manager: manager.trim() || undefined, status, color });
    onOpenChange(false);
    toast.success("Project updated", { description: `${name.trim()} · ${project.code}` });
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
            <Input value={name} onChange={(e) => { setName(e.target.value); setError(undefined); }} className="h-11" autoFocus />
          </Field>
          <Field label="Project description">
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Project manager">
              <Input value={manager} onChange={(e) => setManager(e.target.value)} className="h-11" placeholder="Unassigned" />
            </Field>
            <Field label="Project status">
              <Select value={status} onValueChange={(v) => setStatus(v as ProjectStatus)}>
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
            <Button type="button" variant="outline" className="rounded-md" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="rounded-md shadow-glow"><Save className="mr-1.5 h-4 w-4" /> Save changes</Button>
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
  const tasks = useAllTasks();
  if (!project) return null;
  const stats = projectStats(tasks, project.id);
  const blocked = stats.hasActiveWork;

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
          <Button variant="outline" className="rounded-md" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            variant="outline"
            className="rounded-md"
            onClick={() => {
              archiveProject(project.id);
              onOpenChange(false);
              toast.success("Project archived", { description: `${project.name} no longer accepts new tasks.` });
              onRemoved?.(project.id);
            }}
          >
            <Archive className="mr-1.5 h-4 w-4" /> Archive project
          </Button>
          <Button
            variant="destructive"
            className="rounded-md"
            disabled={blocked}
            onClick={() => {
              if (blocked) {
                toast.error("This project contains active tasks and cannot be deleted.");
                return;
              }
              deleteProject(project.id);
              onOpenChange(false);
              toast.success("Project deleted", { description: `${project.name} was removed.` });
              onRemoved?.(project.id);
            }}
          >
            <Trash2 className="mr-1.5 h-4 w-4" /> Delete project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
