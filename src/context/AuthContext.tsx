import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  onAuthStateChanged,
  User as FirebaseUser,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  UserCredential,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { UserProfile, UserRole } from '../types';

export interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signInWithEmail: (email: string, pass: string) => Promise<UserCredential>;
  signUpWithEmail: (email: string, pass: string, displayName?: string, role?: UserRole) => Promise<UserCredential>;
  signInWithGoogle: () => Promise<UserCredential>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setLoading(true);
      if (fbUser) {
        setFirebaseUser(fbUser);
        try {
          // Fetch custom token claims
          const tokenResult = await fbUser.getIdTokenResult();
          const claims = tokenResult.claims;

          // Fetch additional profile data from Firestore if available
          const userDocRef = doc(db, 'users', fbUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            setUser({
              uid: fbUser.uid,
              email: fbUser.email || '',
              displayName: data.displayName || fbUser.displayName || 'Developer',
              photoURL: data.photoURL || fbUser.photoURL || undefined,
              role: (data.role as UserRole) || (claims.role as string) || 'developer',
              createdAt: data.createdAt || fbUser.metadata.creationTime || new Date().toISOString(),
              tenantId: (claims.tenantId as string) || data.tenantId || 'tenant-default',
              isTenantAdmin: Boolean(claims.isTenantAdmin ?? data.isTenantAdmin ?? (data.role === 'admin')),
              profileId: (claims.profileId as string) || data.profileId || 'admin_profile',
            });
          } else {
            // Create fallback profile and populate in Firestore
            const initialProfile: UserProfile = {
              uid: fbUser.uid,
              email: fbUser.email || '',
              displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Developer',
              photoURL: fbUser.photoURL || undefined,
              role: (claims.role as string) || 'admin',
              createdAt: fbUser.metadata.creationTime || new Date().toISOString(),
              tenantId: (claims.tenantId as string) || 'tenant-default',
              isTenantAdmin: Boolean(claims.isTenantAdmin ?? true),
              profileId: (claims.profileId as string) || 'admin_profile',
            };

            await setDoc(userDocRef, initialProfile, { merge: true });
            setUser(initialProfile);
          }
        } catch {
          // If Firestore is offline or restricted, construct client-side fallback
          setUser({
            uid: fbUser.uid,
            email: fbUser.email || '',
            displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Developer',
            photoURL: fbUser.photoURL || undefined,
            role: 'admin',
            createdAt: fbUser.metadata.creationTime || new Date().toISOString(),
            tenantId: 'tenant-default',
            isTenantAdmin: true,
            profileId: 'admin_profile',
          });
        }
      } else {
        setFirebaseUser(null);
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithEmail = async (email: string, pass: string) => {
    return signInWithEmailAndPassword(auth, email, pass);
  };

  const signUpWithEmail = async (
    email: string,
    pass: string,
    displayName?: string,
    role: UserRole = 'developer'
  ) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    const profile: UserProfile = {
      uid: cred.user.uid,
      email: cred.user.email || email,
      displayName: displayName || email.split('@')[0],
      photoURL: cred.user.photoURL || undefined,
      role,
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'users', cred.user.uid), profile);
    } catch (err) {
      console.warn('Could not save user profile to Firestore:', err);
    }

    setUser(profile);
    return cred;
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  };

  const signOut = async () => {
    await fbSignOut(auth);
    setUser(null);
    setFirebaseUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
