// ════════════════════════════════════════════════════════════════════════════
//  KULLANICI ÇEKME PLANI — Oyunlaştırma / Ödül motoru (Faz 1)
//  ----------------------------------------------------------------------------
//  İki para birimi:
//    • XP  → kalıcı prestij + sıralama (xpTotal hiç sıfırlanmaz, xpWeekly haftalık)
//    • MP  → harcanabilir cüzdan (indirim kodu için biriktirilir; Faz 3)
//  Tüm ödüller SUNUCU tarafında ve transaction içinde verilir; istemci puanı
//  asla kendi yazamaz (bkz. firestore.rules → users/publicProfiles kısıtları).
//  Tüm tarih/reset işlemleri Europe/Istanbul'a göre yapılır.
// ════════════════════════════════════════════════════════════════════════════

const { onCall, onRequest, HttpsError } = require('firebase-functions/v2/https');
const { onDocumentWritten } = require('firebase-functions/v2/firestore');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const admin = require('firebase-admin');
const zlib = require('zlib');

const REGION = 'us-central1';

// ── Ekonomi sabitleri ────────────────────────────────────────────────────────
// NOT: Faz 2'de admin panelinden (economyConfig/current) dinamik ayarlanacak.
// Şimdilik kod içi sabit; tek yerden yönetilir.
const ECON = {
  loginXp: 1,
  loginMp: 2,
  reviewXp: 5,
  reviewMp: 1,
  reviewDailyMpCap: 10,   // yorumdan günde en fazla 10 MP
};

// ── Rozet tanımları (onaylı yorum sayısına göre) — 13 kilometre taşı ─────────
// NOT: id'ler src/lib/gamification.js → BADGE_GROUPS ile birebir aynı olmalı.
const REVIEW_BADGES = [
  { id: 'ilk-kesif',           min: 1 },
  { id: 'koku-meraklisi',      min: 5 },
  { id: 'muadil-ciragi',       min: 10 },
  { id: 'tester-avcisi',       min: 25 },
  { id: 'koku-dedektifi',      min: 50 },
  { id: 'blind-buy-kahramani', min: 75 },
  { id: 'muadil-uzmani',       min: 100 },
  { id: 'koku-kasifi',         min: 150 },
  { id: 'nota-ustasi',         min: 200 },
  { id: 'bronz-burun',         min: 250 },
  { id: 'gumus-burun',         min: 500 },
  { id: 'altin-burun',         min: 750 },
  { id: 'muadilci-efsanesi',   min: 1000 },
];
function reviewBadgesFor(count) {
  return REVIEW_BADGES.filter((b) => count >= b.min).map((b) => b.id);
}
function mergeBadges(existing, toAdd) {
  return [...new Set([...(existing || []), ...toAdd])];
}

// ── Europe/Istanbul tarih (YYYY-MM-DD) ───────────────────────────────────────
// İstemci saatine ASLA güvenilmez; "bugün" kavramı hep sunucuda İstanbul'a göre.
function istanbulDate(d = new Date()) {
  // en-CA → YYYY-MM-DD biçimi
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Istanbul', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(d);
}

// Günlük sayaç objesini bugüne göre tazeler (tembel reset): gün değiştiyse sıfırlar.
function freshDaily(daily, today) {
  if (!daily || daily.date !== today) {
    return { date: today, login: false, gamePlayed: false, commentMp: 0 };
  }
  return {
    date: today,
    login: !!daily.login,
    gamePlayed: !!daily.gamePlayed,
    commentMp: daily.commentMp || 0,
  };
}

// Yalnızca ADMIN liderlik tablosundan / şampiyonluktan hariç tutulur (moderatörler
// girer). XP/MP/rozet ise HERKESE (admin dahil) verilir: yetki alınıp verildiğinde
// kazanılan ilerleme kaybolmasın — üye→moderatör ya da moderatör→üye geçişlerinde
// birikim korunur.
const isLeaderboardExcluded = (role) => role === 'admin';

// XP/rozet alanlarını herkese açık publicProfiles'a yansıtır (leaderboard + profil
// bu taraftan okunur; users belgesi gizlidir). Admin SDK rules'ı baypas eder.
async function mirrorPublic(db, uid, fields) {
  try {
    await db.collection('publicProfiles').doc(uid).set(fields, { merge: true });
  } catch (e) {
    console.error(`publicProfiles yansıtılamadı (${uid}):`, e.message);
  }
}

// Leaderboard statik dosyasını "kirli" işaretler → cron yeniden üretir.
async function markLeaderboardDirty(db) {
  try {
    await db.doc('catalogMeta/status').set({
      leaderboardDirty: true,
      leaderboardMarkedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  } catch (e) {
    console.error('leaderboardDirty işaretlenemedi:', e.message);
  }
}

// ════════════════════════════════════════════════════════════════════════════
//  1) Günlük giriş ödülü — günde 1 kez XP+1 / MP+2 (tembel günlük reset)
// ════════════════════════════════════════════════════════════════════════════
exports.claimDailyLogin = onCall({ region: REGION, enforceAppCheck: true }, async (request) => {
  const { auth } = request;
  if (!auth) throw new HttpsError('unauthenticated', 'Giriş yapmalısınız.');
  const uid = auth.uid;
  const db = admin.firestore();
  const userRef = db.collection('users').doc(uid);
  const today = istanbulDate();

  const result = await db.runTransaction(async (tx) => {
    const snap = await tx.get(userRef);
    if (!snap.exists) throw new HttpsError('failed-precondition', 'Kullanıcı profili bulunamadı.');
    const u = snap.data();
    if (u.deleted) throw new HttpsError('permission-denied', 'Hesabınız pasif durumda.');

    const daily = freshDaily(u.daily, today);
    if (daily.login) {
      return { alreadyClaimed: true, mp: u.mp || 0, xpTotal: u.xpTotal || 0, xpWeekly: u.xpWeekly || 0, badges: u.badges || [] };
    }
    daily.login = true;
    const xpTotal  = (u.xpTotal  || 0) + ECON.loginXp;
    const xpWeekly = (u.xpWeekly || 0) + ECON.loginXp;
    const mp       = (u.mp       || 0) + ECON.loginMp;
    tx.set(userRef, { xpTotal, xpWeekly, mp, daily }, { merge: true });
    return {
      alreadyClaimed: false,
      awardedXp: ECON.loginXp, awardedMp: ECON.loginMp,
      xpTotal, xpWeekly, mp, badges: u.badges || [],
    };
  });

  if (!result.alreadyClaimed) {
    await mirrorPublic(db, uid, { uid, xpTotal: result.xpTotal, xpWeekly: result.xpWeekly, badges: result.badges || [] });
    await markLeaderboardDirty(db);
  }
  return result;
});

// ════════════════════════════════════════════════════════════════════════════
//  2) Yorum onaylanınca ödül — status 'approved'a geçince XP+5 / MP+1 (tavanlı)
//  ----------------------------------------------------------------------------
//  onDocumentWritten: hem "pending → approved" güncellemesini hem de metinsiz
//  (doğrudan approved oluşturulan) değerlendirmeleri yakalar. `rewarded` bayrağı
//  ile idempotent — aynı yorum iki kez ödül vermez (edit/re-approve döngülerinde
//  de tekrar tetiklenmez).
// ════════════════════════════════════════════════════════════════════════════
exports.awardOnReviewApproved = onDocumentWritten({ document: 'reviews/{id}', region: REGION }, async (event) => {
  const after = event.data?.after;
  if (!after || !after.exists) return;             // silinmiş
  const a = after.data();
  if (a.status !== 'approved' || a.rewarded) return; // sadece ilk onayda
  const uid = a.userId;

  const db = admin.firestore();
  const reviewRef = db.collection('reviews').doc(event.params.id);
  const today = istanbulDate();

  const result = await db.runTransaction(async (tx) => {
    // ── ÖNCE tüm okumalar (Firestore: reads-before-writes) ──
    const rSnap = await tx.get(reviewRef);
    if (!rSnap.exists) return null;
    const r = rSnap.data();
    if (r.status !== 'approved' || r.rewarded) return null;   // yarış: başka çağrı ödüllendirdi
    const ruid = r.userId;
    const userRef = (ruid && ruid !== 'deleted') ? db.collection('users').doc(ruid) : null;
    const uSnap = userRef ? await tx.get(userRef) : null;

    // ── SONRA yazmalar ──
    // Her durumda rewarded işaretle (idempotency) — kullanıcı gitmiş olsa bile.
    tx.update(reviewRef, { rewarded: true, rewardedAt: admin.firestore.FieldValue.serverTimestamp() });

    if (!uSnap || !uSnap.exists) return null;
    const u = uSnap.data();
    if (u.deleted) return null;   // silinmiş hesap ödül almaz (admin/mod dahil herkes kazanır)

    const daily = freshDaily(u.daily, today);
    // MP günlük tavanı (yorumdan en fazla reviewDailyMpCap)
    let mpAward = 0;
    if (daily.commentMp < ECON.reviewDailyMpCap) {
      mpAward = Math.min(ECON.reviewMp, ECON.reviewDailyMpCap - daily.commentMp);
      daily.commentMp += mpAward;
    }
    const approvedReviewCount = (u.approvedReviewCount || 0) + 1;
    const badges = mergeBadges(u.badges, reviewBadgesFor(approvedReviewCount));
    const xpTotal  = (u.xpTotal  || 0) + ECON.reviewXp;
    const xpWeekly = (u.xpWeekly || 0) + ECON.reviewXp;
    const mp       = (u.mp       || 0) + mpAward;

    tx.set(userRef, { xpTotal, xpWeekly, mp, approvedReviewCount, badges, daily }, { merge: true });
    return { uid, xpTotal, xpWeekly, badges, weeklyChampionCount: u.weeklyChampionCount || 0 };
  });

  if (result) {
    await mirrorPublic(db, result.uid, {
      uid: result.uid, xpTotal: result.xpTotal, xpWeekly: result.xpWeekly, badges: result.badges,
    });
    await markLeaderboardDirty(db);
  }
});

// ════════════════════════════════════════════════════════════════════════════
//  3) Haftalık liderlik sıfırlaması — Pazartesi 00:00 (İstanbul)
//     İlk 3'ü arşivle → şampiyona rozet/sayaç → tüm xpWeekly=0
// ════════════════════════════════════════════════════════════════════════════
exports.weeklyLeaderboardReset = onSchedule(
  { schedule: '0 0 * * 1', timeZone: 'Europe/Istanbul', region: REGION },
  async () => {
    const db = admin.firestore();
    const weekId = istanbulDate();   // sıfırlamanın yapıldığı pazartesi

    // Haftalık XP > 0 olan herkesi bir kez çek (hem şampiyon seçimi hem reset için).
    const allSnap = await db.collection('users').where('xpWeekly', '>', 0).get();

    // ── İlk 3'ü seç ve arşivle — ADMIN sıralamaya/şampiyonluğa GİRMEZ (mod girer) ──
    const ranked = allSnap.docs
      .filter((d) => !isLeaderboardExcluded(d.data().role))
      .sort((a, b) => (b.data().xpWeekly || 0) - (a.data().xpWeekly || 0));
    const top3 = ranked.slice(0, 3);

    if (top3.length) {
      const champions = top3.map((d, i) => {
        const u = d.data();
        return {
          rank: i + 1, uid: d.id,
          username: u.username || null, name: u.name || 'Kullanıcı',
          photoURL: u.photoURL || null, xpWeekly: u.xpWeekly || 0,
        };
      });
      await db.collection('leaderboardChampions').doc(weekId).set({
        weekId, champions, createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 1.'ye kalıcı şampiyon rozeti + sayaç
      const winner = top3[0];
      const w = winner.data();
      const wBadges = mergeBadges(w.badges, ['weekly-champion']);
      await winner.ref.set({
        weeklyChampionCount: (w.weeklyChampionCount || 0) + 1,
        badges: wBadges,
      }, { merge: true });
      await mirrorPublic(db, winner.id, {
        uid: winner.id, badges: wBadges, weeklyChampionCount: (w.weeklyChampionCount || 0) + 1,
      });
    }

    // ── Tüm xpWeekly'i sıfırla (admin dahil; admin biriktirir ama sıralamada görünmez) ──
    const docs = allSnap.docs;
    for (let i = 0; i < docs.length; i += 400) {
      const batch = db.batch();
      const pubBatch = db.batch();
      docs.slice(i, i + 400).forEach((d) => {
        batch.set(d.ref, { xpWeekly: 0 }, { merge: true });
        pubBatch.set(db.collection('publicProfiles').doc(d.id), { xpWeekly: 0 }, { merge: true });
      });
      await batch.commit();
      await pubBatch.commit();
    }

    await markLeaderboardDirty(db);
    console.log(`✓ Haftalık liderlik sıfırlandı (${weekId}): ${docs.length} kullanıcı, ${top3.length} şampiyon.`);
  },
);

// ════════════════════════════════════════════════════════════════════════════
//  4) Leaderboard statik JSON — publicProfiles/users'tan üretilip CDN'den servis
//     edilir; ziyaretçi başına Firestore okuması YOK (katalog deseninin aynısı).
// ════════════════════════════════════════════════════════════════════════════
const LEADERBOARD_PATH = 'catalog/leaderboard.json';
const LB_TOP_N = 100;

async function rebuildLeaderboard() {
  const db = admin.firestore();
  const snap = await db.collection('users').where('xpTotal', '>', 0).get();
  const rows = snap.docs
    .map((d) => ({ ...d.data(), uid: d.id }))
    .filter((u) => !u.deleted && !isLeaderboardExcluded(u.role))
    .map((u) => ({
      uid: u.uid,
      username: u.username || null,
      name: u.name || 'Kullanıcı',
      photoURL: u.photoURL || null,
      xpTotal: u.xpTotal || 0,
      xpWeekly: u.xpWeekly || 0,
      badges: u.badges || [],
      weeklyChampionCount: u.weeklyChampionCount || 0,
    }));

  const byTr = (a, b) => (a.name || '').localeCompare(b.name || '', 'tr');
  const allTime = [...rows]
    .sort((a, b) => b.xpTotal - a.xpTotal || byTr(a, b))
    .slice(0, LB_TOP_N);
  const weekly = rows.filter((r) => r.xpWeekly > 0)
    .sort((a, b) => b.xpWeekly - a.xpWeekly || byTr(a, b))
    .slice(0, LB_TOP_N);

  const json = JSON.stringify({ generatedAt: Date.now(), allTime, weekly });
  await admin.storage().bucket().file(LEADERBOARD_PATH).save(zlib.gzipSync(Buffer.from(json)), {
    resumable: false,
    metadata: {
      contentType: 'application/json',
      contentEncoding: 'gzip',
      cacheControl: 'public, max-age=120',
    },
  });
  console.log(`✓ Leaderboard üretildi: ${allTime.length} tüm-zamanlar, ${weekly.length} haftalık.`);
}

// 5 dakikada bir: leaderboard kirliyse (veya dosya yoksa) yeniden üret.
exports.rebuildLeaderboardCron = onSchedule(
  { schedule: 'every 5 minutes', region: REGION, timeZone: 'Europe/Istanbul' },
  async () => {
    const db = admin.firestore();
    const metaRef = db.doc('catalogMeta/status');
    const meta = await metaRef.get();
    let needsBuild = !meta.exists || meta.data().leaderboardDirty === true;
    if (!needsBuild) {
      const [exists] = await admin.storage().bucket().file(LEADERBOARD_PATH).exists();
      needsBuild = !exists;
    }
    if (!needsBuild) return;

    const markedBefore = meta.exists ? (meta.data().leaderboardMarkedAt?.toMillis?.() ?? 0) : 0;
    await rebuildLeaderboard();
    await db.runTransaction(async (tx) => {
      const cur = await tx.get(metaRef);
      const markedNow = cur.exists ? (cur.data().leaderboardMarkedAt?.toMillis?.() ?? 0) : 0;
      tx.set(metaRef, { leaderboardDirty: markedNow > markedBefore }, { merge: true });
    });
  },
);

// Leaderboard servisi — Hosting CDN arkasından (bkz. firebase.json rewrite
// /data/leaderboard.json). Katalog servisiyle aynı: 60 sn bellek-içi cache +
// gzip pass-through + edge cache.
const _lbMem = { buf: null, ts: 0 };
const LB_MEM_TTL_MS = 60 * 1000;

exports.leaderboard = onRequest(
  { region: REGION, maxInstances: 5, concurrency: 40 },
  async (req, res) => {
    try {
      if (!_lbMem.buf || Date.now() - _lbMem.ts > LB_MEM_TTL_MS) {
        const [buf] = await admin.storage().bucket().file(LEADERBOARD_PATH).download({ decompress: false });
        _lbMem.buf = buf; _lbMem.ts = Date.now();
      }
      res.set('Content-Type', 'application/json; charset=utf-8');
      res.set('Content-Encoding', 'gzip');
      res.set('Vary', 'Accept-Encoding');
      res.set('Cache-Control', 'public, max-age=120, s-maxage=300');
      res.status(200).end(_lbMem.buf);
    } catch (e) {
      console.error('✗ Leaderboard servis hatası:', e.message);
      res.status(503).json({ error: 'leaderboard unavailable' });
    }
  },
);
