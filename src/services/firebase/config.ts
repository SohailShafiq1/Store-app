import app, { auth, db } from './firebaseConfig';

export const firebaseEnabled = true;
export const firebaseApp = app;
export const firebaseAuth = auth;
export const firestore = db;
