import React from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';

const colors = { ink: '#172126', muted: '#718087', line: '#E4EBE8', canvas: '#F6F8F5', white: '#FFFFFF', green: '#0E7C66' };

export default function RestockSheet({ productName, unit, onClose, onSubmit }: { productName: string; unit: string; onClose: () => void; onSubmit: (quantity: number) => void }) {
  const [quantity, setQuantity] = React.useState('');
  return <SafeAreaView style={styles.screen}><View style={styles.content}><Text style={styles.kicker}>INVENTORY</Text><Text style={styles.title}>Restock product</Text><Text style={styles.subtitle}>{productName}</Text><Text style={styles.label}>Quantity to add ({unit})</Text><TextInput autoFocus value={quantity} onChangeText={setQuantity} keyboardType="decimal-pad" placeholder="e.g. 25" placeholderTextColor={colors.muted} style={styles.input} /><Pressable onPress={() => { const value = Number(quantity); if (value > 0) onSubmit(value); }} style={styles.button}><Text style={styles.buttonText}>Add stock</Text></Pressable><Pressable onPress={onClose} style={styles.cancel}><Text style={styles.cancelText}>Cancel</Text></Pressable></View></SafeAreaView>;
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: colors.canvas }, content: { flex: 1, padding: 24 }, kicker: { color: colors.green, fontSize: 11, fontWeight: '800', letterSpacing: 1.3 }, title: { color: colors.ink, fontSize: 30, fontWeight: '900', marginTop: 4 }, subtitle: { color: colors.muted, fontSize: 15, marginTop: 8, marginBottom: 32 }, label: { color: colors.ink, fontSize: 12, fontWeight: '800', marginBottom: 8 }, input: { backgroundColor: colors.white, borderColor: colors.line, borderWidth: 1, borderRadius: 10, padding: 14, color: colors.ink, fontSize: 16 }, button: { backgroundColor: colors.green, padding: 16, borderRadius: 11, alignItems: 'center', marginTop: 16 }, buttonText: { color: colors.white, fontWeight: '800' }, cancel: { padding: 16, alignItems: 'center', marginTop: 8 }, cancelText: { color: colors.muted, fontWeight: '800' } });
