import { readFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const admin = require('firebase-admin');

// Use Firebase CLI's stored OAuth2 token as credential
const cfg = JSON.parse(readFileSync('C:/Users/MERT/.config/configstore/firebase-tools.json', 'utf8'));
const accessToken = cfg.tokens.access_token;
const refreshToken = cfg.tokens.refresh_token;

const credential = {
  getAccessToken: () => Promise.resolve({
    access_token: accessToken,
    expires_in: 3600,
  }),
};

admin.initializeApp({
  credential,
  projectId: 'muadilci-890e4',
});

const ADMIN_UID = '82k0BGn0ETae1yjaC2zraEaL1Zp2';

async function main() {
  await admin.auth().setCustomUserClaims(ADMIN_UID, { admin: true });
  console.log('Custom claim "admin: true" set for user:', ADMIN_UID);

  const user = await admin.auth().getUser(ADMIN_UID);
  console.log('Current claims:', user.customClaims);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
