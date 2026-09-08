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
  UserSession,
  Verify2FaResponse,
  WorkspaceSettings,
} from "../types";

export const settingsService = {
  getPreferences: async (): Promise<UserPreferences> => {
    const res = await http.get<{ preferences?: UserPreferences } | UserPreferences>(
      API_ENDPOINTS.settings.preferences,
    );
    const data = (res && "preferences" in res ? res.preferences : (res as UserPreferences)) ?? {
      userId: "",
      theme: "dark",
      notifications: {
        email: { taskAssignments: true, reviewRequests: true, weeklyDigest: false },
        inApp: { deadlineReminders: true, taskApprovals: true, pointsEarned: true },
        deliverySchedule: { quietHoursStart: "22:00", quietHoursEnd: "07:00" },
      },
      security: {
        twoFactor: { authenticatorApp: false, emailVerification: true, isAuthenticatorVerified: false },
      },
    };

    const isTotpEnabled = Boolean(
      data.security?.twoFactor?.authenticatorApp ||
      data.security?.twoFactor?.isAuthenticatorVerified ||
      data.twoFactorAuth?.isTotpEnabled,
    );

    const emailOtpEnabled =
      data.security?.twoFactor?.emailVerification ?? data.security?.emailOtpEnabled ?? true;

    return {
      ...data,
      twoFactorAuth: {
        isTotpEnabled,
        totpSecret: data.twoFactorAuth?.totpSecret,
      },
      security: {
        ...data.security,
        twoFactorEnabled: isTotpEnabled,
        emailOtpEnabled,
      },
    };
  },

  updatePreferences: async (payload: UpdatePreferencesPayload): Promise<UserPreferences> => {
    // Format payload for backend filterBody("notifications", "security", "theme")
    const formattedPayload: Record<string, unknown> = {};

    if (payload.theme) {
      formattedPayload.theme = payload.theme;
    }

    if (payload.notifications) {
      formattedPayload.notifications = payload.notifications;
    }

    if (payload.security) {
      formattedPayload.security = {
        twoFactor: {
          ...(payload.security.twoFactor || {}),
          ...(payload.security.emailOtpEnabled !== undefined
            ? { emailVerification: payload.security.emailOtpEnabled }
            : {}),
          ...(payload.security.twoFactorEnabled !== undefined
            ? { authenticatorApp: payload.security.twoFactorEnabled }
            : {}),
        },
      };
    }

    const res = await http.patch<{ preferences?: UserPreferences } | UserPreferences>(
      API_ENDPOINTS.settings.preferences,
      formattedPayload,
    );
    const data = res && "preferences" in res ? res.preferences : (res as UserPreferences);
    return (
      data ?? {
        userId: "",
        theme: "dark",
        notifications: {},
        security: {},
      }
    );
  },

  getWorkspace: async (): Promise<WorkspaceSettings> => {
    const res = await http.get<{ workspaceSettings?: WorkspaceSettings } | WorkspaceSettings>(
      API_ENDPOINTS.settings.workspace,
    );
    const data = res && "workspaceSettings" in res ? res.workspaceSettings : (res as WorkspaceSettings);
    return data ?? { require2FaForAdmins: false, allowSsoSignIn: true };
  },

  updateWorkspace: async (payload: UpdateWorkspaceSettingsPayload): Promise<WorkspaceSettings> => {
    const res = await http.patch<{ workspaceSettings?: WorkspaceSettings } | WorkspaceSettings>(
      API_ENDPOINTS.settings.workspace,
      payload,
    );
    const data = res && "workspaceSettings" in res ? res.workspaceSettings : (res as WorkspaceSettings);
    return data ?? { require2FaForAdmins: false, allowSsoSignIn: true };
  },

  setup2Fa: async (): Promise<Setup2FaResponse> => {
    const res = await http.post<{ qrCode?: string; qrCodeUrl?: string; secret: string }>(
      API_ENDPOINTS.settings.setup2Fa,
    );
    const qrCode = res?.qrCode || res?.qrCodeUrl || "";
    return {
      qrCode,
      qrCodeUrl: qrCode,
      secret: res?.secret || "",
    };
  },

  verify2Fa: async (token: string): Promise<Verify2FaResponse> => {
    const res = await http.post<{ preferences?: UserPreferences } & Verify2FaResponse>(
      API_ENDPOINTS.settings.verify2Fa,
      { token },
    );
    return res ?? {};
  },

  checkPassword: async (payload: CheckPasswordPayload): Promise<{ message: string; email?: string }> => {
    const res = await http.post<{ message: string; email?: string }>(
      API_ENDPOINTS.settings.checkPassword,
      { currentPassword: payload.currentPassword || payload.password },
    );
    return res;
  },

  updatePassword: async (payload: UpdatePasswordPayload): Promise<{ message: string }> => {
    const res = await http.post<{ message: string }>(
      API_ENDPOINTS.settings.updatePassword,
      {
        otp: payload.otp,
        newPassword: payload.newPassword,
        refreshToken: payload.refreshToken,
      },
    );
    return res;
  },

  updateProfile: async (payload: UpdateProfilePayload): Promise<any> => {
    const res = await http.patch<any>(API_ENDPOINTS.settings.profile, {
      phone: payload.phone,
      avatar: payload.avatar || payload.avtar,
    });
    return res;
  },

  getSessions: async (): Promise<SessionsData> => {
    const res = await http.get<{ sessions?: UserSession[] } | UserSession[]>(
      API_ENDPOINTS.settings.sessions,
    );
    const rawSessions: UserSession[] = Array.isArray(res) ? res : res?.sessions || [];
    const normalizedSessions = rawSessions.map((s, idx) => ({
      ...s,
      id: s.id || s._id || `session-${idx}`,
      device: s.device || s.deviceInfo?.device || "Desktop Device",
      browser: s.browser || s.deviceInfo?.browser || "Browser",
      os: s.os || s.deviceInfo?.os || "Operating System",
    }));

    return {
      currentSession: normalizedSessions[0],
      otherSessions: normalizedSessions.slice(1),
    };
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
