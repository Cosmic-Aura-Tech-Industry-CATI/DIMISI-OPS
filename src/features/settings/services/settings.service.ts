/** API services for the settings module. */
import { http } from "@/api/client/client";
import { API_ENDPOINTS } from "@/api/client/endpoints";
import type {
  CheckPasswordPayload,
  SessionsData,
  Setup2FaResponse,
  UpdatePasswordPayload,
  UpdatePreferencesPayload,
  UpdateProfilePayload,
  UpdateWorkspaceSettingsPayload,
  UserPreferences,
  Verify2FaResponse,
  WorkspaceSettings,
} from "../types";

export const settingsService = {
  getPreferences: async (): Promise<UserPreferences> => {
    const res = await http.get<UserPreferences>(API_ENDPOINTS.settings.preferences);
    return (
      res ?? {
        userId: "",
        theme: "system",
        notifications: { email: true, push: true, marketing: true },
        security: { twoFactorEnabled: false, emailOtpEnabled: true, sessionTimeout: 30 },
        twoFactorAuth: { isTotpEnabled: false },
      }
    );
  },

  updatePreferences: async (payload: UpdatePreferencesPayload): Promise<UserPreferences> => {
    const res = await http.patch<UserPreferences>(API_ENDPOINTS.settings.preferences, payload);
    return res;
  },

  getWorkspace: async (): Promise<WorkspaceSettings> => {
    const res = await http.get<WorkspaceSettings>(API_ENDPOINTS.settings.workspace);
    return res ?? { require2FaForAdmins: false, allowSsoSignIn: true };
  },

  updateWorkspace: async (payload: UpdateWorkspaceSettingsPayload): Promise<WorkspaceSettings> => {
    const res = await http.patch<WorkspaceSettings>(API_ENDPOINTS.settings.workspace, payload);
    return res;
  },

  setup2Fa: async (): Promise<Setup2FaResponse> => {
    const res = await http.post<Setup2FaResponse>(API_ENDPOINTS.settings.setup2Fa);
    return res;
  },

  verify2Fa: async (token: string): Promise<Verify2FaResponse> => {
    const res = await http.post<Verify2FaResponse>(API_ENDPOINTS.settings.verify2Fa, { token });
    return res ?? {};
  },

  checkPassword: async (payload: CheckPasswordPayload): Promise<{ message: string }> => {
    const res = await http.post<{ message: string }>(API_ENDPOINTS.settings.checkPassword, payload);
    return res;
  },

  updatePassword: async (payload: UpdatePasswordPayload): Promise<{ message: string }> => {
    const res = await http.post<{ message: string }>(API_ENDPOINTS.settings.updatePassword, payload);
    return res;
  },

  updateProfile: async (payload: UpdateProfilePayload): Promise<any> => {
    const res = await http.patch<any>(API_ENDPOINTS.settings.profile, payload);
    return res;
  },

  getSessions: async (): Promise<SessionsData> => {
    const res = await http.get<SessionsData>(API_ENDPOINTS.settings.sessions);
    return res ?? { otherSessions: [] };
  },

  revokeOtherSessions: async (): Promise<{ message: string }> => {
    const res = await http.delete<{ message: string }>(API_ENDPOINTS.settings.revokeOtherSessions);
    return res;
  },

  revokeSession: async (id: string): Promise<{ message: string }> => {
    const res = await http.delete<{ message: string }>(API_ENDPOINTS.settings.revokeSession(id));
    return res;
  },
};
