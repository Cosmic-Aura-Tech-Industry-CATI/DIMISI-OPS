/**
 * Type-safe service functions for the Projects module.
 * Communicates with the backend /api/v1/projects endpoints.
 */
import { http } from "@/api/client/client";
import { API_ENDPOINTS } from "@/api/client/endpoints";
import type { MessageResponse } from "@/types/api";
import {
  mapCreateProjectPayload,
  mapProjectResponse,
  mapUpdateProjectPayload,
  type BackendProject,
  type CreateProjectPayload,
  type Project,
  type ProjectFilters,
  type ProjectListResponse,
  type ProjectSingleResponse,
  type UpdateProjectPayload,
} from "../types";

const { projects: projectEndpoints } = API_ENDPOINTS;

/** GET /api/v1/projects — retrieves all projects with real-time task analytics. */
export async function getProjects(filters?: ProjectFilters): Promise<Project[]> {
  const res = await http.get<ProjectListResponse | BackendProject[]>(
    projectEndpoints.list,
    { params: filters },
  );

  const rawList = Array.isArray(res) ? res : res?.projects ?? [];
  return rawList.map(mapProjectResponse);
}

/** GET /api/v1/projects/:id — retrieves a single project by ID. */
export async function getProjectById(id: string): Promise<Project> {
  const res = await http.get<ProjectSingleResponse | BackendProject>(
    projectEndpoints.detail(id),
  );

  const raw = "project" in res ? res.project : (res as BackendProject);
  return mapProjectResponse(raw);
}

/** POST /api/v1/projects — creates a new project. */
export async function createProject(payload: CreateProjectPayload): Promise<Project> {
  const body = mapCreateProjectPayload(payload);
  const res = await http.post<ProjectSingleResponse | BackendProject>(
    projectEndpoints.create,
    body,
  );

  const raw = "project" in res ? res.project : (res as BackendProject);
  return mapProjectResponse(raw);
}

/** PATCH /api/v1/projects/:id — updates an existing project. */
export async function updateProject(
  id: string,
  payload: UpdateProjectPayload,
): Promise<Project> {
  const body = mapUpdateProjectPayload(payload);
  const res = await http.patch<ProjectSingleResponse | BackendProject>(
    projectEndpoints.update(id),
    body,
  );

  const raw = "project" in res ? res.project : (res as BackendProject);
  return mapProjectResponse(raw);
}

/** DELETE /api/v1/projects/:id — soft deletes (deactivates & archives) a project. */
export async function deleteProject(id: string): Promise<MessageResponse> {
  return await http.delete<MessageResponse>(projectEndpoints.delete(id));
}

/** Alias for deleteProject to match semantic backend controller name. */
export const deactivateProject = deleteProject;

export const projectsService = {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  deactivateProject,
};
