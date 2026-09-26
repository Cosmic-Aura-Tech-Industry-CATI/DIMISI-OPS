import { useSyncExternalStore } from "react";

export type EditableProfile = {
  phone?: string;
  bio?: string;
  photo: string | null;
};

const KEY = "dimisi.profile.editable";

const DEFAULT_PROFILE: EditableProfile = {
  photo: null,
};

let cache: EditableProfile | null = null;
const listeners = new Set<() => void>();

function read(): EditableProfile {
  if (cache) return cache;
  if (typeof window === "undefined") return DEFAULT_PROFILE;
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = raw ? { ...DEFAULT_PROFILE, ...(JSON.parse(raw) as Partial<EditableProfile>) } : DEFAULT_PROFILE;
  } catch {
    cache = DEFAULT_PROFILE;
  }
  return cache;
}

function emit() {
  listeners.forEach((l) => l());
}

export function updateProfile(patch: Partial<EditableProfile>) {
  cache = { ...read(), ...patch };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    /* ignore quota errors */
  }
  emit();
}

export function useEditableProfile(): EditableProfile {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    read,
    () => DEFAULT_PROFILE,
  );
}
