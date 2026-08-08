const { onDocumentUpdated, onDocumentCreated, onDocumentWritten } = require('firebase-functions/v2/firestore');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { setGlobalOptions } = require('firebase-functions/v2');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');
const crypto = require('crypto');
const zlib = require('zlib');
const { validateReviewText } = require('./reviewValidation');

admin.initializeApp();

// ── Maliyet tavanı ───────────────────────────────────────────────────────────
// Tüm fonksiyonların aynı anda çalışabilecek örnek (instance) sayısını sınırlar.
// Bir istek seli / maliyet DoS'unda fonksiyonlar sonsuza kadar ölçeklenip fatura
// patlatamaz; bu sayının üstündeki eşzamanlı istekler kuyruğa alınır.
setGlobalOptions({ maxInstances: 10 });

// IP hash'lemede kullanılacak sunucu sırrı (raw IP asla saklanmaz).
// Deploy öncesi: firebase functions:secrets:set IP_HASH_SALT
const IP_HASH_SALT = defineSecret('IP_HASH_SALT');

// Web API anahtarı — kullanıcı adıyla giriş (resolveLoginEmail) içinde parola
// doğrulamak için Identity Toolkit REST'e gönderilir. Web API key zaten public'tir
// (client config'te de var) ama tek yerden yönetmek için secret olarak tutulur.
// Deploy öncesi: firebase functions:secrets:set WEB_API_KEY
const WEB_API_KEY = defineSecret('WEB_API_KEY');

/**
 * Firestore'da users/{uid} belgesi güncellenip deleted:true olduğunda
 * Firebase Authentication hesabını otomatik siler.
 */
/**
 * users/{uid} belgesi oluşturulduğunda veya role alanı değiştiğinde Firebase Auth
 * custom claim'lerini günceller. Bu claim'ler storage.rules içindeki isAdmin()
 * fonksiyonu tarafından kullanılır: request.auth.token.admin == true
 *
 * Yeni kullanıcı oluşturulunca da tetiklenir (create) çünkü admin bir kullanıcıya
 * doğrudan admin rolü atayabilir.
 */
exports.syncRoleClaims = onDocumentUpdated('users/{uid}', async (event) => {
  const before = event.data.before.data();
  const after  = event.data.after.data();

  // role değişmediyse çık
  if (before.role === after.role) return;

  const uid = event.params.uid;
  const claims = {
    admin:     after.role === 'admin',
    moderator: after.role === 'moderator' || after.role === 'admin',
  };

  try {
    await admin.auth().setCustomUserClaims(uid, claims);
    console.log(`✓ Custom claims güncellendi: ${uid} → admin=${claims.admin}, moderator=${claims.moderator}`);
  } catch (e) {
    console.error(`✗ Custom claims hatası (${uid}):`, e);
    throw e;
  }
});

/**
 * Yeni kullanıcı belgesi oluşturulduğunda başlangıç claim'lerini set eder.
 * Kullanıcılar varsayılan olarak 'user' rolüyle oluşturulduğundan admin=false set edilir.
 */
exports.initRoleClaims = onDocumentCreated('users/{uid}', async (event) => {
  const data = event.data.data();
  const uid  = event.params.uid;
  const claims = {
    admin:     data?.role === 'admin',
    moderator: data?.role === 'moderator' || data?.role === 'admin',
  };

  try {
    await admin.auth().setCustomUserClaims(uid, claims);
    console.log(`✓ Başlangıç custom claims set edildi: ${uid} → admin=${claims.admin}, moderator=${claims.moderator}`);
  } catch (e) {
    console.error(`✗ Başlangıç custom claims hatası (${uid}):`, e);
  }
});

exports.deleteAuthOnUserDeleted = onDocumentUpdated('users/{uid}', async (event) => {
  const before = event.data.before.data();
  const after  = event.data.after.data();

  // Sadece deleted bayrağı false → true geçişinde tetikle
  if (before.deleted || !after.deleted) return;

  const uid = event.params.uid;

  // 1. Firebase Auth hesabını sil
  try {
    await admin.auth().deleteUser(uid);
    console.log(`✓ Auth hesabı silindi: ${uid} (${after.email ?? ''})`);
  } catch (e) {
    if (e.code === 'auth/user-not-found') {
      console.log(`— Auth hesabı zaten mevcut değildi: ${uid}`);
    } else {
      console.error(`✗ Auth silme hatası (${uid}):`, e);
      throw e;
    }
  }

  // 2. Firestore users belgesini tamamen sil
  try {
    await admin.firestore().collection('users').doc(uid).delete();
    console.log(`✓ Firestore users belgesi silindi: ${uid}`);
  } catch (e) {
    console.error(`✗ Firestore belge silme hatası (${uid}):`, e);
    throw e;
  }
});

// ════════════════════════════════════════════════════════════════════════════
//  Doğrulanmamış hesap temizliği — kayıttan 24 saat sonra hâlâ e-postasını
//  doğrulamamış kullanıcıları siler (Auth + Firestore users/usernames).
//  Aksi halde kullanıcı adı sonsuza dek rezerve kalır ve gerçek kullanıcılar
//  o adı hiç alamaz.
// ════════════════════════════════════════════════════════════════════════════

const UNVERIFIED_TTL_MS = 24 * 60 * 60 * 1000;

exports.cleanupUnverifiedUsers = onSchedule(
  { schedule: 'every 60 minutes', region: 'us-central1', timeZone: 'Europe/Istanbul' },
  async () => {
    const db = admin.firestore();
    const cutoffMs = Date.now() - UNVERIFIED_TTL_MS;
    let deletedCount = 0;
    let pageToken;

    do {
      const page = await admin.auth().listUsers(1000, pageToken);
      pageToken = page.pageToken;

      const targets = page.users.filter((u) => {
        if (u.emailVerified) return false;
        // Google hesapları Firebase tarafından zaten doğrulanmış sayılır — ek güvence
        if (u.providerData.some((p) => p.providerId === 'google.com')) return false;
        return new Date(u.metadata.creationTime).getTime() < cutoffMs;
      });

      for (const authUser of targets) {
        const uid = authUser.uid;
        try {
          const userSnap = await db.collection('users').doc(uid).get();
          const userData = userSnap.exists ? userSnap.data() : null;
          // Admin/moderatör hesapları yanlışlıkla doğrulanmamış görünse bile dokunma
          if (userData && (userData.role === 'admin' || userData.role === 'moderator')) continue;

          const batch = db.batch();
          batch.delete(db.collection('users').doc(uid));
          if (userData?.username) batch.delete(db.collection('usernames').doc(userData.username));
          await batch.commit();

          await admin.auth().deleteUser(uid);
          deletedCount++;
          console.log(`✓ Doğrulanmamış hesap silindi (24s+): ${uid} (${authUser.email ?? ''})`);
        } catch (e) {
          console.error(`✗ Doğrulanmamış hesap silinemedi (${uid}):`, e);
        }
      }
    } while (pageToken);

    console.log(`Doğrulanmamış hesap temizliği tamamlandı: ${deletedCount} hesap silindi.`);
  },
);

// ════════════════════════════════════════════════════════════════════════════
//  Kullanıcı adıyla giriş — admin/moderatör e-postasını sızdırmadan çözüm
//  ----------------------------------------------------------------------------
//  Admin/mod hesaplarının e-postası /usernames belgelerinde TUTULMAZ ve bu
//  belgeler client'tan okunamaz (bkz. firestore.rules → PII gizliliği). Bu yüzden
//  bu hesaplar kullanıcı adıyla giriş yapamıyordu. Bu callable çözümü sunucuda
//  yapar; ancak e-postayı yalnızca DOĞRU PAROLA girildiğinde döndürür — böylece
//  "kullanıcı adı ver, e-postayı al" şeklinde bir e-posta hasadı oracle'ı olmaz.
//  Asıl oturum (ve MFA/TOTP akışı) client tarafında normal şekilde tamamlanır.
// ════════════════════════════════════════════════════════════════════════════

// Identity Toolkit REST ile parolayı doğrula. Admin SDK parola doğrulayamadığı
// için signInWithPassword endpoint'i kullanılır. MFA kuruluysa bu çağrı idToken
// yerine mfaPendingCredential döndürür (yine HTTP 200) — her iki durumda da parola
// doğrudur. Yanlış parola 400 döner.
async function verifyPassword(apiKey, email, password) {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: false }),
    },
  );
  if (res.ok) return 'ok';                       // idToken veya mfaPendingCredential → parola doğru
  let code = '';
  try { code = (await res.json())?.error?.message || ''; } catch { /* gövde yok */ }
  if (code.startsWith('TOO_MANY_ATTEMPTS')) return 'too-many';
  return 'bad';                                  // INVALID_LOGIN_CREDENTIALS / INVALID_PASSWORD / EMAIL_NOT_FOUND
}

exports.resolveLoginEmail = onCall({ secrets: [WEB_API_KEY], region: 'us-central1', enforceAppCheck: true }, async (request) => {
  const username = String(request.data?.username ?? '').toLowerCase().trim();
  const password = String(request.data?.password ?? '');
  if (!username || !password) {
    throw new HttpsError('invalid-argument', 'Kullanıcı adı ve şifre gerekli.');
  }

  const db = admin.firestore();

  // 1) Kullanıcı adı → uid. Önce /usernames, sonra /users.username yedeği.
  let uid = null;
  const unameSnap = await db.collection('usernames').doc(username).get();
  if (unameSnap.exists) uid = unameSnap.data().uid || null;
  if (!uid) {
    const q = await db.collection('users').where('username', '==', username).limit(1).get();
    if (!q.empty) uid = q.docs[0].id;
  }
  if (!uid) throw new HttpsError('not-found', 'Kullanıcı bulunamadı.');

  // 2) uid → e-posta (Admin SDK rules'ı baypas eder)
  const userSnap = await db.collection('users').doc(uid).get();
  if (!userSnap.exists) throw new HttpsError('not-found', 'Kullanıcı bulunamadı.');
  const u = userSnap.data();
  if (u.deleted) throw new HttpsError('permission-denied', 'Hesap pasif durumda.');
  const email = u.email;
  if (!email) throw new HttpsError('failed-precondition', 'Bu hesap için e-posta tanımlı değil.');

  // 3) Parolayı doğrula — doğru parola olmadan e-posta ASLA dönmez (oracle önleme)
  const verdict = await verifyPassword(WEB_API_KEY.value(), email, password);
  if (verdict === 'too-many') {
    throw new HttpsError('resource-exhausted', 'Çok fazla deneme yapıldı. Lütfen bir süre sonra tekrar deneyin.');
  }
  if (verdict !== 'ok') {
    throw new HttpsError('permission-denied', 'E-posta/kullanıcı adı veya şifre hatalı.');
  }

  return { email };
});

// ════════════════════════════════════════════════════════════════════════════
//  Yorum gönderimi — spam/sahte hesap korumalı sunucu tarafı akışı
//  Client doğrudan reviews'a yazamaz (bkz. firestore.rules); tüm yorumlar bu
//  callable üzerinden, Admin SDK ile oluşturulur. Üç katman:
//   1) Yeni hesaplara ilk 24 saat yorum yasağı (Auth createTime — kurcalanamaz)
//   2) IP bazlı hız limiti (hash'li IP + günlük salt, atomik transaction)
//   3) Çok kısa / düşük eforlu yorum reddi (reviewValidation.js)
// ════════════════════════════════════════════════════════════════════════════

const NEW_ACCOUNT_BLOCK_MS = 0;   // yeni hesap bekleme süresi kaldırıldı

// IP bazlı (1 saatlik pencere)
const IP_WINDOW_MS         = 60 * 60 * 1000;
const IP_SOFT_REVIEWS      = 5;    // bu sayıyı aşınca → pending + abuse işareti
const IP_HARD_REVIEWS      = 20;   // bu sayıyı aşınca → tamamen reddet
const IP_SOFT_ACCOUNTS     = 3;    // aynı IP'den farklı hesap sayısı → işaret
const IP_UID_CAP           = 25;   // doc şişmesin diye saklanan uid tavanı

// Kullanıcı bazlı (10 dakikalık pencere) — farklı muadillere hızlı yorum
const USER_WINDOW_MS       = 10 * 60 * 1000;
const USER_SOFT_REVIEWS    = 5;
const USER_HARD_REVIEWS    = 12;

// Mevsim / kullanım ortamı geçerli anahtarları (client'tan gelen değerler bunlarla sınırlanır)
const SEASON_KEYS = ['yaz', 'kis', 'ilkbahar', 'sonbahar', 'dortMevsim'];
const OCCASION_KEYS = ['ofis', 'date', 'gunluk', 'gunduz', 'gece', 'deniz', 'tumu'];
const sanitizeKeys = (arr, allowed) =>
  Array.isArray(arr) ? [...new Set(arr.filter((x) => allowed.includes(x)))] : [];

const clampRating = (v) => {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return 5;
  return Math.min(10, Math.max(1, n));
};

// Raw IP yerine HMAC-SHA256(salt + günlük tarih, ip) saklanır → geri döndürülemez,
// günlük salt rotasyonu ile uzun süreli takip de engellenir.
function hashIp(ip, salt) {
  const day = new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
  return crypto.createHmac('sha256', `${salt}:${day}`).update(ip || 'unknown').digest('hex').slice(0, 32);
}

exports.submitReview = onCall({ secrets: [IP_HASH_SALT], region: 'us-central1', enforceAppCheck: true }, async (request) => {
  const { auth, data, rawRequest } = request;

  // ── Kimlik ─────────────────────────────────────────────────────────────────
  if (!auth) throw new HttpsError('unauthenticated', 'Yorum yapmak için giriş yapmalısınız.');
  const uid = auth.uid;

  const muadilId = String(data?.muadilId ?? '').trim();
  if (!muadilId) throw new HttpsError('invalid-argument', 'Geçersiz muadil.');

  const db = admin.firestore();

  // ── Kullanıcı belgesi & rol (rol client'tan ASLA alınmaz) ──────────────────
  const userSnap = await db.collection('users').doc(uid).get();
  if (!userSnap.exists) throw new HttpsError('failed-precondition', 'Kullanıcı profili bulunamadı.');
  const userData = userSnap.data();
  if (userData.deleted) throw new HttpsError('permission-denied', 'Hesabınız pasif durumda.');
  const role = userData.role === 'admin' || userData.role === 'moderator' ? userData.role : 'user';
  const isStaff = role === 'admin' || role === 'moderator';

  // ── E-posta doğrulaması (admin muaf — eski kurallarla aynı) ─────────────────
  if (role !== 'admin' && auth.token.email_verified !== true) {
    throw new HttpsError('failed-precondition', 'Yorum yapabilmek için e-posta adresinizi doğrulamalısınız.');
  }

  // ── 1) Yeni hesap 24 saat yasağı (Auth createTime — kurcalanamaz) ──────────
  if (!isStaff) {
    let createdMs = 0;
    try {
      const authUser = await admin.auth().getUser(uid);
      createdMs = new Date(authUser.metadata.creationTime).getTime();
    } catch {
      // Auth'tan okunamazsa Firestore createdAt'e düş (yine de kurcalama rules ile engelli)
      createdMs = userData.createdAt?.toMillis?.() ?? 0;
    }
    if (createdMs && Date.now() - createdMs < NEW_ACCOUNT_BLOCK_MS) {
      throw new HttpsError('failed-precondition', 'Spam koruması nedeniyle yeni hesaplar ilk 24 saat yorum yapamaz.');
    }
  }

  // ── 3) Metin kalite kontrolü (sunucu tarafı kesin kapı) ────────────────────
  const text = String(data?.text ?? '');
  const v = validateReviewText(text);
  if (!v.ok) throw new HttpsError('invalid-argument', v.reason);

  // ── 2) IP + kullanıcı bazlı hız limiti (atomik transaction, race-safe) ─────
  const ip = (rawRequest?.ip || rawRequest?.headers?.['x-forwarded-for']?.split(',')[0] || '').trim();
  const ipHash = hashIp(ip, IP_HASH_SALT.value());
  const now = Date.now();

  const reviewId = `${uid}_${muadilId}`;
  const reviewRef = db.collection('reviews').doc(reviewId);
  const ipRef     = db.collection('rateLimits').doc(`ip_${ipHash}`);
  const userRef   = db.collection('rateLimits').doc(`user_${uid}`);
  const muadilRef = db.collection('muadils').doc(muadilId);

  // Güvenli, denormalize alanlar — hepsi sunucuda belirlenir
  const userName = role === 'moderator'
    ? '@moderatör'
    : (userData.username ? `@${userData.username}` : (userData.name || 'Kullanıcı'));

  const sanitized = {
    similarity: clampRating(data?.similarity),
    projection: clampRating(data?.projection),
    longevity:  clampRating(data?.longevity),
    text: text.trim(),
    recommend: data?.recommend === true ? true : data?.recommend === false ? false : null,
    // Kör alışa uygunluk: evet/hayır/belirtilmemiş
    blindBuy: data?.blindBuy === true ? true : data?.blindBuy === false ? false : null,
    // Yorum sahibi orijinal parfüme sahip mi? (orijinal parfüm bazında — bkz. ownedOriginals)
    ownsOriginal: data?.ownsOriginal === true ? true : data?.ownsOriginal === false ? false : null,
    // Çoklu seçim: hangi mevsim / kullanım ortamı için uygun (yalnızca geçerli anahtarlar)
    seasons: sanitizeKeys(data?.seasons, SEASON_KEYS),
    occasions: sanitizeKeys(data?.occasions, OCCASION_KEYS),
    originalImage: typeof data?.originalImage === 'string' ? data.originalImage : null,
    muadilImage:   typeof data?.muadilImage === 'string' ? data.muadilImage : null,
    imageConsent:  !!data?.imageConsent,
    targetPerfumeId: data?.targetPerfumeId != null ? String(data.targetPerfumeId) : null,
  };

  const result = await db.runTransaction(async (tx) => {
    const [ipSnap, userRlSnap, existingReview, muadilSnap] = await Promise.all([
      tx.get(ipRef), tx.get(userRef), tx.get(reviewRef), tx.get(muadilRef),
    ]);

    // IP penceresi
    const ipData = ipSnap.exists ? ipSnap.data() : null;
    const ipWindowOpen = ipData && (now - (ipData.windowStart ?? 0) < IP_WINDOW_MS);
    let ipCount = ipWindowOpen ? (ipData.count ?? 0) : 0;
    let ipUids  = ipWindowOpen ? (ipData.uids ?? []) : [];
    const isNewReview = !existingReview.exists; // var olan yorumun güncellenmesi limiti yemesin

    // Kullanıcı penceresi
    const urlData = userRlSnap.exists ? userRlSnap.data() : null;
    const userWindowOpen = urlData && (now - (urlData.windowStart ?? 0) < USER_WINDOW_MS);
    let userCount = userWindowOpen ? (urlData.count ?? 0) : 0;

    // Staff hız limitinden muaf; ayrıca güncellemeler sayaca eklenmez
    const countsAgainstLimit = !isStaff && isNewReview;

    if (countsAgainstLimit) {
      // ── HARD limit → tamamen reddet (sel önleme) ──
      if (ipCount + 1 > IP_HARD_REVIEWS || userCount + 1 > USER_HARD_REVIEWS) {
        throw new HttpsError('resource-exhausted', 'Çok sayıda işlem algılandı. Lütfen bir süre sonra tekrar deneyin.');
      }
    }

    // ── SOFT limit → pending + abuse işareti (banlama yerine moderasyon) ──
    const distinctAccounts = new Set([...ipUids, uid]).size;
    let abuseReason = null;
    if (countsAgainstLimit) {
      if (ipCount + 1 > IP_SOFT_REVIEWS)      abuseReason = 'Aynı IP adresinden kısa sürede çok sayıda yorum.';
      else if (distinctAccounts > IP_SOFT_ACCOUNTS) abuseReason = 'Aynı IP adresinden çok sayıda farklı hesap aktivitesi.';
      else if (userCount + 1 > USER_SOFT_REVIEWS)  abuseReason = 'Kullanıcı kısa sürede çok sayıda yorum gönderdi.';
    }

    const abuseFlag = !!abuseReason;
    // Moderatör ve admin yorumları otomatik onaylı (doğrudan yayınlanır); diğerleri pending.
    // Abuse işaretliyse staff bile pending'e düşürülür (gözden geçirme şart).
    const status = (isStaff && !abuseFlag) ? 'approved' : 'pending';

    // ── Yorum belgesini yaz (merge: var olanı güncellerken alanları koru) ──
    tx.set(reviewRef, {
      id: reviewId,
      muadilId,
      muadilPerfumeId: muadilId, // mevcut client alan adıyla uyum
      userId: uid,
      userName,
      userAvatar: userData.avatar ?? null,
      userPhotoURL: userData.photoURL ?? null,
      userRole: role,
      status,
      abuseFlag,
      abuseReason,
      ...sanitized,
      ...(isNewReview ? { createdAt: admin.firestore.FieldValue.serverTimestamp() } : { updatedAt: admin.firestore.FieldValue.serverTimestamp() }),
    }, { merge: true });

    // ── Muadil istatistikleri (Admin SDK ile — client yetkisi yok) ──
    if (isNewReview && muadilSnap.exists) {
      const m = muadilSnap.data();
      const n = (m.reviewCount ?? 0) + 1;
      tx.update(muadilRef, {
        reviewCount: n,
        avgSimilarity: ((m.avgSimilarity ?? 0) * (n - 1) + sanitized.similarity) / n,
        avgProjection: ((m.avgProjection ?? 0) * (n - 1) + sanitized.projection) / n,
        avgLongevity:  ((m.avgLongevity  ?? 0) * (n - 1) + sanitized.longevity)  / n,
      });
    }

    // ── Hız limiti sayaçlarını güncelle ──
    if (countsAgainstLimit) {
      if (!ipWindowOpen) { ipCount = 0; ipUids = []; }
      const newUids = ipUids.includes(uid) ? ipUids : [...ipUids, uid].slice(-IP_UID_CAP);
      tx.set(ipRef, {
        count: ipCount + 1,
        uids: newUids,
        windowStart: ipWindowOpen ? (ipData.windowStart ?? now) : now,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
      tx.set(userRef, {
        count: userCount + 1,
        windowStart: userWindowOpen ? (urlData.windowStart ?? now) : now,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    }

    return { status, abuseFlag, abuseReason, reviewId, isNewReview };
  });

  // ── Orijinale sahiplik bilgisini kullanıcı belgesinde sakla ──
  // Sahiplik orijinal parfüm bazındadır: kullanıcı bir orijinale sahipse, o
  // orijinalin TÜM muadillerine yorum yaparken cevap otomatik dolar (client prefill).
  if (sanitized.targetPerfumeId && typeof sanitized.ownsOriginal === 'boolean') {
    try {
      await db.collection('users').doc(uid).set({
        ownedOriginals: sanitized.ownsOriginal
          ? admin.firestore.FieldValue.arrayUnion(sanitized.targetPerfumeId)
          : admin.firestore.FieldValue.arrayRemove(sanitized.targetPerfumeId),
      }, { merge: true });
    } catch (e) {
      console.error('ownedOriginals güncellenemedi:', e);
    }
  }

  // ── Abuse işareti varsa ayrı koleksiyona iz bırak (admin/mod inceler) ──
  if (result.abuseFlag) {
    try {
      await db.collection('abuseSignals').add({
        type: 'review',
        reviewId: result.reviewId,
        userId: uid,
        ipHash,                       // raw IP değil
        reason: result.abuseReason,
        muadilId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (e) {
      console.error('abuseSignals yazılamadı:', e);
    }
  }

  return { ok: true, status: result.status, abuseFlag: result.abuseFlag, abuseReason: result.abuseReason, id: result.reviewId };
});

// ════════════════════════════════════════════════════════════════════════════
//  Statik katalog — public koleksiyonlar (brands/perfumes/muadils/slider/
//  settings) tek bir JSON dosyası olarak Storage'a yazılır; ziyaretçiler bu
//  dosyayı okur. Böylece her sayfa açılışında binlerce Firestore doküman
//  okuması yerine sıfır Firestore maliyeti oluşur. Akış:
//   1) Bu koleksiyonlarda herhangi bir yazma → catalogMeta/status.dirty = true
//   2) 5 dakikada bir çalışan cron, dirty ise kataloğu yeniden üretir
//  Admin panel bu dosyayı KULLANMAZ (staff canlı Firestore okur) — yani
//  buradaki 5 dk'lık gecikme yalnızca ziyaretçilerin gördüğü veriye yansır.
// ════════════════════════════════════════════════════════════════════════════

const CATALOG_PATH = 'catalog/catalog.json';
const REVIEWS_PATH = 'catalog/reviews.json';

// Timestamp'ler client'taki cache formatıyla aynı şekilde ({_ts,s,n}) saklanır;
// DataContext okurken bunları toDate'li objelere geri çevirir.
const catalogJsonReplacer = (_k, v) => {
  if (v instanceof admin.firestore.Timestamp) return { _ts: true, s: v.seconds, n: v.nanoseconds };
  return v;
};

async function rebuildCatalog() {
  const db = admin.firestore();
  const [brands, perfumes, muadils, sliderImages, siteSnap, landingSnap] = await Promise.all([
    db.collection('brands').orderBy('name').get(),
    db.collection('perfumes').orderBy('name').get(),
    db.collection('muadils').orderBy('name').get(),
    db.collection('sliderImages').get(),
    db.doc('settings/site').get(),
    db.doc('settings/landingImages').get(),
  ]);
  const arr = (s) => s.docs.map((d) => ({ ...d.data(), id: d.id }));
  const payload = {
    generatedAt: Date.now(),
    brands: arr(brands),
    perfumes: arr(perfumes),
    muadils: arr(muadils),
    sliderImages: arr(sliderImages),
    settingsSite: siteSnap.exists ? siteSnap.data() : null,
    settingsLandingImages: landingSnap.exists ? landingSnap.data() : null,
  };
  const json = JSON.stringify(payload, catalogJsonReplacer);
  await saveCatalogFile(CATALOG_PATH, json);
  console.log(`✓ Katalog üretildi: ${payload.brands.length} marka, ${payload.perfumes.length} parfüm, ${payload.muadils.length} muadil (${(json.length / 1024).toFixed(0)} KB ham)`);
}

// Onaylı (herkese görünür) yorumlar ayrı dosyada tutulur: yorum trafiği katalogdan
// daha sık değiştiği için her yorum onayında koca kataloğu yeniden üretmeye gerek
// kalmaz — yalnızca reviews koleksiyonu okunur.
async function rebuildReviewsCatalog() {
  const db = admin.firestore();
  // 'in' tek alan olduğu için composite index gerekmez; sıralama bellekte yapılır
  const snap = await db.collection('reviews').where('status', 'in', ['approved', 'pending_update']).get();
  const reviews = snap.docs
    .map((d) => ({ ...d.data(), id: d.id }))
    .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
  const json = JSON.stringify({ generatedAt: Date.now(), reviews }, catalogJsonReplacer);
  await saveCatalogFile(REVIEWS_PATH, json);
  console.log(`✓ Yorum kataloğu üretildi: ${reviews.length} onaylı yorum (${(json.length / 1024).toFixed(0)} KB ham)`);
}

// gzip + contentEncoding: tarayıcı şeffaf açar, indirme boyutu ~5-10 kat küçülür
async function saveCatalogFile(path, json) {
  await admin.storage().bucket().file(path).save(zlib.gzipSync(Buffer.from(json)), {
    resumable: false,
    metadata: {
      contentType: 'application/json',
      contentEncoding: 'gzip',
      // 5 dk CDN/tarayıcı cache'i — cron periyoduyla uyumlu
      cacheControl: 'public, max-age=300',
    },
  });
}

const markDirty = (flagField, markField) => async () => {
  await admin.firestore().doc('catalogMeta/status').set({
    [flagField]: true,
    [markField]: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
};
const markCatalogDirty = markDirty('dirty', 'markedAt');
const markReviewsDirty = markDirty('reviewsDirty', 'reviewsMarkedAt');

exports.catalogDirtyOnBrand    = onDocumentWritten('brands/{id}', markCatalogDirty);
exports.catalogDirtyOnPerfume  = onDocumentWritten('perfumes/{id}', markCatalogDirty);
exports.catalogDirtyOnMuadil   = onDocumentWritten('muadils/{id}', markCatalogDirty);
exports.catalogDirtyOnSlider   = onDocumentWritten('sliderImages/{id}', markCatalogDirty);
exports.catalogDirtyOnSettings = onDocumentWritten('settings/{id}', markCatalogDirty);
exports.catalogDirtyOnReview   = onDocumentWritten('reviews/{id}', markReviewsDirty);

// Tek dosyanın "kirliyse yeniden üret" döngüsü. markedAt karşılaştırması: build
// sırasında yeni bir değişiklik geldiyse bayrak dirty kalır (kayıp güncelleme olmasın)
async function rebuildIfDirty(meta, metaRef, { flagField, markField, path, rebuild }) {
  const db = admin.firestore();
  let needsBuild = !meta.exists || meta.data()[flagField] === true;
  if (!needsBuild) {
    // Dosya hiç üretilmemiş ya da silinmişse de üret (ilk kurulum / kurtarma)
    const [exists] = await admin.storage().bucket().file(path).exists();
    needsBuild = !exists;
  }
  if (!needsBuild) return;

  const markedBefore = meta.exists ? (meta.data()[markField]?.toMillis?.() ?? 0) : 0;
  await rebuild();

  await db.runTransaction(async (tx) => {
    const cur = await tx.get(metaRef);
    const markedNow = cur.exists ? (cur.data()[markField]?.toMillis?.() ?? 0) : 0;
    tx.set(metaRef, {
      [flagField]: markedNow > markedBefore,
      builtAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  });
}

exports.rebuildCatalogCron = onSchedule(
  { schedule: 'every 5 minutes', region: 'us-central1', timeZone: 'Europe/Istanbul' },
  async () => {
    const metaRef = admin.firestore().doc('catalogMeta/status');
    const meta = await metaRef.get();
    await rebuildIfDirty(meta, metaRef, {
      flagField: 'dirty', markField: 'markedAt', path: CATALOG_PATH, rebuild: rebuildCatalog,
    });
    await rebuildIfDirty(meta, metaRef, {
      flagField: 'reviewsDirty', markField: 'reviewsMarkedAt', path: REVIEWS_PATH, rebuild: rebuildReviewsCatalog,
    });
  },
);
