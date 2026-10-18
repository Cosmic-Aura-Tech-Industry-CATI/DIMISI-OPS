import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ClipboardList,
  CheckCircle2,
  XCircle,
  UserPlus,
  UserRoundMinus,
  ShieldPlus,
  ShieldMinus,
  FolderPlus,
  FolderX,
  Archive,
  KeyRound,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  AlertTriangle,
  Building2,
  ArrowRightLeft,
  Megaphone,
  Settings,
  ShieldCheck,
  ListTodo,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useAdminActivityQuery, useOrgActivityQuery, type ActivityLog } from "@/features/activity";
import { useEmployeesQuery } from "@/features/employees/hooks/use-employees-api";
import { useAuditLogs } from "@/lib/audit-log";

export const Route = createFileRoute("/admin/activity")({
  head: () => ({
    meta: [
      { title: "Activity — Dimisi Operations" },
      {
        name: "description",
        content: "Full timeline of task and account activity across your organization.",
      },
      { property: "og:title", content: "Activity — Dimisi Operations" },
      {
        property: "og:description",
        content: "Full timeline of task and account activity across your organization.",
      },
    ],
  }),
  component: ActivityPage,
});

const PAGE_SIZE = 25;

type EventType =
  | "task_assigned"
  | "task_created"
  | "task_completed"
  | "task_approved"
  | "task_rejected"
  | "task_deleted"
  | "project_created"
  | "project_deleted"
  | "project_archived"
  | "project_joined"
  | "employee_added"
  | "employee_removed"
  | "department_created"
  | "department_deleted"
  | "department_changed"
  | "designation_created"
  | "designation_deleted"
  | "designation_changed"
  | "notice_created"
  | "notice_deleted"
  | "workspace_settings_updated"
  | "admin_added"
  | "admin_removed"
  | "approved"
  | "rejected"
  | "login";

interface ActivityEvent {
  id: string;
  action: EventType | string;
  entityType: string;
  entityId?: string;
  status: "success" | "failed" | string;
  scope: "ADMIN" | "ORG" | "PERSONAL" | string;
  description: string;
  actor: {
    id: string;
    empId?: string;
    name: string;
    email?: string;
    avatar?: string;
    initials: string;
  };
  metadata?: Record<string, unknown>;
  timestamp: string; // ISO
}

const meta: Record<
  string,
  { label: string; Icon: React.ElementType; tone: string; ring: string }
> = {
  login: {
    label: "User Login",
    Icon: KeyRound,
    tone: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
    ring: "ring-blue-500/30",
  },
  employee_added: {
    label: "Employee Added",
    Icon: UserPlus,
    tone: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    ring: "ring-emerald-500/30",
  },
  employee_removed: {
    label: "Employee Removed",
    Icon: UserRoundMinus,
    tone: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
    ring: "ring-rose-500/30",
  },
  task_assigned: {
    label: "Task Assigned",
    Icon: ClipboardList,
    tone: "bg-primary/15 text-primary",
    ring: "ring-primary/30",
  },
  task_created: {
    label: "Task Created",
    Icon: ListTodo,
    tone: "bg-primary/15 text-primary",
    ring: "ring-primary/30",
  },
  task_completed: {
    label: "Task Completed",
    Icon: CheckCircle2,
    tone: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    ring: "ring-emerald-500/30",
  },
  task_approved: {
    label: "Task Approved",
    Icon: ShieldCheck,
    tone: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    ring: "ring-emerald-500/30",
  },
  approved: {
    label: "Task Approved",
    Icon: ShieldCheck,
    tone: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    ring: "ring-emerald-500/30",
  },
  task_rejected: {
    label: "Task Rejected",
    Icon: XCircle,
    tone: "bg-destructive/15 text-destructive",
    ring: "ring-destructive/30",
  },
  rejected: {
    label: "Task Rejected",
    Icon: XCircle,
    tone: "bg-destructive/15 text-destructive",
    ring: "ring-destructive/30",
  },
  task_deleted: {
    label: "Task Deleted",
    Icon: FolderX,
    tone: "bg-destructive/15 text-destructive",
    ring: "ring-destructive/30",
  },
  project_created: {
    label: "Project Created",
    Icon: FolderPlus,
    tone: "bg-primary/15 text-primary",
    ring: "ring-primary/30",
  },
  project_joined: {
    label: "Project Joined",
    Icon: FolderPlus,
    tone: "bg-primary/15 text-primary",
    ring: "ring-primary/30",
  },
  project_deleted: {
    label: "Project Deleted",
    Icon: FolderX,
    tone: "bg-destructive/15 text-destructive",
    ring: "ring-destructive/30",
  },
  project_archived: {
    label: "Project Archived",
    Icon: Archive,
    tone: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    ring: "ring-amber-500/30",
  },
  department_created: {
    label: "Department Created",
    Icon: Building2,
    tone: "bg-primary/15 text-primary",
    ring: "ring-primary/30",
  },
  department_deleted: {
    label: "Department Deleted",
    Icon: FolderX,
    tone: "bg-destructive/15 text-destructive",
    ring: "ring-destructive/30",
  },
  department_changed: {
    label: "Department Changed",
    Icon: ArrowRightLeft,
    tone: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400",
    ring: "ring-indigo-500/30",
  },
  designation_created: {
    label: "Designation Created",
    Icon: ShieldPlus,
    tone: "bg-primary/15 text-primary",
    ring: "ring-primary/30",
  },
  designation_deleted: {
    label: "Designation Deleted",
    Icon: ShieldMinus,
    tone: "bg-destructive/15 text-destructive",
    ring: "ring-destructive/30",
  },
  designation_changed: {
    label: "Designation Changed",
    Icon: ArrowRightLeft,
    tone: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400",
    ring: "ring-indigo-500/30",
  },
  notice_created: {
    label: "Notice Published",
    Icon: Megaphone,
    tone: "bg-primary/15 text-primary",
    ring: "ring-primary/30",
  },
  notice_deleted: {
    label: "Notice Deleted",
    Icon: FolderX,
    tone: "bg-destructive/15 text-destructive",
    ring: "ring-destructive/30",
  },
  workspace_settings_updated: {
    label: "Workspace Updated",
    Icon: Settings,
    tone: "bg-primary/15 text-primary",
    ring: "ring-primary/30",
  },
  admin_added: {
    label: "Admin Added",
    Icon: ShieldPlus,
    tone: "bg-primary/15 text-primary",
    ring: "ring-primary/30",
  },
  admin_removed: {
    label: "Admin Removed",
    Icon: ShieldMinus,
    tone: "bg-destructive/15 text-destructive",
    ring: "ring-destructive/30",
  },
};

const defaultMeta = {
  label: "Activity Event",
  Icon: ClipboardList,
  tone: "bg-primary/15 text-primary",
  ring: "ring-primary/30",
};

const ENTITY_CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "authentication", label: "Authentication" },
  { value: "task", label: "Tasks" },
  { value: "employee", label: "Employees" },
  { value: "project", label: "Projects" },
  { value: "department", label: "Departments" },
  { value: "designation", label: "Designations" },
  { value: "notice", label: "Notices" },
  { value: "admin", label: "Admins" },
  { value: "settings", label: "Settings" },
  { value: "reports", label: "Reports" },
];

const SCOPES = [
  { value: "all", label: "All Scopes" },
  { value: "ORG", label: "Organization" },
  { value: "ADMIN", label: "Admin" },
  { value: "PERSONAL", label: "Personal" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "success", label: "Success" },
  { value: "failed", label: "Failed" },
];

function formatWhen(ts: string) {
  const d = new Date(ts);
  const now = Date.now();
  const diffM = Math.max(1, Math.round((now - d.getTime()) / 60000));
  if (diffM < 60) return `${diffM}m ago`;
  if (diffM < 60 * 24) return `${Math.round(diffM / 60)}h ago`;
  const days = Math.round(diffM / 60 / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function dayLabel(ts: string) {
  const d = new Date(ts);
  const now = new Date();
  const diffTime = now.getTime() - d.getTime();
  const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return "This week";
  if (days < 30) return "This month";
  return "Earlier";
}

type RangeKey = "today" | "week" | "month" | "all";

function withinRange(ts: string, range: RangeKey) {
  if (range === "all") return true;
  const diffH = (Date.now() - new Date(ts).getTime()) / 3600_000;
  if (range === "today") return diffH <= 24;
  if (range === "week") return diffH <= 24 * 7;
  return diffH <= 24 * 30;
}

function ScopeBadge({ scope }: { scope: string }) {
  const s = scope.toUpperCase();
  if (s === "ADMIN") {
    return (
      <Badge
        variant="outline"
        className="border-indigo-500/30 bg-indigo-500/10 font-mono text-[10px] font-semibold text-indigo-600 dark:text-indigo-400"
      >
        ADMIN
      </Badge>
    );
  }
  if (s === "ORG") {
    return (
      <Badge
        variant="outline"
        className="border-sky-500/30 bg-sky-500/10 font-mono text-[10px] font-semibold text-sky-600 dark:text-sky-400"
      >
        ORG
      </Badge>
    );
  }
  if (s === "PERSONAL") {
    return (
      <Badge
        variant="outline"
        className="border-amber-500/30 bg-amber-500/10 font-mono text-[10px] font-semibold text-amber-600 dark:text-amber-400"
      >
        PERSONAL
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="font-mono text-[10px]">
      {s}
    </Badge>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isFailed = status.toLowerCase() === "failed";
  if (isFailed) {
    return (
      <Badge
        variant="outline"
        className="gap-1 border-destructive/40 bg-destructive/10 text-[10px] font-semibold text-destructive"
      >
        <AlertTriangle className="h-3 w-3" />
        Failed
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="gap-1 border-emerald-500/40 bg-emerald-500/10 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400"
    >
      <CheckCircle2 className="h-3 w-3" />
      Success
    </Badge>
  );
}

function CopyableId({ id, label = "ID" }: { id: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopied(true);
    toast.success(`${label} copied to clipboard`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={`Click to copy ${label}: ${id}`}
      className="inline-flex items-center gap-1 rounded border border-border/50 bg-muted/40 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground transition-colors hover:border-border hover:bg-muted hover:text-foreground"
    >
      <span>
        {label}: {id.length > 10 ? `${id.slice(0, 4)}…${id.slice(-4)}` : id}
      </span>
      {copied ? <Check className="h-2.5 w-2.5 text-emerald-500" /> : <Copy className="h-2.5 w-2.5 opacity-60" />}
    </button>
  );
}

function ActivityPage() {
  const { user } = useAuth();
  const isDirector = String(user?.role || "").toLowerCase() === "director";

  const [page, setPage] = useState<number>(1);
  const [scope, setScope] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [range, setRange] = useState<RangeKey>("all");
  const [employee, setEmployee] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const queryFilters = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      entityType: category !== "all" ? category : undefined,
      scope: scope !== "all" ? scope : undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
      actorId: employee !== "all" ? employee : undefined,
      search: search.trim() || undefined,
    }),
    [page, category, scope, statusFilter, employee, search],
  );

  const adminQuery = useAdminActivityQuery(queryFilters);
  const orgQuery = useOrgActivityQuery(queryFilters);
  const employeesQuery = useEmployeesQuery();

  // If user explicitly chooses ADMIN scope, route to adminQuery; otherwise orgQuery covers org logs
  const activeQuery = scope === "ADMIN" ? adminQuery : orgQuery;

  const rawLogs: ActivityLog[] = useMemo(() => {
    const d = activeQuery.data;
    if (!d) return [];
    if (Array.isArray(d)) return d;
    if (Array.isArray(d.data)) return d.data;
    if (Array.isArray((d as any).logs)) return (d as any).logs;
    if (Array.isArray((d as any)?.data?.data)) return (d as any).data.data;
    return [];
  }, [activeQuery.data]);

  const employeesList = useMemo(() => {
    const list = employeesQuery.data?.employees || [];
    return list
      .map((e) => ({
        id: e._id || e.id || "",
        empId: e.empId,
        name: e.name || "Unknown",
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [employeesQuery.data]);

  const auditLogs = useAuditLogs();

  const events: ActivityEvent[] = useMemo(() => {
    const apiEvents = rawLogs.map((log) => {
      const actorObj = typeof log.actorId === "object" && log.actorId !== null ? log.actorId : null;
      const actorName = actorObj?.name || actorObj?.email || "System";
      const actorId =
        actorObj?._id || actorObj?.id || (typeof log.actorId === "string" ? log.actorId : "");
      const empId = actorObj?.empId;
      const email = actorObj?.email;
      const actorAvatar = typeof actorObj?.avatar === "string" ? actorObj.avatar.trim() : "";
      const actorInitials =
        actorName
          .split(" ")
          .filter(Boolean)
          .map((n) => n[0])
          .slice(0, 2)
          .join("")
          .toUpperCase() || "US";

      const normalizedAction = log.action || "activity";
      const entityType = log.entityType || "general";
      const status = (log.status || "success").toLowerCase();
      const logScope = (log.scope || "ORG").toUpperCase();

      // Priority: use the prominent human-readable description from the model
      const description =
        log.description ||
        (log.metadata?.description as string) ||
        (log.metadata?.details as string) ||
        (log.metadata?.reason as string) ||
        `${normalizedAction.replace(/_/g, " ")} on ${entityType}`;

      return {
        id: log._id || log.id || Math.random().toString(),
        action: normalizedAction,
        entityType,
        entityId: log.entityId,
        status,
        scope: logScope,
        description,
        actor: {
          id: actorId,
          empId,
          name: actorName,
          email,
          avatar: actorAvatar,
          initials: actorInitials,
        },
        metadata: log.metadata,
        timestamp: new Date(log.createdAt).toISOString(),
      };
    });

    if (apiEvents.length > 0) return apiEvents;

    return auditLogs.map((log) => ({
      id: log.id,
      action:
        log.category === "task"
          ? log.status === "failed"
            ? "task_rejected"
            : "task_approved"
          : log.action.toLowerCase().replace(/\s+/g, "_"),
      entityType: log.category,
      entityId: log.targetId,
      status: log.status === "failed" ? "failed" : "success",
      scope: "ORG",
      description: log.details || `${log.action} on ${log.target}`,
      actor: {
        id: log.actorId,
        empId: log.actorId.startsWith("DMS") ? log.actorId : undefined,
        name: log.actorName,
        avatar: "",
        initials: (log.actorName || "US")
          .split(" ")
          .filter(Boolean)
          .map((n) => n[0])
          .slice(0, 2)
          .join("")
          .toUpperCase() || "US",
      },
      timestamp: log.timestamp,
    }));
  }, [rawLogs, auditLogs]);

  // Client-side filtering across active events
  const filtered = useMemo(() => {
    return events
      .filter((e) => withinRange(e.timestamp, range))
      .filter((e) => (scope === "all" ? true : e.scope === scope))
      .filter((e) => (statusFilter === "all" ? true : e.status === statusFilter))
      .filter((e) => (category === "all" ? true : e.entityType.toLowerCase() === category.toLowerCase()))
      .filter((e) => (employee === "all" ? true : e.actor.id === employee || e.actor.empId === employee))
      .filter((e) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          e.actor.name.toLowerCase().includes(q) ||
          (e.actor.empId ?? "").toLowerCase().includes(q) ||
          (e.actor.email ?? "").toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.action.toLowerCase().includes(q) ||
          e.entityType.toLowerCase().includes(q) ||
          (e.entityId ?? "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp));
  }, [events, range, scope, statusFilter, category, employee, search]);

  // Determine pagination bounds (respecting API pagination or fallback client slice)
  const isApiPaginated = Boolean(
    activeQuery.data &&
      !Array.isArray(activeQuery.data) &&
      typeof activeQuery.data === "object" &&
      (activeQuery.data.totalPages || activeQuery.data.total),
  );

  const totalRecords = isApiPaginated
    ? activeQuery.data?.total ?? filtered.length
    : filtered.length;

  const totalPages = isApiPaginated
    ? Math.max(1, activeQuery.data?.totalPages ?? Math.ceil(totalRecords / PAGE_SIZE))
    : Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const currentPage = Math.min(page, totalPages);

  // If server-side paginated, records in `filtered` are already 25 records for current page;
  // otherwise, slice locally to guarantee exactly 25 records per page.
  const displaySlice = useMemo(() => {
    if (isApiPaginated && rawLogs.length > 0) {
      return filtered;
    }
    return filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  }, [isApiPaginated, rawLogs.length, filtered, currentPage]);

  const grouped = useMemo(() => {
    const map = new Map<string, ActivityEvent[]>();
    for (const ev of displaySlice) {
      const k = dayLabel(ev.timestamp);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(ev);
    }
    return Array.from(map.entries());
  }, [displaySlice]);

  const totals = useMemo(() => {
    const total = isApiPaginated ? activeQuery.data?.total ?? filtered.length : filtered.length;
    const successCount = filtered.filter((e) => e.status === "success").length;
    const failedCount = filtered.filter((e) => e.status === "failed").length;
    const adminCount = filtered.filter((e) => e.scope === "ADMIN").length;
    const orgCount = filtered.filter((e) => e.scope === "ORG").length;
    return {
      total,
      successCount,
      failedCount,
      adminCount,
      orgCount,
    };
  }, [isApiPaginated, activeQuery.data?.total, filtered]);

  const handleRangeChange = (v: string) => {
    setRange(v as RangeKey);
    setPage(1);
  };

  const handleScopeChange = (v: string) => {
    setScope(v);
    setPage(1);
  };

  const handleCategoryChange = (v: string) => {
    setCategory(v);
    setPage(1);
  };

  const handleStatusChange = (v: string) => {
    setStatusFilter(v);
    setPage(1);
  };

  const handleEmployeeChange = (v: string) => {
    setEmployee(v);
    setPage(1);
  };

  const handleSearchChange = (v: string) => {
    setSearch(v);
    setPage(1);
  };

  return (
    <>
      <PageHeader
        title="Activity"
        subtitle="A live timeline of tasks, reviews, and security events across the workspace."
        actions={
          <Button
            variant="outline"
            size="sm"
            className="rounded-md"
            onClick={() => void activeQuery.refetch()}
            disabled={activeQuery.isFetching}
          >
            <RefreshCw
              className={cn("mr-1.5 h-3.5 w-3.5", activeQuery.isFetching && "animate-spin")}
            />
            Refresh
          </Button>
        }
      />

      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total Events", value: totals.total, tone: "text-foreground" },
          { label: "Successful", value: totals.successCount, tone: "text-emerald-500" },
          {
            label: "Failed / Alerts",
            value: totals.failedCount,
            tone: totals.failedCount > 0 ? "text-destructive" : "text-muted-foreground",
          },
          {
            label: "Org vs Admin",
            value: `${totals.orgCount} / ${totals.adminCount}`,
            tone: "text-primary",
          },
        ].map((s) => (
          <div key={s.label} className="glass rounded-2xl p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</div>
            <div className={cn("mt-1 font-display text-2xl font-semibold", s.tone)}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="glass flex flex-col gap-3 rounded-2xl p-4">
        {/* Top filter row: Scope tabs & Date range tabs */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Scope:</span>
            <Tabs value={scope} onValueChange={handleScopeChange}>
              <TabsList className="h-8">
                {SCOPES.map((sc) => (
                  <TabsTrigger key={sc.value} value={sc.value} className="text-xs px-2.5">
                    {sc.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Range:</span>
            <Tabs value={range} onValueChange={handleRangeChange}>
              <TabsList className="h-8">
                <TabsTrigger value="today" className="text-xs px-2.5">Today</TabsTrigger>
                <TabsTrigger value="week" className="text-xs px-2.5">Week</TabsTrigger>
                <TabsTrigger value="month" className="text-xs px-2.5">Month</TabsTrigger>
                <TabsTrigger value="all" className="text-xs px-2.5">All</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Bottom filter row: Search, Category, Status, Employee */}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4 pt-1 border-t border-border/40">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search description, actor, ID…"
              className="pl-9 h-9 text-xs"
            />
          </div>

          <Select value={category} onValueChange={handleCategoryChange}>
            <SelectTrigger className="h-9 text-xs">
              <Filter className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {ENTITY_CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value} className="text-xs">
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((st) => (
                <SelectItem key={st.value} value={st.value} className="text-xs">
                  {st.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={employee} onValueChange={handleEmployeeChange}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Employee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All employees</SelectItem>
              {employeesList.map((p) => (
                <SelectItem key={p.id} value={p.id} className="text-xs">
                  {p.name} {p.empId ? `(${p.empId})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Timeline */}
      <div className="glass rounded-2xl p-6">
        {activeQuery.isLoading ? (
          <div className="space-y-4 py-8">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-12 w-12 shrink-0 rounded-2xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3 rounded" />
                  <Skeleton className="h-4 w-2/3 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : activeQuery.isError ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-8 text-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <h3 className="font-semibold text-destructive">Failed to load activity logs</h3>
            <p className="text-sm text-muted-foreground">
              {(activeQuery.error as any)?.message || "An unexpected error occurred while fetching activity."}
            </p>
            <Button variant="outline" onClick={() => void activeQuery.refetch()}>
              Retry
            </Button>
          </div>
        ) : grouped.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            No activity records found for the selected filters.
          </div>
        ) : (
          <>
            {grouped.map(([label, list]) => (
              <div key={label} className="mb-8 last:mb-0">
                <div className="mb-4 flex items-center gap-3">
                  <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    {label}
                  </h3>
                  <Badge variant="outline" className="border-border/60">
                    {list.length}
                  </Badge>
                  <div className="h-px flex-1 bg-border/60" />
                </div>

                <ol className="relative space-y-4">
                  <div className="absolute bottom-2 left-6.75 top-2 w-px bg-gradient-to-b from-primary/40 via-border to-transparent" />
                  {list.map((ev, idx) => {
                    const m = meta[ev.action] || defaultMeta;
                    const isFailed = ev.status.toLowerCase() === "failed";
                    const isExpanded = expandedLogId === ev.id;
                    const hasMetadata = ev.metadata && Object.keys(ev.metadata).length > 0;

                    return (
                      <li
                        key={ev.id}
                        className="relative flex gap-4 animate-in fade-in slide-in-from-bottom-1"
                        style={{ animationDelay: `${idx * 30}ms` }}
                      >
                        {/* Event Icon */}
                        <div
                          className={cn(
                            "relative z-10 grid h-14 w-14 shrink-0 place-items-center rounded-2xl ring-4 ring-background transition-transform hover:scale-105",
                            isFailed
                              ? "bg-destructive/15 text-destructive ring-destructive/30"
                              : m.tone,
                          )}
                        >
                          <m.Icon className="h-5 w-5" />
                        </div>

                        {/* Event Body */}
                        <div
                          className={cn(
                            "min-w-0 flex-1 rounded-2xl border bg-card/60 p-4 transition-colors",
                            isFailed
                              ? "border-destructive/30 bg-destructive/5 hover:border-destructive/50"
                              : "border-border/40 hover:border-primary/30",
                          )}
                        >
                          {/* Badges and timestamp row */}
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] uppercase tracking-wider font-semibold",
                                isFailed ? "text-destructive border-destructive/40" : m.tone,
                              )}
                            >
                              {m.label}
                            </Badge>

                            {!m.label.toLowerCase().includes(ev.entityType.toLowerCase()) && (
                              <Badge
                                variant="outline"
                                className="border-border/60 text-[10px] font-mono uppercase text-muted-foreground"
                              >
                                {ev.entityType}
                              </Badge>
                            )}

                            <ScopeBadge scope={ev.scope} />
                            <StatusBadge status={ev.status} />

                            <span className="ml-auto text-xs text-muted-foreground whitespace-nowrap" title={new Date(ev.timestamp).toLocaleString()}>
                              {formatWhen(ev.timestamp)}
                            </span>
                          </div>

                          {/* Actor & Entity Info Row */}
                          <div className="mt-2.5 flex flex-wrap items-center gap-2 text-sm">
                            <Avatar className="h-6 w-6 shrink-0 ring-1 ring-border/50">
                              {ev.actor.avatar && ev.actor.avatar.startsWith("http") ? (
                                <AvatarImage
                                  src={ev.actor.avatar}
                                  alt={ev.actor.name}
                                  className="object-cover"
                                />
                              ) : null}
                              <AvatarFallback className="bg-gradient-to-br from-primary/30 to-accent text-[10px] font-bold text-foreground">
                                {ev.actor.initials}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-semibold text-foreground text-xs sm:text-sm">{ev.actor.name}</span>
                            {ev.actor.empId && (
                              <Badge variant="secondary" className="font-mono text-[10px] px-1.5 py-0 h-4.5">
                                {ev.actor.empId}
                              </Badge>
                            )}
                            {ev.actor.email && (
                              <span className="hidden text-xs text-muted-foreground md:inline">
                                · {ev.actor.email}
                              </span>
                            )}
                            {ev.entityId && (
                              <div className="ml-auto">
                                <CopyableId id={ev.entityId} label="Entity" />
                              </div>
                            )}
                          </div>

                          {/* Human-readable Description from Model */}
                          <p className="mt-2 text-sm font-normal text-foreground/90 leading-relaxed">
                            {ev.description}
                          </p>

                          {/* Metadata expander if available */}
                          {hasMetadata && (
                            <div className="mt-2 border-t border-border/30 pt-2">
                              <button
                                type="button"
                                onClick={() => setExpandedLogId(isExpanded ? null : ev.id)}
                                className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
                              >
                                {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                {isExpanded ? "Hide metadata" : "View metadata"}
                              </button>
                              {isExpanded && (
                                <pre className="mt-2 overflow-x-auto rounded-lg bg-muted/50 p-2.5 font-mono text-[11px] text-muted-foreground">
                                  {JSON.stringify(ev.metadata, null, 2)}
                                </pre>
                              )}
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>
            ))}

            {/* Pagination Controls */}
            <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-border/60 pt-4 sm:flex-row">
              <span className="text-xs text-muted-foreground">
                Showing {displaySlice.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}–
                {Math.min((currentPage - 1) * PAGE_SIZE + displaySlice.length, totalRecords)} of {totalRecords} events
                (Page {currentPage} of {totalPages})
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-md"
                  disabled={currentPage <= 1 || activeQuery.isFetching}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  aria-label="Previous Page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: totalPages })
                  .slice(0, 5)
                  .map((_, i) => {
                    const n = i + 1;
                    return (
                      <Button
                        key={n}
                        variant={n === currentPage ? "default" : "outline"}
                        size="sm"
                        className="h-8 w-8 rounded-full p-0 text-xs"
                        disabled={activeQuery.isFetching}
                        onClick={() => setPage(n)}
                      >
                        {n}
                      </Button>
                    );
                  })}
                {totalPages > 5 && (
                  <span className="px-1 text-xs text-muted-foreground">…</span>
                )}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-md"
                  disabled={currentPage >= totalPages || activeQuery.isFetching}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  aria-label="Next Page"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
