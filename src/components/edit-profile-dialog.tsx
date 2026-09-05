import { useEffect, useRef, useState } from "react";
import { Camera, Trash2, Lock } from "lucide-react";
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
import { useEditableProfile, updateProfile } from "@/lib/profile-store";

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
  const profile = useEditableProfile();
  const [phone, setPhone] = useState(profile.phone ?? currentPhone ?? "");
  const [photo, setPhoto] = useState<string | null>(profile.photo);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setPhone(profile.phone ?? currentPhone ?? "");
      setPhoto(profile.photo);
    }
  }, [open, profile.phone, profile.photo, currentPhone]);

  const onPick = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be smaller than 2 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPhoto(String(reader.result));
    reader.readAsDataURL(file);
  };

  const save = () => {
    updateProfile({ phone: phone.trim(), photo });
    toast.success("Profile updated");
    onOpenChange(false);
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
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-md bg-muted text-xl font-display font-semibold">
                {photo ? (
                  <img src={photo} alt="Profile preview" className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(ev) => onPick(ev.target.files?.[0])}
              />
              <Button type="button" variant="outline" className="rounded-md" onClick={() => fileRef.current?.click()}>
                <Camera className="mr-2 h-4 w-4" /> Upload photo
              </Button>
              {photo && (
                <Button type="button" variant="ghost" className="rounded-md" onClick={() => setPhoto(null)}>
                  <Trash2 className="mr-2 h-4 w-4" /> Remove
                </Button>
              )}
            </div>
          </div>

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
          <Button className="rounded-md shadow-glow" onClick={save}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
