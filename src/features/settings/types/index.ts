/** Types for settings and preferences module. */

export interface UserPreferencesNotifications {
  email: boolean;
  push: boolean;
  marketing: boolean;
}

export interface UserPreferencesSecurity {
  twoFactorEnabled: boolean;
  emailOtpEnabled: boolean;
  sessionTimeout: number;
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
  twoFactorAuth: UserPreferencesTwoFactorAuth;
}

export interface UpdatePreferencesPayload {
  theme?: "light" | "dark" | "system";
  notifications?: Partial<UserPreferencesNotifications>;
  security?: Partial<UserPreferencesSecurity>;
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
  id: string;
  ipAddress: string;
  device?: string;
  browser?: string;
  os?: string;
  location?: string;
  lastActive: string | Date;
  createdAt: string | Date;
}

export interface SessionsData {
  currentSession?: UserSession;
  otherSessions: UserSession[];
}

export interface Setup2FaResponse {
  qrCodeUrl: string;
  secret: string;
}

export interface Verify2FaResponse {
  recoveryCodes?: string[];
}

export interface CheckPasswordPayload {
  password: string;
}

export interface UpdatePasswordPayload {
  currentPassword: string;
  newPassword: string;
  otp?: string;
}

export interface UpdateProfilePayload {
  phone?: string;
  avatar?: string;
}
