const { onDocumentUpdated, onDocumentCreated } = require('firebase-functions/v2/firestore');
const admin = require('firebase-admin');

admin.initializeApp();

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
