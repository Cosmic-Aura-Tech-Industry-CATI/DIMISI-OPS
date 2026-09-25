import { useRef, useState, useEffect } from "react";
import { Upload, Trash2, Camera } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export interface AvatarUploadProps {
  value?: string | null;
  name?: string;
  onChange: (photoUrl: string | null, file?: File | null) => void;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function AvatarUpload({
  value,
  name = "User",
  onChange,
  className = "",
  size = "md",
}: AvatarUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(value || null);

  useEffect(() => {
    setPreview(value || null);
  }, [value]);

  const initials = name
    ? name
        .trim()
        .split(/\s+/)
        .map((p) => p[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  const isImageAvatar =
    Boolean(preview) &&
    (preview!.startsWith("data:") ||
      preview!.startsWith("http") ||
      preview!.startsWith("/") ||
      preview!.includes("/"));

  const onPickFile = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose a valid image file (JPG, PNG, WebP, etc.).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be smaller than 5 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      setPreview(dataUrl);
      onChange(dataUrl, file);
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
    onChange(null, null);
  };

  const dimensionClasses =
    size === "sm"
      ? "h-16 w-16 text-lg"
      : size === "lg"
        ? "h-28 w-28 text-3xl"
        : "h-24 w-24 text-2xl";

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onPickFile(e.target.files?.[0])}
      />
      <div className="relative">
        <div
          className={`grid ${dimensionClasses} shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-primary to-accent font-display font-bold shadow-glow ring-4 ring-background`}
        >
          {isImageAvatar ? (
            <img src={preview!} alt={name} className="h-full w-full object-cover" />
          ) : (
            <span>{initials}</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="absolute bottom-0 right-0 grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform hover:scale-110 ring-2 ring-background"
          aria-label="Upload photo"
        >
          <Camera className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-md"
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="mr-1.5 h-3.5 w-3.5" /> Upload photo
        </Button>
        {preview && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="rounded-md text-destructive hover:bg-destructive/10"
            onClick={handleRemove}
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Remove
          </Button>
        )}
      </div>
      <p className="text-center text-[11px] text-muted-foreground">
        JPG, PNG, GIF, or WebP · square · up to 5MB
      </p>
    </div>
  );
}
