import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  User as FirebaseUser,
  signOut as firebaseSignOut,
  updateEmail as firebaseUpdateEmail,
  updateProfile as firebaseUpdateAuthProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { auth, db } from '../lib/firebase';

interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: 'user' | 'admin';
  biometricsEnabled: boolean;
  vaultKey?: string; // In a real app, this wouldn't be stored in plaintext
  verifierPayload?: string;
  verifierSalt?: string;
  verifierIv?: string;
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  vaultKey: string | null;
  setVaultKey: (key: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [vaultKey, setVaultKeyState] = useState<string | null>(null);

  const setVaultKey = (key: string | null) => {
    setVaultKeyState(key);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        try {
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            setProfile(userDoc.data() as UserProfile);
            // Unblock the UI immediately — lastLogin write is fire-and-forget
            setLoading(false);
            updateDoc(userDocRef, { lastLogin: serverTimestamp() })
              .catch(err => handleFirestoreError(err, OperationType.UPDATE, `users/${firebaseUser.uid}`));
          } else {
            // Create default profile
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || 'Agent',
              role: 'user',
              biometricsEnabled: false
            };
            setProfile(newProfile);
            setLoading(false);
            // Write new profile in background
            setDoc(userDocRef, {
              ...newProfile,
              createdAt: serverTimestamp(),
              lastLogin: serverTimestamp()
            }).catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${firebaseUser.uid}`));
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, `users/${firebaseUser.uid}`);
          setLoading(false);
        }
      } else {
        setProfile(null);
        setVaultKey(null);
        setLoading(false);
      }
    });

    // Safety fallback: if auth init stalls (network/emulator issues), stop loading after 8s
    const fallbackTimer = setTimeout(() => {
      setLoading(false);
      // Do not modify `user` here — leaving as null will cause a redirect to /login
      // This prevents the app from being stuck on a perpetual loading screen.
      // eslint-disable-next-line no-console
      console.warn('Auth initialization fallback triggered: loading forced false after timeout');
    }, 8000);

    return () => {
      clearTimeout(fallbackTimer);
      unsubscribe();
    };
  }, []);

  const logout = async () => {
    await firebaseSignOut(auth);
    setVaultKey(null);
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);
    try {
      if (typeof data.displayName === 'string' && data.displayName !== user.displayName) {
        await firebaseUpdateAuthProfile(user, { displayName: data.displayName });
      }

      if (typeof data.email === 'string' && data.email !== user.email) {
        await firebaseUpdateEmail(user, data.email);
      }

      await updateDoc(userDocRef, data);
      setProfile(prev => prev ? { ...prev, ...data } : null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, logout, updateProfile, vaultKey, setVaultKey }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
