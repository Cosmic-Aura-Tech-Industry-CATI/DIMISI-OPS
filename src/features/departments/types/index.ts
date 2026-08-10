/**
 * Department & Designation entity models and API payloads matching backend contract.
 */

// ==========================================
// 1. Department Types
// ==========================================

export interface Department {
  _id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateDepartmentPayload {
  name: string;
  code: string;
  description?: string;
}

export interface UpdateDepartmentPayload {
  name?: string;
  code?: string;
  description?: string;
  isActive?: boolean;
}

export interface DepartmentListResponse {
  departments: Department[];
}

export interface DepartmentSingleResponse {
  department: Department;
}

// ==========================================
// 2. Designation Types & Mappings
// ==========================================

/** Raw backend designation object (uses 'title' and/or 'name') */
export interface BackendDesignation {
  _id: string;
  title?: string;
  name?: string;
  code?: string;
  departmentId: string | { _id: string; name: string };
  description?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/** Frontend normalized Designation object (has both 'name' and 'title' for seamless compatibility) */
export interface Designation {
  _id: string;
  id: string; // alias for _id
  name: string; // mapped from backend title or name
  title: string; // mapped from backend title or name
  code?: string;
  departmentId: string;
  description?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateDesignationPayload {
  name?: string; // frontend UI field
  title?: string; // backend contract field
  code?: string;
  departmentId: string;
  description?: string;
}

export interface UpdateDesignationPayload {
  name?: string; // frontend UI field
  title?: string; // backend contract field
  code?: string;
  departmentId?: string;
  description?: string;
  isActive?: boolean;
}

export interface DesignationListResponse {
  designations: BackendDesignation[];
}

export interface DesignationSingleResponse {
  designation: BackendDesignation;
}

/**
 * Adapter function: Maps backend designation response to frontend Designation object.
 * Resolves title <-> name mapping.
 */
export function mapBackendToDesignation(raw: BackendDesignation): Designation {
  const resolvedName = raw.title || raw.name || "";
  const deptId =
    typeof raw.departmentId === "object" && raw.departmentId !== null
      ? raw.departmentId._id
      : String(raw.departmentId || "");

  return {
    _id: raw._id,
    id: raw._id,
    name: resolvedName,
    title: resolvedName,
    code: raw.code,
    departmentId: deptId,
    description: raw.description,
    isActive: raw.isActive ?? true,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

/**
 * Adapter function: Maps frontend create payload to backend request body.
 * Maps name -> title & name.
 */
export function mapPayloadToBackend(
  payload: CreateDesignationPayload,
): { title: string; name: string; code?: string; departmentId: string; description?: string } {
  const resolvedTitle = (payload.title || payload.name || "").trim();
  return {
    title: resolvedTitle,
    name: resolvedTitle,
    code: payload.code?.trim(),
    departmentId: payload.departmentId,
    description: payload.description?.trim(),
  };
}

/**
 * Adapter function: Maps frontend update payload to backend request body.
 */
export function mapUpdatePayloadToBackend(
  payload: UpdateDesignationPayload,
): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (payload.name !== undefined || payload.title !== undefined) {
    const val = (payload.title || payload.name || "").trim();
    body.title = val;
    body.name = val;
  }
  if (payload.code !== undefined) body.code = payload.code.trim();
  if (payload.departmentId !== undefined) body.departmentId = payload.departmentId;
  if (payload.description !== undefined) body.description = payload.description.trim();
  if (payload.isActive !== undefined) body.isActive = payload.isActive;
  return body;
}
