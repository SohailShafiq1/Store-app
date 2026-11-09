import { collection, doc } from 'firebase/firestore';
import { firestore } from './config';

function requireFirestore() {
  if (!firestore) throw new Error('Firebase is not configured. Add the EXPO_PUBLIC_FIREBASE_* values from .env.example.');
  return firestore;
}

export const userRef = (userId: string) => doc(requireFirestore(), 'users', userId);
export const storesRef = (userId: string) => collection(userRef(userId), 'stores');
export const storeRef = (userId: string, storeId: string) => doc(storesRef(userId), storeId);
export const productsRef = (userId: string, storeId: string) => collection(storeRef(userId, storeId), 'products');
export const productRef = (userId: string, storeId: string, productId: string) => doc(productsRef(userId, storeId), productId);
export const salesRef = (userId: string, storeId: string) => collection(storeRef(userId, storeId), 'sales');
export const categoriesRef = (userId: string, storeId: string) => collection(storeRef(userId, storeId), 'categories');
export const categoryRef = (userId: string, storeId: string, categoryId: string) => doc(categoriesRef(userId, storeId), encodeURIComponent(categoryId));
export const unitsRef = (userId: string, storeId: string) => collection(storeRef(userId, storeId), 'units');
export const unitRef = (userId: string, storeId: string, unitId: string) => doc(unitsRef(userId, storeId), encodeURIComponent(unitId));
