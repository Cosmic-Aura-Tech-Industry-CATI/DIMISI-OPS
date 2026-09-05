/** React Query hooks for the settings module. */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/api/client/query-keys";
import { settingsService } from "../services/settings.service";
import type {
  CheckPasswordPayload,
  UpdatePasswordPayload,
  UpdatePreferencesPayload,
  UpdateProfilePayload,
  UpdateWorkspaceSettingsPayload,
} from "../types";

export function useUserPreferencesQuery() {
  return useQuery({
    queryKey: queryKeys.settings.preferences(),
    queryFn: () => settingsService.getPreferences(),
    staleTime: 60 * 1000,
  });
}

export function useUpdatePreferencesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdatePreferencesPayload) => settingsService.updatePreferences(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.settings.preferences(), data);
    },
  });
}

export function useWorkspaceSettingsQuery() {
  return useQuery({
    queryKey: queryKeys.settings.workspace(),
    queryFn: () => settingsService.getWorkspace(),
    staleTime: 60 * 1000,
  });
}

export function useUpdateWorkspaceSettingsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateWorkspaceSettingsPayload) =>
      settingsService.updateWorkspace(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.settings.workspace(), data);
    },
  });
}

export function useSetup2FaMutation() {
  return useMutation({
    mutationFn: () => settingsService.setup2Fa(),
  });
}

export function useVerify2FaMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (token: string) => settingsService.verify2Fa(token),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.settings.preferences() });
    },
  });
}

export function useCheckPasswordMutation() {
  return useMutation({
    mutationFn: (payload: CheckPasswordPayload) => settingsService.checkPassword(payload),
  });
}

export function useUpdatePasswordMutation() {
  return useMutation({
    mutationFn: (payload: UpdatePasswordPayload) => settingsService.updatePassword(payload),
  });
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => settingsService.updateProfile(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
      void queryClient.invalidateQueries({ queryKey: queryKeys.auth.session });
    },
  });
}

export function useSessionsQuery() {
  return useQuery({
    queryKey: queryKeys.settings.sessions(),
    queryFn: () => settingsService.getSessions(),
    staleTime: 30 * 1000,
  });
}

export function useRevokeOtherSessionsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => settingsService.revokeOtherSessions(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.settings.sessions() });
    },
  });
}

export function useRevokeSessionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => settingsService.revokeSession(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.settings.sessions() });
    },
  });
}
