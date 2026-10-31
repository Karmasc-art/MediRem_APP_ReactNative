import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../../firebase";
import { logger } from "../utils/logger";
import { logout } from "./authService";

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
}

interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function toAppUser(u: User | null): AppUser | null {
  if (!u) return null;
  return { uid: u.uid, email: u.email ?? "", displayName: u.displayName ?? "" };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      logger.info(firebaseUser ? "Auth state: signed in" : "Auth state: signed out");
      setUser(toAppUser(firebaseUser));
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      signOut: logout,
      // Registration sets the display name after the user is created,
      // so this re-reads it from Firebase.
      refreshUser: () => setUser(toAppUser(auth.currentUser)),
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}