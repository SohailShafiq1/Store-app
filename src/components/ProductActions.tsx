import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Product } from '../types';

const colors = { green: '#0E7C66', coral: '#D9674C' };

export default function ProductActions({ product, onRestock, onEdit, onDelete }: { product: Product; onRestock: (product: Product) => void; onEdit: (product: Product) => void; onDelete: (product: Product) => void }) {
  return <View style={styles.row}><Pressable onPress={() => onRestock(product)}><Text style={styles.link}>Restock</Text></Pressable><Pressable onPress={() => onEdit(product)}><Text style={styles.link}>Edit</Text></Pressable><Pressable onPress={() => onDelete(product)}><Text style={styles.delete}>Delete</Text></Pressable></View>;
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', gap: 8, marginTop: 8, justifyContent: 'flex-end' }, link: { color: colors.green, fontSize: 10, fontWeight: '800' }, delete: { color: colors.coral, fontSize: 10, fontWeight: '800' } });
