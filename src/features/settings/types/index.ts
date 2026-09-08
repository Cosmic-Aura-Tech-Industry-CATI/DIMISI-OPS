/** Types for settings and preferences module. */

<<<<<<< Updated upstream
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
=======
export interface UserPreferencesNotifications {
  email: boolean;
  push: boolean;
  marketing: boolean;
}

export interface UserPreferencesSecurity {
  twoFactorEnabled: boolean;
  emailOtpEnabled: boolean;
  sessionTimeout: number;
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
  twoFactorAuth?: UserPreferencesTwoFactorAuth;
=======
  twoFactorAuth: UserPreferencesTwoFactorAuth;
>>>>>>> Stashed changes
}

export interface UpdatePreferencesPayload {
  theme?: "light" | "dark" | "system";
<<<<<<< Updated upstream
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
=======
  notifications?: Partial<UserPreferencesNotifications>;
  security?: Partial<UserPreferencesSecurity>;
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
  _id?: string;
  id?: string;
  ipAddress: string;
  deviceInfo?: {
    os?: string;
    browser?: string;
    device?: string;
  };
=======
  id: string;
  ipAddress: string;
>>>>>>> Stashed changes
  device?: string;
  browser?: string;
  os?: string;
  location?: string;
<<<<<<< Updated upstream
  lastActive?: string | Date;
  createdAt?: string | Date;
  current?: boolean;
=======
  lastActive: string | Date;
  createdAt: string | Date;
>>>>>>> Stashed changes
}

export interface SessionsData {
  currentSession?: UserSession;
  otherSessions: UserSession[];
}

export interface Setup2FaResponse {
<<<<<<< Updated upstream
  qrCode: string;
=======
>>>>>>> Stashed changes
  qrCodeUrl: string;
  secret: string;
}

export interface Verify2FaResponse {
<<<<<<< Updated upstream
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
=======
  recoveryCodes?: string[];
}

export interface CheckPasswordPayload {
  password: string;
}

export interface UpdatePasswordPayload {
  currentPassword: string;
  newPassword: string;
  otp?: string;
>>>>>>> Stashed changes
}

export interface UpdateProfilePayload {
  phone?: string;
  avatar?: string;
<<<<<<< Updated upstream
  avtar?: string;
=======
>>>>>>> Stashed changes
}
