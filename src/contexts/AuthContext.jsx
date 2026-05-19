import { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  confirmPasswordReset,
  verifyPasswordResetCode,
  deleteUser,
  updateProfile,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, writeBatch, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

const AuthCtx = createContext(null);
const googleProvider = new GoogleAuthProvider();

export function useAuth() {
  return useContext(AuthCtx);
}

async function fetchOrCreateUserDoc(firebaseUser, extraData = {}) {
  const ref = doc(db, 'users', firebaseUser.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return snap.data();

  const name = extraData.name || firebaseUser.displayName || firebaseUser.email.split('@')[0];
  const userData = {
    uid: firebaseUser.uid,
    name,
    username: extraData.username || null,
    email: firebaseUser.email,
    avatar: firebaseUser.photoURL || name[0].toUpperCase(),
    role: 'user',
    active: true,
    createdAt: serverTimestamp(),
  };
  await setDoc(ref, userData);
  return userData;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = loading

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) { setUser(null); return; }
      const userData = await fetchOrCreateUserDoc(firebaseUser);
      setUser({ ...userData, uid: firebaseUser.uid });
    });
    return unsub;
  }, []);

  const loginWithEmail = async (identifier, password) => {
    let email = identifier;
    if (!identifier.includes('@')) {
      // Kullanıcı adıyla giriş: usernames koleksiyonundan e-postayı bul
      const usernameRef = doc(db, 'usernames', identifier.toLowerCase().trim());
      const usernameSnap = await getDoc(usernameRef);
      if (!usernameSnap.exists()) {
        const err = new Error('Kullanıcı bulunamadı.');
        err.code = 'auth/user-not-found';
        throw err;
      }
      email = usernameSnap.data().email;
    }
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const userData = await fetchOrCreateUserDoc(cred.user);
    setUser({ ...userData, uid: cred.user.uid });
  };

  const register = async (name, username, email, password) => {
    const usernameKey = username.toLowerCase().trim();
    // "admin" ile başlayan kullanıcı adları yasak
    if (usernameKey.startsWith('admin')) {
      const err = new Error('Bu kullanıcı adı kullanılamaz.');
      err.code = 'username-reserved';
      throw err;
    }
    // Kullanıcı adı müsait mi kontrol et
    const usernameRef = doc(db, 'usernames', usernameKey);
    const usernameSnap = await getDoc(usernameRef);
    if (usernameSnap.exists()) {
      const err = new Error('Bu kullanıcı adı zaten alınmış.');
      err.code = 'username-taken';
      throw err;
    }
    // Firebase Auth kullanıcısı oluştur
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    // users ve usernames belgelerini batch ile yaz
    const userData = {
      uid: cred.user.uid,
      name,
      username: usernameKey,
      email,
      avatar: name[0].toUpperCase(),
      role: 'user',
      active: true,
      createdAt: serverTimestamp(),
    };
    const batch = writeBatch(db);
    batch.set(doc(db, 'users', cred.user.uid), userData);
    batch.set(usernameRef, { uid: cred.user.uid, email });
    await batch.commit();
    setUser({ ...userData, uid: cred.user.uid });
  };

  const checkUsername = async (username) => {
    if (!username || username.length < 3) return null;
    const key = username.toLowerCase().trim();
    if (key.startsWith('admin')) return false;
    const snap = await getDoc(doc(db, 'usernames', key));
    return !snap.exists(); // true = müsait
  };

  const deleteAccount = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    const batch = writeBatch(db);
    batch.delete(doc(db, 'users', currentUser.uid));
    if (user?.username) batch.delete(doc(db, 'usernames', user.username));
    await batch.commit();
    await deleteUser(currentUser);
    setUser(null);
  };

  const loginWithGoogle = async () => {
    const cred = await signInWithPopup(auth, googleProvider);
    const userData = await fetchOrCreateUserDoc(cred.user);
    setUser({ ...userData, uid: cred.user.uid });
  };

  const logout = () => signOut(auth).then(() => setUser(null));

  const resetPassword = (email) => sendPasswordResetEmail(auth, email, {
    url: window.location.origin,
  });

  const verifyResetCode = (oobCode) => verifyPasswordResetCode(auth, oobCode);
  const confirmReset = (oobCode, newPassword) => confirmPasswordReset(auth, oobCode, newPassword);

  const updateProfilePhoto = async (dataUrl) => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Oturum açık değil.');
    await updateDoc(doc(db, 'users', currentUser.uid), { photoURL: dataUrl });
    setUser((prev) => ({ ...prev, photoURL: dataUrl }));
  };

  const deleteProfilePhoto = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Oturum açık değil.');
    await updateDoc(doc(db, 'users', currentUser.uid), { photoURL: null });
    setUser((prev) => ({ ...prev, photoURL: null }));
  };

  const reauthenticate = async (password) => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Oturum açık değil.');
    const credential = EmailAuthProvider.credential(currentUser.email, password);
    await reauthenticateWithCredential(currentUser, credential);
  };

  const isAdmin = user?.role === 'admin';
  const isMod = user?.role === 'moderator' || user?.role === 'admin';
  const loading = user === undefined;

  return (
    <AuthCtx.Provider value={{ user, loading, loginWithEmail, register, loginWithGoogle, logout, resetPassword, verifyResetCode, confirmReset, checkUsername, deleteAccount, reauthenticate, updateProfilePhoto, deleteProfilePhoto, isAdmin, isMod }}>
      {children}
    </AuthCtx.Provider>
  );
}
