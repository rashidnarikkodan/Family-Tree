import { 
  browserLocalPersistence,
  signInWithPopup, 
  signInWithRedirect,
  GoogleAuthProvider, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  setPersistence,
} from 'firebase/auth';
import { auth, firebaseInitializationError } from './firebase';


const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

const ensureAuth = () => {
  if (!auth) {
    throw new Error(firebaseInitializationError || 'Firebase authentication is not configured.');
  }
};

const mapUser = (user) => ({
  uid: user.uid,
  email: user.email,
  name: user.displayName || user.email,
  avatar: user.photoURL,
});

const configurePersistence = async () => {
  ensureAuth();
  await setPersistence(auth, browserLocalPersistence);
};

export const signInWithGoogle = async () => {
  try {
    await configurePersistence();
    const result = await signInWithPopup(auth, provider);
    return mapUser(result.user);
  } catch (error) {
    if (
      error.code === 'auth/popup-blocked' ||
      error.code === 'auth/cancelled-popup-request' ||
      error.code === 'auth/operation-not-supported-in-this-environment'
    ) {
      await signInWithRedirect(auth, provider);
      return null;
    }

    console.error("Google Sign-In Error:", error.code, error.message);
    throw error;
  }
};

export const loginWithGoogle = signInWithGoogle;

export const registerEmailPassword = async (email, password) => {
  try {
    await configurePersistence();
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return mapUser(result.user);
  } catch (error) {
    console.error("Error registering with email", error);
    throw error;
  }
};

export const loginEmailPassword = async (email, password) => {
  try {
    await configurePersistence();
    const result = await signInWithEmailAndPassword(auth, email, password);
    return mapUser(result.user);
  } catch (error) {
    console.error("Error logging in with email", error);
    throw error;
  }
};

export const logout = async () => {
  try {
    ensureAuth();
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
    throw error;
  }
};

export const subscribeToAuthChanges = (callback) => {
  if (!auth) {
    callback(null);
    return () => {};
  }

  return onAuthStateChanged(auth, callback);
};
