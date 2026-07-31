import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronRight, Home } from "lucide-react";
import { Fragment } from "react";

const LABELS: Record<string, string> = {
  admin: "Admin",
  employee: "Employee",
  employees: "Employees",
  admins: "Admins",
  tasks: "Tasks",
  leaderboard: "Leaderboard",
  activity: "Activity Logs",
  reports: "Reports",
  completed: "Completed",
  pending: "Pending",
  points: "Points",
  performance: "Performance",
  history: "History",
  profile: "Profile",
};

function humanize(seg: string) {
  return LABELS[seg] ?? seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " ");
}

export function RouteBreadcrumb() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-1.5 text-xs text-muted-foreground"
    >
      <Link to="/" className="flex items-center gap-1 transition-colors hover:text-foreground">
        <Home className="h-3.5 w-3.5" />
      </Link>
      {parts.map((seg, i) => {
        const href = "/" + parts.slice(0, i + 1).join("/");
        const isLast = i === parts.length - 1;
        return (
          <Fragment key={href}>
            <ChevronRight className="h-3.5 w-3.5 opacity-50" />
            {isLast ? (
              <span className="font-medium text-foreground">{humanize(seg)}</span>
            ) : (
              <Link to={href} className="transition-colors hover:text-foreground">
                {humanize(seg)}
              </Link>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
