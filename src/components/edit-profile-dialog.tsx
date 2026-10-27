import { useEffect, useState } from "react";
import { Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AvatarUpload } from "@/components/avatar-upload";
import { useEditableProfile, updateProfile } from "@/lib/profile-store";
import { useAuth } from "@/lib/auth";
import { useUpdateProfileMutation } from "@/features/settings";
import { uploadProfileAvatar, type DirectUploadResult } from "@/lib/cdn-upload";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Fallback initials when no photo is set. */
  initials: string;
  /** Read-only fields shown for context. */
  readOnly: { label: string; value: string }[];
  currentPhone?: string;
};

export function EditProfileDialog({
  open,
  onOpenChange,
  initials: _initials,
  readOnly,
  currentPhone,
}: Props) {
  const { user, setUser } = useAuth();
  const updateProfileMutation = useUpdateProfileMutation();
  const profile = useEditableProfile();

  const [phone, setPhone] = useState(profile.phone ?? currentPhone ?? user?.phone ?? "");
  const [photo, setPhoto] = useState<string | null>(profile.photo ?? user?.avatar ?? null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isPhotoRemoved, setIsPhotoRemoved] = useState<boolean>(false);

  // Retain uploaded CDN asset in case subsequent profile update fails, enabling retry without duplicate upload
  const [stagedUpload, setStagedUpload] = useState<DirectUploadResult | null>(null);
  const [isUploadingToCdn, setIsUploadingToCdn] = useState<boolean>(false);
  const [cdnProgress, setCdnProgress] = useState<number>(0);

  useEffect(() => {
    if (open) {
      setPhone(profile.phone ?? currentPhone ?? user?.phone ?? "");
      setPhoto(profile.photo ?? user?.avatar ?? null);
      setSelectedFile(null);
      setIsPhotoRemoved(false);
      setStagedUpload(null);
      setIsUploadingToCdn(false);
      setCdnProgress(0);
    }
  }, [open, profile.phone, profile.photo, currentPhone, user]);

  const isPending = updateProfileMutation.isPending || isUploadingToCdn;

  const save = async () => {
    try {
      let finalAvatarUrl: string | undefined;
      let finalAvatarPublicId: string | undefined;

      // 1. If a new file was selected, upload it directly to CDN (or reuse staged upload if retrying)
      if (selectedFile) {
        if (stagedUpload) {
          // Re-use already uploaded CDN asset from earlier attempt
          finalAvatarUrl = stagedUpload.avatar;
          finalAvatarPublicId = stagedUpload.avatarPublicId;
        } else {
          setIsUploadingToCdn(true);
          setCdnProgress(10);
          try {
            const uploadResult = await uploadProfileAvatar(selectedFile, (percent) => {
              setCdnProgress(percent);
            });
            setStagedUpload(uploadResult);
            finalAvatarUrl = uploadResult.avatar;
            finalAvatarPublicId = uploadResult.avatarPublicId;
          } catch (uploadErr: unknown) {
            const message =
              uploadErr instanceof Error
                ? uploadErr.message
                : typeof uploadErr === "object" && uploadErr !== null && "message" in uploadErr
                  ? String((uploadErr as { message: unknown }).message)
                  : "Failed to upload image to CDN.";
            toast.error(message);
            // Data safety: Retain previous valid photo if replacement upload fails
            setPhoto(profile.photo ?? user?.avatar ?? null);
            setSelectedFile(null);
            setStagedUpload(null);
            setIsUploadingToCdn(false);
            return;
          } finally {
            setIsUploadingToCdn(false);
          }
        }
      } else if (isPhotoRemoved) {
        // User explicitly removed their photo
        finalAvatarUrl = "";
        finalAvatarPublicId = "";
      }

      // 2. Build PATCH /api/v2/settings/profile payload
      const payload: {
        phone?: string;
        avatar?: string;
        avatarPublicId?: string;
      } = {};

      const trimmedPhone = phone.trim();
      if (trimmedPhone !== (user?.phone || "")) {
        payload.phone = trimmedPhone;
      }

      if (finalAvatarUrl !== undefined && finalAvatarPublicId !== undefined) {
        payload.avatar = finalAvatarUrl;
        payload.avatarPublicId = finalAvatarPublicId;
      }

      // If nothing changed, just close
      if (Object.keys(payload).length === 0) {
        onOpenChange(false);
        return;
      }

      // 3. Persist profile update to backend
      const res = await updateProfileMutation.mutateAsync(payload);
      const updatedUser = res?.user || res?.data?.user || res;

      const newAvatar =
        finalAvatarUrl !== undefined
          ? finalAvatarUrl
          : updatedUser?.avatar || photo || user?.avatar || "";
      const newPhone = updatedUser?.phone ?? trimmedPhone;

      // 4. Update auth state and client cache
      if (user) {
        setUser({
          ...user,
          phone: newPhone,
          avatar: newAvatar,
        });
      }
      updateProfile({ phone: newPhone, photo: newAvatar });

      toast.success("Profile updated successfully.");
      onOpenChange(false);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err !== null && "message" in err
            ? String((err as { message: unknown }).message)
            : "Failed to update profile. You can retry saving.";
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={isPending ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>
            Only your profile picture and phone number can be changed. Contact an admin for other
            details.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Photo */}
          <AvatarUpload
            value={photo}
            name={user?.name || "User"}
            disabled={isPending}
            autoUpload={false}
            onChange={(photoUrl, file) => {
              setPhoto(photoUrl);
              setSelectedFile(file ?? null);
              setStagedUpload(null); // invalidate staged upload if user selected another file
              if (!photoUrl && !file) {
                setIsPhotoRemoved(true);
              } else {
                setIsPhotoRemoved(false);
              }
            }}
          />

          {isUploadingToCdn && (
            <p className="text-center text-xs text-muted-foreground animate-pulse">
              Uploading image directly to storage… {cdnProgress}%
            </p>
          )}

          {stagedUpload && !isUploadingToCdn && (
            <p className="text-center text-xs text-emerald-600 dark:text-emerald-400">
              Image uploaded to storage. Click "Save changes" to apply.
            </p>
          )}

          {/* Phone Number */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              disabled={isPending}
              value={phone}
              onChange={(ev) => setPhone(ev.target.value)}
              placeholder="e.g. +1 (415) 555-0142"
            />
          </div>

          {/* Locked fields */}
          <div className="rounded-md border border-border/60 bg-muted/30 p-4">
            <div className="mb-3 inline-flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
              <Lock className="h-3.5 w-3.5" /> Managed by admin
            </div>
            <dl className="grid gap-3 sm:grid-cols-2">
              {readOnly.map((f) => (
                <div key={f.label}>
                  <dt className="text-xs text-muted-foreground">{f.label}</dt>
                  <dd className="truncate text-sm font-medium">{f.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            className="rounded-md"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button className="rounded-md shadow-glow" onClick={save} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                {isUploadingToCdn ? "Uploading photo…" : "Saving…"}
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
