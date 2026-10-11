/** API services for the profile module. */
import { uploadProfileAvatar, type DirectUploadResult } from "@/lib/cdn-upload";
import { settingsService } from "@/features/settings/services/settings.service";
import type { UpdateProfilePayload } from "@/features/settings/types";

export const profileService = {
  uploadAvatar: async (
    file: File,
    onProgress?: (percent: number) => void,
  ): Promise<DirectUploadResult> => {
    return uploadProfileAvatar(file, onProgress);
  },
  updateProfile: async (payload: UpdateProfilePayload) => {
    return settingsService.updateProfile(payload);
  },
};
