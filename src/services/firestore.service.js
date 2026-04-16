import { db, auth } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  addDoc,
  query,
  where,
  getDocs,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';

// ==== UTILS ====

const ensureDb = () => {
  if (!db) {
    throw new Error('Firestore is not initialized.');
  }
};

const getAuthUser = () => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }
  return user;
};

// ==== USERS ====

export const createUserProfile = async (data) => {
  ensureDb();
  const user = getAuthUser();

  const userRef = doc(db, 'users', user.uid);

  await setDoc(userRef, {
    ...data,
    updatedAt: serverTimestamp()
  }, { merge: true });
};

export const getUserProfile = async () => {
  ensureDb();
  const user = getAuthUser();

  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);

  return snap.exists() ? snap.data() : null;
};

// ==== FAMILIES ====

export const createFamily = async (familyName) => {
  ensureDb();
  const user = getAuthUser();

  if (!familyName || typeof familyName !== 'string') {
    throw new Error('Invalid family name');
  }

  try {
    const docRef = await addDoc(collection(db, 'families'), {
      name: familyName,
      userId: user.uid,
      isPublic: false, // Default to private
      createdAt: serverTimestamp()
    });

    return {
      id: docRef.id,
      name: familyName,
      userId: user.uid,
      isPublic: false
    };

  } catch (error) {
    console.error('createFamily error:', error);
    throw error;
  }
};

export const updateFamily = async (familyId, updateData) => {
  ensureDb();
  getAuthUser();
  const familyRef = doc(db, 'families', familyId);
  await updateDoc(familyRef, {
    ...updateData,
    updatedAt: serverTimestamp()
  });
};

export const getPublicFamilies = async () => {
  ensureDb();
  try {
    const q = query(
      collection(db, 'families'),
      where("isPublic", "==", true)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('getPublicFamilies error:', error);
    throw error;
  }
};

export const getUserFamilies = async () => {
  ensureDb();
  const user = getAuthUser();

  try {
    const q = query(
      collection(db, 'families'),
      where("userId", "==", user.uid)
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

  } catch (error) {
    console.error('getUserFamilies error:', error);
    throw error;
  }
};

// ==== MEMBERS ====

export const addFamilyMember = async (familyId, memberData) => {
  ensureDb();
  getAuthUser();

  if (!familyId) {
    throw new Error('familyId is required');
  }

  try {
    const docRef = await addDoc(collection(db, 'members'), {
      familyId,
      name: memberData.name || 'Unnamed',
      gender: memberData.gender || 'unspecified',
      dob: memberData.dob || null,
      jobOrStudy: memberData.jobOrStudy || '',
      phone: memberData.phone || '',
      email: memberData.email || '',
      generationLevel: memberData.generationLevel || 0,
      parentId: memberData.parentId || null,
      spouseId: memberData.spouseId || null,
      position: memberData.position || { x: 0, y: 0 },
      createdAt: serverTimestamp()
    });

    return {
      id: docRef.id,
      familyId,
      ...memberData
    };

  } catch (error) {
    console.error('addFamilyMember error:', error);
    throw error;
  }
};

export const getFamilyById = async (familyId) => {
  ensureDb();
  if (!familyId) throw new Error('familyId is required');
  const familyRef = doc(db, 'families', familyId);
  const snap = await getDoc(familyRef);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const getFamilyMembers = async (familyId) => {
  ensureDb();
  // Removed getAuthUser() to allow public exploration

  if (!familyId) {
    throw new Error('familyId is required');
  }

  try {
    const q = query(
      collection(db, 'members'),
      where("familyId", "==", familyId)
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

  } catch (error) {
    console.error('getFamilyMembers error:', error);
    throw error;
  }
};

export const updateFamilyMember = async (memberId, updateData) => {
  getAuthUser();

  if (!memberId) {
    throw new Error('memberId is required');
  }

  try {
    const memberRef = doc(db, 'members', memberId);

    const dataToUpdate = {
      ...updateData,
      updatedAt: serverTimestamp()
    };

    await updateDoc(memberRef, dataToUpdate);

  } catch (error) {
    console.error('updateFamilyMember error:', error);
    throw error;
  }
};

export const deleteFamilyMember = async (memberId) => {
  ensureDb();
  getAuthUser();

  if (!memberId) {
    throw new Error('memberId is required');
  }

  try {
    await deleteDoc(doc(db, 'members', memberId));

  } catch (error) {
    console.error('deleteFamilyMember error:', error);
    throw error;
  }
};