import { deleteDoc, doc, getDocs, setDoc, Timestamp } from 'firebase/firestore';
import { firestore } from './config';
import { categoriesRef, categoryRef, productsRef, salesRef, storesRef, unitsRef, unitRef } from './storePaths';
import { Product, Sale, Store } from '../../types';

function requireFirestore() {
  if (!firestore) throw new Error('Firebase is not configured.');
  return firestore;
}

export async function saveUserProfile(userId: string, profile: { name: string; phone: string; email: string }) {
  await setDoc(doc(requireFirestore(), 'users', userId), { ...profile, updatedAt: Timestamp.now() }, { merge: true });
}

export async function saveStore(userId: string, store: Store) {
  await setDoc(doc(requireFirestore(), 'users', userId, 'stores', store.id), { ...store, createdAt: Timestamp.now(), updatedAt: Timestamp.now() }, { merge: true });
}

export async function saveProduct(userId: string, storeId: string, product: Product) {
  await setDoc(doc(productsRef(userId, storeId), product.id), { ...product, updatedAt: Timestamp.now() }, { merge: true });
}

export async function removeProduct(userId: string, storeId: string, productId: string) {
  await deleteDoc(doc(productsRef(userId, storeId), productId));
}

export async function saveCustomCategory(userId: string, storeId: string, name: string) {
  await setDoc(categoryRef(userId, storeId, name), { name, createdAt: Timestamp.now() }, { merge: true });
}

export async function saveCustomUnit(userId: string, storeId: string, name: string) {
  await setDoc(unitRef(userId, storeId, name), { name, createdAt: Timestamp.now() }, { merge: true });
}

function timestampToIso(value: unknown) {
  return value instanceof Timestamp ? value.toDate().toISOString() : new Date().toISOString();
}

function uniqueProducts(products: Product[]) {
  const seen = new Set<string>();
  return products.filter((product) => {
    const key = (product.sku || product.name).trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function loadStoreData(userId: string) {
  const storesSnapshot = await getDocs(storesRef(userId));
  const stores = storesSnapshot.docs.map((item) => item.data() as Store);
  const productsByStore: Record<string, Product[]> = {};
  const salesByStore: Record<string, Sale[]> = {};
  const customCategoriesByStore: Record<string, string[]> = {};
  const customUnitsByStore: Record<string, string[]> = {};
  for (const store of stores) {
    const [productsSnapshot, salesSnapshot, categoriesSnapshot, unitsSnapshot] = await Promise.all([
      getDocs(productsRef(userId, store.id)),
      getDocs(salesRef(userId, store.id)),
      getDocs(categoriesRef(userId, store.id)),
      getDocs(unitsRef(userId, store.id)),
    ]);
    productsByStore[store.id] = uniqueProducts(productsSnapshot.docs.map((item) => item.data() as Product));
    salesByStore[store.id] = salesSnapshot.docs.map((item) => ({ ...item.data(), id: item.id, createdAt: timestampToIso(item.data().createdAt) } as Sale));
    customCategoriesByStore[store.id] = categoriesSnapshot.docs.map((item) => String(item.data().name));
    customUnitsByStore[store.id] = unitsSnapshot.docs.map((item) => String(item.data().name));
  }
  return { stores, productsByStore, salesByStore, customCategoriesByStore, customUnitsByStore };
}
