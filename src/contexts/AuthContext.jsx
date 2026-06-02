import { createContext, useContext, useState, useEffect, useRef } from 'react';
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
  reauthenticateWithPopup,
  EmailAuthProvider,
  sendEmailVerification,
} from 'firebase/auth';
import {
  doc, getDoc, setDoc, updateDoc, writeBatch, deleteDoc,
  serverTimestamp, collection, query, where, getDocs, onSnapshot,
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { uploadDataURL, deleteImageByUrl } from '@/lib/storage';
import { containsProfanity } from '@/utils/profanity';
import { writeActivityLog, updatePresence } from '@/lib/activityLog';

// 10 dakika hareketsizlik → otomatik çıkış
const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000;
// localStorage'a yazılan son aktivite anahtarı (tüm sekmeler paylaşır)
const LAST_ACTIVITY_KEY = 'muadilci_last_activity';
// BroadcastChannel mesaj tipi
const ACTIVITY_MSG = 'user_activity';

const RESERVED_WORDS = [
  'admin', 'mod', 'moderator', 'moderatör', 'muadilci',
  'support', 'destek', 'official', 'resmi', 'sistem',
  'yonetim', 'yönetim', 'staff', 'ekip', 'team', 'root', 'superuser',
];
const USERNAME_RE = /^[a-z0-9_\-]{3,20}$/;

function isReservedUsername(key) {
  return RESERVED_WORDS.some((w) => key.includes(w));
}

function isInvalidUsername(key) {
  return isReservedUsername(key) || containsProfanity(key);
}

const AuthCtx = createContext(null);
const googleProvider = new GoogleAuthProvider();

export function useAuth() {
  return useContext(AuthCtx);
}

function syncPublicProfile(uid, data) {
  // Hata olsa bile ana akışı engellemesin
  setDoc(doc(db, 'publicProfiles', uid), data, { merge: true }).catch(() => {});
}

async function fetchOrCreateUserDoc(firebaseUser, extraData = {}) {
  const ref = doc(db, 'users', firebaseUser.uid);
  const snap = await getDoc(ref);
  // Hesap admin tarafından silinmişse oturumu kapat
  if (snap.exists() && snap.data().deleted) {
    await signOut(auth);
    return null;
  }
  if (snap.exists()) {
    const d = snap.data();
    // Mevcut kullanıcı için publicProfiles'ı güncel tut
    syncPublicProfile(firebaseUser.uid, { uid: firebaseUser.uid, name: d.name, username: d.username || null, photoURL: d.photoURL || null, role: d.role || 'user' });
    return d;
  }

  const name = extraData.name || firebaseUser.displayName || firebaseUser.email.split('@')[0];
  const userData = {
    uid: firebaseUser.uid,
    name,
    username: extraData.username || null,
    email: firebaseUser.email,
    avatar: firebaseUser.photoURL || name[0].toUpperCase(),
    photoURL: firebaseUser.photoURL || null,
    role: 'user',
    active: true,
    createdAt: serverTimestamp(),
  };
  await setDoc(ref, userData);
  syncPublicProfile(firebaseUser.uid, { uid: firebaseUser.uid, name, username: userData.username, photoURL: userData.photoURL, role: 'user' });
  return userData;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = loading
  // Kullanıcı kendi hesabını silerken otomatik-çıkış listener'ını sustur
  const selfDeletingRef = useRef(false);
  // İnaktivite timer ref'i
  const inactivityTimerRef = useRef(null);
  // BroadcastChannel: sekmeler arası aktivite senkronizasyonu
  const channelRef = useRef(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) { setUser(null); return; }
      // Token'ı tazele: kullanıcı başka sekmede/cihazda doğruladıysa
      // emailVerified güncel değeri ancak reload sonrası okunabilir
      try { await firebaseUser.reload(); } catch { /* offline vb. */ }
      const fresh = auth.currentUser || firebaseUser;
      const userData = await fetchOrCreateUserDoc(fresh);
      if (!userData) { setUser(null); return; } // deleted hesap → çıkış yapıldı
      const provider = fresh.providerData[0]?.providerId || 'password';
      // Yeni sekme veya sayfa yenilemesinde inaktivite sayacını sıfırla.
      // Yoksa kullanıcı başka bir browser sekmesinde 10+ dk geçirirse bu sekme
      // eski timestamp'i görüp tüm sekmeleri otomatik logout eder.
      localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
      setUser({
        ...userData,
        uid: fresh.uid,
        emailVerified: fresh.emailVerified || provider === 'google.com',
        provider,
      });
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
    const provider = cred.user.providerData[0]?.providerId || 'password';
    localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
    const u = { ...userData, uid: cred.user.uid };
    writeActivityLog(u, 'login', { method: 'email' });
    updatePresence(u, true);
    setUser({ ...u, emailVerified: cred.user.emailVerified || provider === 'google.com', provider });
  };

  const register = async (name, username, email, password) => {
    const usernameKey = username.toLowerCase().trim();
    // Rezerve / küfürlü kullanıcı adları yasak
    if (isInvalidUsername(usernameKey)) {
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
    // users ve usernames belgelerini batch ile yaz (mail göndermeden ÖNCE,
    // mail hatası kaydı yarıda bırakmasın)
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
    syncPublicProfile(cred.user.uid, { uid: cred.user.uid, name, username: usernameKey, photoURL: null, role: 'user' });
    // Doğrulama maili gönder — hata olsa bile kayıt tamamlanmış olur,
    // kullanıcı doğrulama sayfasından "tekrar gönder" diyebilir
    try {
      await sendEmailVerification(cred.user);
    } catch (mailErr) {
      console.error('[register] Doğrulama maili gönderilemedi:', mailErr?.code, mailErr?.message);
    }
    setUser({ ...userData, uid: cred.user.uid });
  };

  const checkUsername = async (username) => {
    if (!username || username.length < 3) return null;
    const key = username.toLowerCase().trim();
    if (!USERNAME_RE.test(key) || isInvalidUsername(key)) return false;
    const snap = await getDoc(doc(db, 'usernames', key));
    return !snap.exists(); // true = müsait
  };

  const updateUsername = async (newUsername) => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Oturum açık değil.');
    const newKey = newUsername.toLowerCase().trim();
    if (!USERNAME_RE.test(newKey)) {
      const err = new Error('Geçersiz kullanıcı adı.');
      err.code = 'username-invalid';
      throw err;
    }
    if (isInvalidUsername(newKey)) {
      const err = new Error('Bu kullanıcı adı kullanılamaz.');
      err.code = 'username-reserved';
      throw err;
    }
    const oldKey = user?.username;
    if (oldKey === newKey) return;
    // Müsaitlik kontrolü
    const snap = await getDoc(doc(db, 'usernames', newKey));
    if (snap.exists()) {
      const err = new Error('Bu kullanıcı adı zaten alınmış.');
      err.code = 'username-taken';
      throw err;
    }
    // users + usernames batch güncelle
    const batch = writeBatch(db);
    batch.update(doc(db, 'users', currentUser.uid), { username: newKey });
    if (oldKey) batch.delete(doc(db, 'usernames', oldKey));
    batch.set(doc(db, 'usernames', newKey), { uid: currentUser.uid, email: currentUser.email });
    await batch.commit();
    // Bu kullanıcıya ait tüm yorumların userName alanını güncelle
    const newUserName = user?.role === 'moderator' ? '@moderatör' : `@${newKey}`;
    const reviewsSnap = await getDocs(
      query(collection(db, 'reviews'), where('userId', '==', currentUser.uid))
    );
    if (!reviewsSnap.empty) {
      const rb = writeBatch(db);
      reviewsSnap.docs.forEach((d) => rb.update(d.ref, { userName: newUserName }));
      await rb.commit();
    }
    syncPublicProfile(currentUser.uid, { username: newKey });
    setUser((prev) => ({ ...prev, username: newKey }));
  };

  const deleteAccount = async (password) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    selfDeletingRef.current = true; // otomatik-çıkış listener'ı karışmasın
    try {
      // 0. Güvenlik: silmeden önce kimlik doğrula (auth/requires-recent-login'i önler)
      const provider = currentUser.providerData[0]?.providerId;
      if (provider === 'google.com') {
        await reauthenticateWithPopup(currentUser, googleProvider);
      } else if (password) {
        const credential = EmailAuthProvider.credential(currentUser.email, password);
        await reauthenticateWithCredential(currentUser, credential);
      }

      // 1. Kullanıcının yorumlarını anonimleştir (yorumlar sitede kalır)
      const reviewsSnap = await getDocs(
        query(collection(db, 'reviews'), where('userId', '==', currentUser.uid))
      );
      const anonymize = {
        userName: 'Silinmiş Kullanıcı',
        userPhotoURL: null,
        userAvatar: '?',
        userId: 'deleted',
        userRole: 'user',
      };
      const reviewDocs = reviewsSnap.docs;
      for (let i = 0; i < reviewDocs.length; i += 490) {
        const chunk = reviewDocs.slice(i, i + 490);
        const b = writeBatch(db);
        chunk.forEach((d) => b.update(d.ref, anonymize));
        await b.commit();
      }

      // 2. users + usernames belgelerini sil (kullanıcı adı tekrar alınabilir olur)
      const batch = writeBatch(db);
      batch.delete(doc(db, 'users', currentUser.uid));
      if (user?.username) batch.delete(doc(db, 'usernames', user.username));
      await batch.commit();

      // 3. Firebase Auth hesabını sil (en son — kimlik gerektiren işlemler bitti)
      await deleteUser(currentUser);
      setUser(null);
    } finally {
      selfDeletingRef.current = false;
    }
  };

  const loginWithGoogle = async () => {
    const cred = await signInWithPopup(auth, googleProvider);
    const userData = await fetchOrCreateUserDoc(cred.user);
    if (!userData) { setUser(null); return; }
    localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
    const u = { ...userData, uid: cred.user.uid };
    writeActivityLog(u, 'login', { method: 'google' });
    updatePresence(u, true);
    setUser({ ...u, emailVerified: true, provider: 'google.com' });
  };

  // E-posta doğrulama maili gönder
  const sendVerificationEmail = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    await sendEmailVerification(currentUser);
  };

  // Firebase'den güncel emailVerified durumunu çek
  const reloadUser = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return false;
    await currentUser.reload();
    const verified = auth.currentUser.emailVerified;
    if (verified) {
      setUser((prev) => ({ ...prev, emailVerified: true }));
    }
    return verified;
  };

  // ── İnaktivite yönetimi ─────────────────────────────────────────────────────
  const resetInactivityTimer = () => {
    clearTimeout(inactivityTimerRef.current);
    localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
    inactivityTimerRef.current = setTimeout(() => {
      signOut(auth).then(() => setUser(null));
    }, INACTIVITY_TIMEOUT_MS);
  };

  // Kullanıcı giriş yaptığında / state değiştiğinde inaktivite dinleyicilerini kur
  useEffect(() => {
    if (!user) {
      // Giriş yoksa timer ve dinleyicileri temizle
      clearTimeout(inactivityTimerRef.current);
      if (channelRef.current) { channelRef.current.close(); channelRef.current = null; }
      return;
    }

    // BroadcastChannel: diğer sekmelerden gelen aktivite mesajlarını al
    try {
      channelRef.current = new BroadcastChannel('muadilci_activity');
      channelRef.current.onmessage = (e) => {
        if (e.data === ACTIVITY_MSG) resetInactivityTimer();
      };
    } catch { /* BroadcastChannel desteklenmiyor */ }

    // Sayfa yüklendiğinde mevcut son aktiviteye göre kalan süreyi hesapla
    const stored = localStorage.getItem(LAST_ACTIVITY_KEY);
    if (!stored) {
      // İlk giriş veya temizlenmiş — şimdiden başlat
      localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
    }
    const lastActivity = stored ? parseInt(stored, 10) : Date.now();
    const elapsed = Date.now() - lastActivity;
    if (elapsed >= INACTIVITY_TIMEOUT_MS) {
      // Zaten süre dolmuş → hemen çıkış
      signOut(auth).then(() => setUser(null));
      return;
    }
    // Kalan süre kadar timer kur
    clearTimeout(inactivityTimerRef.current);
    inactivityTimerRef.current = setTimeout(() => {
      signOut(auth).then(() => setUser(null));
    }, INACTIVITY_TIMEOUT_MS - elapsed);

    // DOM aktivite olayları
    const handleActivity = () => {
      resetInactivityTimer();
      // Diğer sekmelere bildir
      try { channelRef.current?.postMessage(ACTIVITY_MSG); } catch { /* noop */ }
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    events.forEach((ev) => window.addEventListener(ev, handleActivity, { passive: true }));

    return () => {
      clearTimeout(inactivityTimerRef.current);
      events.forEach((ev) => window.removeEventListener(ev, handleActivity));
      if (channelRef.current) { channelRef.current.close(); channelRef.current = null; }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);
  // ────────────────────────────────────────────────────────────────────────────

  const logout = () => {
    if (user) {
      writeActivityLog(user, 'logout');
      updatePresence(user, false);
    }
    return signOut(auth).then(() => setUser(null));
  };

  const resetPassword = (email) => sendPasswordResetEmail(auth, email, {
    url: window.location.origin,
  });

  const verifyResetCode = (oobCode) => verifyPasswordResetCode(auth, oobCode);
  const confirmReset = (oobCode, newPassword) => confirmPasswordReset(auth, oobCode, newPassword);

  const updateProfilePhoto = async (dataUrl) => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Oturum açık değil.');
    // Görseli Storage'a yükle, yalnızca URL'yi Firestore'da sakla
    const url = await uploadDataURL(dataUrl, `users/${currentUser.uid}`);
    const oldUrl = user?.photoURL;
    await updateDoc(doc(db, 'users', currentUser.uid), { photoURL: url });
    syncPublicProfile(currentUser.uid, { photoURL: url });
    setUser((prev) => ({ ...prev, photoURL: url }));
    // Eski fotoğrafı Storage'dan temizle (best-effort)
    if (oldUrl && oldUrl !== url) deleteImageByUrl(oldUrl);
  };

  const deleteProfilePhoto = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Oturum açık değil.');
    const oldUrl = user?.photoURL;
    await updateDoc(doc(db, 'users', currentUser.uid), { photoURL: null });
    syncPublicProfile(currentUser.uid, { photoURL: null });
    setUser((prev) => ({ ...prev, photoURL: null }));
    if (oldUrl) deleteImageByUrl(oldUrl);
  };

  const reauthenticate = async (password) => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Oturum açık değil.');
    const credential = EmailAuthProvider.credential(currentUser.email, password);
    await reauthenticateWithCredential(currentUser, credential);
  };

  // Oturum açık kullanıcının belgesi silinirse / deleted:true olursa anında çıkış yaptır
  useEffect(() => {
    if (!user?.uid) return;
    const ref = doc(db, 'users', user.uid);
    const unsub = onSnapshot(ref, async (snap) => {
      if (selfDeletingRef.current) return; // kendi hesabını silme akışı sürüyor → karışma
      if (!snap.exists() || snap.data().deleted) {
        await signOut(auth);
        setUser(null);
      }
    });
    return () => unsub();
  }, [user?.uid]);

  // Presence heartbeat — 60 sn'de bir lastSeen güncelle
  useEffect(() => {
    if (!user) return;
    updatePresence(user, true);
    const id = setInterval(() => updatePresence(user, true), 60_000);
    const handleUnload = () => updatePresence(user, false);
    window.addEventListener('beforeunload', handleUnload);
    return () => {
      clearInterval(id);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [user?.uid]);

  const isAdmin = user?.role === 'admin';
  const isMod = user?.role === 'moderator' || user?.role === 'admin';
  const loading = user === undefined;

  return (
    <AuthCtx.Provider value={{ user, loading, loginWithEmail, register, loginWithGoogle, logout, resetPassword, verifyResetCode, confirmReset, checkUsername, updateUsername, deleteAccount, reauthenticate, updateProfilePhoto, deleteProfilePhoto, sendVerificationEmail, reloadUser, isAdmin, isMod }}>
      {children}
    </AuthCtx.Provider>
  );
}
