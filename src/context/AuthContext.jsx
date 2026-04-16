import React, { createContext, useContext, useEffect, useState } from 'react';
import { subscribeToAuthChanges, loginWithGoogle, registerEmailPassword, loginEmailPassword, logout } from '../services/auth.service';
import { createUserProfile, getUserProfile } from '../services/firestore.service';

const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (firebaseUser) => {
      if (firebaseUser) {
        let profile = await getUserProfile(firebaseUser.uid);
        if (!profile) {
          const newProfile = { name: firebaseUser.displayName || firebaseUser.email, email: firebaseUser.email };
          await createUserProfile(firebaseUser.uid, newProfile);
          profile = newProfile;
        }
        setUser({ uid: firebaseUser.uid, ...profile });
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = {
    user,
    loading,
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
