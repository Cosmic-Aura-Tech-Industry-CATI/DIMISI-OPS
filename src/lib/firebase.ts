import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  type Auth,
  type UserCredential,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "dimisi-ops.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "dimisi-ops",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "dimisi-ops.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
};

export const isFirebaseConfigured = (): boolean => {
  return Boolean(
    import.meta.env.VITE_FIREBASE_API_KEY &&
    import.meta.env.VITE_FIREBASE_PROJECT_ID
  );
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

try {
  if (isFirebaseConfigured() || firebaseConfig.projectId) {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
  }
} catch (error) {
  console.warn("Failed to initialize Firebase client:", error);
}

export { app as firebaseApp, auth as firebaseAuth };

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

/**
 * Initiates Google OAuth popup flow using Firebase Auth.
 * Returns the Firebase ID token and user object.
 */
export async function signInWithGoogleOAuth(): Promise<{
  idToken: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}> {
  if (!auth) {
    if (!isFirebaseConfigured()) {
      throw new Error(
        "Firebase is not configured. Please provide VITE_FIREBASE_API_KEY and related variables in your .env file."
      );
    }
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
  }

  try {
    const result: UserCredential = await signInWithPopup(auth, googleProvider);
    const idToken = await result.user.getIdToken(true);

    return {
      idToken,
      email: result.user.email,
      displayName: result.user.displayName,
      photoURL: result.user.photoURL,
    };
  } catch (err: any) {
    if (err?.code === "auth/popup-closed-by-user") {
      throw new Error("Sign-in cancelled. You closed the login popup.");
    }
    if (err?.code === "auth/popup-blocked") {
      throw new Error("Popup was blocked by your browser. Please allow popups for this site.");
    }
    if (err?.code === "auth/cancelled-popup-request") {
      throw new Error("Popup request was cancelled.");
    }
    throw err;
  }
}

/**
 * Signs out from client-side Firebase session.
 */
export async function signOutFirebase(): Promise<void> {
  if (auth) {
    try {
      await firebaseSignOut(auth);
    } catch (err) {
      console.warn("Error signing out from Firebase:", err);
    }
  }
}
