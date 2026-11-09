import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AuthScreen from '../src/components/AuthScreen';
import ProductForm from '../src/components/ProductForm';
import SettingsView from '../src/components/SettingsView';
import RestockSheet from '../src/components/RestockSheet';
import ProductActions from '../src/components/ProductActions';
import POSScreen from '../src/components/POSScreen';
import { storeCategories, unitsByCategory } from '../src/constants/catalog';
import { useAppStore } from '../src/store/useAppStore';
import { PaymentMethod, Product } from '../src/types';
import { firebaseAuth } from '../src/services/firebase/config';
import { loadStoreData, removeProduct, saveCustomCategory, saveCustomUnit, saveProduct } from '../src/services/firebase/data';
import { completeSaleAtomic } from '../src/services/firebase/sales';
import { logOut } from '../src/services/auth/auth';
import { formatPkr } from '../src/utils/currency';

const colors = { ink: '#172126', muted: '#718087', line: '#E4EBE8', canvas: '#F6F8F5', white: '#FFFFFF', green: '#0E7C66', mint: '#DDF3E9', coral: '#D9674C', amber: '#F1B95A' };

type Tab = 'Overview' | 'Inventory' | 'POS' | 'Sales' | 'Settings';
const EMPTY_PRODUCTS: Product[] = [];
const EMPTY_SALES: ReturnType<typeof useAppStore.getState>['salesByStore'][string] = [];
const EMPTY_STRINGS: string[] = [];

export default function HomeScreen() {
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const [tab, setTab] = useState<Tab>('Overview');
  const [showAdd, setShowAdd] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [restockingProduct, setRestockingProduct] = useState<Product | null>(null);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [newProduct, setNewProduct] = useState({ name: '', sku: '', category: 'Lighting', customCategory: '', unit: 'Piece', customUnit: '', purchasePrice: '', sellingPrice: '', stockQuantity: '', minimumStock: '' });
  const activeStoreId = useAppStore((state) => state.activeStoreId);
  const store = useAppStore((state) => state.stores.find((item) => item.id === activeStoreId));
  const products = useAppStore((state) => state.productsByStore[activeStoreId] ?? EMPTY_PRODUCTS);
  const sales = useAppStore((state) => state.salesByStore[activeStoreId] ?? EMPTY_SALES);
  const addProduct = useAppStore((state) => state.addProduct);
  const completeSale = useAppStore((state) => state.completeSale);
  const updateProduct = useAppStore((state) => state.updateProduct);
  const restockProduct = useAppStore((state) => state.restockProduct);
  const deleteProduct = useAppStore((state) => state.deleteProduct);
  const setAuthenticated = useAppStore((state) => state.setAuthenticated);
  const replaceRemoteData = useAppStore((state) => state.replaceRemoteData);
  const addCustomCategory = useAppStore((state) => state.addCustomCategory);
  const addCustomUnit = useAppStore((state) => state.addCustomUnit);
  const customCategories = useAppStore((state) => state.customCategoriesByStore[activeStoreId] ?? EMPTY_STRINGS);
  const customUnits = useAppStore((state) => state.customUnitsByStore[activeStoreId] ?? EMPTY_STRINGS);

  useEffect(() => {
    const userId = firebaseAuth.currentUser?.uid;
    if (!isAuthenticated || !userId) return;
    loadStoreData(userId).then(replaceRemoteData).catch((error) => Alert.alert('Sync issue', error instanceof Error ? error.message : 'Could not load your Firebase data.'));
  }, [isAuthenticated, replaceRemoteData]);

  const filteredProducts = useMemo(() => products.filter((product) => `${product.name} ${product.sku} ${product.category}`.toLowerCase().includes(search.toLowerCase())), [products, search]);
  const cartItems = products.filter((product) => cart[product.id]).map((product) => ({ product, quantity: cart[product.id] }));
  const cartTotal = cartItems.reduce((sum, item) => sum + item.product.sellingPrice * item.quantity, 0);
  const todaySales = sales.filter((sale) => new Date(sale.createdAt).toDateString() === new Date().toDateString());
  const revenue = todaySales.reduce((sum, sale) => sum + sale.total, 0);
  const stockValue = products.reduce((sum, product) => sum + product.purchasePrice * product.stockQuantity, 0);
  const lowStock = products.filter((product) => product.stockQuantity <= product.minimumStock);

  if (!isAuthenticated) return <AuthScreen />;

  const submitProduct = async () => {
    if (!newProduct.name || !newProduct.sellingPrice || !newProduct.stockQuantity) {
      Alert.alert('Missing details', 'Add a name, selling price, and available stock.');
      return;
    }
    const category = newProduct.category === 'Other' ? newProduct.customCategory.trim() : newProduct.category;
    const unit = newProduct.unit === 'Other' ? newProduct.customUnit.trim() : newProduct.unit;
    if (!category || !unit) return Alert.alert('Complete product details', 'Name your custom category and unit.');
    setSavingProduct(true);
    try {
      const productDraft = { name: newProduct.name.trim(), sku: newProduct.sku.trim(), category, unit, purchasePrice: Number(newProduct.purchasePrice) || 0, sellingPrice: Number(newProduct.sellingPrice), stockQuantity: Number(newProduct.stockQuantity), minimumStock: Number(newProduct.minimumStock) || 0 };
      const created = editingProduct ? updateProduct(editingProduct.id, productDraft) : addProduct(productDraft);
      if (!created) return Alert.alert('Product already exists', 'A product with this SKU is already in this store.');
      const userId = firebaseAuth.currentUser?.uid;
      if (userId) {
        await saveProduct(userId, activeStoreId, created);
        if (newProduct.category === 'Other') { await saveCustomCategory(userId, activeStoreId, category); addCustomCategory(category); }
        if (newProduct.unit === 'Other') { await saveCustomUnit(userId, activeStoreId, unit); addCustomUnit(unit); }
      }
      setNewProduct({ name: '', sku: '', category: 'Lighting', customCategory: '', unit: 'Piece', customUnit: '', purchasePrice: '', sellingPrice: '', stockQuantity: '', minimumStock: '' });
      setShowAdd(false);
      setEditingProduct(null);
    } catch (error) {
      Alert.alert('Could not save product', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSavingProduct(false);
    }
  };

  const openEdit = (product: Product) => { setEditingProduct(product); setNewProduct({ name: product.name, sku: product.sku, category: product.category, customCategory: '', unit: product.unit, customUnit: '', purchasePrice: String(product.purchasePrice), sellingPrice: String(product.sellingPrice), stockQuantity: String(product.stockQuantity), minimumStock: String(product.minimumStock) }); setShowAdd(true); };
  const handleDelete = (product: Product) => Alert.alert('Delete product?', `${product.name} will be removed from this store.`, [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: async () => { deleteProduct(product.id); const userId = firebaseAuth.currentUser?.uid; if (userId) await removeProduct(userId, activeStoreId, product.id); } }]);
  const submitRestock = async (quantity: number) => { if (!restockingProduct) return; const updated = restockProduct(restockingProduct.id, quantity); const userId = firebaseAuth.currentUser?.uid; if (updated && userId) await saveProduct(userId, activeStoreId, updated); setRestockingProduct(null); };

  const confirmSale = async (saleDetails: { customerName: string; billNumber: string; billBookNumber: string; contact: string }) => {
    if (!cartItems.length) return;
    try {
      const items = cartItems.map(({ product, quantity }) => ({ productId: product.id, name: product.name, unit: product.unit, quantity, sellingPrice: product.sellingPrice, purchasePrice: product.purchasePrice }));
      const userId = firebaseAuth.currentUser?.uid;
      if (userId) await completeSaleAtomic(userId, activeStoreId, { ...saleDetails, items, subtotal: cartTotal, discount: 0, total: cartTotal, paymentMethod, amountReceived: cartTotal });
      completeSale({ ...saleDetails, items, subtotal: cartTotal, discount: 0, total: cartTotal, paymentMethod });
      setCart({});
      Alert.alert('Sale completed', 'Inventory was updated and the invoice was saved.');
      setTab('Sales');
    } catch (error) {
      Alert.alert('Sale not completed', error instanceof Error ? error.message : 'Stock may have changed. Please try again.');
    }
  };

  const handleSignOut = async () => { try { await logOut(); setAuthenticated(false); setTab('Overview'); } catch (error) { Alert.alert('Could not sign out', error instanceof Error ? error.message : 'Please try again.'); } };

  if (showAdd) return <ProductForm value={newProduct} setValue={setNewProduct} categories={[...new Set(['Lighting', 'Cables', 'Switches', 'Fittings', ...customCategories, 'Other'])]} units={[...new Set([...unitsByCategory['Electrical Store'], ...customUnits, 'Other'])]} onClose={() => { setShowAdd(false); setEditingProduct(null); }} onSubmit={submitProduct} submitting={savingProduct} editing={Boolean(editingProduct)} />;
  if (restockingProduct) return <RestockSheet productName={restockingProduct.name} unit={restockingProduct.unit} onClose={() => setRestockingProduct(null)} onSubmit={submitRestock} />;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View><Text style={styles.eyebrow}>STORE OPERATIONS</Text><Text style={styles.title}>{store?.name ?? 'Your store'}</Text><Text style={styles.subtitle}>{store?.category}  •  {store?.address}</Text></View>
          <Pressable onPress={() => setTab('Settings')} style={styles.avatar}><Text style={styles.avatarText}>AM</Text></Pressable>
        </View>
        <View style={styles.tabs}>{(['Overview', 'Inventory', 'POS', 'Sales'] as Tab[]).map((item) => <Pressable key={item} onPress={() => setTab(item)} style={[styles.tab, tab === item && styles.activeTab]}><Text style={[styles.tabText, tab === item && styles.activeTabText]}>{item}</Text></Pressable>)}</View>

        {tab === 'Overview' && <Overview revenue={revenue} products={products} stockValue={stockValue} lowStock={lowStock} sales={sales} onAdd={() => setShowAdd(true)} onNavigate={setTab} />}
        {tab === 'Inventory' && <Inventory products={filteredProducts} search={search} setSearch={setSearch} onAdd={() => { setEditingProduct(null); setShowAdd(true); }} onEdit={openEdit} onRestock={setRestockingProduct} onDelete={handleDelete} />}
        {tab === 'POS' && <POSScreen products={filteredProducts} search={search} setSearch={setSearch} cart={cart} setCart={setCart} cartItems={cartItems} cartTotal={cartTotal} paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} onConfirm={confirmSale} />}
        {tab === 'Sales' && <Sales sales={sales} />}
        {tab === 'Settings' && <SettingsView store={store} onSignOut={handleSignOut} />}
      </ScrollView>
    </SafeAreaView>
  );
}

function Overview({ revenue, products, stockValue, lowStock, sales, onAdd, onNavigate }: { revenue: number; products: Product[]; stockValue: number; lowStock: Product[]; sales: ReturnType<typeof useAppStore.getState>['salesByStore'][string]; onAdd: () => void; onNavigate: (tab: Tab) => void }) {
  return <>
    <View style={styles.hero}><View><Text style={styles.heroLabel}>TODAY'S REVENUE</Text><Text style={styles.heroValue}>{formatPkr(revenue)}</Text><Text style={styles.heroMeta}>Live from completed sales</Text></View><Text style={styles.heroIcon}>↗</Text></View>
    <View style={styles.metrics}><Metric label="Products" value={products.length.toString()} /><Metric label="Stock value" value={formatPkr(stockValue)} /><Metric label="Low stock" value={lowStock.length.toString()} alert /></View>
    <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Quick actions</Text></View><View style={styles.actionRow}><Action label="Add product" icon="+" onPress={onAdd} /><Action label="Open POS" icon="₹" onPress={() => onNavigate('POS')} /><Action label="Inventory" icon="▦" onPress={() => onNavigate('Inventory')} /><Action label="Settings" icon="⚙" onPress={() => onNavigate('Settings')} /></View>
    <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Needs attention</Text><Pressable onPress={() => onNavigate('Inventory')}><Text style={styles.link}>View all</Text></Pressable></View>
    {lowStock.length ? lowStock.slice(0, 3).map((product) => <StockRow key={product.id} product={product} />) : <EmptyState title="Stock levels look healthy" body="No products are below their minimum threshold." />}
    <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Recent transactions</Text><Pressable onPress={() => onNavigate('Sales')}><Text style={styles.link}>See history</Text></Pressable></View>
    {sales.slice(0, 3).map((sale) => <View style={styles.transaction} key={sale.id}><View><Text style={styles.transactionTitle}>{sale.invoiceNumber}</Text><Text style={styles.transactionMeta}>{sale.items.length} item{sale.items.length === 1 ? '' : 's'}  •  {sale.paymentMethod}</Text></View><Text style={styles.transactionAmount}>{formatPkr(sale.total)}</Text></View>)}
  </>;
}

function Inventory({ products, search, setSearch, onAdd, onEdit, onRestock, onDelete }: { products: Product[]; search: string; setSearch: (value: string) => void; onAdd: () => void; onEdit: (product: Product) => void; onRestock: (product: Product) => void; onDelete: (product: Product) => void }) {
  return <><View style={styles.sectionHeader}><View><Text style={styles.sectionTitle}>Product inventory</Text><Text style={styles.sectionSub}>{products.length} products in this store</Text></View><Pressable style={styles.primaryButton} onPress={onAdd}><Text style={styles.primaryButtonText}>+ Add</Text></Pressable></View><TextInput value={search} onChangeText={setSearch} placeholder="Search name, SKU or category" placeholderTextColor={colors.muted} style={styles.search} />{products.map((product) => <View style={styles.productRow} key={product.id}><View style={styles.productIcon}><Text style={styles.productIconText}>{product.name.charAt(0)}</Text></View><View style={styles.productInfo}><Text style={styles.productName}>{product.name}</Text><Text style={styles.productMeta}>{product.sku || 'No SKU'}  •  {product.unit}</Text><Text style={[styles.stock, product.stockQuantity <= product.minimumStock && styles.stockAlert]}>{product.stockQuantity} {product.unit.toLowerCase()}{product.stockQuantity === 1 ? '' : 's'} available</Text></View><View style={styles.productRight}><Text style={styles.price}>{formatPkr(product.sellingPrice)}</Text><ProductActions product={product} onRestock={onRestock} onEdit={onEdit} onDelete={onDelete} /></View></View>)}</>;
}

function POS({ products, search, setSearch, cart, setCart, cartItems, cartTotal, paymentMethod, setPaymentMethod, onConfirm }: { products: Product[]; search: string; setSearch: (value: string) => void; cart: Record<string, number>; setCart: (value: Record<string, number>) => void; cartItems: { product: Product; quantity: number }[]; cartTotal: number; paymentMethod: PaymentMethod; setPaymentMethod: (method: PaymentMethod) => void; onConfirm: () => void }) {
  const add = (product: Product) => setCart({ ...cart, [product.id]: Math.min((cart[product.id] ?? 0) + 1, product.stockQuantity) });
  return <><Text style={styles.sectionTitle}>Create a bill</Text><Text style={styles.sectionSub}>Tap a product to add it to the cart</Text><TextInput value={search} onChangeText={setSearch} placeholder="Search products or scan SKU" placeholderTextColor={colors.muted} style={styles.search} />{products.slice(0, 4).map((product) => <Pressable style={styles.posProduct} key={product.id} onPress={() => add(product)}><View><Text style={styles.productName}>{product.name}</Text><Text style={styles.productMeta}>{product.stockQuantity} available  •  {product.unit}</Text></View><Text style={styles.posPrice}>₹{product.sellingPrice}</Text></Pressable>)}<View style={styles.cartPanel}><View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Current cart</Text><Text style={styles.cartCount}>{cartItems.length} lines</Text></View>{cartItems.length ? cartItems.map(({ product, quantity }) => <View style={styles.cartRow} key={product.id}><View style={{ flex: 1 }}><Text style={styles.productName}>{product.name}</Text><Text style={styles.productMeta}>₹{product.sellingPrice} × {quantity}</Text></View><Pressable onPress={() => setCart({ ...cart, [product.id]: quantity - 1 })}><Text style={styles.stepper}>−</Text></Pressable><Text style={styles.quantity}>{quantity}</Text><Pressable onPress={() => add(product)}><Text style={styles.stepper}>+</Text></Pressable></View>) : <EmptyState title="Cart is empty" body="Choose products above to start a sale." />}<View style={styles.totalRow}><Text style={styles.totalLabel}>Total payable</Text><Text style={styles.totalValue}>₹{cartTotal.toLocaleString('en-IN')}</Text></View><View style={styles.paymentRow}>{(['Cash', 'Card', 'Bank Transfer'] as PaymentMethod[]).map((method) => <Pressable key={method} onPress={() => setPaymentMethod(method)} style={[styles.paymentChip, paymentMethod === method && styles.paymentChipActive]}><Text style={[styles.paymentText, paymentMethod === method && styles.paymentTextActive]}>{method}</Text></Pressable>)}</View><Pressable disabled={!cartItems.length} onPress={onConfirm} style={[styles.checkout, !cartItems.length && styles.disabled]}><Text style={styles.checkoutText}>Confirm sale  •  ₹{cartTotal.toLocaleString('en-IN')}</Text></Pressable></View></>;
}

function Sales({ sales }: { sales: ReturnType<typeof useAppStore.getState>['salesByStore'][string] }) { return <><Text style={styles.sectionTitle}>Sales history</Text><Text style={styles.sectionSub}>{sales.length} completed transactions</Text>{sales.map((sale) => <View style={styles.saleRow} key={sale.id}><View><Text style={styles.transactionTitle}>{sale.invoiceNumber}</Text><Text style={styles.transactionMeta}>{new Date(sale.createdAt).toLocaleDateString()}  •  {sale.paymentMethod}  •  {sale.items.length} item{sale.items.length === 1 ? '' : 's'}</Text></View><View style={{ alignItems: 'flex-end' }}><Text style={styles.transactionAmount}>{formatPkr(sale.total)}</Text><Text style={styles.status}>COMPLETED</Text></View></View>)}</>; }

function LegacySettings() { return null; }

function LegacyAddProductForm() { return null; }

function Metric({ label, value, alert }: { label: string; value: string; alert?: boolean }) { return <View style={styles.metric}><Text style={styles.metricLabel}>{label}</Text><Text style={[styles.metricValue, alert && styles.metricAlert]}>{value}</Text></View>; }
function Action({ label, icon, onPress }: { label: string; icon: string; onPress: () => void }) { return <Pressable style={styles.action} onPress={onPress}><Text style={styles.actionIcon}>{icon}</Text><Text style={styles.actionText}>{label}</Text></Pressable>; }
function StockRow({ product }: { product: Product }) { return <View style={styles.stockRow}><View style={styles.warningDot} /><View style={{ flex: 1 }}><Text style={styles.productName}>{product.name}</Text><Text style={styles.productMeta}>Only {product.stockQuantity} {product.unit.toLowerCase()} left</Text></View><Text style={styles.restock}>RESTOCK</Text></View>; }
function EmptyState({ title, body }: { title: string; body: string }) { return <View style={styles.empty}><Text style={styles.emptyTitle}>{title}</Text><Text style={styles.emptyBody}>{body}</Text></View>; }

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.canvas }, content: { padding: 20, paddingBottom: 48 }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }, eyebrow: { color: colors.green, fontSize: 11, fontWeight: '800', letterSpacing: 1.4 }, title: { color: colors.ink, fontSize: 27, fontWeight: '800', marginTop: 5 }, subtitle: { color: colors.muted, fontSize: 12, marginTop: 5 }, avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' }, avatarText: { color: colors.white, fontWeight: '800' }, tabs: { flexDirection: 'row', backgroundColor: colors.white, borderRadius: 12, padding: 4, marginBottom: 20, borderWidth: 1, borderColor: colors.line }, tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 9 }, activeTab: { backgroundColor: colors.ink }, tabText: { color: colors.muted, fontSize: 12, fontWeight: '700' }, activeTabText: { color: colors.white }, hero: { backgroundColor: colors.green, borderRadius: 18, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }, heroLabel: { color: '#BCE4D4', fontWeight: '800', fontSize: 11, letterSpacing: 1 }, heroValue: { color: colors.white, fontSize: 32, fontWeight: '800', marginTop: 5 }, heroMeta: { color: '#CDECE0', fontSize: 12, marginTop: 5 }, heroIcon: { color: colors.white, fontSize: 46, fontWeight: '200' }, metrics: { flexDirection: 'row', gap: 8, marginBottom: 26 }, metric: { backgroundColor: colors.white, flex: 1, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: colors.line }, metricLabel: { color: colors.muted, fontSize: 11, fontWeight: '700' }, metricValue: { color: colors.ink, fontSize: 20, fontWeight: '800', marginTop: 7 }, metricAlert: { color: colors.coral }, sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, marginBottom: 12 }, sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: '800' }, sectionSub: { color: colors.muted, fontSize: 12, marginTop: 4, marginBottom: 16 }, link: { color: colors.green, fontSize: 12, fontWeight: '800' }, actionRow: { flexDirection: 'row', gap: 9, marginBottom: 25 }, action: { backgroundColor: colors.white, borderRadius: 14, padding: 13, flex: 1, minHeight: 75, borderWidth: 1, borderColor: colors.line }, actionIcon: { color: colors.green, fontSize: 20, fontWeight: '700' }, actionText: { color: colors.ink, fontSize: 11, fontWeight: '800', marginTop: 8 }, stockRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, padding: 14, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.line }, warningDot: { backgroundColor: '#FFE7C0', width: 10, height: 10, borderRadius: 5, marginRight: 12 }, restock: { color: colors.coral, fontWeight: '800', fontSize: 10 }, transaction: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.white, padding: 14, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.line }, transactionTitle: { color: colors.ink, fontSize: 13, fontWeight: '800' }, transactionMeta: { color: colors.muted, fontSize: 11, marginTop: 5 }, transactionAmount: { color: colors.ink, fontSize: 14, fontWeight: '800' }, search: { backgroundColor: colors.white, borderColor: colors.line, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: colors.ink, marginBottom: 12, fontSize: 13 }, primaryButton: { backgroundColor: colors.ink, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 9 }, primaryButtonText: { color: colors.white, fontWeight: '800', fontSize: 12 }, productRow: { backgroundColor: colors.white, borderRadius: 14, padding: 13, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.line, marginBottom: 8 }, productIcon: { width: 38, height: 38, borderRadius: 11, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center', marginRight: 11 }, productIconText: { color: colors.green, fontWeight: '800', fontSize: 16 }, productInfo: { flex: 1 }, productName: { color: colors.ink, fontSize: 13, fontWeight: '800' }, productMeta: { color: colors.muted, fontSize: 11, marginTop: 4 }, productRight: { alignItems: 'flex-end' }, price: { color: colors.ink, fontWeight: '800', fontSize: 13 }, stock: { color: colors.green, fontSize: 11, marginTop: 4, fontWeight: '700' }, stockAlert: { color: colors.coral }, posProduct: { backgroundColor: colors.white, padding: 15, borderRadius: 12, borderWidth: 1, borderColor: colors.line, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between' }, posPrice: { color: colors.green, fontWeight: '800' }, cartPanel: { backgroundColor: colors.white, borderRadius: 16, padding: 16, marginTop: 12, borderWidth: 1, borderColor: colors.line }, cartCount: { color: colors.muted, fontSize: 12 }, cartRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.line }, stepper: { color: colors.green, fontSize: 24, paddingHorizontal: 8 }, quantity: { color: colors.ink, fontWeight: '800', minWidth: 18, textAlign: 'center' }, totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 18 }, totalLabel: { color: colors.muted, fontWeight: '700' }, totalValue: { color: colors.ink, fontSize: 22, fontWeight: '800' }, paymentRow: { flexDirection: 'row', gap: 6, marginBottom: 15 }, paymentChip: { borderWidth: 1, borderColor: colors.line, paddingVertical: 9, paddingHorizontal: 9, borderRadius: 8 }, paymentChipActive: { backgroundColor: colors.mint, borderColor: colors.green }, paymentText: { color: colors.muted, fontSize: 10, fontWeight: '700' }, paymentTextActive: { color: colors.green }, checkout: { backgroundColor: colors.green, padding: 15, borderRadius: 11, alignItems: 'center' }, checkoutText: { color: colors.white, fontWeight: '800', fontSize: 13 }, disabled: { opacity: 0.4 }, saleRow: { backgroundColor: colors.white, padding: 15, borderRadius: 13, marginBottom: 8, borderWidth: 1, borderColor: colors.line, flexDirection: 'row', justifyContent: 'space-between' }, status: { color: colors.green, fontSize: 9, fontWeight: '800', marginTop: 5 }, empty: { backgroundColor: colors.white, padding: 18, borderRadius: 12, borderWidth: 1, borderColor: colors.line, marginBottom: 16 }, emptyTitle: { color: colors.ink, fontWeight: '800', fontSize: 13 }, emptyBody: { color: colors.muted, fontSize: 12, marginTop: 5 }, modalBackdrop: { position: 'absolute', inset: 0, backgroundColor: 'rgba(23,33,38,0.42)', justifyContent: 'flex-end' }, modal: { backgroundColor: colors.canvas, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20, paddingBottom: 34 }, close: { fontSize: 30, color: colors.muted, lineHeight: 28 }, input: { backgroundColor: colors.white, borderColor: colors.line, borderWidth: 1, borderRadius: 10, paddingHorizontal: 13, paddingVertical: 11, color: colors.ink, marginBottom: 8, fontSize: 13 }, inputRow: { flexDirection: 'row', gap: 8 }, half: { flex: 1 }, fieldLabel: { color: colors.muted, fontSize: 11, fontWeight: '800', marginTop: 4, marginBottom: 7 }, smallChip: { borderWidth: 1, borderColor: colors.line, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 10, backgroundColor: colors.white, marginRight: 6 }, smallChipActive: { backgroundColor: colors.mint, borderColor: colors.green }, smallChipText: { color: colors.muted, fontSize: 11, fontWeight: '700' }, smallChipTextActive: { color: colors.green },
});
