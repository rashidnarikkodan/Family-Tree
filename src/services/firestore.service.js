import { db } from './firebase';
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
  deleteDoc
} from 'firebase/firestore';

// ==== USERS ====

export const createUserProfile = async (uid, data) => {
  const userRef = doc(db, 'users', uid);
  await setDoc(userRef, data, { merge: true });
};

export const getUserProfile = async (uid) => {
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  return snap.exists() ? snap.data() : null;
};

// ==== FAMILIES ====

export const createFamily = async (userId, familyName) => {
  const familiesRef = collection(db, 'families');
  const docRef = await addDoc(familiesRef, {
    userId,
    name: familyName,
    createdAt: new Date()
  });
  return { id: docRef.id, name: familyName, userId };
};

export const getUserFamilies = async (userId) => {
  const q = query(collection(db, 'families'), where("userId", "==", userId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// ==== MEMBERS (NODES) ====

export const addFamilyMember = async (familyId, memberData) => {
  const membersRef = collection(db, 'members');
  const docRef = await addDoc(membersRef, {
    familyId,
    ...memberData
  });
  return { id: docRef.id, familyId, ...memberData };
};

export const getFamilyMembers = async (familyId) => {
  const q = query(collection(db, 'members'), where("familyId", "==", familyId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const updateFamilyMember = async (memberId, updateData) => {
  const memberRef = doc(db, 'members', memberId);
  await updateDoc(memberRef, updateData);
};

export const deleteFamilyMember = async (memberId) => {
  const memberRef = doc(db, 'members', memberId);
  await deleteDoc(memberRef);
};
