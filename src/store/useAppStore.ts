import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { Product, Sale, Store } from '../types';

const initialStore: Store = {
  id: 'store-1',
  name: 'Northstar Electricals',
  category: 'Electrical Store',
  ownerName: 'Aarav Mehta',
  phone: '+91 98765 43210',
  address: '14 Market Street, Pune',
};

const initialProducts: Product[] = [
  { id: 'p-1', name: 'Copper Wire 1.5mm', sku: 'CW-150', category: 'Cables', unit: 'Meter', purchasePrice: 42, sellingPrice: 58, stockQuantity: 1240, minimumStock: 250 },
  { id: 'p-2', name: 'LED Bulb 12W', sku: 'LED-12', category: 'Lighting', unit: 'Piece', purchasePrice: 78, sellingPrice: 129, stockQuantity: 86, minimumStock: 24 },
  { id: 'p-3', name: 'Modular Switch', sku: 'SW-MOD', category: 'Switches', unit: 'Piece', purchasePrice: 54, sellingPrice: 89, stockQuantity: 18, minimumStock: 30 },
  { id: 'p-4', name: 'PVC Conduit Pipe', sku: 'PVC-20', category: 'Pipes', unit: 'Meter', purchasePrice: 22, sellingPrice: 35, stockQuantity: 310, minimumStock: 80 },
  { id: 'p-5', name: 'Ceiling Rose', sku: 'CR-01', category: 'Fittings', unit: 'Piece', purchasePrice: 18, sellingPrice: 32, stockQuantity: 42, minimumStock: 20 },
];

const initialSales: Sale[] = [
  { id: 'sale-1', invoiceNumber: 'INV-1048', billNumber: 'BILL-1048', items: [{ productId: 'p-2', name: 'LED Bulb 12W', unit: 'Piece', quantity: 4, sellingPrice: 129, purchasePrice: 78 }], subtotal: 516, discount: 0, total: 516, paymentMethod: 'Cash', customerName: 'Walk-in customer', createdAt: new Date().toISOString() },
  { id: 'sale-2', invoiceNumber: 'INV-1047', billNumber: 'BILL-1047', items: [{ productId: 'p-1', name: 'Copper Wire 1.5mm', unit: 'Meter', quantity: 30, sellingPrice: 58, purchasePrice: 42 }], subtotal: 1740, discount: 100, total: 1640, paymentMethod: 'Card', customerName: 'Walk-in customer', createdAt: new Date(Date.now() - 86400000).toISOString() },
];

type AppState = {
  isAuthenticated: boolean;
  stores: Store[];
  activeStoreId: string;
  productsByStore: Record<string, Product[]>;
  salesByStore: Record<string, Sale[]>;
  customCategoriesByStore: Record<string, string[]>;
  customUnitsByStore: Record<string, string[]>;
  addProduct: (product: Omit<Product, 'id'>) => Product | null;
  updateProduct: (id: string, product: Omit<Product, 'id'>) => Product | null;
  restockProduct: (id: string, quantity: number) => Product | null;
  addStore: (store: Omit<Store, 'id'>) => Store;
  addCustomCategory: (name: string) => void;
  addCustomUnit: (name: string) => void;
  replaceRemoteData: (data: { stores: Store[]; productsByStore: Record<string, Product[]>; salesByStore: Record<string, Sale[]>; customCategoriesByStore: Record<string, string[]>; customUnitsByStore: Record<string, string[]> }) => void;
  deleteProduct: (id: string) => void;
  completeSale: (sale: Omit<Sale, 'id' | 'invoiceNumber' | 'createdAt'>) => Sale;
  switchStore: (id: string) => void;
  setAuthenticated: (value: boolean) => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      stores: [initialStore],
      activeStoreId: initialStore.id,
      productsByStore: { [initialStore.id]: initialProducts },
      salesByStore: { [initialStore.id]: initialSales },
      customCategoriesByStore: {},
      customUnitsByStore: {},
      addStore: (store) => {
        const id = `store-${Date.now()}`;
        const created = { ...store, id };
        set((state) => ({ stores: [...state.stores, created], activeStoreId: id, productsByStore: { ...state.productsByStore, [id]: [] }, salesByStore: { ...state.salesByStore, [id]: [] }, customCategoriesByStore: { ...state.customCategoriesByStore, [id]: [] }, customUnitsByStore: { ...state.customUnitsByStore, [id]: [] } }));
        return created;
      },
      addProduct: (product) => {
        const created = { ...product, id: `p-${Date.now()}` };
        let duplicate = false;
        set((state) => {
          const current = state.productsByStore[state.activeStoreId] ?? [];
          duplicate = current.some((item) => {
            const incomingKey = (product.sku || product.name).trim().toLowerCase();
            const existingKey = (item.sku || item.name).trim().toLowerCase();
            return Boolean(incomingKey) && incomingKey === existingKey;
          });
          return duplicate ? state : { productsByStore: { ...state.productsByStore, [state.activeStoreId]: [...current, created] } };
        });
        return duplicate ? null : created;
      },
      updateProduct: (id, product) => {
        let updated: Product | null = null;
        set((state) => {
          const current = state.productsByStore[state.activeStoreId] ?? [];
          const duplicate = current.some((item) => item.id !== id && (product.sku || product.name).trim().toLowerCase() === (item.sku || item.name).trim().toLowerCase());
          if (duplicate) return state;
          updated = { ...product, id };
          return { productsByStore: { ...state.productsByStore, [state.activeStoreId]: current.map((item) => item.id === id ? updated as Product : item) } };
        });
        return updated;
      },
      restockProduct: (id, quantity) => {
        let updated: Product | null = null;
        set((state) => {
          const current = state.productsByStore[state.activeStoreId] ?? [];
          return { productsByStore: { ...state.productsByStore, [state.activeStoreId]: current.map((item) => {
            if (item.id !== id) return item;
            updated = { ...item, stockQuantity: item.stockQuantity + quantity };
            return updated;
          }) } };
        });
        return updated;
      },
      addCustomCategory: (name) => set((state) => ({ customCategoriesByStore: { ...state.customCategoriesByStore, [state.activeStoreId]: [...new Set([...(state.customCategoriesByStore[state.activeStoreId] ?? []), name])] } })),
      addCustomUnit: (name) => set((state) => ({ customUnitsByStore: { ...state.customUnitsByStore, [state.activeStoreId]: [...new Set([...(state.customUnitsByStore[state.activeStoreId] ?? []), name])] } })),
      replaceRemoteData: (data) => set((state) => ({ ...data, activeStoreId: data.stores.find((store) => store.id === state.activeStoreId)?.id ?? data.stores[0]?.id ?? state.activeStoreId })),
      deleteProduct: (id) => set((state) => ({
        productsByStore: {
          ...state.productsByStore,
          [state.activeStoreId]: (state.productsByStore[state.activeStoreId] ?? []).filter((product) => product.id !== id),
        },
      })),
      completeSale: (sale) => {
        const nextSale: Sale = { ...sale, id: `sale-${Date.now()}`, invoiceNumber: sale.billNumber, createdAt: new Date().toISOString() };
        set((state) => {
        const storeProducts = state.productsByStore[state.activeStoreId] ?? [];
        const updatedProducts = storeProducts.map((product) => {
          const sold = sale.items.find((item) => item.productId === product.id);
          return sold ? { ...product, stockQuantity: product.stockQuantity - sold.quantity } : product;
        });
        return {
          productsByStore: { ...state.productsByStore, [state.activeStoreId]: updatedProducts },
          salesByStore: { ...state.salesByStore, [state.activeStoreId]: [nextSale, ...(state.salesByStore[state.activeStoreId] ?? [])] },
        };
        });
        return nextSale;
      },
      switchStore: (id) => set({ activeStoreId: id }),
      setAuthenticated: (value) => set({ isAuthenticated: value }),
    }),
    { name: 'storeflow-state', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
