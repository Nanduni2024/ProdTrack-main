# ProdTrack Journal

ProdTrack Journal is a professional personal article writing website built with React. It has a public reader experience and an admin publishing area where articles can be added with uploaded cover images.

## Run the project

```bash
npm run start
```

Open http://localhost:3000 in your browser.

## Features

- Medium-style article reading layout
- Admin publisher for adding posts (prototype PIN: `prodtrack2026`)
- Cover image upload for each article
- Cloud article sync with Firebase Firestore when configured
- Local browser storage fallback when cloud settings are missing
- Responsive desktop and mobile design

## Cloud articles with Firebase

Articles added in one browser only appear on another device after you connect a shared database. The app supports Firebase Firestore through Vercel environment variables.

Vercel hosts the React website. Firebase Firestore stores the articles so laptop and phone visitors see the same posts.

## Move existing local posts

If you already created posts before adding Firebase, those posts are saved only in that browser. To move them:

1. Open the site on the browser that shows the posts.
2. Go to Admin.
3. Click `Export posts`.
4. Open the site on another device or browser.
5. Go to Admin.
6. Click `Import posts` and choose the exported JSON file.

After Firebase is configured, importing posts also syncs them to Firestore.

## Firebase setup

1. Go to Firebase Console.
2. Create a project.
3. Add a Web app.
4. Create a Firestore database.
5. Create a collection named `articles`.
6. In Vercel, add these Environment Variables from your Firebase Web app config:

```text
REACT_APP_FIREBASE_API_KEY=your_firebase_web_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_firebase_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_firebase_app_id
```

7. Redeploy on Vercel after adding the variables.

For local testing, copy `.env.example` to `.env.local`, paste your real Firebase values, then restart `npm run start`.

For this prototype, Firestore rules must allow public read/write to the `articles` collection:

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /articles/{articleId} {
      allow read, write: if true;
    }
  }
}
```

Note: the admin PIN is a frontend prototype guard, not production-grade security. For a real public writing platform, replace it with backend authentication and private image storage.
