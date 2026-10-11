import axios from "axios";
import { http } from "@/api/client/client";
import { API_ENDPOINTS } from "@/api/client/endpoints";

export const ALLOWED_AVATAR_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const ALLOWED_AVATAR_EXTENSIONS = ["jpg", "jpeg", "png", "webp"] as const;

export const MAX_AVATAR_FILE_SIZE = 2 * 1024 * 1024; // 2 MB

export interface SignUploadRequest {
  model: "profile" | string;
  field: "avatar" | string;
  filename: string;
  size: number;
  mime: string;
  entityId?: string;
  fileChunk?: string;
}

export interface SignUploadResponse {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
  publicId: string;
  resourceType: "image" | "video" | "raw" | "auto";
  uploadUrl: string;
  maxFileSize: number;
  allowedFormats: string[];
  transformation?: string;
  notificationUrl?: string;
  expiresAt: string;
}

export interface DirectUploadResult {
  avatar: string;
  avatarPublicId: string;
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates file format and file size against backend upload rules for profile.avatar.
 */
export function validateAvatarFile(file: File): FileValidationResult {
  if (!file) {
    return { valid: false, error: "No file selected." };
  }

  const mime = file.type?.toLowerCase();
  const ext = file.name.split(".").pop()?.toLowerCase();

  const isMimeAllowed = mime && (ALLOWED_AVATAR_MIME_TYPES as readonly string[]).includes(mime);
  const isExtAllowed = ext && (ALLOWED_AVATAR_EXTENSIONS as readonly string[]).includes(ext);

  if (!isMimeAllowed && !isExtAllowed) {
    return {
      valid: false,
      error: "Please choose a supported image format (JPEG, PNG, or WebP).",
    };
  }

  if (file.size > MAX_AVATAR_FILE_SIZE) {
    return {
      valid: false,
      error: `Image size must be smaller than ${(MAX_AVATAR_FILE_SIZE / (1024 * 1024)).toFixed(0)} MB.`,
    };
  }

  if (file.size <= 0) {
    return {
      valid: false,
      error: "The selected file is empty.",
    };
  }

  return { valid: true };
}

/**
 * Requests an upload signature from the authenticated backend API.
 * Rate limited to 50 requests/hour by the backend.
 */
export async function requestUploadSignature(
  params: SignUploadRequest,
): Promise<SignUploadResponse> {
  const result = await http.post<SignUploadResponse>(API_ENDPOINTS.upload.sign, params);
  return result;
}

/**
 * Uploads an image binary directly to the Cloudinary storage provider URL
 * using FormData containing the signed parameters.
 *
 * CRITICAL: This call NEVER attaches backend Authorization headers or cookies
 * to avoid leaking credentials to third-party CDN origins.
 */
export async function uploadFileToCdn(
  file: File,
  signData: SignUploadResponse,
  onProgress?: (percent: number) => void,
): Promise<{ secureUrl: string; publicId: string }> {
  const formData = new FormData();

  // Attach all required signed parameters exactly as verified by Cloudinary
  formData.append("file", file);
  formData.append("api_key", signData.apiKey);
  formData.append("timestamp", String(signData.timestamp));
  formData.append("signature", signData.signature);
  formData.append("folder", signData.folder);
  formData.append("public_id", signData.publicId);
  formData.append("max_file_size", String(signData.maxFileSize));

  if (signData.allowedFormats && signData.allowedFormats.length > 0) {
    formData.append("allowed_formats", signData.allowedFormats.join(","));
  }

  if (signData.transformation) {
    formData.append("transformation", signData.transformation);
  }

  if (signData.notificationUrl) {
    formData.append("notification_url", signData.notificationUrl);
  }

  // Use a clean axios POST without custom app interceptors or auth headers
  const response = await axios.post<{
    secure_url?: string;
    url?: string;
    public_id?: string;
    [key: string]: unknown;
  }>(signData.uploadUrl, formData, {
    // Explicitly do not send credentials or Authorization headers
    withCredentials: false,
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total && onProgress) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(Math.min(percent, 100));
      }
    },
  });

  const data = response.data;
  const secureUrl = data.secure_url || data.url;
  const publicId = data.public_id;

  if (!secureUrl) {
    throw new Error("Storage provider did not return a public image URL.");
  }

  if (!publicId) {
    throw new Error("Storage provider did not return a public image ID.");
  }

  return {
    secureUrl,
    publicId,
  };
}

/**
 * Full end-to-end direct-to-CDN avatar upload pipeline:
 * 1. Validates format and size limit.
 * 2. Requests signed upload authorization from backend.
 * 3. Streams image directly to the storage provider URL.
 * 4. Returns final public CDN URL and asset public ID.
 */
export async function uploadProfileAvatar(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<DirectUploadResult> {
  const validation = validateAvatarFile(file);
  if (!validation.valid) {
    throw new Error(validation.error || "Invalid image file.");
  }

  // Request upload authorization
  const signData = await requestUploadSignature({
    model: "profile",
    field: "avatar",
    filename: file.name,
    size: file.size,
    mime: file.type || "image/jpeg",
  });

  // Upload directly to CDN
  const cdnResult = await uploadFileToCdn(file, signData, onProgress);

  return {
    avatar: cdnResult.secureUrl,
    avatarPublicId: cdnResult.publicId,
  };
}
