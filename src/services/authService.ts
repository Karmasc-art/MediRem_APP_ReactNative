import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { auth } from "../../firebase";
import { logger } from "../utils/logger";
import { reportError } from "../utils/errorHandler";

// Turns Firebase error codes into messages a user can understand.
export function friendlyAuthError(error: unknown): string {
  const code = (error as { code?: string })?.code ?? "";
  switch (code) {
    case "auth/invalid-email":
      return "That email address is not valid.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Incorrect email or password.";
    case "auth/email-already-in-use":
      return "An account with this email already exists.";
    case "auth/weak-password":
      return "Password is too weak. Use at least 6 characters.";
    case "auth/network-request-failed":
      return "No internet connection. Please check your network.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    case "auth/user-disabled":
      return "This account has been disabled.";
    default:
      return "Something went wrong. Please try again.";
  }
}

export async function login(email: string, password: string): Promise<void> {
  try {
    logger.info("Login started");
    await signInWithEmailAndPassword(auth, email.trim(), password);
    logger.info("Login completed");
  } catch (error) {
    reportError("login", error);
    throw new Error(friendlyAuthError(error));
  }
}

export async function register(name: string, email: string, password: string): Promise<void> {
  try {
    logger.info("Registration started");
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    await updateProfile(cred.user, { displayName: name.trim() });
    logger.info("Registration completed");
  } catch (error) {
    reportError("register", error);
    throw new Error(friendlyAuthError(error));
  }
}

export async function resetPassword(email: string): Promise<void> {
  try {
    logger.info("Password reset requested");
    await sendPasswordResetEmail(auth, email.trim());
  } catch (error) {
    reportError("reset password", error);
    throw new Error(friendlyAuthError(error));
  }
}

export async function logout(): Promise<void> {
  try {
    await signOut(auth);
    logger.info("Logged out");
  } catch (error) {
    reportError("logout", error);
    throw new Error("Could not log out. Please try again.");
  }
}