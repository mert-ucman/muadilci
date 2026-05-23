import { readFileSync } from 'fs';
import admin from 'firebase-admin';

const serviceAccount = JSON.parse(
  readFileSync('C:/Users/win10/OneDrive/Desktop/muadilci-890e4-firebase-adminsdk-fbsvc-b145eb6842.json', 'utf8')
);

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const snapshot = await db.collection('brands').where('origin', '==', 'Amerika Birleşik Devletleri').get();
console.log(`${snapshot.size} kayıt bulundu.`);

const batch = db.batch();
snapshot.forEach(doc => batch.update(doc.ref, { origin: 'ABD' }));
await batch.commit();

console.log('✓ Tamamlandı.');
process.exit(0);
