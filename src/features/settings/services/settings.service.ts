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
  const rawEmail = rawNotifications.email || {};
  const rawInApp = rawNotifications.inApp || {};
  const rawSchedule = rawNotifications.deliverySchedule || {};

  const resolvedEmail = {
    taskReviews: rawEmail.taskReviews ?? rawEmail.reviewRequests ?? rawNotifications.reviewRequests ?? true,
    universalTaskApplications: rawEmail.universalTaskApplications ?? true,
    universalTaskAssignments: rawEmail.universalTaskAssignments ?? rawEmail.taskAssignments ?? rawNotifications.taskAssignments ?? true,
    taskAssignments: rawEmail.taskAssignments ?? rawNotifications.taskAssignments ?? true,
    reviewRequests: rawEmail.reviewRequests ?? rawEmail.taskReviews ?? rawNotifications.reviewRequests ?? true,
    weeklyDigest: rawEmail.weeklyDigest ?? rawNotifications.weeklyDigest ?? false,
    ...rawEmail,
  };

  const resolvedInApp = {
    taskReviews: rawInApp.taskReviews ?? true,
    universalTaskApplications: rawInApp.universalTaskApplications ?? true,
    overdueTasks: rawInApp.overdueTasks ?? rawInApp.deadlineReminders ?? rawNotifications.deadlineReminders ?? true,
    taskAssignments: rawInApp.taskAssignments ?? rawNotifications.taskAssignments ?? true,
    reviewAcceptance: rawInApp.reviewAcceptance ?? rawInApp.taskApprovals ?? rawNotifications.taskApprovals ?? true,
    reviewRejection: rawInApp.reviewRejection ?? true,
    universalTaskAssignments: rawInApp.universalTaskAssignments ?? true,
    deadlineReminders: rawInApp.deadlineReminders ?? rawInApp.overdueTasks ?? rawNotifications.deadlineReminders ?? true,
    taskApprovals: rawInApp.taskApprovals ?? rawInApp.reviewAcceptance ?? rawNotifications.taskApprovals ?? true,
    pointsEarned: rawInApp.pointsEarned ?? rawNotifications.pointsEarned ?? true,
    ...rawInApp,
  };

  const resolvedSchedule = {
    quietHoursStart: rawSchedule.quietHoursStart || rawNotifications.quietHoursStart || "22:00",
    quietHoursEnd: rawSchedule.quietHoursEnd || rawNotifications.quietHoursEnd || "07:00",
    ...rawSchedule,
  };

  return {
    _id: safeData._id,
    userId: safeData.userId || "",
    theme: safeData.theme || "dark",
    notifications: {
      ...rawNotifications,
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
    // Format payload for backend filterBody("notifications", "security", "theme")
    const formattedPayload: Record<string, unknown> = {};

    if (payload.theme) {
      formattedPayload.theme = payload.theme;
    }

    if (payload.notifications) {
      const email = payload.notifications.email || {};
      const inApp = payload.notifications.inApp || {};

      // Mirror aliases so existing backend schema fields and extended fields are both sent
      const mirroredEmail = {
        ...email,
        reviewRequests:
          email.taskReviews !== undefined
            ? email.taskReviews
            : email.reviewRequests,
        taskAssignments:
          email.taskAssignments !== undefined
            ? email.taskAssignments
            : email.universalTaskAssignments !== undefined
              ? email.universalTaskAssignments
              : undefined,
      };

      const mirroredInApp = {
        ...inApp,
        taskApprovals:
          inApp.reviewAcceptance !== undefined ? inApp.reviewAcceptance : inApp.taskApprovals,
        deadlineReminders:
          inApp.overdueTasks !== undefined ? inApp.overdueTasks : inApp.deadlineReminders,
      };

      formattedPayload.notifications = {
        ...payload.notifications,
        email: mirroredEmail,
        inApp: mirroredInApp,
      };
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

    // Ensure client updates are preserved in returned object for cache consistency
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
