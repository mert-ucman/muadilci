/**
 * Firestore'da deleted:true olan kullanıcıların Firebase Auth hesaplarını siler.
 * Kullanım: node scripts/delete-auth-accounts.mjs
 */
import { readFileSync } from 'fs';
import admin from 'firebase-admin';

const serviceAccount = JSON.parse(
  readFileSync('C:/Users/win10/Downloads/muadilci-890e4-firebase-adminsdk-fbsvc-b145eb6842.json', 'utf8')
);

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const auth = admin.auth();
const db = admin.firestore();

const snap = await db.collection('users').where('deleted', '==', true).get();

if (snap.empty) {
  console.log('Silinecek hesap yok.');
  process.exit(0);
}

console.log(`${snap.size} silinmiş kullanıcı bulundu...`);

for (const docSnap of snap.docs) {
  const uid = docSnap.id;
  try {
    await auth.deleteUser(uid);
    console.log(`✓ Auth silindi: ${uid} (${docSnap.data().email ?? ''})`);
  } catch (e) {
    if (e.code === 'auth/user-not-found') {
      console.log(`— Zaten yok: ${uid}`);
    } else {
      console.error(`✗ Hata (${uid}):`, e.message);
    }
  }
}

console.log('\n✅ Tamamlandı.');
process.exit(0);
