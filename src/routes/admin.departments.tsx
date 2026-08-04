import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Building2, Check, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  addDesignation,
  createDepartment,
  deleteDepartment,
  isDepartmentNameTaken,
  removeDesignation,
  renameDesignation,
  updateDepartment,
  useDepartments,
  type Department,
} from "@/lib/department-store";

export const Route = createFileRoute("/admin/departments")({
  head: () => ({
    meta: [
      { title: "Departments — Dimisi" },
      {
        name: "description",
        content: "Create and manage departments and their designations across the workspace.",
      },
      { property: "og:title", content: "Departments — Dimisi" },
      {
        property: "og:description",
        content: "Departments and designations, fully editable by admins and directors.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DepartmentsPage,
});

function DepartmentsPage() {
  const departments = useDepartments();
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Department | null>(null);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return departments;
    return departments.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.designations.some((t) => t.toLowerCase().includes(q)),
    );
  }, [departments, query]);

  return (
    <>
      <PageHeader
        title="Departments"
        subtitle="Create departments and manage the designations available inside each one."
        actions={
          <Button className="rounded-md" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> New department
          </Button>
        }
      />

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search departments or designations"
          className="pl-9"
        />
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No departments found"
          description="Create a department to start grouping designations."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((dept) => (
            <DepartmentCard
              key={dept.id}
              dept={dept}
              onEdit={() => setEditing(dept)}
              onDelete={() => setPendingDelete(dept)}
            />
          ))}
        </div>
      )}

      <DepartmentDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={(name, description) => {
          createDepartment({ name, description });
          setCreateOpen(false);
        }}
      />

      <DepartmentDialog
        open={!!editing}
        dept={editing ?? undefined}
        onOpenChange={(o) => !o && setEditing(null)}
        onSubmit={(name, description) => {
          if (editing) updateDepartment(editing.id, { name, description });
          setEditing(null);
        }}
      />

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {pendingDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the department and its {pendingDelete?.designations.length ?? 0}{" "}
              designation(s). People already assigned keep their current titles.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDelete) deleteDepartment(pendingDelete.id);
                setPendingDelete(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function DepartmentCard({
  dept,
  onEdit,
  onDelete,
}: {
  dept: Department;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [newTitle, setNewTitle] = useState("");
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState("");

  return (
    <div className="glass flex min-w-0 flex-col gap-4 rounded-md p-5">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-primary/25 bg-primary/10 text-primary">
          <Building2 className="h-4.5 w-4.5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="card-title truncate font-semibold">{dept.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {dept.description || `${dept.designations.length} designation(s)`}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit} aria-label="Edit department">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive"
            onClick={onDelete}
            aria-label="Delete department"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Designations
        </p>
        {dept.designations.length === 0 && (
          <p className="text-xs text-muted-foreground">No designations yet.</p>
        )}
        <ul className="space-y-1.5">
          {dept.designations.map((title, i) => (
            <li
              key={`${title}-${i}`}
              className="flex min-w-0 items-center gap-2 rounded-md border border-border/60 bg-card/40 px-2.5 py-1.5"
            >
              {editIndex === i ? (
                <>
                  <Input
                    value={draft}
                    autoFocus
                    onChange={(e) => setDraft(e.target.value)}
                    className="h-8 flex-1"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    aria-label="Save designation"
                    onClick={() => {
                      renameDesignation(dept.id, i, draft);
                      setEditIndex(null);
                    }}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    aria-label="Cancel"
                    onClick={() => setEditIndex(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <span className="min-w-0 flex-1 truncate text-sm">{title}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    aria-label={`Rename ${title}`}
                    onClick={() => {
                      setEditIndex(i);
                      setDraft(title);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive"
                    aria-label={`Delete ${title}`}
                    onClick={() => removeDesignation(dept.id, i)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
            </li>
          ))}
        </ul>

        <form
          className="flex gap-2 pt-1"
          onSubmit={(e) => {
            e.preventDefault();
            if (!newTitle.trim()) return;
            addDesignation(dept.id, newTitle);
            setNewTitle("");
          }}
        >
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Add designation"
            className="h-9"
          />
          <Button type="submit" variant="outline" className="h-9 rounded-md px-3">
            <Plus className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

function DepartmentDialog({
  open,
  dept,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  dept?: Department;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string, description: string) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [seeded, setSeeded] = useState<string | null>(null);

  // sync fields when the dialog opens for a given department
  const key = open ? (dept?.id ?? "new") : null;
  if (key && seeded !== key) {
    setSeeded(key);
    setName(dept?.name ?? "");
    setDescription(dept?.description ?? "");
    setError("");
  }
  if (!open && seeded !== null) setSeeded(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dept ? "Edit department" : "New department"}</DialogTitle>
          <DialogDescription>
            Departments group designations used across employee and admin accounts.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Department name
            </label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Engineering" />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Description
            </label>
            <Textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What this department is responsible for."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="rounded-md" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="rounded-md"
            onClick={() => {
              if (!name.trim()) return setError("Department name is required");
              if (isDepartmentNameTaken(name, dept?.id))
                return setError("A department with this name already exists");
              onSubmit(name, description);
            }}
          >
            {dept ? "Save changes" : "Create department"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
