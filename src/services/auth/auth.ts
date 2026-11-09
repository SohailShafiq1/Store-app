import { createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { firebaseAuth } from '../firebase/config';

function requireAuth() {
  if (!firebaseAuth) throw new Error('Firebase is not configured. Add the EXPO_PUBLIC_FIREBASE_* values from .env.example.');
  return firebaseAuth;
}

export const signIn = (email: string, password: string) => signInWithEmailAndPassword(requireAuth(), email.trim(), password);
export const signUp = (email: string, password: string) => createUserWithEmailAndPassword(requireAuth(), email.trim(), password);
export const resetPassword = (email: string) => sendPasswordResetEmail(requireAuth(), email.trim());
export const logOut = () => signOut(requireAuth());
