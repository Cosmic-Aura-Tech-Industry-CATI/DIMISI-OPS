import { useState } from "react";
import { Archive, CalendarDays, FileUp, FolderKanban, FolderPlus, Globe, Paperclip, Pencil, Save, Target, Timer, Trophy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { employees, type Task, type TaskPriority, type TaskType } from "@/lib/mock-data";
import { projectById } from "@/lib/projects";
import { useActiveProjects, useProjects } from "@/lib/project-store";
import { ArchiveProjectDialog, CreateProjectDialog, EditProjectDialog } from "@/components/project-dialogs";
import { cn } from "@/lib/utils";

export interface TaskFormValues {
  title: string;
  description: string;
  category: string;
  priority: TaskPriority;
  assigneeId: string;
  points: number;
  dueDate: string;
  notes: string;
  attachments: { name: string; size: string }[];
  taskType: TaskType;
  projectId: string;
  template: string;
  estimatedTime: string;
}

export const taskCategories = ["Engineering", "Design", "Product", "Marketing", "Sales", "Support", "Operations"];

export function emptyTaskValues(): TaskFormValues {
  return {
    title: "", description: "", category: "Engineering", priority: "medium",
    assigneeId: employees[0]?.id ?? "", points: 50, dueDate: "", notes: "", attachments: [],
    taskType: "universal", projectId: "", template: "", estimatedTime: "",
  };
}

export function taskToValues(t: Task): TaskFormValues {
  return {
    title: t.title, description: t.description, category: t.category, priority: t.priority,
    assigneeId: t.assigneeId, points: t.points, dueDate: t.dueDate,
    notes: t.notes ?? "", attachments: t.attachments ?? [],
    taskType: t.taskType ?? "direct", projectId: t.projectId ?? "",
    template: t.projectId ? t.title : "", estimatedTime: t.estimatedTime ?? "",
  };
}

const categoryOptions: { value: TaskType; icon: typeof Globe; emoji: string; title: string; hint: string }[] = [
  {
    value: "universal",
    icon: Globe,
    emoji: "🌐",
    title: "Universal Tasks",
    hint: "Visible to every employee — anyone can voluntarily pick it up. Best for docs, testing, bug fixing, research and small features.",
  },
  {
    value: "project",
    icon: FolderKanban,
    emoji: "📁",
    title: "Project Tasks",
    hint: "Belongs to a specific project. Appears in that project's section on every employee dashboard.",
  },
  {
    value: "direct",
    icon: Target,
    emoji: "🎯",
    title: "Direct Assignment",
    hint: "Assigned immediately to one employee. Nobody else can see or claim it.",
  },
];


export function TaskForm({
  initial,
  submitLabel = "Save task",
  onCancel,
  onSubmit,
}: {
  initial: TaskFormValues;
  submitLabel?: string;
  onCancel: () => void;
  onSubmit: (values: TaskFormValues) => void;
}) {
  const [form, setForm] = useState<TaskFormValues>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dialog, setDialog] = useState<"create" | "edit" | "archive" | null>(null);
  const allProjectList = useProjects();
  const activeProjects = useActiveProjects();
  const selectedProject = allProjectList.find((p) => p.id === form.projectId);

  const set = <K extends keyof TaskFormValues>(k: K, v: TaskFormValues[K]) => setForm({ ...form, [k]: v });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = "Title is required";
    if (!form.description.trim()) errs.description = "Add a short description";
    if (!form.dueDate) errs.dueDate = "Pick a deadline";
    if (form.points <= 0) errs.points = "Points must be greater than 0";
    if (form.taskType === "project" && !form.projectId) errs.projectId = "Pick a project";
    if (form.taskType === "direct" && !form.assigneeId) errs.assigneeId = "Pick an employee";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    onSubmit(form);
  };


  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const next = Array.from(files).map((f) => ({
      name: f.name,
      size: f.size < 1024 * 1024 ? `${(f.size / 1024).toFixed(0)} KB` : `${(f.size / 1024 / 1024).toFixed(1)} MB`,
    }));
    set("attachments", [...form.attachments, ...next]);
  };

  return (
    <form onSubmit={submit} className="grid gap-5 lg:grid-cols-3">
      <div className="glass space-y-5 rounded-2xl p-6 lg:col-span-2">
        <Field label="Title" error={errors.title}>
          <Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Migrate to new analytics SDK" className="h-11" />
        </Field>

        <Field label="Description" error={errors.description}>
          <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="What needs to be done and why…" rows={4} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category">
            <Select value={form.category} onValueChange={(v) => set("category", v)}>
              <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
              <SelectContent>{taskCategories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Priority">
            <Select value={form.priority} onValueChange={(v) => set("priority", v as TaskPriority)}>
              <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>

        <Field label="Notes (optional)">
          <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Internal context for reviewers…" rows={3} />
        </Field>

        <div>
          <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Attachments</Label>
          <label
            htmlFor="task-attachment"
            className="mt-2 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/70 bg-card/40 p-8 text-center transition-colors hover:border-primary/60 hover:bg-primary/5"
          >
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/15 text-primary">
              <FileUp className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium">Drop files or click to upload</p>
            <p className="text-xs text-muted-foreground">PNG, JPG, PDF up to 20 MB (mock)</p>
            <input id="task-attachment" type="file" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
          </label>
          {form.attachments.length > 0 && (
            <ul className="mt-3 space-y-2">
              {form.attachments.map((a, i) => (
                <li key={i} className="flex items-center justify-between rounded-xl border border-border/60 bg-card/40 px-3 py-2 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="truncate">{a.name}</span>
                    <span className="text-xs text-muted-foreground">{a.size}</span>
                  </span>
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7 rounded-md" onClick={() => set("attachments", form.attachments.filter((_, idx) => idx !== i))}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="glass space-y-5 rounded-2xl p-6">
        {/* Task Category — mutually exclusive radio cards */}
        <div className="space-y-3">
          <div>
            <h3 className="font-display text-base font-semibold">Task Category</h3>
            <p className="text-xs text-muted-foreground">Choose how this task reaches employees.</p>
          </div>
          <div role="radiogroup" aria-label="Task Category" className="grid gap-2.5">
            {categoryOptions.map((opt) => {
              const active = form.taskType === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setForm({ ...form, taskType: opt.value })}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-md border p-3.5 text-left transition-all",
                    active
                      ? "border-primary/60 bg-primary/10 shadow-glow"
                      : "border-border/60 bg-card/40 hover:border-primary/40 hover:bg-secondary/40",
                  )}
                >
                  <span className={cn(
                    "mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-md text-base",
                    active ? "bg-primary/20 text-primary" : "bg-secondary/60 text-muted-foreground",
                  )}>
                    <opt.icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-sm font-semibold">
                      <span aria-hidden>{opt.emoji}</span> {opt.title}
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{opt.hint}</span>
                  </span>
                  <span className={cn(
                    "mt-1 grid h-4 w-4 shrink-0 place-items-center rounded-full border",
                    active ? "border-primary" : "border-border",
                  )}>
                    {active && <span className="h-2 w-2 rounded-full bg-primary" />}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {form.taskType === "project" && (
          <>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Project</Label>
                <div className="flex items-center gap-1">
                  <IconAction label="Add project" onClick={() => setDialog("create")}><FolderPlus className="h-3.5 w-3.5" /></IconAction>
                  <IconAction label="Rename project" disabled={!selectedProject} onClick={() => setDialog("edit")}><Pencil className="h-3.5 w-3.5" /></IconAction>
                  <IconAction label="Archive or delete project" disabled={!selectedProject} onClick={() => setDialog("archive")}><Archive className="h-3.5 w-3.5" /></IconAction>
                </div>
              </div>
              <Select
                value={form.projectId}
                onValueChange={(v) => setForm({ ...form, projectId: v, template: "" })}
              >
                <SelectTrigger className="h-11"><SelectValue placeholder="Select a project" /></SelectTrigger>
                <SelectContent>
                  {activeProjects.length === 0 ? (
                    <div className="px-2 py-3 text-xs text-muted-foreground">No active projects — add one.</div>
                  ) : (
                    activeProjects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        <span className="inline-flex items-center gap-2">
                          {p.color && <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: p.color }} />}
                          {p.name}
                          <span className="font-mono text-[10px] tracking-wider text-muted-foreground">{p.code}</span>
                        </span>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.projectId && <p className="text-xs text-destructive">{errors.projectId}</p>}
            </div>

            <CreateProjectDialog
              open={dialog === "create"}
              onOpenChange={(v) => setDialog(v ? "create" : null)}
              onCreated={(p) => setForm((f) => ({ ...f, projectId: p.id, template: "" }))}
            />
            <EditProjectDialog open={dialog === "edit"} onOpenChange={(v) => setDialog(v ? "edit" : null)} project={selectedProject} />
            <ArchiveProjectDialog
              open={dialog === "archive"}
              onOpenChange={(v) => setDialog(v ? "archive" : null)}
              project={selectedProject}
              onRemoved={() => setForm((f) => ({ ...f, projectId: "", template: "" }))}
            />


            {form.projectId && (
              <Field label="Task template">
                <Select
                  value={form.template}
                  onValueChange={(v) => setForm({ ...form, template: v, title: form.title.trim() ? form.title : v })}
                >
                  <SelectTrigger className="h-11"><SelectValue placeholder="Select a task template" /></SelectTrigger>
                  <SelectContent>
                    {(projectById(form.projectId)?.templates ?? []).map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
          </>
        )}

        {form.taskType === "direct" && (
          <Field label="Assign employee" error={errors.assigneeId}>
            <Select value={form.assigneeId} onValueChange={(v) => set("assigneeId", v)}>
              <SelectTrigger className="h-11"><SelectValue placeholder="Select an employee" /></SelectTrigger>
              <SelectContent>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    <span className="inline-flex items-center gap-2">
                      <span className="grid h-5 w-5 place-items-center rounded-full bg-primary/20 text-[10px] font-semibold text-primary">{e.avatar}</span>
                      {e.name}
                      <span className="font-mono text-[10px] tracking-wider text-muted-foreground">{e.code}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        )}

        <Field label="Estimated time (optional)">
          <div className="relative">
            <Timer className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={form.estimatedTime} onChange={(e) => set("estimatedTime", e.target.value)} placeholder="e.g. 4h or 2 days" className="h-11 pl-9" />
          </div>
        </Field>

        <Field label="Reward points">
          <div className="relative">
            <Trophy className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-warning" />
            <Input
              type="number" min={0} step={5}
              value={form.points}
              onChange={(e) => set("points", Number(e.target.value))}
              className="h-11 pl-9"
            />
          </div>
          {errors.points && <p className="text-xs text-destructive">{errors.points}</p>}
        </Field>

        <Field label="Deadline" error={errors.dueDate}>
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input type="date" value={form.dueDate} onChange={(e) => set("dueDate", e.target.value)} className="h-11 pl-9" />
          </div>
        </Field>

        <div className="rounded-xl border border-border/60 bg-card/40 p-4 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">Preview</p>
          <p className="mt-1">{form.title || "Untitled task"}</p>
          <p className="mt-0.5">
            {form.taskType === "direct"
              ? `${employees.find((e) => e.id === form.assigneeId)?.name ?? "Unassigned"} · ${employees.find((e) => e.id === form.assigneeId)?.code ?? "—"}`
              : form.taskType === "project"
                ? `Open to all · ${projectById(form.projectId)?.name ?? "No project"}`
                : "Open to all employees"}
            {" · "}{form.priority} priority · {form.points} pts
          </p>
        </div>


        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" className="rounded-md" onClick={onCancel}>Cancel</Button>
          <Button type="submit" className="rounded-md shadow-glow"><Save className="mr-1.5 h-4 w-4" /> {submitLabel}</Button>
        </div>
      </div>
    </form>
  );
}

function IconAction({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="h-7 w-7 rounded-md border-border/60 bg-card/40 text-muted-foreground hover:border-primary/50 hover:text-primary"
    >
      {children}
    </Button>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
