import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Mail,
  Building2,
  Calendar,
  Sparkles,
  Trophy,
  CheckCircle2,
  Clock,
  TrendingUp,
  MapPin,
  Phone,
  Briefcase,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { IdBadge } from "@/components/id-badge";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import {
  currentEmployee,
  tasks as mockTasks,
  performanceTrend as mockPerformanceTrend,
} from "@/lib/mock-data";
import { useAuth } from "@/lib/auth";
import { useEditableProfile } from "@/lib/profile-store";
import { EditProfileDialog } from "@/components/edit-profile-dialog";
import { useDepartmentsQuery } from "@/features/departments";
import { useTasksQuery } from "@/features/tasks";
import { cn } from "@/lib/utils";

// ==========================================
// 1. Interfaces and Entity Definitions
// ==========================================

export interface EmployeeProfileData {
  id: string;
  code: string;
  name: string;
  email: string;
  role: "employee" | "admin" | "director" | "intern";
  jobTitle: string;
  department: string;
  avatar: string;
  points: number;
  tasksCompleted: number;
  status: "active" | "inactive";
  joinedAt: string;
  phone: string;
}

export interface DepartmentEntity {
  _id: string;
  id?: string;
  name: string;
  code: string;
}

export interface TaskEntity {
  id: string;
  _id?: string;
  title: string;
  description?: string;
  assignee?: string | { _id?: string; id?: string; name?: string };
  assigneeId?: string;
  status: "pending" | "in_progress" | "completed" | "overdue" | "available" | "assigned";
  priority?: "low" | "medium" | "high";
  points: number;
  dueDate: string;
  createdAt?: string;
  category: string;
}

export interface PerformanceTrendPoint {
  week: string;
  points: number;
  tasks: number;
  cumulative?: number;
}

export interface StatItem {
  label: string;
  value: string | number;
  Icon: React.ComponentType<{ className?: string }>;
  tone: string;
}

// ==========================================
// 2. Helper Functions
// ==========================================

const formatDateSafe = (
  dateStr?: string | Date | null,
  options?: Intl.DateTimeFormatOptions,
  fallback: string = "—"
): string => {
  if (!dateStr) return fallback;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return fallback;
    return d.toLocaleDateString(undefined, options || { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return fallback;
  }
};

const isTaskAssignedToUser = (
  task: TaskEntity,
  userId: string,
  userCode: string,
  userName: string
): boolean => {
  if (!task) return false;

  // 1. Direct assigneeId match
  if (task.assigneeId && (task.assigneeId === userId || task.assigneeId === userCode)) {
    return true;
  }

  // 2. Assignee as string match
  if (typeof task.assignee === "string") {
    const raw = task.assignee.trim();
    if (raw === userId || raw === userCode || (userName && raw.toLowerCase() === userName.toLowerCase())) {
      return true;
    }
  }

  // 3. Assignee as populated object from backend
  if (typeof task.assignee === "object" && task.assignee !== null) {
    const obj = task.assignee as { _id?: string; id?: string; name?: string };
    if (
      (obj.id && obj.id === userId) ||
      (obj._id && obj._id === userId) ||
      (obj.name && userName && obj.name.toLowerCase() === userName.toLowerCase())
    ) {
      return true;
    }
  }

  return false;
};

// ==========================================
// 3. Route Declaration
// ==========================================

export const Route = createFileRoute("/employee/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Poll" },
      { name: "description", content: "Your performance, achievements, and history at a glance." },
      { property: "og:title", content: "Profile — Poll" },
      { property: "og:description", content: "Your performance, achievements, and history at a glance." },
    ],
  }),
  component: ProfilePage,
});

// ==========================================
// 4. Main ProfilePage Component
// ==========================================

function ProfilePage() {
  const { user } = useAuth();
  const editable = useEditableProfile();
  const [editOpen, setEditOpen] = useState<boolean>(false);

  // Queries with loading & error handling
  const {
    data: departmentsData = [],
    isLoading: isDeptsLoading,
    isError: isDeptsError,
  } = useDepartmentsQuery();

  const {
    data: liveTasks = [],
    isLoading: isTasksLoading,
    isError: isTasksError,
  } = useTasksQuery();

  // 1. Derived Employee Profile Data
  const e: EmployeeProfileData = useMemo(() => {
    if (user) {
      const rawDept = user.department ?? (user as any).departmentName ?? (user as any).departmentId;
      let deptName = "";

      if (typeof rawDept === "object" && rawDept !== null) {
        deptName = (rawDept as any).name || (rawDept as any).title || "";
      } else if (typeof rawDept === "string" && rawDept.trim()) {
        const trimmed = rawDept.trim();
        const found = departmentsData.find(
          (d: DepartmentEntity) =>
            d.id === trimmed ||
            d._id === trimmed ||
            String(d.id) === trimmed ||
            String(d._id) === trimmed ||
            d.code === trimmed ||
            (d.name && d.name.toLowerCase() === trimmed.toLowerCase())
        );
        if (found) {
          deptName = found.name;
        } else if (!/^[0-9a-fA-F]{24}$/.test(trimmed)) {
          deptName = trimmed;
        }
      }

      if (!deptName) {
        deptName = (user as any).departmentName || currentEmployee.department || "Engineering";
      }

      const userIdStr = user.id || user._id || "";
      const rawCode = user.empId || user.code;
      let empCode = "DMSEMP260001";
      if (rawCode && rawCode.trim() && !/^[0-9a-fA-F]{24}$/.test(rawCode)) {
        empCode = rawCode;
      } else if (userIdStr && userIdStr.length >= 4) {
        empCode = `DMSEMP26${userIdStr.slice(-4).toUpperCase()}`;
      } else if (currentEmployee.code) {
        empCode = currentEmployee.code;
      }

      const rawDesig = user.designation;
      let jobTitle = "Operations Specialist";
      if (typeof rawDesig === "object" && rawDesig !== null) {
        jobTitle = (rawDesig as any).name || (rawDesig as any).title || jobTitle;
      } else if (typeof rawDesig === "string" && rawDesig.trim() && !/^[0-9a-fA-F]{24}$/.test(rawDesig.trim())) {
        jobTitle = rawDesig.trim();
      } else if ((user as any).designationName) {
        jobTitle = (user as any).designationName;
      }

      return {
        id: userIdStr || currentEmployee.id || "unknown",
        code: empCode,
        name: user.name || currentEmployee.name || "Employee",
        email: user.email || currentEmployee.email || "employee@poll.io",
        role: ((user.role as any) || "employee") as "employee" | "admin" | "director" | "intern",
        jobTitle,
        department: deptName,
        avatar: user.avatar || currentEmployee.avatar || "EP",
        points: Number((user as any).rewardPoints ?? user.points ?? 0),
        tasksCompleted: currentEmployee.tasksCompleted || 0,
        status: user.isActive === false ? "inactive" : "active",
        joinedAt: user.joinDate || currentEmployee.joinedAt || new Date().toISOString(),
        phone: user.phone || "",
      };
    }

    return {
      id: currentEmployee.id || "u1",
      code: currentEmployee.code || "DMSEMP260001",
      name: currentEmployee.name || "Ava Chen",
      email: currentEmployee.email || "ava.chen@poll.io",
      role: (currentEmployee.role as any) || "employee",
      jobTitle: currentEmployee.jobTitle || "Frontend Developer",
      department: currentEmployee.department || "Engineering",
      avatar: currentEmployee.avatar || "AC",
      points: currentEmployee.points || 0,
      tasksCompleted: currentEmployee.tasksCompleted || 0,
      status: currentEmployee.status || "active",
      joinedAt: currentEmployee.joinedAt || "2024-02-11",
      phone: currentEmployee.phone || "",
    };
  }, [user, departmentsData]);

  // 2. Filtered User Tasks
  const myTasks: TaskEntity[] = useMemo(() => {
    if (liveTasks && liveTasks.length > 0) {
      return (liveTasks as TaskEntity[]).filter((t) =>
        isTaskAssignedToUser(t, e.id, e.code, e.name)
      );
    }
    return (mockTasks as TaskEntity[]).filter((t) =>
      isTaskAssignedToUser(t, e.id, e.code, e.name)
    );
  }, [liveTasks, e.id, e.code, e.name]);

  // 3. Computed Statistics
  const completed = useMemo(
    () => myTasks.filter((t) => t.status === "completed").length,
    [myTasks]
  );

  const active = useMemo(
    () => myTasks.filter((t) => t.status === "in_progress").length,
    [myTasks]
  );

  const pending = useMemo(
    () => myTasks.filter((t) => t.status === "pending").length,
    [myTasks]
  );

  const completionRate = useMemo(
    () => (myTasks.length > 0 ? Math.round((completed / myTasks.length) * 100) : 0),
    [myTasks.length, completed]
  );

  // 4. Computed Points History
  const pointsHistory: PerformanceTrendPoint[] = useMemo(() => {
    const source = mockPerformanceTrend || [];
    return source.map((p, i) => {
      const cumulative = source.slice(0, i + 1).reduce((sum, item) => sum + (item.points || 0), 0);
      return {
        ...p,
        cumulative,
      };
    });
  }, []);

  const recentTasks = useMemo(() => myTasks.slice(0, 6), [myTasks]);

  const stats: StatItem[] = useMemo(
    () => [
      { label: "Total points", value: e.points.toLocaleString(), Icon: Sparkles, tone: "text-primary" },
      { label: "Completed", value: completed, Icon: CheckCircle2, tone: "text-primary" },
      { label: "Active", value: active, Icon: Clock, tone: "text-primary" },
      { label: "Completion", value: `${completionRate}%`, Icon: TrendingUp, tone: "text-primary" },
    ],
    [e.points, completed, active, completionRate]
  );

  // 5. Image Avatar Detector
  const avatarSrc = editable.photo || e.avatar;
  const isImageAvatar = useMemo(() => {
    return (
      Boolean(avatarSrc) &&
      typeof avatarSrc === "string" &&
      (avatarSrc.startsWith("data:") ||
        avatarSrc.startsWith("http:") ||
        avatarSrc.startsWith("https:") ||
        avatarSrc.startsWith("/") ||
        avatarSrc.includes("/"))
    );
  }, [avatarSrc]);

  return (
    <>
      <PageHeader
        title="Profile"
        subtitle="Your performance, achievements and history in one place."
      />

      {/* Query Error / Loading Alerts */}
      {(isDeptsError || isTasksError) && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>Some profile data could not be fetched. Displaying fallback values.</span>
        </div>
      )}

      {/* Hero Header */}
      <div className="glass overflow-hidden rounded-2xl">
        <div className="relative h-28 border-b border-border/60 bg-gradient-to-r from-primary/15 via-card to-card sm:h-32">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_120%,hsl(var(--primary)/0.18),transparent_65%)]" />
          <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] [background-size:32px_32px]" />
        </div>
        <div className="-mt-12 flex flex-col gap-5 p-5 sm:-mt-14 sm:flex-row sm:items-end sm:gap-6 sm:p-6">
          <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl border border-border/60 bg-muted font-display text-2xl font-bold text-foreground shadow-lg ring-4 ring-background sm:h-24 sm:w-24 sm:text-3xl">
            {isImageAvatar ? (
              <img
                src={avatarSrc}
                alt={`${e.name} profile photo`}
                className="h-full w-full object-cover"
              />
            ) : (
              <span>{avatarSrc || e.name.slice(0, 2).toUpperCase()}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-xl font-semibold sm:text-2xl">{e.name}</h2>
              <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">
                {e.jobTitle}
              </Badge>
              <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">
                {e.department}
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  "capitalize",
                  e.status === "active"
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-border/60 text-muted-foreground"
                )}
              >
                {e.status}
              </Badge>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground sm:text-sm">
              <IdBadge id={e.code} />
              <span className="inline-flex min-w-0 items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{e.email}</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 shrink-0" />
                {e.department}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                Joined {formatDateSafe(e.joinedAt, { month: "long", year: "numeric" })}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 shrink-0" />
                {e.points.toLocaleString()} pts
              </span>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button className="w-full rounded-md shadow-glow sm:w-auto" onClick={() => setEditOpen(true)}>
              Edit profile
            </Button>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 gap-px border-t border-border/60 bg-border/40 sm:grid-cols-4">
          {stats.map(({ label, value, Icon, tone }) => (
            <div key={label} className="flex items-center gap-3 bg-card/60 px-5 py-4">
              <div className={cn("grid h-9 w-9 place-items-center rounded-xl bg-muted", tone)}>
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <div className="font-display text-lg font-semibold">{value}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Basic Info + Performance */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Basic Information */}
        <div className="glass rounded-2xl p-6 lg:col-span-1">
          <h3 className="font-display text-lg font-semibold">Basic information</h3>
          <Separator className="my-4" />
          <dl className="space-y-4 text-sm">
            {[
              { Icon: Briefcase, label: "Employee ID", value: e.code },
              { Icon: Building2, label: "Department", value: e.department },
              { Icon: Mail, label: "Email", value: e.email },
              { Icon: Phone, label: "Phone", value: editable.phone || e.phone || "—" },
              { Icon: MapPin, label: "Location", value: "San Francisco, CA" },
              { Icon: Calendar, label: "Joined", value: formatDateSafe(e.joinedAt, { day: "numeric", month: "long", year: "numeric" }) },
            ].map(({ Icon, label, value }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <dt className="text-xs uppercase tracking-wider text-muted-foreground">{label}</dt>
                  <dd className="mt-0.5 truncate font-medium">{value}</dd>
                </div>
              </div>
            ))}
          </dl>
        </div>

        {/* Weekly Trend Chart */}
        <div className="glass rounded-2xl p-6 lg:col-span-2">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-display text-lg font-semibold">Performance</h3>
              <p className="text-xs text-muted-foreground">Weekly points and completed tasks trend</p>
            </div>
            <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
              <TrendingUp className="mr-1 h-3 w-3" /> +12.4%
            </Badge>
          </div>
          <div className="mt-4 h-64">
            {mockPerformanceTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockPerformanceTrend}>
                  <defs>
                    <linearGradient id="ptsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.72 0.19 45)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="oklch(0.72 0.19 45)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="oklch(0.28 0 0)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="week" stroke="oklch(0.65 0 0)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="oklch(0.65 0 0)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "oklch(0.18 0 0)",
                      border: "1px solid oklch(0.28 0 0)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="points"
                    stroke="oklch(0.72 0.19 45)"
                    strokeWidth={2}
                    fill="url(#ptsGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="grid h-full place-items-center text-xs text-muted-foreground">
                No performance data available.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Charts Row: Cumulative Points + Weekly Tasks */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass rounded-2xl p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-display text-lg font-semibold">Points history</h3>
              <p className="text-xs text-muted-foreground">Cumulative points earned over time</p>
            </div>
            <div className="text-right">
              <div className="font-display text-xl font-semibold text-gradient">
                {(pointsHistory[pointsHistory.length - 1]?.cumulative || 0).toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">total</div>
            </div>
          </div>
          <div className="mt-4 h-56">
            {pointsHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={pointsHistory}>
                  <defs>
                    <linearGradient id="cumGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.72 0.19 45)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="oklch(0.72 0.19 45)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="oklch(0.28 0 0)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="week" stroke="oklch(0.65 0 0)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="oklch(0.65 0 0)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "oklch(0.18 0 0)",
                      border: "1px solid oklch(0.28 0 0)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="cumulative"
                    stroke="oklch(0.72 0.19 45)"
                    strokeWidth={2}
                    fill="url(#cumGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="grid h-full place-items-center text-xs text-muted-foreground">
                No cumulative data available.
              </div>
            )}
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-display text-lg font-semibold">Weekly tasks</h3>
              <p className="text-xs text-muted-foreground">Tasks completed per week</p>
            </div>
            <Badge variant="outline" className="border-border/60">Last 8 weeks</Badge>
          </div>
          <div className="mt-4 h-56">
            {mockPerformanceTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockPerformanceTrend}>
                  <CartesianGrid stroke="oklch(0.28 0 0)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="week" stroke="oklch(0.65 0 0)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="oklch(0.65 0 0)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "oklch(0.18 0 0)",
                      border: "1px solid oklch(0.28 0 0)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="tasks" fill="oklch(0.72 0.19 45)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="grid h-full place-items-center text-xs text-muted-foreground">
                No task trend available.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Task History Table */}
      <div className="glass overflow-hidden rounded-2xl">
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
          <div>
            <h3 className="font-display text-lg font-semibold">Task history</h3>
            <p className="text-xs text-muted-foreground">
              {isTasksLoading ? "Loading tasks..." : `Your most recent ${recentTasks.length} tasks`}
            </p>
          </div>
          <Button asChild variant="ghost" size="sm" className="rounded-md">
            <Link to="/employee/tasks">View all</Link>
          </Button>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/60 hover:bg-transparent">
                <TableHead>Task</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Points</TableHead>
                <TableHead className="text-right">Deadline</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isTasksLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                    <div className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" /> Loading task history...
                    </div>
                  </TableCell>
                </TableRow>
              ) : recentTasks.length > 0 ? (
                recentTasks.map((t, idx) => (
                  <TableRow key={t.id || t._id || `task-${idx}`} className="border-border/40">
                    <TableCell>
                      <Link
                        to="/employee/tasks/$id"
                        params={{ id: t.id || t._id || "" }}
                        className="font-medium hover:text-primary"
                      >
                        {t.title}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{t.category || "General"}</TableCell>
                    <TableCell><StatusBadge status={t.status} /></TableCell>
                    <TableCell className="text-right font-medium">+{t.points || 0}</TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {formatDateSafe(t.dueDate, { day: "numeric", month: "short" })}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                    No tasks assigned yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Points History Detail Table */}
      <div className="glass overflow-hidden rounded-2xl">
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
          <div>
            <h3 className="font-display text-lg font-semibold">Points history</h3>
            <p className="text-xs text-muted-foreground">Weekly breakdown of points and tasks</p>
          </div>
          <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
            <Trophy className="mr-1 h-3 w-3" /> {pending} pending payouts
          </Badge>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/60 hover:bg-transparent">
                <TableHead>Week</TableHead>
                <TableHead className="text-right">Points earned</TableHead>
                <TableHead className="text-right">Tasks completed</TableHead>
                <TableHead className="text-right">Avg / task</TableHead>
                <TableHead className="text-right">Cumulative</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pointsHistory
                .slice()
                .reverse()
                .map((p, idx) => {
                  const avgPerTask = p.tasks > 0 ? Math.round(p.points / p.tasks) : 0;
                  return (
                    <TableRow key={p.week || `week-${idx}`} className="border-border/40">
                      <TableCell className="font-medium">{p.week}</TableCell>
                      <TableCell className="text-right">
                        <span className="inline-flex items-center gap-1 font-medium text-primary">
                          <Sparkles className="h-3 w-3" />+{p.points || 0}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">{p.tasks || 0}</TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {avgPerTask}
                      </TableCell>
                      <TableCell className="text-right font-display font-semibold">
                        {(p.cumulative || 0).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <EditProfileDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        initials={e.avatar}
        currentPhone={e.phone}
        readOnly={[
          { label: "Full name", value: e.name },
          { label: "Employee ID", value: e.code },
          { label: "Email", value: e.email },
          { label: "Department", value: e.department },
        ]}
      />
    </>
  );
}
