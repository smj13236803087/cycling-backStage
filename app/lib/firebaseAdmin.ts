import admin from 'firebase-admin';

const serviceAccount = {
  "type": "service_account",
  "project_id": "cycling-78d6d",
  "private_key_id": "c78d1950b96e2f0ff9d0615731a7ce2523d236d4",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCqKq3ABDMn2M5c\nGErzusFdnccp/qCXKwJtv11cOK+chm3sFtf2auTFTYakzKKiobCa7+hmiuhoLOSf\nKSywMVXp/iGazqOsqrnlPGeGiP10hWw2b0IeSgzru/12YgnaIYodsIbtfveDPC1h\nA8HaXrDQQdRREtpZ9Qsgf56E1tcCxw3JCjIur/HTPzxg2f6IKMrtMw5507zHJBBp\nm4JlaUOI+Xva3rQNJY/djVq2erG0j4HCVkS/BMCXR1qD+EEOrVwTT8fjJmnY+9Vl\n/QKrqFtd3cvLg2VV6OBmo91WD9p2+DccjsS9eG1OI9P6ZQblbOgnZqdpZSFqXNnX\nF9MgXobJAgMBAAECggEACqAiG9KXUCZnUlRY/8maT+pteIeUBwRyQSCZJ4xJmOxC\n+mI9x38KvHA4F1vIzv9qK+6NlDOZygF9oBud1P2rp/IMrqI3Ea3ScEg6janJq8g2\nBtshJYuJrYGeVNFP3K1J9ssiTbunIGx2R+/IX8aYY1Ss+YgEFuhocrXNU+2nXN6v\ngnVw5BkTj+EN5JEfknGavSus3JO1eHowmkgIoswKpQnRRa5FR/FYLiBJuzrf8J3R\nywhehLA1n1YNrGFrxzZ0bD9df1mC6NtG7k0BnzDgjZKPI5y6MJ0wOh6ruFr6XG5x\nU1g+Nd4PkIo2spOHRbMZrxu7kndufhXOcFcfw99igQKBgQDSHCysR6jcPm4w6vm7\nHdgs/snYuV0MAD2QjYV8NQBMUVm9jzOZpD38Ol0qZKEb8fqsLVIlcPnNuvOiDMi0\nv/o00HhpH0spl0fMbu4a+xhwglPEKZw4cP5xQhQUJDGbIyZEUze5kwYo59UHUu3m\nPFfPnjuVabZwb1Zoy1UlT8h5QQKBgQDPVSnCLIflNjEBmaBiOHYby4JnJADkaAWx\n5EXCs0zNjJRCorbRxHcHSsP5PKbrKr0Ydw6A7ABTZjk6GqBYNFlABWhc0/bildzF\n6hjfQ25bFqYW0rjBLjWPSyp4Amv1E94ZhdIfIVvMOIeeK+6PE1AINgDpOvCFEHau\n9+0GDVHjiQKBgEeLaHrRe+JjL8pgeOEKbI4FxF2T4OcxPcV3Kzj8IznZiaFOndd3\nYdP9W7QPx/xoDV+Lnyk4qxcuzb8kc0N5C43oXtgM298xsDUgoNt3HP9SoYtuT8+4\nSivuwD+Lg4i8E0+4toTuV26eYp+30WJQseX0j311HbZzcw0ED95AqJcBAoGBAIz/\nlLN5hz2I+hDlgh3p2eCTKO6tnHG4kE7nN83uE8gh113tvDixzGTIIrhn1/hMC2cM\n6G8ikCInfbmXC/6QMzYHt26Rs+9qDUcHKb0D5ZPKtk8FJSIzI7d8XbhZpUN5LGzd\nBgWnsP8UXp5hsA3bC21aFIqIS7Oie6QH9UhNXKhJAoGAaGg7NAc3jImhNt54OAPr\ncv+lt4dSC53TqDT/zSex52/1BhTauJb0ysgUyWPyL/fosJZBZr2ZaBDXHvoZX7Io\nJ+txS1hPaSx+Z4RRRcW44kJ9hlfhnFhme1tjk1uh+gjTYvIdax0xCNgBNIjH71TN\nVebgns+kfi2rVT2CMdWGglc=\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@cycling-78d6d.iam.gserviceaccount.com",
  "client_id": "114033900453751287683",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40cycling-78d6d.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        // databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
}

export { admin };