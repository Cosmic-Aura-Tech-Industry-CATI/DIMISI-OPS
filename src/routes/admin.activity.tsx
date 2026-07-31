import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ClipboardList,
  Play,
  Upload,
  Eye,
  CheckCircle2,
  Sparkles,
  XCircle,
  MessageSquare,
  UserPlus,
  KeyRound,
  Settings2,
  Search,
  Filter,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { employees, tasks } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/activity")({
  head: () => ({
    meta: [
      { title: "Activity — Poll" },
      { name: "description", content: "Full timeline of task and account activity across your organization." },
      { property: "og:title", content: "Activity — Poll" },
      { property: "og:description", content: "Full timeline of task and account activity across your organization." },
    ],
  }),
  component: ActivityPage,
});

type EventType =
  | "task_assigned"
  | "task_opened"
  | "proof_submitted"
  | "under_review"
  | "approved"
  | "rejected"
  | "points_added"
  | "comment"
  | "invited"
  | "login"
  | "system";

type ActivityEvent = {
  id: string;
  type: EventType;
  actor: string;
  actorAvatar: string;
  actorId: string;
  target: string;
  detail?: string;
  timestamp: string; // ISO
  points?: number;
};

const meta: Record<EventType, { label: string; Icon: typeof ClipboardList; tone: string; ring: string }> = {
  task_assigned:   { label: "Task Assigned",   Icon: ClipboardList, tone: "bg-primary/15 text-primary",       ring: "ring-primary/30" },
  task_opened:     { label: "Task Opened",     Icon: Play,          tone: "bg-primary/15 text-primary", ring: "ring-primary/30" },
  proof_submitted: { label: "Proof Submitted", Icon: Upload,        tone: "bg-primary/15 text-primary", ring: "ring-primary/30" },
  under_review:    { label: "Under Review",    Icon: Eye,           tone: "bg-primary/15 text-primary",   ring: "ring-primary/30" },
  approved:        { label: "Approved",        Icon: CheckCircle2,  tone: "bg-primary/15 text-primary", ring: "ring-primary/30" },
  rejected:        { label: "Rejected",        Icon: XCircle,       tone: "bg-primary/15 text-primary",     ring: "ring-primary/30" },
  points_added:    { label: "Points Added",    Icon: Sparkles,      tone: "bg-primary/15 text-primary",       ring: "ring-primary/30" },
  comment:         { label: "Comment",         Icon: MessageSquare, tone: "bg-slate-500/15 text-slate-300",   ring: "ring-slate-500/30" },
  invited:         { label: "Invited",         Icon: UserPlus,      tone: "bg-primary/15 text-primary",     ring: "ring-primary/30" },
  login:           { label: "Login",           Icon: KeyRound,      tone: "bg-primary/15 text-primary",       ring: "ring-primary/30" },
  system:          { label: "System",          Icon: Settings2,     tone: "bg-muted text-muted-foreground",   ring: "ring-border/40" },
};

const nowIso = "2026-07-29T09:00:00Z";

function hoursAgo(h: number) {
  return new Date(new Date(nowIso).getTime() - h * 3600_000).toISOString();
}

const events: ActivityEvent[] = [
  { id: "e1",  type: "task_assigned",   actor: "Elena Voss",     actorAvatar: "EV", actorId: "a1", target: tasks[9]?.title ?? "Enterprise SSO rollout", detail: "assigned to Priya Nair", timestamp: hoursAgo(1) },
  { id: "e2",  type: "task_opened",     actor: "Priya Nair",     actorAvatar: "PN", actorId: "u3", target: tasks[9]?.title ?? "Enterprise SSO rollout", timestamp: hoursAgo(2) },
  { id: "e3",  type: "proof_submitted", actor: "Ava Chen",       actorAvatar: "AC", actorId: "u1", target: "API rate-limit dashboard", detail: "2 files attached", timestamp: hoursAgo(3) },
  { id: "e4",  type: "under_review",    actor: "Rhea Kapoor",    actorAvatar: "RK", actorId: "a3", target: "API rate-limit dashboard", detail: "picked up for review", timestamp: hoursAgo(4) },
  { id: "e5",  type: "approved",        actor: "Rhea Kapoor",    actorAvatar: "RK", actorId: "a3", target: "Fix mobile crash on iOS 19", detail: "reviewed by admin", timestamp: hoursAgo(5) },
  { id: "e6",  type: "points_added",    actor: "System",         actorAvatar: "SY", actorId: "sys", target: "Ava Chen", detail: "+75 points for Fix mobile crash on iOS 19", timestamp: hoursAgo(5), points: 75 },
  { id: "e7",  type: "comment",         actor: "Julian Park",    actorAvatar: "JP", actorId: "a2", target: "Design onboarding flow v3", detail: "left a comment for Marcus", timestamp: hoursAgo(6) },
  { id: "e8",  type: "rejected",        actor: "Elena Voss",     actorAvatar: "EV", actorId: "a1", target: "Legacy cron cleanup", detail: "requested changes", timestamp: hoursAgo(28) },
  { id: "e9",  type: "task_assigned",   actor: "Elena Voss",     actorAvatar: "EV", actorId: "a1", target: "Q3 pipeline forecast", detail: "assigned to Sofia Alvarez", timestamp: hoursAgo(30) },
  { id: "e10", type: "proof_submitted", actor: "Sofia Alvarez",  actorAvatar: "SA", actorId: "u5", target: "Q3 pipeline forecast", detail: "1 file attached", timestamp: hoursAgo(48) },
  { id: "e11", type: "approved",        actor: "Elena Voss",     actorAvatar: "EV", actorId: "a1", target: "Roadmap workshop prep", timestamp: hoursAgo(72) },
  { id: "e12", type: "points_added",    actor: "System",         actorAvatar: "SY", actorId: "sys", target: "Zara Ahmed", detail: "+55 points for Roadmap workshop prep", timestamp: hoursAgo(72), points: 55 },
  { id: "e13", type: "invited",         actor: "Julian Park",    actorAvatar: "JP", actorId: "a2", target: "noah@poll.io", detail: "sent an invitation", timestamp: hoursAgo(120) },
  { id: "e14", type: "login",           actor: "Marcus Reed",    actorAvatar: "MR", actorId: "u2", target: "Web · Chrome", detail: "signed in", timestamp: hoursAgo(168) },
  { id: "e15", type: "system",          actor: "System",         actorAvatar: "SY", actorId: "sys", target: "Weekly digest generated", timestamp: hoursAgo(180) },
  { id: "e16", type: "task_opened",     actor: "Liam Foster",    actorAvatar: "LF", actorId: "u4", target: "Launch summer campaign", timestamp: hoursAgo(240) },
  { id: "e17", type: "under_review",    actor: "Julian Park",    actorAvatar: "JP", actorId: "a2", target: "Checkout webhook retries", timestamp: hoursAgo(320) },
];

type RangeKey = "today" | "week" | "month" | "all";

function withinRange(ts: string, range: RangeKey) {
  if (range === "all") return true;
  const diffH = (new Date(nowIso).getTime() - new Date(ts).getTime()) / 3600_000;
  if (range === "today") return diffH <= 24;
  if (range === "week") return diffH <= 24 * 7;
  return diffH <= 24 * 30;
}

function formatWhen(ts: string) {
  const d = new Date(ts);
  const diffM = Math.round((new Date(nowIso).getTime() - d.getTime()) / 60000);
  if (diffM < 60) return `${diffM}m ago`;
  if (diffM < 60 * 24) return `${Math.round(diffM / 60)}h ago`;
  const days = Math.round(diffM / 60 / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function dayLabel(ts: string) {
  const d = new Date(ts);
  const now = new Date(nowIso);
  const days = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return "This week";
  if (days < 30) return "This month";
  return "Earlier";
}

function ActivityPage() {
  const [range, setRange] = useState<RangeKey>("week");
  const [employee, setEmployee] = useState<string>("all");
  const [type, setType] = useState<string>("all");
  const [search, setSearch] = useState("");

  const people = useMemo(
    () => employees.map((e) => ({ id: e.id, name: e.name })).sort((a, b) => a.name.localeCompare(b.name)),
    [],
  );

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
      .sort((a, b) => +new Date(a.timestamp) - +new Date(b.timestamp));
  }, [range, employee, type, search]);

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
      approvals: filtered.filter((e) => e.type === "approved").length,
      submissions: filtered.filter((e) => e.type === "proof_submitted").length,
      points: filtered.reduce((s, e) => s + (e.points ?? 0), 0),
    };
  }, [filtered]);

  return (
    <>
      <PageHeader
        title="Activity"
        subtitle="A live timeline of tasks, reviews, and system events across the org."
      />

      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Events", value: totals.total, tone: "text-foreground" },
          { label: "Approvals", value: totals.approvals, tone: "text-primary" },
          { label: "Submissions", value: totals.submissions, tone: "text-primary" },
          { label: "Points awarded", value: totals.points, tone: "text-primary" },
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
              {people.map((p) => (
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
              {(Object.keys(meta) as EventType[]).map((k) => (
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
        {grouped.length === 0 && (
          <div className="py-16 text-center text-sm text-muted-foreground">
            No activity for these filters.
          </div>
        )}

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
              <div className="absolute bottom-2 left-[27px] top-2 w-px bg-gradient-to-b from-primary/40 via-border to-transparent" />
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
                        {ev.points ? (
                          <Badge className="bg-primary/15 text-primary hover:bg-primary/15">
                            <Sparkles className="mr-1 h-3 w-3" />+{ev.points} pts
                          </Badge>
                        ) : null}
                        <span className="ml-auto text-xs text-muted-foreground">
                          {formatWhen(ev.timestamp)}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-sm">
                        <div className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-primary/30 to-accent text-[10px] font-semibold">
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
        ))}
      </div>
    </>
  );
}
