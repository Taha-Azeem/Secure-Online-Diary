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
const VAULT_KEY_STORAGE = 'cipherdiary:vault-key';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [vaultKey, setVaultKeyState] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return window.sessionStorage.getItem(VAULT_KEY_STORAGE);
  });

  const setVaultKey = (key: string | null) => {
    setVaultKeyState(key);

    if (typeof window === 'undefined') return;

    if (key) {
      window.sessionStorage.setItem(VAULT_KEY_STORAGE, key);
    } else {
      window.sessionStorage.removeItem(VAULT_KEY_STORAGE);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Fetch user profile from Firestore
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        try {
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            setProfile(userDoc.data() as UserProfile);
            // Update last login
            await updateDoc(userDocRef, {
              lastLogin: serverTimestamp()
            }).catch(err => handleFirestoreError(err, OperationType.UPDATE, `users/${firebaseUser.uid}`));
          } else {
            // Create default profile if it doesn't exist
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || 'Agent',
              role: 'user', // Default role
              biometricsEnabled: false
            };
            await setDoc(userDocRef, {
              ...newProfile,
              createdAt: serverTimestamp(),
              lastLogin: serverTimestamp()
            }).catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${firebaseUser.uid}`));
            setProfile(newProfile);
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, `users/${firebaseUser.uid}`);
        }
      } else {
        setProfile(null);
        setVaultKey(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
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
