/** API services for the settings module. */
import { http } from "@/api/client/client";
import { API_ENDPOINTS } from "@/api/client/endpoints";
import type {
  CheckPasswordPayload,
  EmailNotifications,
  InAppNotifications,
  SessionsData,
  Setup2FaResponse,
  UpdatePasswordPayload,
  UpdatePreferencesPayload,
  UpdateProfilePayload,
  UpdateProfileResult,
  UpdateWorkspaceSettingsPayload,
  UserPreferences,
  UserSession,
  Verify2FaResponse,
  WorkspaceSettings,
} from "../types";

function normalizePreferences(data: Partial<UserPreferences> | null | undefined): UserPreferences {
  const safeData = data ?? {};
  const isTotpEnabled = Boolean(
    safeData.security?.twoFactor?.authenticatorApp ||
    safeData.security?.twoFactor?.isAuthenticatorVerified ||
    safeData.twoFactorAuth?.isTotpEnabled,
  );

  const emailOtpEnabled =
    safeData.security?.twoFactor?.emailVerification ?? safeData.security?.emailOtpEnabled ?? true;

  const rawNotifications = safeData.notifications || {};
  const rawEmail = (rawNotifications.email || {}) as Record<string, boolean>;
  const rawInApp = (rawNotifications.inApp || {}) as Record<string, boolean>;
  const rawSchedule = rawNotifications.deliverySchedule || {};

  // Defaults for exact backend field names
  const resolvedEmail: EmailNotifications = {
    taskAssignments: rawEmail.taskAssignments ?? true,
    universalTask: rawEmail.universalTask ?? true,
    reviewRequests: rawEmail.reviewRequests ?? true,
    taskOverdue: rawEmail.taskOverdue ?? true,
    ...rawEmail,
  };

  const resolvedInApp: InAppNotifications = {
    taskAssignments: rawInApp.taskAssignments ?? true,
    reviewRequests: rawInApp.reviewRequests ?? true,
    taskOverdue: rawInApp.taskOverdue ?? true,
    universalTask: rawInApp.universalTask ?? true,
    reviewActions: rawInApp.reviewActions ?? true,
    ...rawInApp,
  };

  const resolvedSchedule = {
    quietHoursStart: rawSchedule.quietHoursStart || "22:00",
    quietHoursEnd: rawSchedule.quietHoursEnd || "07:00",
  };

  return {
    _id: safeData._id,
    userId: safeData.userId || "",
    theme: safeData.theme || "dark",
    notifications: {
      email: resolvedEmail,
      inApp: resolvedInApp,
      deliverySchedule: resolvedSchedule,
    },
    twoFactorAuth: {
      isTotpEnabled,
      totpSecret: safeData.twoFactorAuth?.totpSecret,
    },
    security: {
      ...safeData.security,
      twoFactorEnabled: isTotpEnabled,
      emailOtpEnabled,
    },
  };
}

export const settingsService = {
  getPreferences: async (): Promise<UserPreferences> => {
    const res = await http.get<{ preferences?: UserPreferences } | UserPreferences>(
      API_ENDPOINTS.settings.preferences,
    );
    const data = res && "preferences" in res ? res.preferences : (res as UserPreferences);
    return normalizePreferences(data);
  },

  updatePreferences: async (payload: UpdatePreferencesPayload): Promise<UserPreferences> => {
    // Send only the fields that are present in the payload — minimal partial update
    const formattedPayload: Record<string, unknown> = {};

    if (payload.theme) {
      formattedPayload.theme = payload.theme;
    }

    if (payload.notifications) {
      // Build notifications object with only changed sub-keys
      const notifPayload: Record<string, unknown> = {};

      if (payload.notifications.email && Object.keys(payload.notifications.email).length > 0) {
        notifPayload.email = payload.notifications.email;
      }

      if (payload.notifications.inApp && Object.keys(payload.notifications.inApp).length > 0) {
        notifPayload.inApp = payload.notifications.inApp;
      }

      if (payload.notifications.deliverySchedule) {
        notifPayload.deliverySchedule = payload.notifications.deliverySchedule;
      }

      if (Object.keys(notifPayload).length > 0) {
        formattedPayload.notifications = notifPayload;
      }
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
    const result = normalizePreferences(data);

    // Preserve optimistic client state in cache for instant UI feedback
    if (payload.notifications?.email) {
      result.notifications.email = {
        ...result.notifications.email,
        ...payload.notifications.email,
      };
    }
    if (payload.notifications?.inApp) {
      result.notifications.inApp = {
        ...result.notifications.inApp,
        ...payload.notifications.inApp,
      };
    }

    return result;
  },

  getWorkspace: async (): Promise<WorkspaceSettings> => {
    const res = await http.get<{ workspaceSettings?: WorkspaceSettings } | WorkspaceSettings>(
      API_ENDPOINTS.settings.workspace,
    );
    const data =
      res && "workspaceSettings" in res ? res.workspaceSettings : (res as WorkspaceSettings);
    return data ?? { require2FaForAdmins: false, allowSsoSignIn: true };
  },

  updateWorkspace: async (payload: UpdateWorkspaceSettingsPayload): Promise<WorkspaceSettings> => {
    const res = await http.patch<{ workspaceSettings?: WorkspaceSettings } | WorkspaceSettings>(
      API_ENDPOINTS.settings.workspace,
      payload,
    );
    const data =
      res && "workspaceSettings" in res ? res.workspaceSettings : (res as WorkspaceSettings);
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

  checkPassword: async (
    payload: CheckPasswordPayload,
  ): Promise<{ message: string; email?: string }> => {
    const res = await http.post<{ message: string; email?: string }>(
      API_ENDPOINTS.settings.checkPassword,
      { currentPassword: payload.currentPassword || payload.password },
    );
    return res;
  },

  updatePassword: async (payload: UpdatePasswordPayload): Promise<{ message: string }> => {
    const body = {
      otp: String(payload.otp || "").trim(),
      newPassword: payload.newPassword,
      currentPassword: payload.currentPassword,
      refreshToken: payload.refreshToken,
    };
    const res = await http.post<{ message: string }>(API_ENDPOINTS.settings.updatePassword, body);
    return res;
  },

  updateProfile: async (payload: UpdateProfilePayload): Promise<UpdateProfileResult> => {
    const avatarValue =
      payload.avatar !== undefined
        ? payload.avatar
        : payload.photo !== undefined
          ? payload.photo
          : payload.profileImage;
    const avatarPublicIdValue = payload.avatarPublicId;

    const body: Record<string, unknown> = {};

    if (payload.phone !== undefined) {
      body.phone = payload.phone;
    }

    // Pass avatar and avatarPublicId matching backend v2 contract
    if (avatarValue !== undefined) {
      body.avatar = avatarValue;
    }
    if (avatarPublicIdValue !== undefined) {
      body.avatarPublicId = avatarPublicIdValue;
    }

    // Call PATCH /api/v2/settings/profile
    const endpoint = API_ENDPOINTS.settings.profileV2;
    const res = await http.patch<UpdateProfileResult>(endpoint, body);
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
