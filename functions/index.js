const { onDocumentUpdated, onDocumentCreated } = require('firebase-functions/v2/firestore');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');
const crypto = require('crypto');
const { validateReviewText } = require('./reviewValidation');

admin.initializeApp();

// IP hash'lemede kullanılacak sunucu sırrı (raw IP asla saklanmaz).
// Deploy öncesi: firebase functions:secrets:set IP_HASH_SALT
const IP_HASH_SALT = defineSecret('IP_HASH_SALT');

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
//  Yorum gönderimi — spam/sahte hesap korumalı sunucu tarafı akışı
//  Client doğrudan reviews'a yazamaz (bkz. firestore.rules); tüm yorumlar bu
//  callable üzerinden, Admin SDK ile oluşturulur. Üç katman:
//   1) Yeni hesaplara ilk 24 saat yorum yasağı (Auth createTime — kurcalanamaz)
//   2) IP bazlı hız limiti (hash'li IP + günlük salt, atomik transaction)
//   3) Çok kısa / düşük eforlu yorum reddi (reviewValidation.js)
// ════════════════════════════════════════════════════════════════════════════

const NEW_ACCOUNT_BLOCK_MS = 24 * 60 * 60 * 1000;   // ilk 24 saat yorum yok

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
const OCCASION_KEYS = ['ofis', 'date', 'gunluk', 'gunduz', 'gece', 'deniz'];
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

exports.submitReview = onCall({ secrets: [IP_HASH_SALT], region: 'us-central1' }, async (request) => {
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
