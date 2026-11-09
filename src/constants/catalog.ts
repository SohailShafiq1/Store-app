import { StoreCategory } from '../types';

export const storeCategories: StoreCategory[] = [
  'Electrical Store',
  'Kiryana / Grocery Store',
  'Clothing Store',
  'Pharmacy',
  'Hardware Store',
  'Electronics Store',
  'General Store',
  'Other',
];

export const unitsByCategory: Record<StoreCategory, string[]> = {
  'Electrical Store': ['Piece', 'Box', 'Dozen', 'Feet', 'Meter', 'Roll', 'Coil', 'Pack', 'Set'],
  'Kiryana / Grocery Store': ['Piece', 'Packet', 'Box', 'Kg', 'Gram', 'Litre', 'ML', 'Bottle', 'Bag', 'Pack'],
  'Clothing Store': ['Piece', 'Pair', 'Set', 'Dozen', 'Pack', 'Meter', 'Yard'],
  Pharmacy: ['Piece', 'Tablet', 'Capsule', 'Strip', 'Bottle', 'Box', 'Pack', 'ML', 'Gram', 'Tube'],
  'Hardware Store': ['Piece', 'Box', 'Kg', 'Gram', 'Feet', 'Meter', 'Inch', 'Roll', 'Bundle', 'Pack'],
  'Electronics Store': ['Piece', 'Box', 'Set', 'Pack', 'Pair', 'Meter', 'Feet'],
  'General Store': ['Piece', 'Packet', 'Box', 'Carton', 'Dozen', 'Kg', 'Gram', 'Litre', 'Bottle', 'Pack'],
  Other: ['Piece', 'Box', 'Pack', 'Set', 'Kg', 'Gram', 'Litre', 'Meter', 'Custom'],
};
