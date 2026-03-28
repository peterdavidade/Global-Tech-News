# Firebase setup (replaces “passcode” login)

## 1) Create a Firebase project
- Firebase Console → create project
- **Authentication** → Sign-in method → enable **Email/Password**
- **Firestore Database** → create database

## 2) Add your Web app config to this repo
- Open `firebase-config.js` and paste your project’s config values (apiKey, authDomain, projectId, …).

## 3) Create your admin login (so you don’t “forget logins” again)
- Firebase Console → **Authentication** → **Users** → **Add user** (email + password)
- On the admin page `orbit-newsroom-4837.html`, use that email/password to sign in.
- If you forget the password: type your email → click **Forgot password** (sends reset email).
 - Firebase Auth requires the site to be served over `http://localhost` or `https://…` (not `file://`). Use `serve.ps1` for local testing.

## 4) Firestore data shape
The site expects:
- `posts/{postId}` documents (the admin console will write these after login).
- `siteConfig/public` document (optional) with:
  - `liveTicker`: string[]
  - `archiveTicker`: string[]
  - `liveDesk`: `{ label: string, value: string }`

## 5) Minimal Firestore security rules (example)
Protect writes so only signed-in admins can publish:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## 6) If login fails on GitHub Pages
- Firebase Console → **Authentication** → **Settings** → **Authorized domains** → add your GitHub Pages domain.

## Local passcode fallback (if Firebase isn’t configured yet)
- Default passcode is `DailyAffairs-Desk-2026` (see `newsroom-data.js`).
- If you changed it and forgot it, you can clear the browser’s site storage for this site (localStorage) to revert to defaults.
