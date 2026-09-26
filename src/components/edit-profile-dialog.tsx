import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
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

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Fallback initials when no photo is set. */
  initials: string;
  /** Read-only fields shown for context. */
  readOnly: { label: string; value: string }[];
  currentPhone?: string;
};

export function EditProfileDialog({ open, onOpenChange, initials, readOnly, currentPhone }: Props) {
  const { user, setUser } = useAuth();
  const updateProfileMutation = useUpdateProfileMutation();
  const profile = useEditableProfile();
  const [phone, setPhone] = useState(profile.phone ?? currentPhone ?? user?.phone ?? "");
  const [photo, setPhoto] = useState<string | null>(profile.photo ?? user?.avatar ?? null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (open) {
      setPhone(profile.phone ?? currentPhone ?? user?.phone ?? "");
      setPhoto(profile.photo ?? user?.avatar ?? null);
      setSelectedFile(null);
    }
  }, [open, profile.phone, profile.photo, currentPhone, user]);

  const save = async () => {
    try {
      let payload: any;
      if (selectedFile) {
        payload = new FormData();
        payload.append("avatar", selectedFile);
        if (phone.trim()) payload.append("phone", phone.trim());
      } else {
        payload = { phone: phone.trim(), avatar: photo || "" };
      }

      const res = await updateProfileMutation.mutateAsync(payload);
      const updatedUser = res?.user || res?.data?.user || res;
      const newAvatar = updatedUser?.avatar || photo || user?.avatar || "";
      const newPhone = updatedUser?.phone ?? phone.trim();

      if (user) {
        setUser({
          ...user,
          phone: newPhone,
          avatar: newAvatar,
        });
      }
      updateProfile({ phone: newPhone, photo: newAvatar });
      toast.success("Profile updated");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update profile");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>
            Only your profile picture and phone number can be changed. Contact an admin for other details.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Photo */}
          <AvatarUpload
            value={photo}
            name={user?.name || "User"}
            onChange={(photoUrl, file) => {
              setPhoto(photoUrl);
              setSelectedFile(file ?? null);
            }}
          />

          {/* Phone Number */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
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
          <Button variant="outline" className="rounded-md" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className="rounded-md shadow-glow" onClick={save} disabled={updateProfileMutation.isPending}>
            {updateProfileMutation.isPending ? "Saving…" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
