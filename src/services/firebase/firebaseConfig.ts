import { initializeApp } from "firebase/app";
import { initializeAuth,
  // Firebase's RN conditional export is missing from the package's TypeScript declarations.
  // @ts-expect-error
  getReactNativePersistence,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBGjKE9oxSoxokVbTmLWe-9elYpLTiTshk",
  authDomain: "storemate-app-f9074.firebaseapp.com",
  projectId: "storemate-app-f9074",
  storageBucket: "storemate-app-f9074.firebasestorage.app",
  messagingSenderId: "359850975721",
  appId: "1:359850975721:web:2e25307094a69f644feb78",
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;