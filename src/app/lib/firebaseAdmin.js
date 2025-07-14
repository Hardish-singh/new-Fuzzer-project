// lib/firebaseAdmin.js
import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

const serviceAccountPath = path.join(process.cwd(), 'firebase-adminsdk.json');

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

export { db };
