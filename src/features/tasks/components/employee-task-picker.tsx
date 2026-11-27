import { useState } from "react";
import { Users } from "lucide-react";
import type { AuthUser } from "@/auth/types/auth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UserAvatar } from "@/components/user-avatar";
import { useEmployeesQuery } from "@/features/employees/hooks/use-employees-api";

export function EmployeeTaskPicker({ onSelect }: { onSelect: (employee: AuthUser) => void }) {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const directory = useEmployeesQuery({ page, limit: 10 }, { enabled: open });
  const pages = directory.data?.pagination?.totalPages ?? 1;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setPage(1);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-full">
          <Users />
          Employee Tasks
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Employee Tasks</DialogTitle>
          <DialogDescription>Select an employee to view their task cards.</DialogDescription>
        </DialogHeader>
        {directory.isLoading ? (
          <p role="status">Loading employees…</p>
        ) : directory.isError ? (
          <div role="alert">
            Couldn’t load employees.{" "}
            <Button variant="outline" onClick={() => void directory.refetch()}>
              Retry
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {directory.data?.employees.map((employee) => (
              <li key={employee._id || employee.id}>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-md p-2 text-left hover:bg-muted focus-visible:bg-muted"
                  onClick={() => {
                    onSelect(employee);
                    setOpen(false);
                  }}
                >
                  <UserAvatar name={employee.name} className="h-8 w-8" />
                  <span className="min-w-0">
                    <span className="block font-medium">{employee.name}</span>
                    <span className="block break-all text-xs text-muted-foreground">
                      {employee.code || employee.empId || employee.email}
                    </span>
                  </span>
                </button>
              </li>
            ))}
            {directory.data?.employees.length === 0 && <li>No employees found.</li>}
          </ul>
        )}
        {pages > 1 && (
          <div className="flex items-center justify-between">
            <Button variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Previous
            </Button>
            <span className="text-xs text-muted-foreground">
              Page {page} of {pages}
            </span>
            <Button variant="outline" disabled={page >= pages} onClick={() => setPage(page + 1)}>
              Next
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
