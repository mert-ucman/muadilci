import { addDoc, collection, doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export async function writeActivityLog(userData, type, extra = {}) {
  try {
    await addDoc(collection(db, 'activityLogs'), {
      type,
      userId: userData.uid,
      userName: userData.username ? `@${userData.username}` : (userData.name || ''),
      userUsername: userData.username || null,
      ...extra,
      createdAt: serverTimestamp(),
    });
  } catch { /* log hatası ana akışı engellemesin */ }
}

export async function updatePresence(userData, online = true) {
  if (!userData?.uid) return;
  try {
    await setDoc(doc(db, 'presence', userData.uid), {
      userId: userData.uid,
      userName: userData.username ? `@${userData.username}` : (userData.name || ''),
      userUsername: userData.username || null,
      photoURL: userData.photoURL || null,
      online,
      lastSeen: serverTimestamp(),
      page: window.location.pathname,
    }, { merge: true });
  } catch { /* noop */ }
}
