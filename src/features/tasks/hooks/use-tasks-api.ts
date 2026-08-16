/**
 * React Query Hooks for Tasks Module
 * Provides standardized query and mutation hooks with automated cache synchronization.
 */

import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from "@tanstack/react-query";
import { queryKeys } from "@/api/client/query-keys";
import type { ApiError } from "@/api/client/client";
import { tasksService } from "../services/tasks.service";
import type {
  CreateTaskInput,
  Task,
  TaskQueryFilters,
  UpdateTaskInput,
} from "../types";

/**
 * Query hook to fetch tasks list with optional filtering.
 */
export function useTasksQuery(
  filters?: TaskQueryFilters,
  options?: Omit<UseQueryOptions<Task[], ApiError>, "queryKey" | "queryFn">,
) {
  return useQuery<Task[], ApiError>({
    queryKey: queryKeys.tasks.list(filters),
    queryFn: () => tasksService.getTasks(filters),
    ...options,
  });
}

/**
 * Query hook to fetch a single task by ID.
 */
export function useTaskQuery(
  id: string,
  options?: Omit<UseQueryOptions<Task, ApiError>, "queryKey" | "queryFn">,
) {
  return useQuery<Task, ApiError>({
    queryKey: queryKeys.tasks.detail(id),
    queryFn: () => tasksService.getTaskById(id),
    enabled: Boolean(id) && (options?.enabled ?? true),
    ...options,
  });
}

/**
 * Mutation hook to create a new task.
 */
export function useCreateTask(options?: {
  onSuccess?: (data: Task, variables: CreateTaskInput | FormData) => void;
  onError?: (error: ApiError, variables: CreateTaskInput | FormData) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation<Task, ApiError, CreateTaskInput | FormData>({
    mutationFn: (input) => tasksService.createTask(input),
    onSuccess: (data, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
      options?.onSuccess?.(data, variables);
    },
    onError: (error, variables) => {
      options?.onError?.(error, variables);
    },
  });
}

/**
 * Mutation hook to update an existing task.
 */
export function useUpdateTask(options?: {
  onSuccess?: (data: Task, variables: { id: string; input: UpdateTaskInput | FormData }) => void;
  onError?: (error: ApiError, variables: { id: string; input: UpdateTaskInput | FormData }) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation<Task, ApiError, { id: string; input: UpdateTaskInput | FormData }>({
    mutationFn: ({ id, input }) => tasksService.updateTask(id, input),
    onSuccess: (data, variables) => {
      const { id } = variables;
      void queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(id) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
      options?.onSuccess?.(data, variables);
    },
    onError: (error, variables) => {
      options?.onError?.(error, variables);
    },
  });
}

/**
 * Mutation hook to delete a task.
 */
export function useDeleteTask(options?: {
  onSuccess?: (data: void, id: string) => void;
  onError?: (error: ApiError, id: string) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: (id) => tasksService.deleteTask(id),
    onSuccess: (data, id) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
      options?.onSuccess?.(data, id);
    },
    onError: (error, id) => {
      options?.onError?.(error, id);
    },
  });
}

/**
 * Mutation hook for employee to request (bid on) an open task.
 */
export function useRequestTask(options?: {
  onSuccess?: (data: void, id: string) => void;
  onError?: (error: ApiError, id: string) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: (id) => tasksService.requestTask(id),
    onSuccess: (data, id) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      options?.onSuccess?.(data, id);
    },
    onError: (error, id) => {
      options?.onError?.(error, id);
    },
  });
}

/**
 * Mutation hook for admin to assign a task to an employee.
 */
export function useAssignTask(options?: {
  onSuccess?: (data: Task, variables: { id: string; employeeId: string }) => void;
  onError?: (error: ApiError, variables: { id: string; employeeId: string }) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation<Task, ApiError, { id: string; employeeId: string }>({
    mutationFn: ({ id, employeeId }) => tasksService.assignTask(id, employeeId),
    onSuccess: (data, variables) => {
      const { id } = variables;
      void queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(id) });
      options?.onSuccess?.(data, variables);
    },
    onError: (error, variables) => {
      options?.onError?.(error, variables);
    },
  });
}

/**
 * Mutation hook for employee to start an assigned task.
 */
export function useStartTask(options?: {
  onSuccess?: (data: Task, id: string) => void;
  onError?: (error: ApiError, id: string) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation<Task, ApiError, string>({
    mutationFn: (id) => tasksService.startTask(id),
    onSuccess: (data, id) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(id) });
      options?.onSuccess?.(data, id);
    },
    onError: (error, id) => {
      options?.onError?.(error, id);
    },
  });
}

/**
 * Mutation hook for employee to submit an in-progress task for review.
 */
export function useSubmitTaskForReview(options?: {
  onSuccess?: (data: Task, variables: { id: string; notes?: string }) => void;
  onError?: (error: ApiError, variables: { id: string; notes?: string }) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation<Task, ApiError, { id: string; notes?: string }>({
    mutationFn: ({ id, notes }) => tasksService.submitTaskForReview(id, notes),
    onSuccess: (data, variables) => {
      const { id } = variables;
      void queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(id) });
      options?.onSuccess?.(data, variables);
    },
    onError: (error, variables) => {
      options?.onError?.(error, variables);
    },
  });
}

/**
 * Mutation hook for admin to approve/reject a submitted task.
 */
export function useReviewTask(options?: {
  onSuccess?: (data: Task, variables: { id: string; isApproved: boolean; feedback?: string }) => void;
  onError?: (error: ApiError, variables: { id: string; isApproved: boolean; feedback?: string }) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation<Task, ApiError, { id: string; isApproved: boolean; feedback?: string }>({
    mutationFn: ({ id, isApproved, feedback }) => tasksService.reviewTask(id, isApproved, feedback),
    onSuccess: (data, variables) => {
      const { id } = variables;
      void queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(id) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
      options?.onSuccess?.(data, variables);
    },
    onError: (error, variables) => {
      options?.onError?.(error, variables);
    },
  });
}

/**
 * Unified tasks API hook.
 */
export function useTasksApi(filters?: TaskQueryFilters) {
  const query = useTasksQuery(filters);
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const requestTask = useRequestTask();
  const assignTask = useAssignTask();
  const startTask = useStartTask();
  const submitTask = useSubmitTaskForReview();
  const reviewTask = useReviewTask();

  return {
    ...query,
    tasks: query.data ?? [],
    createTask,
    updateTask,
    deleteTask,
    requestTask,
    assignTask,
    startTask,
    submitTask,
    reviewTask,
  };
}
