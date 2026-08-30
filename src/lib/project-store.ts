import { useProjectsQuery } from "@/features/projects/hooks/use-projects-api";
import type {
  Project,
  FrontendProjectStatus as ProjectStatus,
  ProjectAnalytics,
} from "@/features/projects";
import {
  projectColors,
  projectStatusLabel,
  projectStatusStyles,
} from "@/features/projects";

export type { Project, ProjectStatus, ProjectAnalytics };
export { projectColors, projectStatusLabel, projectStatusStyles };

export const seedProjects: Project[] = [];

/** Every project returned from the database API. */
export function useProjects(): Project[] {
  const { data } = useProjectsQuery();
  return data ?? [];
}

/** Only active projects returned from the database API. */
export function useActiveProjects(): Project[] {
  return useProjects().filter((p) => (p.status || "").toLowerCase() === "active");
}

export function allProjects(): Project[] {
  return [];
}
