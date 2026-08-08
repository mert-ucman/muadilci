import { initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);

// ── App Check (bot / otomasyon / maliyet saldırısı koruması) ─────────────────
// Her isteğe "bu gerçekten bizim sitemizden geliyor" kanıtı (reCAPTCHA v3 token)
// ekler. Firestore, Storage ve callable fonksiyonlar App Check zorunlu kılındığında
// bu token olmadan gelen doğrudan SDK / script isteklerini reddeder.
// Diğer servislerden (auth, db...) ÖNCE başlatılır ki ilk istekler de token taşısın.
if (import.meta.env.DEV) {
  // Yerel geliştirmede gerçek reCAPTCHA yerine debug token kullanılır. İlk çalıştırmada
  // konsola basılan token'ı Firebase Console → App Check → Apps → Debug tokens'a ekle.
  // Alternatif: sabit bir token'ı VITE_FIREBASE_APPCHECK_DEBUG_TOKEN ile ver.
  self.FIREBASE_APPCHECK_DEBUG_TOKEN =
    import.meta.env.VITE_FIREBASE_APPCHECK_DEBUG_TOKEN || true;
}

const appCheckSiteKey = import.meta.env.VITE_FIREBASE_APPCHECK_SITE_KEY;
if (appCheckSiteKey) {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(appCheckSiteKey),
    isTokenAutoRefreshEnabled: true,
  });
} else if (import.meta.env.PROD) {
  // Anahtar yoksa App Check sessizce devre dışı kalır; prod build'de uyarı ver.
  console.warn('[App Check] VITE_FIREBASE_APPCHECK_SITE_KEY tanımlı değil — App Check devre dışı.');
}

export const auth = getAuth(app);
// Oturum localStorage'da saklanır — yeni sekmelerde de aktif kalır
// (10 dk hareketsizlik uyarısı AuthContext üzerinden yönetilir)
setPersistence(auth, browserLocalPersistence);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);
