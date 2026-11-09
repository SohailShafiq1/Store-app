# StoreFlow

A TypeScript Expo starter for multi-store inventory and POS workflows.

## Run locally

```bash
npm install
cp .env.example .env
npm start
```

Use `npm run ios`, `npm run android`, or `npm run web` after the development server starts.

## Firebase setup

1. Create a Firebase project and enable Email/Password Authentication.
2. Create a Firestore database and register a mobile/web app.
3. Copy the app configuration values into `.env` using `.env.example`.
4. Publish `firestore.rules` with the Firebase CLI or Firebase console.
5. Never add a Firebase Admin SDK key or service-account JSON file to this app.

With no Firebase environment values, the app runs in local persistent demo mode using Zustand and AsyncStorage. The Firebase client is enabled only when every `EXPO_PUBLIC_FIREBASE_*` value is present.

## Current product slice

- Persisted store, product, inventory, and sales state.
- Dashboard metrics, low-stock warnings, recent transactions, and stock valuation.
- Searchable inventory with category-aware units and add-product form.
- POS cart with quantity limits, payment method selection, and atomic local stock deduction on confirmation.
- Firebase Auth helpers and a Firestore `runTransaction` sale path that rechecks stock before writing a sale.
- Ownership-scoped Firestore rules for user stores and all nested store data.

The Firestore transaction is the production path for concurrent sales. The local demo path is intentionally available for UI development before Firebase credentials are added.
