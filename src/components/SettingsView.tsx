import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Store } from '../types';

const colors = { ink: '#172126', muted: '#718087', line: '#E4EBE8', canvas: '#F6F8F5', white: '#FFFFFF', coral: '#D9674C', green: '#0E7C66' };

type Props = { store?: Store; onSignOut: () => void };

export default function SettingsView({ store, onSignOut }: Props) {
  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.content}><Text style={styles.kicker}>ACCOUNT</Text><Text style={styles.title}>Settings</Text><Text style={styles.subtitle}>Manage your account and active store.</Text><View style={styles.card}><Text style={styles.cardLabel}>ACTIVE STORE</Text><Text style={styles.storeName}>{store?.name ?? 'Your store'}</Text><SettingRow label="Store type" value={store?.category ?? 'Not set'} /><SettingRow label="Owner" value={store?.ownerName ?? 'Not set'} /><SettingRow label="Contact" value={store?.phone ?? 'Not set'} /><SettingRow label="Address" value={store?.address ?? 'Not set'} /></View><Pressable onPress={() => Alert.alert('Sign out?', 'You will need to sign in again to access this store.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Sign out', style: 'destructive', onPress: onSignOut }])} style={styles.signOut}><Text style={styles.signOutText}>Sign out</Text></Pressable></ScrollView></SafeAreaView>;
}

function SettingRow({ label, value }: { label: string; value: string }) { return <View style={styles.row}><Text style={styles.key}>{label}</Text><Text style={styles.value}>{value}</Text></View>; }

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.canvas }, content: { flexGrow: 1, padding: 24 }, kicker: { color: colors.green, fontSize: 11, fontWeight: '800', letterSpacing: 1.3 }, title: { color: colors.ink, fontSize: 30, fontWeight: '900', marginTop: 4 }, subtitle: { color: colors.muted, fontSize: 13, marginTop: 8, marginBottom: 28 }, card: { backgroundColor: colors.white, borderRadius: 15, borderWidth: 1, borderColor: colors.line, padding: 16, marginBottom: 16 }, cardLabel: { color: colors.green, fontSize: 10, fontWeight: '800', letterSpacing: 1.2, marginBottom: 6 }, storeName: { color: colors.ink, fontSize: 20, fontWeight: '800', marginBottom: 14 }, row: { borderTopWidth: 1, borderTopColor: colors.line, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', gap: 12 }, key: { color: colors.muted, fontSize: 12 }, value: { color: colors.ink, fontSize: 12, fontWeight: '700', flex: 1, textAlign: 'right' }, signOut: { backgroundColor: '#FCE8E4', borderRadius: 11, padding: 15, alignItems: 'center' }, signOutText: { color: colors.coral, fontWeight: '800', fontSize: 13 } });
