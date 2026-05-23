const { onDocumentUpdated } = require('firebase-functions/v2/firestore');
const admin = require('firebase-admin');

admin.initializeApp();

/**
 * Firestore'da users/{uid} belgesi güncellenip deleted:true olduğunda
 * Firebase Authentication hesabını otomatik siler.
 */
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
