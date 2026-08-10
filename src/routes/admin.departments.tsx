import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AlertCircle,
  Building2,
  Check,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  useDepartmentsQuery,
  useCreateDepartment,
  useUpdateDepartment,
  useDeactivateDepartment,
  useDesignationsByDepartmentQuery,
  useCreateDesignation,
  useUpdateDesignation,
  useDeactivateDesignation,
  type Department,
  type Designation,
  type CreateDepartmentPayload,
} from "@/features/departments";

export const Route = createFileRoute("/admin/departments")({
  head: () => ({
    meta: [
      { title: "Departments & Designations — Dimisi" },
      {
        name: "description",
        content: "Create and manage departments and designations across the workspace.",
      },
      { property: "og:title", content: "Departments & Designations — Dimisi" },
      {
        property: "og:description",
        content: "Departments and designations management, fully editable by admins and directors.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DepartmentsPage,
});

function DepartmentsPage() {
  const {
    data: departments = [],
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useDepartmentsQuery();

  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Department | null>(null);

  const createMutation = useCreateDepartment();
  const updateMutation = useUpdateDepartment();
  const deleteMutation = useDeactivateDepartment();

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return departments;
    return departments.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.code.toLowerCase().includes(q) ||
        (d.description && d.description.toLowerCase().includes(q)),
    );
  }, [departments, query]);

  return (
    <>
      <PageHeader
        title="Departments"
        subtitle="Create departments and manage the designations available inside each one."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="rounded-md"
              onClick={() => void refetch()}
              disabled={isLoading || isRefetching}
              aria-label="Refresh departments"
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`}
              />
            </Button>
            <Button className="rounded-md" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" /> New department
            </Button>
          </div>
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

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="glass flex flex-col gap-3 rounded-md p-5 border border-border/40"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-md" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
              <Skeleton className="h-24 w-full rounded-md mt-2" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-8 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <div>
            <h3 className="font-semibold text-destructive">
              Failed to load departments
            </h3>
            <p className="text-sm text-muted-foreground">
              {error?.message || "An unexpected error occurred while fetching departments."}
            </p>
          </div>
          <Button
            variant="outline"
            className="mt-2"
            onClick={() => void refetch()}
          >
            Try again
          </Button>
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={query ? "No matching departments" : "No departments found"}
          description={
            query
              ? "Try refining your search query."
              : "Create a department to start grouping designations and roles."
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((dept) => (
            <DepartmentCard
              key={dept._id}
              dept={dept}
              onEdit={() => setEditing(dept)}
              onDelete={() => setPendingDelete(dept)}
            />
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <DepartmentDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        isPending={createMutation.isPending}
        onSubmit={(payload) => {
          createMutation.mutate(payload, {
            onSuccess: () => {
              toast.success("Department created successfully");
              setCreateOpen(false);
            },
            onError: (err) => {
              toast.error(err.message || "Failed to create department");
            },
          });
        }}
      />

      {/* Edit Dialog */}
      <DepartmentDialog
        open={!!editing}
        dept={editing ?? undefined}
        onOpenChange={(open) => !open && setEditing(null)}
        isPending={updateMutation.isPending}
        onSubmit={(payload) => {
          if (!editing) return;
          updateMutation.mutate(
            { id: editing._id, payload },
            {
              onSuccess: () => {
                toast.success("Department updated successfully");
                setEditing(null);
              },
              onError: (err) => {
                toast.error(err.message || "Failed to update department");
              },
            },
          );
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Deactivate {pendingDelete?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate the <strong>{pendingDelete?.name}</strong> (
              {pendingDelete?.code}) department. Existing users and designations
              linked to this department will remain safe.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (!pendingDelete) return;
                deleteMutation.mutate(pendingDelete._id, {
                  onSuccess: () => {
                    toast.success("Department deactivated successfully");
                    setPendingDelete(null);
                  },
                  onError: (err) => {
                    toast.error(
                      err.message || "Failed to deactivate department",
                    );
                  },
                });
              }}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deactivating...
                </>
              ) : (
                "Deactivate"
              )}
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
  const {
    data: designations = [],
    isLoading: isLoadingDesigs,
  } = useDesignationsByDepartmentQuery(dept._id);

  const createDesigMutation = useCreateDesignation();
  const updateDesigMutation = useUpdateDesignation();
  const deleteDesigMutation = useDeactivateDesignation();

  const [newTitle, setNewTitle] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const handleAddDesignation = (e: React.FormEvent) => {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;

    createDesigMutation.mutate(
      {
        departmentId: dept._id,
        name: title,
        title: title,
      },
      {
        onSuccess: () => {
          toast.success(`Added "${title}" designation`);
          setNewTitle("");
        },
        onError: (err) => {
          toast.error(err.message || "Failed to add designation");
        },
      },
    );
  };

  const handleSaveEdit = (desig: Designation) => {
    const updatedTitle = draft.trim();
    if (!updatedTitle) return;

    updateDesigMutation.mutate(
      {
        id: desig._id,
        departmentId: dept._id,
        payload: {
          name: updatedTitle,
          title: updatedTitle,
          departmentId: dept._id,
        },
      },
      {
        onSuccess: () => {
          toast.success("Designation updated");
          setEditId(null);
        },
        onError: (err) => {
          toast.error(err.message || "Failed to update designation");
        },
      },
    );
  };

  const handleDeleteDesig = (desig: Designation) => {
    deleteDesigMutation.mutate(
      { id: desig._id, departmentId: dept._id },
      {
        onSuccess: () => {
          toast.success(`Removed "${desig.title || desig.name}"`);
        },
        onError: (err) => {
          toast.error(err.message || "Failed to remove designation");
        },
      },
    );
  };

  return (
    <div className="glass flex min-w-0 flex-col gap-4 rounded-md p-5 border border-border/50 hover:border-border transition-colors">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-primary/25 bg-primary/10 text-primary">
          <Building2 className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="card-title truncate font-semibold">{dept.name}</p>
            <Badge variant="secondary" className="font-mono text-[10px] uppercase">
              {dept.code}
            </Badge>
          </div>
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {dept.description || `${designations.length} designation(s)`}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onEdit}
            aria-label={`Edit ${dept.name}`}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={onDelete}
            aria-label={`Delete ${dept.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Designations Section */}
      <div className="space-y-2 border-t border-border/40 pt-3">
        <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          <span>Designations ({designations.length})</span>
          {isLoadingDesigs && <Loader2 className="h-3 w-3 animate-spin" />}
        </div>

        {isLoadingDesigs ? (
          <div className="space-y-1.5 py-1">
            <Skeleton className="h-8 w-full rounded-md" />
            <Skeleton className="h-8 w-full rounded-md" />
          </div>
        ) : designations.length === 0 ? (
          <p className="text-xs text-muted-foreground py-1">No designations yet.</p>
        ) : (
          <ul className="space-y-1.5 max-h-44 overflow-y-auto pr-0.5">
            {designations.map((desig) => (
              <li
                key={desig._id}
                className="flex min-w-0 items-center gap-2 rounded-md border border-border/60 bg-card/40 px-2.5 py-1.5"
              >
                {editId === desig._id ? (
                  <>
                    <Input
                      value={draft}
                      autoFocus
                      onChange={(e) => setDraft(e.target.value)}
                      className="h-7 flex-1 text-xs"
                      disabled={updateDesigMutation.isPending}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-emerald-500 hover:text-emerald-600"
                      aria-label="Save designation"
                      disabled={updateDesigMutation.isPending}
                      onClick={() => handleSaveEdit(desig)}
                    >
                      {updateDesigMutation.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Check className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      aria-label="Cancel"
                      disabled={updateDesigMutation.isPending}
                      onClick={() => setEditId(null)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="min-w-0 flex-1 truncate text-xs font-medium">
                      {desig.title || desig.name}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      aria-label={`Rename ${desig.title || desig.name}`}
                      onClick={() => {
                        setEditId(desig._id);
                        setDraft(desig.title || desig.name);
                      }}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-destructive hover:text-destructive"
                      aria-label={`Delete ${desig.title || desig.name}`}
                      disabled={deleteDesigMutation.isPending}
                      onClick={() => handleDeleteDesig(desig)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}

        {/* Add Designation Form */}
        <form className="flex gap-2 pt-1" onSubmit={handleAddDesignation}>
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Add designation"
            className="h-8 text-xs"
            disabled={createDesigMutation.isPending}
          />
          <Button
            type="submit"
            variant="outline"
            className="h-8 rounded-md px-2.5"
            disabled={createDesigMutation.isPending || !newTitle.trim()}
          >
            {createDesigMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
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
  isPending,
  onSubmit,
}: {
  open: boolean;
  dept?: Department;
  onOpenChange: (open: boolean) => void;
  isPending: boolean;
  onSubmit: (payload: CreateDepartmentPayload) => void;
}) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [seeded, setSeeded] = useState<string | null>(null);

  // Sync fields when the dialog opens for a given department
  const key = open ? (dept?._id ?? "new") : null;
  if (key && seeded !== key) {
    setSeeded(key);
    setName(dept?.name ?? "");
    setCode(dept?.code ?? "");
    setDescription(dept?.description ?? "");
    setError("");
  }
  if (!open && seeded !== null) setSeeded(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedCode = code.trim().toUpperCase();

    if (!trimmedName) {
      setError("Department name is required.");
      return;
    }
    if (!trimmedCode) {
      setError("Department code is required (e.g. ENG, HR, DES).");
      return;
    }

    setError("");
    onSubmit({
      name: trimmedName,
      code: trimmedCode,
      description: description.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {dept ? "Edit department" : "New department"}
            </DialogTitle>
            <DialogDescription>
              {dept
                ? "Update department name, code, or description."
                : "Add a new department to organize company roles and designations."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Department name <span className="text-destructive">*</span>
              </label>
              <Input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError("");
                }}
                placeholder="e.g. Engineering"
                disabled={isPending}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Department code <span className="text-destructive">*</span>
              </label>
              <Input
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  if (error) setError("");
                }}
                placeholder="e.g. ENG"
                maxLength={10}
                disabled={isPending}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Description
              </label>
              <Textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What this department is responsible for."
                disabled={isPending}
              />
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="rounded-md"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" className="rounded-md" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : dept ? (
                "Save changes"
              ) : (
                "Create department"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
