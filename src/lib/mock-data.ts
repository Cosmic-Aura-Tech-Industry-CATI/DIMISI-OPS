import { assignEmployeeCodes } from "@/lib/ids";
export type TaskStatus = "pending" | "in_progress" | "completed" | "overdue" | "available" | "assigned";
export type TaskPriority = "low" | "medium" | "high";
export type TaskReviewState = "in_review" | "approved" | "rejected";
/** How a task reaches an employee. */
export type TaskType = "universal" | "project" | "direct";

export interface Task {
  id: string;
  title: string;
  description: string;
  assignee: string;
  assigneeId: string;
  status: TaskStatus;
  priority: TaskPriority;
  points: number;
  dueDate: string;
  createdAt: string;
  category: string;
  createdBy?: string;
  notes?: string;
  attachments?: { name: string; size: string }[];
  reviewState?: TaskReviewState;
  rejectionReason?: string;
  /** Universal (open to all), Project (open within a project) or Direct (pre-assigned). */
  taskType?: TaskType;
  /** Set when taskType === "project". */
  projectId?: string;
  /** Human estimate, e.g. "4h" or "2 days". */
  estimatedTime?: string;
  /** ISO timestamp of the moment the task was claimed / assigned. */
  assignedAt?: string;
  /** Standardized Dimisi ID of the assignee (DMSEMPYYNN). */
  assigneeCode?: string;
}


export interface Employee {
  id: string;
  /** Standardized Dimisi ID — DMSEMPYYNN / DMSDIRNN / DMSADMNN */
  code: string;
  name: string;
  email: string;
  role: "admin" | "employee";
  jobTitle: string;
  department: string;
  avatar: string;
  points: number;
  tasksCompleted: number;
  status: "active" | "inactive";
  joinedAt: string;
  /** Permanent system administrators cannot be deleted. */
  permanent?: boolean;
  /** True when the person holds both an employee and an admin account. */
  dualRole?: boolean;
  /** Optional contact / bio details captured at account creation. */
  phone?: string;
  about?: string;
}

export interface ActivityLog {
  id: string;
  user: string;
  userCode?: string;
  userAvatar: string;
  action: string;
  target: string;
  timestamp: string;
  type: "task" | "auth" | "system" | "reward";
}

const employeeSeed: Omit<Employee, "code">[] = [
  { id: "u1", name: "Ava Chen", email: "ava.chen@poll.io", role: "employee", jobTitle: "Frontend Developer", department: "Engineering", avatar: "AC", points: 1420, tasksCompleted: 42, status: "active", joinedAt: "2024-02-11" },
  { id: "u2", name: "Marcus Reed", email: "marcus@poll.io", role: "employee", jobTitle: "UI Designer", department: "Design", avatar: "MR", points: 1180, tasksCompleted: 38, status: "active", joinedAt: "2024-01-05" },
  { id: "u3", name: "Priya Nair", email: "priya@poll.io", role: "employee", jobTitle: "Backend Developer", department: "Engineering", avatar: "PN", points: 1620, tasksCompleted: 51, status: "active", joinedAt: "2023-11-22" },
  { id: "u4", name: "Liam Foster", email: "liam@poll.io", role: "employee", jobTitle: "Market Researcher", department: "Marketing", avatar: "LF", points: 980, tasksCompleted: 29, status: "active", joinedAt: "2024-04-30" },
  { id: "u5", name: "Sofia Alvarez", email: "sofia@poll.io", role: "employee", jobTitle: "Market Researcher", department: "Sales", avatar: "SA", points: 1310, tasksCompleted: 40, status: "active", joinedAt: "2024-03-14" },
  { id: "u6", name: "Noah Kim", email: "noah@poll.io", role: "employee", jobTitle: "QA Tester", department: "Support", avatar: "NK", points: 720, tasksCompleted: 21, status: "inactive", joinedAt: "2024-06-01" },
  { id: "u7", name: "Zara Ahmed", email: "zara@poll.io", role: "employee", jobTitle: "QA Tester", department: "Product", avatar: "ZA", points: 1540, tasksCompleted: 47, status: "active", joinedAt: "2023-09-18" },
  // Dual-role people — they also hold an admin account (see `admins` below).
  { id: "u8", name: "Rhea Kapoor", email: "rhea@dimisi.io", role: "employee", jobTitle: "UI Designer", department: "Design", avatar: "RK", points: 1250, tasksCompleted: 36, status: "active", joinedAt: "2024-06-12", dualRole: true },
  { id: "u9", name: "Julian Park", email: "julian@dimisi.io", role: "employee", jobTitle: "Frontend Developer", department: "Product", avatar: "JP", points: 860, tasksCompleted: 24, status: "active", joinedAt: "2025-01-20", dualRole: true },
];

/** Employee directory — each person carries their EMPLOYEE id (DMSEMPYYNN). Oldest joiners first. */
export const employees: Employee[] = assignEmployeeCodes(employeeSeed).sort(
  (a, b) => +new Date(a.joinedAt) - +new Date(b.joinedAt),
);

/** Admin directory — each person carries their ADMIN id (DMSDIRNN / DMSADMNN). Oldest first. */
const adminSeed: Employee[] = [
  { id: "a1", code: "DMSDIR01", permanent: true, name: "Shikhar Dixit", email: "shikhar@dimisi.io", role: "admin", jobTitle: "Market Researcher", department: "Operations", avatar: "SD", points: 0, tasksCompleted: 0, status: "active", joinedAt: "2023-05-04" },
  { id: "a2", code: "DMSDIR02", permanent: true, name: "Swatantra Singh", email: "swatantra@dimisi.io", role: "admin", jobTitle: "QA Tester", department: "People", avatar: "SS", points: 0, tasksCompleted: 0, status: "active", joinedAt: "2023-08-21" },
  { id: "a3", code: "DMSDIR03", permanent: true, name: "Nishkarsh Mishra", email: "nishkarsh@dimisi.io", role: "admin", jobTitle: "Backend Developer", department: "Engineering", avatar: "NM", points: 0, tasksCompleted: 0, status: "active", joinedAt: "2023-02-17" },
  { id: "a4", code: "DMSADM04", dualRole: true, name: "Rhea Kapoor", email: "rhea@dimisi.io", role: "admin", jobTitle: "UI Designer", department: "Design", avatar: "RK", points: 0, tasksCompleted: 0, status: "active", joinedAt: "2024-06-12" },
  { id: "a5", code: "DMSADM05", dualRole: true, name: "Julian Park", email: "julian@dimisi.io", role: "admin", jobTitle: "Frontend Developer", department: "Product", avatar: "JP", points: 0, tasksCompleted: 0, status: "active", joinedAt: "2025-01-20" },
];

export const admins: Employee[] = [...adminSeed].sort(
  (a, b) => +new Date(a.joinedAt) - +new Date(b.joinedAt),
);

/** Cross-links between a person's employee and admin accounts. */
export const dualRoleLinks: { name: string; employeeId: string; adminId: string }[] = [
  { name: "Rhea Kapoor", employeeId: "u8", adminId: "a4" },
  { name: "Julian Park", employeeId: "u9", adminId: "a5" },
];

export const employeeAccountFor = (name: string) =>
  employees.find((e) => e.name === name && e.dualRole);
export const adminAccountFor = (name: string) =>
  admins.find((a) => a.name === name && a.dualRole);

const taskSeed: Task[] = [
  { id: "t1", title: "Refactor billing service", description: "Split monolith service into invoice + payments modules.", assignee: "Ava Chen", assigneeId: "u1", status: "in_progress", priority: "high", points: 80, dueDate: "2026-08-04", createdAt: "2026-07-20", category: "Engineering" },
  { id: "t2", title: "Design onboarding flow v3", description: "Streamline first-run experience to 3 steps.", assignee: "Marcus Reed", assigneeId: "u2", status: "pending", priority: "medium", points: 50, dueDate: "2026-08-10", createdAt: "2026-07-22", category: "Design" },
  { id: "t3", title: "Q3 pipeline forecast", description: "Prepare regional pipeline forecast deck.", assignee: "Sofia Alvarez", assigneeId: "u5", status: "completed", priority: "high", points: 70, dueDate: "2026-07-25", createdAt: "2026-07-10", category: "Sales" },
  { id: "t4", title: "Migrate to new analytics SDK", description: "Replace legacy tracker across web + mobile.", assignee: "Priya Nair", assigneeId: "u3", status: "in_progress", priority: "high", points: 90, dueDate: "2026-08-01", createdAt: "2026-07-15", category: "Engineering" },
  { id: "t5", title: "Launch summer campaign", description: "Ship landing, email drip, and social kit.", assignee: "Liam Foster", assigneeId: "u4", status: "overdue", priority: "medium", points: 60, dueDate: "2026-07-28", createdAt: "2026-07-05", category: "Marketing" },
  { id: "t6", title: "Customer NPS review", description: "Analyze Q2 NPS results and propose 3 actions.", assignee: "Noah Kim", assigneeId: "u6", status: "pending", priority: "low", points: 30, dueDate: "2026-08-15", createdAt: "2026-07-23", category: "Support" },
  { id: "t7", title: "Roadmap workshop prep", description: "Draft roadmap themes for the H2 workshop.", assignee: "Zara Ahmed", assigneeId: "u7", status: "completed", priority: "medium", points: 55, dueDate: "2026-07-26", createdAt: "2026-07-14", category: "Product" },
  { id: "t8", title: "Fix mobile crash on iOS 19", description: "Root-cause and patch the startup crash.", assignee: "Ava Chen", assigneeId: "u1", status: "completed", priority: "high", points: 75, dueDate: "2026-07-24", createdAt: "2026-07-18", category: "Engineering" },
  { id: "t9", title: "Update brand guidelines", description: "Refresh typography and motion tokens.", assignee: "Marcus Reed", assigneeId: "u2", status: "in_progress", priority: "low", points: 40, dueDate: "2026-08-12", createdAt: "2026-07-21", category: "Design" },
  { id: "t10", title: "Enterprise SSO rollout", description: "Enable SAML for top 20 accounts.", assignee: "Priya Nair", assigneeId: "u3", status: "pending", priority: "high", points: 100, dueDate: "2026-08-20", createdAt: "2026-07-25", category: "Engineering" },
  { id: "t11", title: "API rate-limit dashboard", description: "Instrument gateway and ship an internal dashboard.", assignee: "Ava Chen", assigneeId: "u1", status: "completed", priority: "medium", points: 60, dueDate: "2026-07-27", createdAt: "2026-07-16", category: "Engineering", reviewState: "in_review" },
  { id: "t12", title: "Checkout webhook retries", description: "Add exponential backoff and dead-letter queue.", assignee: "Ava Chen", assigneeId: "u1", status: "completed", priority: "high", points: 85, dueDate: "2026-07-26", createdAt: "2026-07-14", category: "Engineering", reviewState: "in_review" },
  { id: "t13", title: "Legacy cron cleanup", description: "Remove deprecated cron jobs from billing worker.", assignee: "Ava Chen", assigneeId: "u1", status: "completed", priority: "low", points: 25, dueDate: "2026-07-22", createdAt: "2026-07-10", category: "Engineering", reviewState: "rejected", rejectionReason: "Two jobs still referenced by finance exports — please keep and document them." },
  { id: "t14", title: "Q2 uptime report", description: "Compile incident summary for stakeholder review.", assignee: "Ava Chen", assigneeId: "u1", status: "completed", priority: "medium", points: 45, dueDate: "2026-07-18", createdAt: "2026-07-05", category: "Engineering", reviewState: "rejected", rejectionReason: "Missing RCA for the June 14 outage. Please add and resubmit." },
];

/** Open pool — universal + project tasks nobody has picked yet. */
const poolSeed: Task[] = [
  { id: "p1", title: "Refresh internal documentation", description: "Update the onboarding handbook and API notes.", assignee: "", assigneeId: "", status: "available", priority: "low", points: 30, dueDate: "2026-08-14", createdAt: "2026-07-19", category: "Operations", createdBy: "Shikhar Dixit", taskType: "universal", estimatedTime: "3h" },
  { id: "p2", title: "Regression testing sweep", description: "Run the full manual regression pass on staging.", assignee: "", assigneeId: "", status: "available", priority: "medium", points: 45, dueDate: "2026-08-06", createdAt: "2026-07-21", category: "Support", createdBy: "Swatantra Singh", taskType: "universal", estimatedTime: "1 day" },
  { id: "p3", title: "Fix sidebar overflow on tablet", description: "Small UI bug — sidebar clips at 820px width.", assignee: "", assigneeId: "", status: "available", priority: "high", points: 35, dueDate: "2026-08-02", createdAt: "2026-07-24", category: "Engineering", createdBy: "Nishkarsh Mishra", taskType: "universal", estimatedTime: "2h" },
  { id: "p4", title: "Competitor research brief", description: "Summarise five competitor dashboards with screenshots.", assignee: "", assigneeId: "", status: "available", priority: "low", points: 40, dueDate: "2026-08-18", createdAt: "2026-07-26", category: "Marketing", createdBy: "Rhea Kapoor", taskType: "universal", estimatedTime: "4h" },
  { id: "p5", title: "Dashboard UI", description: "Build the Dimisi analytics dashboard screens.", assignee: "", assigneeId: "", status: "available", priority: "high", points: 90, dueDate: "2026-08-09", createdAt: "2026-07-18", category: "Design", createdBy: "Rhea Kapoor", taskType: "project", projectId: "dimisi", estimatedTime: "3 days" },
  { id: "p6", title: "Notification System", description: "In-app + email notification pipeline for Dimisi.", assignee: "", assigneeId: "", status: "available", priority: "medium", points: 75, dueDate: "2026-08-16", createdAt: "2026-07-20", category: "Engineering", createdBy: "Julian Park", taskType: "project", projectId: "dimisi", estimatedTime: "2 days" },
  { id: "p7", title: "Opinion Feed", description: "Infinite feed with ranking for Kalesh.", assignee: "", assigneeId: "", status: "available", priority: "high", points: 85, dueDate: "2026-08-11", createdAt: "2026-07-22", category: "Product", createdBy: "Shikhar Dixit", taskType: "project", projectId: "kalesh", estimatedTime: "3 days" },
  { id: "p8", title: "Booking System", description: "End-to-end booking flow for Rudra Tours & Travels.", assignee: "", assigneeId: "", status: "available", priority: "high", points: 95, dueDate: "2026-08-21", createdAt: "2026-07-25", category: "Engineering", createdBy: "Swatantra Singh", taskType: "project", projectId: "rudra", estimatedTime: "4 days" },
  { id: "p9", title: "Case Study Layout", description: "Editorial case study template for the portfolio site.", assignee: "", assigneeId: "", status: "available", priority: "medium", points: 55, dueDate: "2026-08-13", createdAt: "2026-07-23", category: "Design", createdBy: "Rhea Kapoor", taskType: "project", projectId: "portfolio", estimatedTime: "1 day" },
];

/** Oldest tasks first. */
export const tasks: Task[] = [...taskSeed, ...poolSeed]
  .map((t) => ({ ...t, taskType: t.taskType ?? ("direct" as const) }))
  .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));


const activityLogSeed: ActivityLog[] = [
  { id: "l1", user: "Ava Chen", userCode: "DMSEMP2402", userAvatar: "AC", action: "completed task", target: "Fix mobile crash on iOS 19", timestamp: "2026-07-29T06:14:00Z", type: "task" },
  { id: "l2", user: "Shikhar Dixit", userCode: "DMSDIR01", userAvatar: "SD", action: "created task", target: "Enterprise SSO rollout", timestamp: "2026-07-29T05:42:00Z", type: "task" },
  { id: "l3", user: "Sofia Alvarez", userCode: "DMSEMP2403", userAvatar: "SA", action: "earned points", target: "+70 for Q3 pipeline forecast", timestamp: "2026-07-28T18:03:00Z", type: "reward" },
  { id: "l4", user: "Swatantra Singh", userCode: "DMSDIR02", userAvatar: "SS", action: "invited employee", target: "noah@poll.io", timestamp: "2026-07-28T12:20:00Z", type: "system" },
  { id: "l5", user: "Marcus Reed", userCode: "DMSEMP2401", userAvatar: "MR", action: "logged in", target: "Web · Chrome", timestamp: "2026-07-28T09:10:00Z", type: "auth" },
  { id: "l6", user: "Zara Ahmed", userCode: "DMSEMP2301", userAvatar: "ZA", action: "completed task", target: "Roadmap workshop prep", timestamp: "2026-07-27T22:11:00Z", type: "task" },
  { id: "l7", user: "Priya Nair", userCode: "DMSEMP2302", userAvatar: "PN", action: "updated task", target: "Migrate to new analytics SDK", timestamp: "2026-07-27T15:36:00Z", type: "task" },
  { id: "l8", user: "Liam Foster", userCode: "DMSEMP2404", userAvatar: "LF", action: "task overdue", target: "Launch summer campaign", timestamp: "2026-07-28T00:00:00Z", type: "system" },
];

/** Oldest activity first. */
export const activityLogs: ActivityLog[] = [...activityLogSeed].sort(
  (a, b) => +new Date(a.timestamp) - +new Date(b.timestamp),
);

export const weeklyCompletion = [
  { day: "Mon", completed: 12, created: 15 },
  { day: "Tue", completed: 18, created: 14 },
  { day: "Wed", completed: 22, created: 20 },
  { day: "Thu", completed: 16, created: 18 },
  { day: "Fri", completed: 25, created: 22 },
  { day: "Sat", completed: 9, created: 6 },
  { day: "Sun", completed: 6, created: 4 },
];

export const departmentDistribution = [
  { name: "Engineering", value: 38 },
  { name: "Design", value: 18 },
  { name: "Marketing", value: 14 },
  { name: "Sales", value: 16 },
  { name: "Product", value: 10 },
  { name: "Support", value: 4 },
];

export const performanceTrend = [
  { week: "W1", points: 210, tasks: 8 },
  { week: "W2", points: 280, tasks: 11 },
  { week: "W3", points: 340, tasks: 13 },
  { week: "W4", points: 300, tasks: 12 },
  { week: "W5", points: 410, tasks: 16 },
  { week: "W6", points: 380, tasks: 15 },
  { week: "W7", points: 460, tasks: 18 },
  { week: "W8", points: 520, tasks: 20 },
];

export const leaderboard = [...employees]
  .sort((a, b) => b.points - a.points)
  .map((e, i) => ({ ...e, rank: i + 1 }));

export const currentEmployee: Employee =
  employees.find((e) => e.id === "u1") ?? employees[0];
