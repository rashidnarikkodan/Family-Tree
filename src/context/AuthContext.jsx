import React, { createContext, useContext, useEffect, useState } from 'react';
import { subscribeToAuthChanges, loginWithGoogle, registerEmailPassword, loginEmailPassword, logout } from '../services/auth.service';
import { createUserProfile, getUserProfile } from '../services/firestore.service';
import { firebaseInitializationError } from '../services/firebase';

const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(firebaseInitializationError);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (firebaseUser) => {
      try {
        setAuthError(firebaseInitializationError);

        if (firebaseUser) {
          let profile = null;
          try {
            profile = await getUserProfile();
          } catch (error) {
            console.warn('Firestore read failed for user profile:', error.code || error.message);
          }

          if (!profile) {
            const newProfile = {
              name: firebaseUser.displayName || firebaseUser.email,
              email: firebaseUser.email,
              avatar: firebaseUser.photoURL || null,
            };
            try {
              await createUserProfile(newProfile);
              profile = newProfile;
            } catch (error) {
              console.warn('Firestore write failed for user profile:', error.code || error.message);
              profile = newProfile;
            }
          }

          setUser({ uid: firebaseUser.uid, ...profile });
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error restoring auth session', error);
        setUser(null);
        setAuthError(error.message || 'Unable to restore authentication session.');
      } finally {
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  const value = {
    user,
    loading,
    authError,
    loginWithGoogle,
    registerEmailPassword,
    loginEmailPassword,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
