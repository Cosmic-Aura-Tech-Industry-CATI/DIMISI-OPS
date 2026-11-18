import * as React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { getAvatarUrl, getInitials, isValidImageUrl } from "@/lib/avatar";

export { getAvatarUrl, getInitials, isValidImageUrl };

export interface UserAvatarProps {
  user?: unknown;
  name?: string | null;
  image?: string | null;
  className?: string;
  fallbackClassName?: string;
  shape?: "circle" | "rounded";
}

/**
 * Consistent avatar component for rendering profile images with resilient fallback.
 * Uses Radix UI AvatarImage which automatically switches to AvatarFallback (initials)
 * if the image URL is missing, invalid, or fails to load (404/network error).
 */
export function UserAvatar({
  user,
  name,
  image,
  className,
  fallbackClassName,
  shape = "circle",
}: UserAvatarProps) {
  const resolvedName =
    name ||
    (user && typeof user === "object" && "name" in user && typeof (user as { name?: unknown }).name === "string"
      ? (user as { name: string }).name
      : "User");

  const resolvedImage =
    typeof image === "string" && isValidImageUrl(image)
      ? image.trim()
      : image === null
        ? undefined
        : getAvatarUrl(user);

  const initials = getInitials(resolvedName);

  return (
    <Avatar
      className={cn(
        "shrink-0 select-none",
        shape === "circle" ? "rounded-full" : "rounded-2xl",
        className,
      )}
    >
      {resolvedImage ? (
        <AvatarImage
          src={resolvedImage}
          alt={resolvedName}
          className="h-full w-full object-cover"
        />
      ) : null}
      <AvatarFallback
        className={cn(
          "font-semibold",
          shape === "circle" ? "rounded-full" : "rounded-2xl",
          "bg-gradient-to-br from-primary/30 to-accent text-foreground",
          fallbackClassName,
        )}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
