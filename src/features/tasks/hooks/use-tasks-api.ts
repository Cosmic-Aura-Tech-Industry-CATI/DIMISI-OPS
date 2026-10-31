/**
 * React Query Hooks for Tasks Module
 * Standardized query and mutation hooks with automated cache synchronization.
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { taskKeys, queryKeys } from "@/api/client/query-keys";
import type { ApiError } from "@/api/client/client";
import { authService } from "@/auth/services/auth.service";
import { tasksService } from "../services/tasks.service";
import type {
  CreateTaskInput,
  ReviewAttachment,
  ReviewCenterResponse,
  ReviewTaskPayload,
  SubmitTaskPayload,
  Task,
  TaskQueryFilters,
  TasksResult,
  TaskStatsResult,
  UpdateTaskInput,
} from "../types";

/* ---------------------------------- Queries --------------------------------- */

/**
 * Hook to fetch all tasks with optional filters.
 * Standardizes pagination with limit capped at 10.
 */
export function useTasksQuery(
  filters?: TaskQueryFilters | number,
  options?: Omit<UseQueryOptions<TasksResult, ApiError>, "queryKey" | "queryFn">,
) {
  const filterObj: TaskQueryFilters =
    typeof filters === "number"
      ? { page: filters, limit: 10 }
      : typeof filters === "object" && filters !== null
        ? { ...filters, limit: 10 }
        : { limit: 10 };

  return useQuery<TasksResult, ApiError>({
    queryKey: queryKeys.tasks.list(filterObj),
    queryFn: () => tasksService.getTasks(filterObj),
    staleTime: 1000 * 60 * 2, // 2 mins
    retry: 1,
    ...options,
  });
}

/**
 * Hook to fetch a single task by ID.
 */
export function useTask(
  id: string,
  options?: Omit<UseQueryOptions<Task, ApiError>, "queryKey" | "queryFn">,
) {
  return useQuery<Task, ApiError>({
    queryKey: taskKeys.detail(id),
    queryFn: () => tasksService.getTaskById(id),
    enabled: Boolean(id) && (options?.enabled ?? true),
    staleTime: 1000 * 60 * 2,
    retry: 1,
    ...options,
  });
}

export const useTaskQuery = useTask;

/**
 * Hook to fetch employee assigned tasks (GET /tasks/assigned).
 */
export function useAssignedTasks(
  filters?: TaskQueryFilters,
  options?: Omit<UseQueryOptions<Task[], ApiError>, "queryKey" | "queryFn">,
) {
  const filterObj: TaskQueryFilters = { ...filters, limit: 10 };
  return useQuery<Task[], ApiError>({
    queryKey: filters ? (["tasks", "assigned", filterObj] as const) : taskKeys.assigned,
    queryFn: () => tasksService.getAssignedTasks(filterObj),
    staleTime: 1000 * 60 * 2,
    retry: 1,
    ...options,
  });
}

export const useAssignedTasksQuery = useAssignedTasks;

/**
 * Hook to fetch employee pending review tasks (GET /tasks/pending).
 */
export function usePendingTasks(
  filters?: TaskQueryFilters,
  options?: Omit<UseQueryOptions<Task[], ApiError>, "queryKey" | "queryFn">,
) {
  const filterObj: TaskQueryFilters = { ...filters, limit: 10 };
  return useQuery<Task[], ApiError>({
    queryKey: filters ? (["tasks", "pending", filterObj] as const) : taskKeys.pending,
    queryFn: () => tasksService.getPendingTasks(filterObj),
    staleTime: 1000 * 60 * 2,
    retry: 1,
    ...options,
  });
}

export const usePendingTasksQuery = usePendingTasks;

/**
 * Hook to fetch employee completed tasks (GET /tasks/completed).
 */
export function useCompletedTasks(
  filters?: TaskQueryFilters,
  options?: Omit<UseQueryOptions<Task[], ApiError>, "queryKey" | "queryFn">,
) {
  const filterObj: TaskQueryFilters = { ...filters, limit: 10 };
  return useQuery<Task[], ApiError>({
    queryKey: filters ? (["tasks", "completed", filterObj] as const) : taskKeys.completed,
    queryFn: () => tasksService.getCompletedTasks(filterObj),
    staleTime: 1000 * 60 * 2,
    retry: 1,
    ...options,
  });
}

export const useCompletedTasksQuery = useCompletedTasks;

/**
 * Hook to fetch Review Center overview data (GET /tasks/review-center).
 */
export function useReviewCenter(
  options?: Omit<UseQueryOptions<ReviewCenterResponse, ApiError>, "queryKey" | "queryFn">,
) {
  return useQuery<ReviewCenterResponse, ApiError>({
    queryKey: taskKeys.reviewCenter,
    queryFn: () => tasksService.getReviewCenter(),
    staleTime: 1000 * 60 * 2,
    retry: 1,
    ...options,
  });
}

export const useReviewCenterQuery = useReviewCenter;

/**
 * Hook to fetch aggregate task statistics (GET /api/v1/tasks/stats).
 */
export function useTaskStatsQuery(
  options?: Omit<UseQueryOptions<TaskStatsResult, ApiError>, "queryKey" | "queryFn">,
) {
  return useQuery<TaskStatsResult, ApiError>({
    queryKey: taskKeys.stats(),
    queryFn: () => tasksService.getTaskStats(),
    staleTime: 1000 * 60 * 2, // 2 mins
    retry: 1,
    ...options,
  });
}

export const useTaskStats = useTaskStatsQuery;

/* -------------------------------- Mutations -------------------------------- */

function invalidateAllTaskQueries(queryClient: ReturnType<typeof useQueryClient>, taskId?: string) {
  void queryClient.invalidateQueries({ queryKey: taskKeys.all });
  void queryClient.invalidateQueries({ queryKey: taskKeys.assigned });
  void queryClient.invalidateQueries({ queryKey: taskKeys.pending });
  void queryClient.invalidateQueries({ queryKey: taskKeys.completed });
  void queryClient.invalidateQueries({ queryKey: taskKeys.reviewCenter });
  void queryClient.invalidateQueries({ queryKey: taskKeys.stats() });
  if (taskId) {
    void queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
  }
  void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
  void queryClient.invalidateQueries({ queryKey: queryKeys.employeeDashboard.all });
  void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
  void queryClient.invalidateQueries({ queryKey: queryKeys.activity.all });
  void queryClient.invalidateQueries({ queryKey: queryKeys.leaderboard.all });
  void queryClient.invalidateQueries({ queryKey: queryKeys.employees.all });
  void queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
  void queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
  try {
    void authService.refreshSession().catch(() => {});
  } catch {}
}

/**
 * Mutation hook for employee to start an assigned task (PATCH /tasks/:id/start).
 */
export function useStartTaskMutation(options?: UseMutationOptions<Task, ApiError, string>) {
  const queryClient = useQueryClient();

  return useMutation<Task, ApiError, string>({
    mutationFn: (id: string) => tasksService.startTask(id),
    onSuccess: (...args) => {
      const [, id] = args;
      invalidateAllTaskQueries(queryClient, id);
      toast.success("Task started! It is now in progress.");
      options?.onSuccess?.(...args);
    },
    onError: (...args) => {
      const [error] = args;
      const msg = error?.message || "Failed to start task.";
      toast.error(msg);
      options?.onError?.(...args);
    },
    ...options,
  });
}

export const useStartTask = useStartTaskMutation;

/**
 * Mutation hook for an employee to request assignment on an available task
 * (POST /tasks/:id/request).
 */
export function useRequestTaskMutation(
  options?: UseMutationOptions<{ status: string; message: string }, ApiError, string>,
) {
  const queryClient = useQueryClient();

  return useMutation<{ status: string; message: string }, ApiError, string>({
    mutationFn: (id: string) => tasksService.requestTask(id),
    onSuccess: (...args) => {
      const [res, id] = args;
      invalidateAllTaskQueries(queryClient, id);
      toast.success(res?.message || "Task request submitted! Awaiting admin approval.");
      options?.onSuccess?.(...args);
    },
    onError: (...args) => {
      const [error] = args;
      const msg = error?.message || "Failed to submit task request.";
      toast.error(msg);
      options?.onError?.(...args);
    },
    ...options,
  });
}

export const useRequestTask = useRequestTaskMutation;

/**
 * Mutation hook for employee to submit an in-progress task for review (PATCH /tasks/:id/submit).
 */
export type SubmitTaskVariables =
  | {
      id: string;
      notes?: string;
      proof?: { url: string; publicId: string };
      proofUrl?: string;
      proofPublicId?: string;
      proofFiles?: any[];
      files?: File[];
      formData?: FormData;
      payload?: SubmitTaskPayload | FormData;
    }
  | string;


export function useSubmitTaskMutation(
  options?: UseMutationOptions<Task, ApiError, SubmitTaskVariables>,
) {
  const queryClient = useQueryClient();

  return useMutation<Task, ApiError, SubmitTaskVariables>({
    mutationFn: (variables: SubmitTaskVariables) => {
      if (typeof variables === "string") {
        return tasksService.submitTask(variables, { notes: "" });
      }
      const { id, payload, ...rest } = variables;
      if (payload) {
        return tasksService.submitTask(id, payload);
      }
      return tasksService.submitTask(id, rest);
    },
    onSuccess: (...args) => {
      const [, variables] = args;
      const taskId = typeof variables === "string" ? variables : variables?.id;
      invalidateAllTaskQueries(queryClient, taskId);
      toast.success("Task submitted for review!");
      options?.onSuccess?.(...args);
    },
    onError: (...args) => {
      const [error] = args;
      const msg = error?.message || "Failed to submit task for review.";
      toast.error(msg);
      options?.onError?.(...args);
    },
    ...options,
  });
}

export const useSubmitTaskForReview = useSubmitTaskMutation;

/**
 * Mutation hook for admin to approve or reject a task (PATCH /tasks/:id/review).
 */
export function useReviewTaskMutation(
  options?: UseMutationOptions<
    Task,
    ApiError,
    { id: string; isApproved: boolean; feedback?: string; attachment?: ReviewAttachment }
  >,
) {
  const queryClient = useQueryClient();

  return useMutation<Task, ApiError, { id: string; isApproved: boolean; feedback?: string; attachment?: ReviewAttachment }>({
    mutationFn: ({ id, isApproved, feedback, attachment }) =>
      tasksService.reviewTask(id, { isApproved, feedback, attachment }),
    onSuccess: (...args) => {
      const [, variables] = args;
      // Immediately remove the reviewed task from the Review Center query cache
      queryClient.setQueryData<ReviewCenterResponse>(taskKeys.reviewCenter, (old) => {
        if (!old) return old;
        const remaining = old.tasks.filter((t) => (t.id || t._id) !== variables.id);
        return {
          ...old,
          kpis: {
            ...old.kpis,
            pendingReview: remaining.length,
            highPriority: remaining.filter((t) => t.priority === "high").length,
            pointsAtStake: remaining.reduce((sum, t) => sum + (t.points || t.rewardPoints || 0), 0),
          },
          tasks: remaining,
        };
      });
      invalidateAllTaskQueries(queryClient, variables.id);
      if (variables.isApproved) {
        toast.success("Task approved and marked as completed!");
      } else {
        toast.info("Task rejected and sent back to in-progress with feedback.");
      }
      options?.onSuccess?.(...args);
    },
    onError: (...args) => {
      const [error] = args;
      const msg = error?.message || "Failed to submit task review.";
      toast.error(msg);
      options?.onError?.(...args);
    },
    ...options,
  });
}

export const useReviewTask = useReviewTaskMutation;

/**
 * Mutation hook to create a new task.
 */
export function useCreateTask(
  options?: UseMutationOptions<Task, ApiError, CreateTaskInput | FormData>,
) {
  const queryClient = useQueryClient();

  return useMutation<Task, ApiError, CreateTaskInput | FormData>({
    mutationFn: (input) => tasksService.createTask(input),
    onSuccess: (...args) => {
      invalidateAllTaskQueries(queryClient);
      toast.success("Task created successfully!");
      options?.onSuccess?.(...args);
    },
    onError: (...args) => {
      const [error] = args;
      toast.error(error?.message || "Failed to create task.");
      options?.onError?.(...args);
    },
    ...options,
  });
}

/**
 * Mutation hook to update an existing task.
 */
export function useUpdateTask(
  options?: UseMutationOptions<Task, ApiError, { id: string; input: UpdateTaskInput | FormData }>,
) {
  const queryClient = useQueryClient();

  return useMutation<Task, ApiError, { id: string; input: UpdateTaskInput | FormData }>({
    mutationFn: ({ id, input }) => tasksService.updateTask(id, input),
    onSuccess: (...args) => {
      const [, variables] = args;
      invalidateAllTaskQueries(queryClient, variables.id);
      toast.success("Task updated successfully!");
      options?.onSuccess?.(...args);
    },
    onError: (...args) => {
      const [error] = args;
      toast.error(error?.message || "Failed to update task.");
      options?.onError?.(...args);
    },
    ...options,
  });
}

/**
 * Mutation hook to delete a task.
 */
export function useDeleteTask(options?: UseMutationOptions<void, ApiError, string>) {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: (id) => tasksService.deleteTask(id),
    onSuccess: (...args) => {
      const [, id] = args;
      invalidateAllTaskQueries(queryClient, id);
      toast.success("Task deleted successfully.");
      options?.onSuccess?.(...args);
    },
    onError: (...args) => {
      const [error] = args;
      toast.error(error?.message || "Failed to delete task.");
      options?.onError?.(...args);
    },
    ...options,
  });
}

/**
 * Mutation hook for admin to assign a task to an employee.
 */
export function useAssignTask(
  options?: UseMutationOptions<Task, ApiError, { id: string; employeeId: string }>,
) {
  const queryClient = useQueryClient();

  return useMutation<Task, ApiError, { id: string; employeeId: string }>({
    mutationFn: ({ id, employeeId }) => tasksService.assignTask(id, employeeId),
    onSuccess: (...args) => {
      const [, variables] = args;
      invalidateAllTaskQueries(queryClient, variables.id);
      toast.success("Task assigned successfully!");
      options?.onSuccess?.(...args);
    },
    onError: (...args) => {
      const [error] = args;
      toast.error(error?.message || "Failed to assign task.");
      options?.onError?.(...args);
    },
    ...options,
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
  const assignTask = useAssignTask();
  const startTask = useStartTaskMutation();
  const submitTask = useSubmitTaskMutation();
  const reviewTask = useReviewTaskMutation();

  return {
    ...query,
    tasks: query.data ?? [],
    createTask,
    updateTask,
    deleteTask,
    assignTask,
    startTask,
    submitTask,
    reviewTask,
  };
}
