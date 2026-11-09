import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { storeCategories } from '../constants/catalog';
import { signIn, signUp, resetPassword } from '../services/auth/auth';
import { firebaseEnabled } from '../services/firebase/config';
import { saveStore, saveUserProfile } from '../services/firebase/data';
import { useAppStore } from '../store/useAppStore';
import { StoreCategory } from '../types';

const colors = { ink: '#172126', muted: '#718087', line: '#E4EBE8', canvas: '#F6F8F5', white: '#FFFFFF', green: '#0E7C66', mint: '#DDF3E9', coral: '#D9674C' };
type AuthMode = 'signin' | 'signup' | 'forgot';

export default function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [storeName, setStoreName] = useState('');
  const [category, setCategory] = useState<StoreCategory>('Electrical Store');
  const [loading, setLoading] = useState(false);
  const addStore = useAppStore((state) => state.addStore);
  const setAuthenticated = useAppStore((state) => state.setAuthenticated);

  const submit = async () => {
    if (!email.trim() || !email.includes('@')) return Alert.alert('Check your email', 'Enter a valid email address.');
    if (mode !== 'forgot' && password.length < 6) return Alert.alert('Password too short', 'Use at least 6 characters.');
    if (mode === 'signup' && (!name.trim() || !phone.trim() || !storeName.trim())) return Alert.alert('Complete your profile', 'Add your name, contact number, and store name.');
    setLoading(true);
    try {
      if (mode === 'forgot') {
        if (firebaseEnabled) await resetPassword(email);
        Alert.alert('Check your inbox', firebaseEnabled ? 'A password reset link has been sent.' : 'Demo mode does not send emails.');
        setMode('signin');
      } else if (mode === 'signup') {
        const credential = firebaseEnabled ? await signUp(email, password) : null;
        const createdStore = addStore({ name: storeName.trim(), category, ownerName: name.trim(), phone: phone.trim(), address: 'Add your store address in settings' });
        if (credential?.user) {
          await saveUserProfile(credential.user.uid, { name: name.trim(), phone: phone.trim(), email: email.trim() });
          await saveStore(credential.user.uid, createdStore);
        }
        setAuthenticated(true);
      } else {
        if (firebaseEnabled) await signIn(email, password);
        setAuthenticated(true);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message.replace('Firebase: ', '').replace(/ \(auth\/.*\)\.?/, '') : 'Something went wrong. Please try again.';
      Alert.alert('Unable to continue', message);
    } finally {
      setLoading(false);
    }
  };

  const title = mode === 'signup' ? 'Set up your store' : mode === 'forgot' ? 'Reset your password' : 'Welcome back';
  const subtitle = mode === 'signup' ? 'Create your workspace in under a minute.' : mode === 'forgot' ? 'Enter your email and we will help you get back in.' : 'Run your stores with clarity.';

  return <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled"><View style={styles.brandMark}><Text style={styles.brandGlyph}>S</Text></View><Text style={styles.brand}>STORE<Text style={styles.brandAccent}>FLOW</Text></Text><Text style={styles.title}>{title}</Text><Text style={styles.subtitle}>{subtitle}</Text>
    {mode === 'signup' && <><Field label="Your name" value={name} onChangeText={setName} placeholder="e.g. Aarav Mehta" /><Field label="Contact number" value={phone} onChangeText={setPhone} placeholder="e.g. +91 98765 43210" keyboardType="phone-pad" /><Field label="Store name" value={storeName} onChangeText={setStoreName} placeholder="e.g. Northstar Electricals" /><Text style={styles.label}>Store type</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>{storeCategories.map((item) => <Pressable key={item} onPress={() => setCategory(item)} style={[styles.category, category === item && styles.categorySelected]}><Text style={[styles.categoryText, category === item && styles.categoryTextSelected]}>{item}</Text></Pressable>)}</ScrollView></>}
    <Field label="Email address" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" />
    {mode !== 'forgot' && <Field label="Password" value={password} onChangeText={setPassword} placeholder="At least 6 characters" secureTextEntry />}
    {mode === 'signin' && <Pressable onPress={() => setMode('forgot')} style={styles.forgot}><Text style={styles.link}>Forgot password?</Text></Pressable>}
    <Pressable onPress={submit} disabled={loading} style={[styles.button, loading && styles.disabled]}><Text style={styles.buttonText}>{loading ? 'Please wait...' : mode === 'signup' ? 'Create account' : mode === 'forgot' ? 'Send reset link' : 'Sign in'}</Text></Pressable>
    <View style={styles.switchRow}><Text style={styles.switchText}>{mode === 'signup' ? 'Already have an account?' : 'New to StoreFlow?'}</Text><Pressable onPress={() => setMode(mode === 'signup' ? 'signin' : 'signup')}><Text style={styles.link}>{mode === 'signup' ? ' Sign in' : ' Create account'}</Text></Pressable></View>
    {!firebaseEnabled && <Text style={styles.demo}>Demo mode is active. Add Firebase values to .env for real authentication.</Text>}
  </ScrollView></KeyboardAvoidingView>;
}

function Field({ label, value, onChangeText, placeholder, secureTextEntry, keyboardType, autoCapitalize }: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; secureTextEntry?: boolean; keyboardType?: 'default' | 'email-address' | 'phone-pad'; autoCapitalize?: 'none' | 'sentences' }) { return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.muted} style={styles.input} secureTextEntry={secureTextEntry} keyboardType={keyboardType} autoCapitalize={autoCapitalize} /></View>; }

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: colors.canvas }, content: { padding: 28, paddingTop: 64, paddingBottom: 40 }, brandMark: { width: 44, height: 44, borderRadius: 13, backgroundColor: colors.green, justifyContent: 'center', alignItems: 'center', marginBottom: 14 }, brandGlyph: { color: colors.white, fontSize: 24, fontWeight: '900' }, brand: { color: colors.ink, fontSize: 15, fontWeight: '900', letterSpacing: 2, marginBottom: 48 }, brandAccent: { color: colors.green }, title: { color: colors.ink, fontSize: 30, fontWeight: '900', letterSpacing: 0 }, subtitle: { color: colors.muted, fontSize: 14, marginTop: 8, marginBottom: 28 }, field: { marginBottom: 15 }, label: { color: colors.ink, fontSize: 12, fontWeight: '800', marginBottom: 7 }, input: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: 11, paddingHorizontal: 14, paddingVertical: 13, color: colors.ink, fontSize: 14 }, categoryRow: { paddingBottom: 18 }, category: { borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 9, marginRight: 7 }, categorySelected: { backgroundColor: colors.mint, borderColor: colors.green }, categoryText: { color: colors.muted, fontSize: 11, fontWeight: '700' }, categoryTextSelected: { color: colors.green }, forgot: { alignSelf: 'flex-end', marginTop: -4, marginBottom: 20 }, link: { color: colors.green, fontWeight: '800', fontSize: 13 }, button: { backgroundColor: colors.green, borderRadius: 11, paddingVertical: 15, alignItems: 'center', marginTop: 6 }, buttonText: { color: colors.white, fontSize: 14, fontWeight: '900' }, disabled: { opacity: 0.55 }, switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 22 }, switchText: { color: colors.muted, fontSize: 13 }, demo: { color: colors.muted, textAlign: 'center', fontSize: 11, lineHeight: 16, marginTop: 28 },
});
