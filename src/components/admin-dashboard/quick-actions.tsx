import { Link } from "@tanstack/react-router";
import { Activity, Award, ClipboardList, Plus, Shield, Sparkles, UserPlus } from "lucide-react";
import { performanceTrend } from "@/lib/mock-data";

function QuickAction({
  to,
  icon: Icon,
  label,
  primary,
}: {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  primary?: boolean;
}) {
  return (
    <Link
      to={to}
      className={`group flex flex-col items-start gap-2 rounded-xl border p-3 transition-all hover:-translate-y-0.5 ${
        primary
          ? "border-primary/40 bg-primary/10 hover:bg-primary/15"
          : "border-border/60 bg-card/40 hover:bg-secondary/40"
      }`}
    >
      <div
        className={`grid h-8 w-8 place-items-center rounded-lg ${
          primary ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
        }`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <span className="text-xs font-medium leading-tight">{label}</span>
    </Link>
  );
}

export function QuickActionsPanel() {
  const momentum =
    performanceTrend[performanceTrend.length - 1].points -
    performanceTrend[performanceTrend.length - 2].points;

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="font-display text-lg font-semibold">Quick actions</h3>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">Jump into common workflows</p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <QuickAction to="/admin/tasks" icon={Plus} label="Create task" primary />
        <QuickAction to="/admin/employees" icon={UserPlus} label="Add employee" />
        <QuickAction to="/admin/task-reviews" icon={ClipboardList} label="Review tasks" />
        <QuickAction to="/admin/leaderboard" icon={Award} label="Award points" />
        <QuickAction to="/admin/reports" icon={Activity} label="View reports" />
        <QuickAction to="/admin/admins" icon={Shield} label="Manage admins" />
      </div>
      <div className="mt-5 rounded-xl border border-primary/30 bg-primary/5 p-4">
        <p className="text-xs font-medium uppercase tracking-wider text-primary">Weekly momentum</p>
        <p className="mt-2 font-display text-2xl font-semibold">+{momentum} pts</p>
        <p className="mt-1 text-xs text-muted-foreground">Compared to last week across all teams.</p>
      </div>
    </div>
  );
}
