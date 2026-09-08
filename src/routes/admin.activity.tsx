import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
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

export const Route = createFileRoute("/admin/activity")({
  head: () => ({
    meta: [
      { title: "Activity — Dimisi Operations" },
      { name: "description", content: "Full timeline of task and account activity across your organization." },
      { property: "og:title", content: "Activity — Dimisi Operations" },
      { property: "og:description", content: "Full timeline of task and account activity across your organization." },
    ],
  }),
  component: ActivityPage,
});

type EventType =
  | "task_assigned"
<<<<<<< Updated upstream
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
  | "designation_created"
  | "designation_deleted"
  | "notice_created"
  | "notice_deleted"
  | "workspace_settings_updated"
  | "admin_added"
  | "admin_removed"
  | "approved"
  | "rejected"
=======
  | "approved"
  | "rejected"
  | "project_created"
  | "project_deleted"
  | "project_archived"
  | "employee_added"
  | "employee_removed"
  | "admin_added"
  | "admin_removed"
>>>>>>> Stashed changes
  | "login";

type ActivityEvent = {
  id: string;
  type: EventType | string;
  actor: string;
  actorAvatar: string;
  actorId: string;
  target: string;
  detail?: string;
  timestamp: string; // ISO
};

<<<<<<< Updated upstream
const meta: Record<string, { label: string; Icon: typeof ClipboardList; tone: string; ring: string }> = {
  task_assigned:              { label: "Task Assigned",              Icon: ClipboardList, tone: "bg-primary/15 text-primary",             ring: "ring-primary/30" },
  task_created:               { label: "Task Created",               Icon: ClipboardList, tone: "bg-primary/15 text-primary",             ring: "ring-primary/30" },
  task_completed:             { label: "Task Completed",             Icon: CheckCircle2,  tone: "bg-primary/15 text-primary",             ring: "ring-primary/30" },
  task_approved:              { label: "Task Approved",              Icon: CheckCircle2,  tone: "bg-primary/15 text-primary",             ring: "ring-primary/30" },
  approved:                   { label: "Task Approved",              Icon: CheckCircle2,  tone: "bg-primary/15 text-primary",             ring: "ring-primary/30" },
  task_rejected:              { label: "Task Rejected",              Icon: XCircle,       tone: "bg-destructive/15 text-destructive",     ring: "ring-destructive/30" },
  rejected:                   { label: "Task Rejected",              Icon: XCircle,       tone: "bg-destructive/15 text-destructive",     ring: "ring-destructive/30" },
  task_deleted:               { label: "Task Deleted",               Icon: XCircle,       tone: "bg-destructive/15 text-destructive",     ring: "ring-destructive/30" },
  project_created:            { label: "Project Created",            Icon: FolderPlus,    tone: "bg-primary/15 text-primary",             ring: "ring-primary/30" },
  project_joined:             { label: "Project Joined",             Icon: FolderPlus,    tone: "bg-primary/15 text-primary",             ring: "ring-primary/30" },
  project_deleted:            { label: "Project Deleted",            Icon: FolderX,       tone: "bg-destructive/15 text-destructive",     ring: "ring-destructive/30" },
  project_archived:           { label: "Project Archived",           Icon: Archive,       tone: "bg-warning/15 text-warning",             ring: "ring-warning/30" },
  employee_added:             { label: "Employee Added",             Icon: UserPlus,      tone: "bg-primary/15 text-primary",             ring: "ring-primary/30" },
  employee_removed:           { label: "Employee Removed",           Icon: UserRoundMinus,tone: "bg-destructive/15 text-destructive",     ring: "ring-destructive/30" },
  department_created:         { label: "Department Created",         Icon: FolderPlus,    tone: "bg-primary/15 text-primary",             ring: "ring-primary/30" },
  department_deleted:         { label: "Department Deleted",         Icon: FolderX,       tone: "bg-destructive/15 text-destructive",     ring: "ring-destructive/30" },
  designation_created:        { label: "Designation Created",        Icon: ShieldPlus,    tone: "bg-primary/15 text-primary",             ring: "ring-primary/30" },
  designation_deleted:        { label: "Designation Deleted",        Icon: ShieldMinus,   tone: "bg-destructive/15 text-destructive",     ring: "ring-destructive/30" },
  notice_created:             { label: "Notice Published",           Icon: ClipboardList, tone: "bg-primary/15 text-primary",             ring: "ring-primary/30" },
  notice_deleted:             { label: "Notice Deleted",             Icon: FolderX,       tone: "bg-destructive/15 text-destructive",     ring: "ring-destructive/30" },
  workspace_settings_updated: { label: "Workspace Updated",          Icon: ShieldPlus,    tone: "bg-primary/15 text-primary",             ring: "ring-primary/30" },
  admin_added:                { label: "Admin Added",                Icon: ShieldPlus,    tone: "bg-primary/15 text-primary",             ring: "ring-primary/30" },
  admin_removed:              { label: "Admin Removed",              Icon: ShieldMinus,   tone: "bg-destructive/15 text-destructive",     ring: "ring-destructive/30" },
  login:                      { label: "User Login",                 Icon: KeyRound,      tone: "bg-primary/15 text-primary",             ring: "ring-primary/30" },
};

const defaultMeta = { label: "Activity Event", Icon: ClipboardList, tone: "bg-primary/15 text-primary", ring: "ring-primary/30" };
=======
const meta: Record<EventType, { label: string; Icon: typeof ClipboardList; tone: string; ring: string }> = {
  task_assigned:   { label: "Task Assigned",   Icon: ClipboardList, tone: "bg-primary/15 text-primary",       ring: "ring-primary/30" },
  approved:        { label: "Task Approved",   Icon: CheckCircle2,  tone: "bg-primary/15 text-primary", ring: "ring-primary/30" },
  rejected:        { label: "Task Rejected",   Icon: XCircle,       tone: "bg-primary/15 text-primary", ring: "ring-primary/30" },
  project_created: { label: "Project Created", Icon: FolderPlus,    tone: "bg-primary/15 text-primary", ring: "ring-primary/30" },
  project_deleted: { label: "Project Deleted", Icon: FolderX,       tone: "bg-destructive/15 text-destructive", ring: "ring-destructive/30" },
  project_archived:{ label: "Project Archived",Icon: Archive,       tone: "bg-warning/15 text-warning", ring: "ring-warning/30" },
  employee_added:  { label: "Employee Added",  Icon: UserPlus,      tone: "bg-primary/15 text-primary", ring: "ring-primary/30" },
  employee_removed:{ label: "Employee Removed",Icon: UserRoundMinus, tone: "bg-destructive/15 text-destructive", ring: "ring-destructive/30" },
  admin_added:     { label: "Admin Added",     Icon: ShieldPlus,    tone: "bg-primary/15 text-primary", ring: "ring-primary/30" },
  admin_removed:   { label: "Admin Removed",   Icon: ShieldMinus,   tone: "bg-destructive/15 text-destructive", ring: "ring-destructive/30" },
  login:           { label: "Login",           Icon: KeyRound,      tone: "bg-primary/15 text-primary",       ring: "ring-primary/30" },
};

const nowIso = "2026-07-29T09:00:00Z";

function hoursAgo(h: number) {
  return new Date(new Date(nowIso).getTime() - h * 3600_000).toISOString();
}

const events: ActivityEvent[] = [
  { id: "e1",  type: "task_assigned",   actor: "Elena Voss",     actorAvatar: "EV", actorId: "a1", target: tasks[9]?.title ?? "Enterprise SSO rollout", detail: "assigned to Priya Nair", timestamp: hoursAgo(1) },
  { id: "e5",  type: "approved",        actor: "Rhea Kapoor",    actorAvatar: "RK", actorId: "a3", target: "Fix mobile crash on iOS 19", detail: "reviewed by admin", timestamp: hoursAgo(5) },
  { id: "e18", type: "project_created", actor: "Elena Voss", actorAvatar: "EV", actorId: "a1", target: "Customer insights sprint", detail: "created a new project", timestamp: hoursAgo(7) },
  { id: "e19", type: "employee_added", actor: "Julian Park", actorAvatar: "JP", actorId: "a2", target: "Nisha Patel", detail: "added to the Engineering team", timestamp: hoursAgo(8) },
  { id: "e20", type: "admin_added", actor: "Elena Voss", actorAvatar: "EV", actorId: "a1", target: "Dev Mehta", detail: "granted admin access", timestamp: hoursAgo(9) },
  { id: "e8",  type: "rejected",        actor: "Elena Voss",     actorAvatar: "EV", actorId: "a1", target: "Legacy cron cleanup", detail: "requested changes", timestamp: hoursAgo(28) },
  { id: "e21", type: "project_archived", actor: "Elena Voss", actorAvatar: "EV", actorId: "a1", target: "Spring launch", detail: "no longer accepts new tasks", timestamp: hoursAgo(32) },
  { id: "e22", type: "project_deleted", actor: "Julian Park", actorAvatar: "JP", actorId: "a2", target: "Legacy migration", detail: "removed after all tasks were completed", timestamp: hoursAgo(36) },
  { id: "e23", type: "employee_removed", actor: "Elena Voss", actorAvatar: "EV", actorId: "a1", target: "Karan Malhotra", detail: "removed from the organization", timestamp: hoursAgo(40) },
  { id: "e24", type: "admin_removed", actor: "Elena Voss", actorAvatar: "EV", actorId: "a1", target: "Vikram Nair", detail: "admin access revoked", timestamp: hoursAgo(44) },
  { id: "e9",  type: "task_assigned",   actor: "Elena Voss",     actorAvatar: "EV", actorId: "a1", target: "Q3 pipeline forecast", detail: "assigned to Sofia Alvarez", timestamp: hoursAgo(30) },
  { id: "e11", type: "approved",        actor: "Elena Voss",     actorAvatar: "EV", actorId: "a1", target: "Roadmap workshop prep", timestamp: hoursAgo(72) },
  { id: "e14", type: "login",           actor: "Marcus Reed",    actorAvatar: "MR", actorId: "u2", target: "Web · Chrome", detail: "signed in", timestamp: hoursAgo(168) },
];

type RangeKey = "today" | "week" | "month" | "all";

function withinRange(ts: string, range: RangeKey) {
  if (range === "all") return true;
  const diffH = (new Date(nowIso).getTime() - new Date(ts).getTime()) / 3600_000;
  if (range === "today") return diffH <= 24;
  if (range === "week") return diffH <= 24 * 7;
  return diffH <= 24 * 30;
}
>>>>>>> Stashed changes

function formatWhen(ts: string) {
  const d = new Date(ts);
  const now = Date.now();
  const diffM = Math.max(1, Math.round((now - d.getTime()) / 60000));
  if (diffM < 60) return `${diffM}m ago`;
  if (diffM < 60 * 24) return `${Math.round(diffM / 60)}h ago`;
  const days = Math.round(diffM / 60 / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
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

function ActivityPage() {
  const { user } = useAuth();
  const isDirector = String(user?.role || "").toLowerCase() === "director";

  const [range, setRange] = useState<RangeKey>("week");
  const [employee, setEmployee] = useState<string>("all");
  const [type, setType] = useState<string>("all");
  const [search, setSearch] = useState("");

  const adminQuery = useAdminActivityQuery({ limit: 100 });
  const orgQuery = useOrgActivityQuery({ limit: 100 });
  const employeesQuery = useEmployeesQuery();

  const activeQuery = isDirector ? orgQuery : adminQuery;
  const rawLogs: ActivityLog[] = activeQuery.data?.data || [];

  const employeesList = useMemo(() => {
    const list = employeesQuery.data?.employees || [];
    return list
      .map((e) => ({
        id: e._id || e.id || "",
        name: e.name || "Unknown",
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [employeesQuery.data]);

  const events: ActivityEvent[] = useMemo(() => {
    return rawLogs.map((log) => {
      const actorObj = typeof log.actorId === "object" && log.actorId !== null ? log.actorId : null;
      const actor = actorObj?.name || actorObj?.email || "System";
      const actorId = actorObj?._id || actorObj?.id || (typeof log.actorId === "string" ? log.actorId : "");
      const actorAvatar = actorObj?.avatar || actor.slice(0, 2).toUpperCase();

      const target =
        (log.metadata?.title as string) ||
        (log.metadata?.target as string) ||
        (log.metadata?.name as string) ||
        log.entityType ||
        "Workspace Entity";

      const detail =
        (log.metadata?.details as string) ||
        (log.metadata?.description as string) ||
        (log.metadata?.reason as string) ||
        `${log.action.replace(/_/g, " ")} (${log.entityType})`;

      return {
        id: log._id || log.id || Math.random().toString(),
        type: log.action,
        actor,
        actorAvatar,
        actorId,
        target,
        detail,
        timestamp: new Date(log.createdAt).toISOString(),
      };
    });
  }, [rawLogs]);

  const filtered = useMemo(() => {
    return events
      .filter((e) => withinRange(e.timestamp, range))
      .filter((e) => (employee === "all" ? true : e.actorId === employee))
      .filter((e) => (type === "all" ? true : e.type === type))
      .filter((e) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          e.actor.toLowerCase().includes(q) ||
          e.target.toLowerCase().includes(q) ||
          (e.detail ?? "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp));
  }, [events, range, employee, type, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, ActivityEvent[]>();
    for (const ev of filtered) {
      const k = dayLabel(ev.timestamp);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(ev);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const totals = useMemo(() => {
    return {
      total: filtered.length,
<<<<<<< Updated upstream
      approvals: filtered.filter((e) => e.type.includes("approved")).length,
      assignments: filtered.filter((e) => e.type.includes("assigned")).length,
      logins: filtered.filter((e) => e.type.includes("login")).length,
=======
      approvals: filtered.filter((e) => e.type === "approved").length,
>>>>>>> Stashed changes
    };
  }, [filtered]);

  return (
    <>
      <PageHeader
        title="Activity"
        subtitle="A live timeline of tasks, reviews, and system events across the org."
        actions={
          <Button
            variant="outline"
            size="sm"
            className="rounded-md"
            onClick={() => void activeQuery.refetch()}
            disabled={activeQuery.isFetching}
          >
            <RefreshCw className={cn("mr-1.5 h-3.5 w-3.5", activeQuery.isFetching && "animate-spin")} />
            Refresh
          </Button>
        }
      />

      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Events", value: totals.total, tone: "text-foreground" },
          { label: "Approvals", value: totals.approvals, tone: "text-primary" },
<<<<<<< Updated upstream
          { label: "Assignments", value: totals.assignments, tone: "text-primary" },
          { label: "Logins", value: totals.logins, tone: "text-primary" },
=======
          { label: "Assignments", value: filtered.filter((e) => e.type === "task_assigned").length, tone: "text-primary" },
          { label: "Logins", value: filtered.filter((e) => e.type === "login").length, tone: "text-primary" },
>>>>>>> Stashed changes
        ].map((s) => (
          <div key={s.label} className="glass rounded-2xl p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</div>
            <div className={cn("mt-1 font-display text-2xl font-semibold", s.tone)}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="glass flex flex-col gap-3 rounded-2xl p-4 lg:flex-row lg:items-center lg:justify-between">
        <Tabs value={range} onValueChange={(v) => setRange(v as RangeKey)}>
          <TabsList>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search activity"
              className="pl-9 sm:w-56"
            />
          </div>
          <Select value={employee} onValueChange={setEmployee}>
            <SelectTrigger className="sm:w-48">
              <SelectValue placeholder="Employee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All employees</SelectItem>
              {employeesList.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="sm:w-44">
              <Filter className="mr-2 h-3.5 w-3.5" />
              <SelectValue placeholder="Event type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All events</SelectItem>
              {Object.keys(meta).map((k) => (
                <SelectItem key={k} value={k}>
                  {meta[k].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Timeline */}
      <div className="glass rounded-2xl p-6">
        {activeQuery.isLoading ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            Loading activity stream…
          </div>
        ) : grouped.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            No activity records found for the selected filters.
          </div>
        ) : (
          grouped.map(([label, list]) => (
            <div key={label} className="mb-8 last:mb-0">
              <div className="mb-4 flex items-center gap-3">
                <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  {label}
                </h3>
                <Badge variant="outline" className="border-border/60">{list.length}</Badge>
                <div className="h-px flex-1 bg-border/60" />
              </div>

<<<<<<< Updated upstream
              <ol className="relative space-y-4">
                <div className="absolute bottom-2 left-6.75 top-2 w-px bg-linear-to-b from-primary/40 via-border to-transparent" />
                {list.map((ev, idx) => {
                  const m = meta[ev.type] || defaultMeta;
                  return (
                    <li
                      key={ev.id}
                      className="relative flex gap-4 animate-in fade-in slide-in-from-bottom-1"
                      style={{ animationDelay: `${idx * 40}ms` }}
                    >
                      <div
                        className={cn(
                          "relative z-10 grid h-14 w-14 shrink-0 place-items-center rounded-2xl ring-4 ring-background",
                          m.tone,
                        )}
                      >
                        <m.Icon className="h-5 w-5" />
                      </div>
                      <div
                        className={cn(
                          "min-w-0 flex-1 rounded-2xl border border-border/40 bg-card/60 p-4 transition-colors hover:border-primary/30",
                        )}
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            variant="outline"
                            className={cn("border-border/40 text-[10px] uppercase tracking-widest", m.tone)}
                          >
                            {m.label}
                          </Badge>
                          <span className="ml-auto text-xs text-muted-foreground">
                            {formatWhen(ev.timestamp)}
                          </span>
=======
        {grouped.map(([label, list]) => (
          <div key={label} className="mb-8 last:mb-0">
            <div className="mb-4 flex items-center gap-3">
              <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {label}
              </h3>
              <Badge variant="outline" className="border-border/60">{list.length}</Badge>
              <div className="h-px flex-1 bg-border/60" />
            </div>

            <ol className="relative space-y-4">
              <div className="absolute bottom-2 left-6.75 top-2 w-px bg-linear-to-b from-primary/40 via-border to-transparent" />
              {list.map((ev, idx) => {
                const m = meta[ev.type];
                return (
                  <li
                    key={ev.id}
                    className="relative flex gap-4 animate-in fade-in slide-in-from-bottom-1"
                    style={{ animationDelay: `${idx * 40}ms` }}
                  >
                    <div
                      className={cn(
                        "relative z-10 grid h-14 w-14 shrink-0 place-items-center rounded-2xl ring-4 ring-background",
                        m.tone,
                      )}
                    >
                      <m.Icon className="h-5 w-5" />
                    </div>
                    <div
                      className={cn(
                        "min-w-0 flex-1 rounded-2xl border border-border/40 bg-card/60 p-4 transition-colors hover:border-primary/30",
                      )}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant="outline"
                          className={cn("border-border/40 text-[10px] uppercase tracking-widest", m.tone)}
                        >
                          {m.label}
                        </Badge>
                        <span className="ml-auto text-xs text-muted-foreground">
                          {formatWhen(ev.timestamp)}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-sm">
                        <div className="grid h-6 w-6 place-items-center rounded-full bg-linear-to-br from-primary/30 to-accent text-[10px] font-semibold">
                          {ev.actorAvatar}
>>>>>>> Stashed changes
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-sm">
                          <div className="grid h-6 w-6 place-items-center rounded-full bg-linear-to-br from-primary/30 to-accent text-[10px] font-semibold">
                            {ev.actorAvatar}
                          </div>
                          <span className="font-medium">{ev.actor}</span>
                          <span className="text-muted-foreground">·</span>
                          <span className="truncate font-medium text-foreground/90">{ev.target}</span>
                        </div>
                        {ev.detail && (
                          <p className="mt-1.5 text-xs text-muted-foreground">{ev.detail}</p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          ))
        )}
      </div>
    </>
  );
}
