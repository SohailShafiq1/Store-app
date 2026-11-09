import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { firestore } from './config';
import { productRef, salesRef } from './storePaths';
import { SaleItem } from '../../types';

export async function completeSaleAtomic(userId: string, storeId: string, input: { items: SaleItem[]; subtotal: number; discount: number; total: number; paymentMethod: string; amountReceived: number; customerName: string; billNumber: string; billBookNumber: string; contact: string }) {
  if (!firestore) throw new Error('Firebase is not configured.');
  const saleRef = doc(salesRef(userId, storeId));
  await runTransaction(firestore, async (transaction) => {
    const productSnapshots = await Promise.all(input.items.map((item) => transaction.get(productRef(userId, storeId, item.productId))));
    productSnapshots.forEach((snapshot, index) => {
      if (!snapshot.exists()) throw new Error(`Product ${input.items[index].name} no longer exists.`);
      const available = Number(snapshot.data().stockQuantity ?? 0);
      const requested = input.items[index].quantity;
      if (requested <= 0 || available < requested) throw new Error(`Insufficient stock for ${input.items[index].name}.`);
      transaction.update(snapshot.ref, { stockQuantity: available - requested, updatedAt: serverTimestamp() });
    });
    transaction.set(saleRef, { ...input, invoiceNumber: `INV-${Date.now()}`, status: 'completed', createdAt: serverTimestamp() });
  });
  return saleRef.id;
}
