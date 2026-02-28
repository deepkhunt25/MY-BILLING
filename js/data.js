// ========================================
// DATA.JS — Server API Layer (replaces localStorage)
// All data is stored on the Node.js server (data/db.json)
// ========================================

const API = '/api';

// ─── Generic API Helpers ─────────────────────
async function apiGet(endpoint) {
    const res = await fetch(API + endpoint);
    if (!res.ok) throw new Error('API Error: ' + endpoint);
    return res.json();
}

async function apiPost(endpoint, body) {
    const res = await fetch(API + endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error('API Error: ' + endpoint);
    return res.json();
}

async function apiPut(endpoint, body) {
    const res = await fetch(API + endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error('API Error: ' + endpoint);
    return res.json();
}

async function apiDelete(endpoint) {
    const res = await fetch(API + endpoint, { method: 'DELETE' });
    if (!res.ok) throw new Error('API Error: ' + endpoint);
    return res.json();
}

// ─── In-memory cache (sync access for rendering) ─────────────────────
let _cache = {
    business: { name: 'Your Business', address: '', phone: '', gstin: '', logo: null },
    customers: [],
    products: [],
    invoices: [],
    deletedInvoices: [],
    upiAccounts: [],
    stats: { totalRevenue: 0, invoiceCount: 0, paidCount: 0, dueCount: 0, unpaidCount: 0, paidAmount: 0, dueAmount: 0, unpaidAmount: 0 }
};

// Load all data from server into cache
async function loadAllData() {
    try {
        const [business, customers, products, invoices, deletedInvoices, upiAccounts, stats] = await Promise.all([
            apiGet('/business'),
            apiGet('/customers'),
            apiGet('/products'),
            apiGet('/invoices'),
            apiGet('/deleted-invoices'),
            apiGet('/upi-accounts'),
            apiGet('/stats')
        ]);
        _cache.business = business;
        _cache.customers = customers;
        _cache.products = products;
        _cache.invoices = invoices;
        _cache.deletedInvoices = deletedInvoices;
        _cache.upiAccounts = upiAccounts;
        _cache.stats = stats;
    } catch (e) {
        console.error('Failed to load data from server:', e);
    }
}

// Refresh cache and re-render current page
async function refreshAndRender() {
    await loadAllData();
    handleRoute(); // Re-render current page
}

// ─── Business Profile ─────────────────────
function getBusiness() {
    return _cache.business;
}

async function saveBusiness(data) {
    _cache.business = await apiPut('/business', data);
}

// ─── Customers ─────────────────────
function getCustomers() {
    return _cache.customers;
}

async function addCustomer(customer) {
    const result = await apiPost('/customers', customer);
    _cache.customers.push(result);
    return result;
}

async function updateCustomer(id, updates) {
    await apiPut('/customers/' + id, updates);
    _cache.customers = _cache.customers.map(c => c.id === id ? { ...c, ...updates } : c);
}

async function deleteCustomer(id) {
    await apiDelete('/customers/' + id);
    _cache.customers = _cache.customers.filter(c => c.id !== id);
}

function getCustomerById(id) {
    return _cache.customers.find(c => c.id === id) || null;
}

// ─── Products ─────────────────────
function getProducts() {
    return _cache.products;
}

async function addProduct(product) {
    const result = await apiPost('/products', product);
    _cache.products.push(result);
    return result;
}

async function updateProduct(id, updates) {
    await apiPut('/products/' + id, updates);
    _cache.products = _cache.products.map(p => p.id === id ? { ...p, ...updates } : p);
}

async function deleteProduct(id) {
    await apiDelete('/products/' + id);
    _cache.products = _cache.products.filter(p => p.id !== id);
}

// ─── Invoices ─────────────────────
function getInvoices() {
    return _cache.invoices;
}

function getInvoiceById(id) {
    return _cache.invoices.find(inv => inv.id === id) || null;
}

async function addInvoice(invoice) {
    const result = await apiPost('/invoices', invoice);
    _cache.invoices.push(result);
    await _refreshStats();
    return result;
}

async function updateInvoice(id, updates) {
    await apiPut('/invoices/' + id, updates);
    _cache.invoices = _cache.invoices.map(inv => inv.id === id ? { ...inv, ...updates } : inv);
    await _refreshStats();
}

async function deleteInvoice(id) {
    await apiDelete('/invoices/' + id);
    const invoice = _cache.invoices.find(inv => inv.id === id);
    if (invoice) {
        invoice.deletedAt = new Date().toISOString();
        _cache.deletedInvoices.push(invoice);
    }
    _cache.invoices = _cache.invoices.filter(inv => inv.id !== id);
    await _refreshStats();
}

// ─── Recycle Bin ─────────────────────
function getDeletedInvoices() {
    return _cache.deletedInvoices;
}

async function restoreInvoice(id) {
    await apiPost('/deleted-invoices/' + id + '/restore', {});
    const invoice = _cache.deletedInvoices.find(inv => inv.id === id);
    if (invoice) {
        delete invoice.deletedAt;
        _cache.invoices.push(invoice);
    }
    _cache.deletedInvoices = _cache.deletedInvoices.filter(inv => inv.id !== id);
    await _refreshStats();
}

async function permanentlyDeleteInvoice(id) {
    await apiDelete('/deleted-invoices/' + id);
    _cache.deletedInvoices = _cache.deletedInvoices.filter(inv => inv.id !== id);
}

async function emptyRecycleBin() {
    await apiDelete('/deleted-invoices');
    _cache.deletedInvoices = [];
}

// ─── Invoice Counter ─────────────────────
function peekNextInvoiceNumber() {
    if (_cache.invoices.length === 0) return 101;
    const maxNum = Math.max(..._cache.invoices.map(inv => inv.invoiceNumber || 0));
    return maxNum + 1;
}

async function commitInvoiceNumber(num) {
    await apiPut('/counter', { lastInvoiceNumber: num });
}

// ─── UPI Accounts ─────────────────────
function getUpiAccounts() {
    return _cache.upiAccounts;
}

async function addUpiAccount(account) {
    const result = await apiPost('/upi-accounts', account);
    _cache.upiAccounts.push(result);
    return result;
}

async function updateUpiAccount(id, updates) {
    await apiPut('/upi-accounts/' + id, updates);
    _cache.upiAccounts = _cache.upiAccounts.map(a => a.id === id ? { ...a, ...updates } : a);
}

async function deleteUpiAccount(id) {
    await apiDelete('/upi-accounts/' + id);
    _cache.upiAccounts = _cache.upiAccounts.filter(a => a.id !== id);
}

function getUpiAccountById(id) {
    return _cache.upiAccounts.find(a => a.id === id) || null;
}

// ─── Stats ─────────────────────
function getStats() {
    return _cache.stats;
}

async function _refreshStats() {
    _cache.stats = await apiGet('/stats');
}

// ─── Search & Filter ─────────────────────
function searchInvoices(query) {
    const q = query.toLowerCase().trim();
    if (!q) return getInvoices();
    return getInvoices().filter(inv => {
        const modeLabel = getPaymentModeLabel(inv.paymentMode).toLowerCase();
        return inv.customerName.toLowerCase().includes(q) ||
            String(inv.invoiceNumber).includes(q) ||
            (inv.customerPhone && inv.customerPhone.includes(q)) ||
            modeLabel.includes(q);
    });
}

function getPaymentModeLabel(mode) {
    const labels = { cash: 'Cash', upi: 'UPI', bank: 'Bank Transfer', other: 'Other' };
    return labels[mode] || mode || '—';
}

function filterInvoices({ status, paymentMode, customer, year, month } = {}) {
    let list = getInvoices();
    if (status && status !== 'all') list = list.filter(inv => inv.status === status);
    if (paymentMode && paymentMode !== 'all') list = list.filter(inv => inv.paymentMode === paymentMode);
    if (customer && customer !== 'all') list = list.filter(inv => inv.customerName === customer);
    if (year && year !== 'all') list = list.filter(inv => inv.date && inv.date.startsWith(year));
    if (month && month !== 'all' && year && year !== 'all') {
        const mm = String(month).padStart(2, '0');
        list = list.filter(inv => inv.date && inv.date.substring(5, 7) === mm);
    }
    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

// ─── Export / Import ─────────────────────
function exportAllData() {
    const db = {
        business: _cache.business,
        customers: _cache.customers,
        products: _cache.products,
        invoices: _cache.invoices,
        upiAccounts: _cache.upiAccounts,
        exportedAt: new Date().toISOString()
    };
    return JSON.stringify(db, null, 2);
}

async function importAllData(jsonStr) {
    try {
        const data = JSON.parse(jsonStr);
        await apiPost('/import', data);
        await loadAllData();
        return true;
    } catch (e) {
        console.error('Import failed:', e);
        return false;
    }
}

// ─── Init (called from app.js) ─────────────────────
async function seedDemoData() {
    // No seeding needed — server starts with empty data
    // Just load data from server into cache
    await loadAllData();
}
