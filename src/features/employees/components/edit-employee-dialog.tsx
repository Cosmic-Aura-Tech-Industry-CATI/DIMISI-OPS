import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { AuthUser } from "@/auth/types/auth";
import { useUpdateEmployeeDetails } from "@/features/employees/hooks/use-employees-api";
import {
  useDepartmentsQuery,
  useDesignationsByDepartmentQuery,
} from "@/features/departments";
import { IdBadge } from "@/components/id-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export function EditEmployeeDialog({
  employee,
  open,
  onOpenChange,
}: {
  employee: AuthUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const updateMutation = useUpdateEmployeeDetails();
  const { data: departments = [], isLoading: isLoadingDepts } = useDepartmentsQuery();

  const [form, setForm] = useState({
    name: "",
    email: "",
    department: "",
    designation: "",
    status: "active" as "active" | "inactive",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const {
    data: designations = [],
    isLoading: isLoadingDesigs,
    isFetching: isFetchingDesigs,
  } = useDesignationsByDepartmentQuery(form.department);

  useEffect(() => {
    if (employee && open) {
      const deptId =
        typeof employee.department === "object" && employee.department
          ? (employee.department as { _id?: string; id?: string })._id ||
            (employee.department as { id?: string }).id ||
            ""
          : (employee.department as string) || "";

      const desigId =
        typeof employee.designation === "object" && employee.designation
          ? (employee.designation as { _id?: string; id?: string })._id ||
            (employee.designation as { id?: string }).id ||
            ""
          : (employee.designation as string) || "";

      setForm({
        name: employee.name || "",
        email: employee.email || "",
        department: deptId,
        designation: desigId,
        status: employee.isActive === false ? "inactive" : "active",
      });
      setErrors({});
    }
  }, [employee, open]);

  const empCode =
    employee?.empId || employee?.code || employee?._id || employee?.id || "—";
  const isDesigLoading = isLoadingDesigs || isFetchingDesigs;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) {
      errs.name = "Employee name is required";
    } else if (form.name.trim().length < 2) {
      errs.name = "Name must be at least 2 characters";
    }

    if (!form.email.trim()) {
      errs.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errs.email = "Please enter a valid email address";
    }

    if (!form.department) {
      errs.department = "Department is required";
    }

    if (!form.designation) {
      errs.designation = "Role / Designation is required";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !employee) return;

    const empId = employee._id || employee.id || "";
    if (!empId) {
      toast.error("Invalid employee ID");
      return;
    }

    updateMutation.mutate(
      {
        id: empId,
        payload: {
          name: form.name.trim(),
          email: form.email.trim(),
          department: form.department,
          designation: form.designation,
          isActive: form.status === "active",
        },
      },
      {
        onSuccess: () => {
          toast.success("Employee updated successfully");
          onOpenChange(false);
        },
        onError: (err) => {
          toast.error(err.message || "Failed to update employee");
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit Employee</DialogTitle>
          <DialogDescription>
            Modify employee details, department, designation, and status.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} noValidate className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Employee Name <span className="text-destructive">*</span>
            </Label>
            <Input
              value={form.name}
              onChange={(e) => {
                setForm({ ...form, name: e.target.value });
                if (errors.name) setErrors({ ...errors, name: "" });
              }}
              placeholder="e.g. Jane Doe"
              disabled={updateMutation.isPending}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => {
                setForm({ ...form, email: e.target.value });
                if (errors.email) setErrors({ ...errors, email: "" });
              }}
              placeholder="jane@dimisi.com"
              disabled={updateMutation.isPending}
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Department <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.department}
                onValueChange={(deptId) => {
                  setForm((prev) => ({ ...prev, department: deptId, designation: "" }));
                  if (errors.department) setErrors((prev) => ({ ...prev, department: "" }));
                }}
                disabled={updateMutation.isPending || isLoadingDepts}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={isLoadingDepts ? "Loading departments..." : "Select department"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d._id} value={d._id}>
                      {d.name} ({d.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.department && <p className="text-xs text-destructive">{errors.department}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Role / Designation <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.designation}
                onValueChange={(desigId) => {
                  setForm((prev) => ({ ...prev, designation: desigId }));
                  if (errors.designation) setErrors((prev) => ({ ...prev, designation: "" }));
                }}
                disabled={
                  updateMutation.isPending ||
                  !form.department ||
                  isDesigLoading ||
                  (designations.length === 0 && !form.designation)
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      !form.department ? (
                        "Select department first"
                      ) : isDesigLoading ? (
                        "Loading roles..."
                      ) : designations.length === 0 ? (
                        "No roles available"
                      ) : (
                        "Select role"
                      )
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {designations.map((d) => (
                    <SelectItem key={d._id} value={d._id}>
                      {d.title || d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.designation && <p className="text-xs text-destructive">{errors.designation}</p>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Status <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, status: v as "active" | "inactive" }))
                }
                disabled={updateMutation.isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Employee ID
              </Label>
              <div className="flex h-10 w-full items-center justify-between rounded-md border border-border/60 bg-secondary/30 px-3 py-2 font-mono text-xs text-muted-foreground">
                <span>{empCode}</span>
                <IdBadge id={empCode} />
              </div>
              <p className="text-[11px] text-muted-foreground">Read-only</p>
            </div>
          </div>

          <DialogFooter className="pt-3">
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
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Updating...
                </>
              ) : (
                "Update Employee"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
