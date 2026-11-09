export type StoreCategory =
  | 'Electrical Store'
  | 'Kiryana / Grocery Store'
  | 'Clothing Store'
  | 'Pharmacy'
  | 'Hardware Store'
  | 'Electronics Store'
  | 'General Store'
  | 'Other';

export type PaymentMethod = 'Cash' | 'Card' | 'Bank Transfer' | 'Other';

export type Product = {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit: string;
  purchasePrice: number;
  sellingPrice: number;
  stockQuantity: number;
  minimumStock: number;
};

export type Store = {
  id: string;
  name: string;
  category: StoreCategory;
  ownerName: string;
  phone: string;
  address: string;
};

export type SaleItem = {
  productId: string;
  name: string;
  unit: string;
  quantity: number;
  sellingPrice: number;
  purchasePrice: number;
};

export type Sale = {
  id: string;
  invoiceNumber: string;
  billNumber: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  customerName: string;
  billBookNumber?: string;
  contact?: string;
  createdAt: string;
};
