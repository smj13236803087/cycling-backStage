import admin from 'firebase-admin';
import { HttpsProxyAgent } from 'https-proxy-agent';
import * as path from 'path';
import * as fs from 'fs';
import https from 'https';

if (process.env.HTTP_PROXY) {
  const agent = new HttpsProxyAgent(process.env.HTTP_PROXY);
  https.globalAgent = agent;
}

let serviceAccount: any;
const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');

if (fs.existsSync(serviceAccountPath)) {
  const fileContent = fs.readFileSync(serviceAccountPath, 'utf8');
  serviceAccount = JSON.parse(fileContent);
} else {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Firebase configuration missing');
  }

  let processedPrivateKey = privateKey;
  if (privateKey.includes('\\n')) {
    processedPrivateKey = privateKey.replace(/\\n/g, '\n');
  }

  serviceAccount = {
    projectId,
    clientEmail,
    privateKey: processedPrivateKey,
  };
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export { admin };
