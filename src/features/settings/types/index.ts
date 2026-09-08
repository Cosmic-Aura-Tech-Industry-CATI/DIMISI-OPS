/** Types for settings and preferences module. */

export interface EmailNotifications {
  taskAssignments?: boolean;
  reviewRequests?: boolean;
  weeklyDigest?: boolean;
}

export interface InAppNotifications {
  deadlineReminders?: boolean;
  taskApprovals?: boolean;
  pointsEarned?: boolean;
}

export interface DeliverySchedule {
  quietHoursStart?: string;
  quietHoursEnd?: string;
}

export interface UserPreferencesNotifications {
  email?: EmailNotifications;
  inApp?: InAppNotifications;
  deliverySchedule?: DeliverySchedule;

  // Flattened aliases for legacy/simple binding
  taskAssignments?: boolean;
  reviewRequests?: boolean;
  weeklyDigest?: boolean;
  deadlineReminders?: boolean;
  taskApprovals?: boolean;
  pointsEarned?: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
}

export interface TwoFactorSecurity {
  authenticatorApp?: boolean;
  emailVerification?: boolean;
  isAuthenticatorVerified?: boolean;
}

export interface UserPreferencesSecurity {
  twoFactor?: TwoFactorSecurity;
  twoFactorEnabled?: boolean;
  emailOtpEnabled?: boolean;
  sessionTimeout?: number;
}

export interface UserPreferencesTwoFactorAuth {
  isTotpEnabled: boolean;
  totpSecret?: string;
}

export interface UserPreferences {
  _id?: string;
  userId: string;
  theme: "light" | "dark" | "system";
  notifications: UserPreferencesNotifications;
  security: UserPreferencesSecurity;
  twoFactorAuth?: UserPreferencesTwoFactorAuth;
}

export interface UpdatePreferencesPayload {
  theme?: "light" | "dark" | "system";
  notifications?: {
    email?: Partial<EmailNotifications>;
    inApp?: Partial<InAppNotifications>;
    deliverySchedule?: Partial<DeliverySchedule>;
    [key: string]: unknown;
  };
  security?: {
    twoFactor?: Partial<TwoFactorSecurity>;
    emailOtpEnabled?: boolean;
    twoFactorEnabled?: boolean;
  };
}

export interface WorkspaceSettings {
  _id?: string;
  require2FaForAdmins: boolean;
  allowSsoSignIn: boolean;
  updatedBy?: string;
}

export interface UpdateWorkspaceSettingsPayload {
  require2FaForAdmins?: boolean;
  allowSsoSignIn?: boolean;
}

export interface UserSession {
  _id?: string;
  id?: string;
  ipAddress: string;
  deviceInfo?: {
    os?: string;
    browser?: string;
    device?: string;
  };
  device?: string;
  browser?: string;
  os?: string;
  location?: string;
  lastActive?: string | Date;
  createdAt?: string | Date;
  current?: boolean;
}

export interface SessionsData {
  currentSession?: UserSession;
  otherSessions: UserSession[];
}

export interface Setup2FaResponse {
  qrCode: string;
  qrCodeUrl: string;
  secret: string;
}

export interface Verify2FaResponse {
  preferences?: UserPreferences;
  recoveryCodes?: string[];
  message?: string;
}

export interface CheckPasswordPayload {
  currentPassword?: string;
  password?: string;
}

export interface UpdatePasswordPayload {
  otp: string;
  newPassword: string;
  currentPassword?: string;
  refreshToken?: string;
}

export interface UpdateProfilePayload {
  phone?: string;
  avatar?: string;
  avtar?: string;
}
