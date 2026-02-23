// ========================================
// DATA.JS — localStorage CRUD Layer
// ========================================

const STORAGE_KEYS = {
    business: 'billing_business',
    customers: 'billing_customers',
    products: 'billing_products',
    invoices: 'billing_invoices',
    deletedInvoices: 'billing_deleted_invoices',
    counter: 'billing_counter',
    upiAccounts: 'billing_upi_accounts',
    initialized: 'billing_initialized'
};

// ─── Generic Storage ─────────────────────
function getStore(key) {
    try {
        return JSON.parse(localStorage.getItem(key));
    } catch {
        return null;
    }
}

function setStore(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

// ─── Business Profile ─────────────────────
function getBusiness() {
    return getStore(STORAGE_KEYS.business) || {
        name: 'Your Business',
        address: '',
        phone: '',
        gstin: '',
        logo: null
    };
}

function saveBusiness(data) {
    setStore(STORAGE_KEYS.business, data);
}

// ─── Customers ─────────────────────
function getCustomers() {
    return getStore(STORAGE_KEYS.customers) || [];
}

function saveCustomers(list) {
    setStore(STORAGE_KEYS.customers, list);
}

function addCustomer(customer) {
    const list = getCustomers();
    customer.id = customer.id || generateId('cust');
    list.push(customer);
    saveCustomers(list);
    return customer;
}

function updateCustomer(id, updates) {
    const list = getCustomers().map(c => c.id === id ? { ...c, ...updates } : c);
    saveCustomers(list);
}

function deleteCustomer(id) {
    saveCustomers(getCustomers().filter(c => c.id !== id));
}

function getCustomerById(id) {
    return getCustomers().find(c => c.id === id) || null;
}

// ─── Products ─────────────────────
function getProducts() {
    return getStore(STORAGE_KEYS.products) || [];
}

function saveProducts(list) {
    setStore(STORAGE_KEYS.products, list);
}

function addProduct(product) {
    const list = getProducts();
    product.id = product.id || generateId('prod');
    list.push(product);
    saveProducts(list);
    return product;
}

function updateProduct(id, updates) {
    const list = getProducts().map(p => p.id === id ? { ...p, ...updates } : p);
    saveProducts(list);
}

function deleteProduct(id) {
    saveProducts(getProducts().filter(p => p.id !== id));
}

// ─── Invoices ─────────────────────
function getInvoices() {
    return getStore(STORAGE_KEYS.invoices) || [];
}

function saveInvoices(list) {
    setStore(STORAGE_KEYS.invoices, list);
}

function addInvoice(invoice) {
    const list = getInvoices();
    invoice.id = invoice.id || generateId('inv');
    invoice.createdAt = invoice.createdAt || new Date().toISOString();
    list.push(invoice);
    saveInvoices(list);
    return invoice;
}

function updateInvoice(id, updates) {
    const list = getInvoices().map(inv => inv.id === id ? { ...inv, ...updates } : inv);
    saveInvoices(list);
}

function deleteInvoice(id) {
    const invoice = getInvoiceById(id);
    if (!invoice) return;
    const bin = getDeletedInvoices();
    invoice.deletedAt = new Date().toISOString();
    bin.push(invoice);
    setStore(STORAGE_KEYS.deletedInvoices, bin);
    saveInvoices(getInvoices().filter(inv => inv.id !== id));
}

function getInvoiceById(id) {
    return getInvoices().find(inv => inv.id === id) || null;
}

// ─── Recycle Bin ─────────────────────
function getDeletedInvoices() {
    return getStore(STORAGE_KEYS.deletedInvoices) || [];
}

function restoreInvoice(id) {
    const bin = getDeletedInvoices();
    const invoice = bin.find(inv => inv.id === id);
    if (!invoice) return;
    delete invoice.deletedAt;
    const active = getInvoices();
    active.push(invoice);
    saveInvoices(active);
    setStore(STORAGE_KEYS.deletedInvoices, bin.filter(inv => inv.id !== id));
}

function permanentlyDeleteInvoice(id) {
    setStore(STORAGE_KEYS.deletedInvoices, getDeletedInvoices().filter(inv => inv.id !== id));
}

function emptyRecycleBin() {
    setStore(STORAGE_KEYS.deletedInvoices, []);
}

// ─── Invoice Counter ─────────────────────
function peekNextInvoiceNumber() {
    const invoices = getInvoices();
    if (invoices.length === 0) return 101;
    const maxNum = Math.max(...invoices.map(inv => inv.invoiceNumber || 0));
    return maxNum + 1;
}

function commitInvoiceNumber(num) {
    setStore(STORAGE_KEYS.counter, { lastInvoiceNumber: num });
}

// ─── UPI Accounts ─────────────────────
function getUpiAccounts() {
    return getStore(STORAGE_KEYS.upiAccounts) || [];
}

function saveUpiAccounts(list) {
    setStore(STORAGE_KEYS.upiAccounts, list);
}

function addUpiAccount(account) {
    const list = getUpiAccounts();
    account.id = account.id || generateId('upi');
    list.push(account);
    saveUpiAccounts(list);
    return account;
}

function updateUpiAccount(id, updates) {
    const list = getUpiAccounts().map(a => a.id === id ? { ...a, ...updates } : a);
    saveUpiAccounts(list);
}

function deleteUpiAccount(id) {
    saveUpiAccounts(getUpiAccounts().filter(a => a.id !== id));
}

function getUpiAccountById(id) {
    return getUpiAccounts().find(a => a.id === id) || null;
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
    if (status && status !== 'all') {
        list = list.filter(inv => inv.status === status);
    }
    if (paymentMode && paymentMode !== 'all') {
        list = list.filter(inv => inv.paymentMode === paymentMode);
    }
    if (customer && customer !== 'all') {
        list = list.filter(inv => inv.customerName === customer);
    }
    if (year && year !== 'all') {
        list = list.filter(inv => inv.date && inv.date.startsWith(year));
    }
    if (month && month !== 'all' && year && year !== 'all') {
        const mm = String(month).padStart(2, '0');
        list = list.filter(inv => inv.date && inv.date.substring(5, 7) === mm);
    }
    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

// ─── Stats ─────────────────────
function getStats() {
    const invoices = getInvoices();
    const total = invoices.reduce((s, inv) => s + inv.grandTotal, 0);
    const paid = invoices.filter(inv => inv.status === 'paid');
    const unpaid = invoices.filter(inv => inv.status === 'unpaid');
    return {
        totalRevenue: total,
        invoiceCount: invoices.length,
        paidCount: paid.length,
        unpaidCount: unpaid.length,
        paidAmount: paid.reduce((s, inv) => s + inv.grandTotal, 0),
        unpaidAmount: unpaid.reduce((s, inv) => s + inv.grandTotal, 0)
    };
}

// ─── Export / Import ─────────────────────
function exportAllData() {
    return JSON.stringify({
        business: getBusiness(),
        customers: getCustomers(),
        products: getProducts(),
        invoices: getInvoices(),
        upiAccounts: getUpiAccounts(),
        counter: getStore(STORAGE_KEYS.counter),
        exportedAt: new Date().toISOString()
    }, null, 2);
}

function importAllData(jsonStr) {
    try {
        const data = JSON.parse(jsonStr);
        if (data.business) saveBusiness(data.business);
        if (data.customers) saveCustomers(data.customers);
        if (data.products) saveProducts(data.products);
        if (data.invoices) saveInvoices(data.invoices);
        if (data.upiAccounts) saveUpiAccounts(data.upiAccounts);
        if (data.counter) setStore(STORAGE_KEYS.counter, data.counter);
        return true;
    } catch (e) {
        console.error('Import failed:', e);
        return false;
    }
}

// ─── Demo Data ─────────────────────
function seedDemoData() {
    if (getStore(STORAGE_KEYS.initialized)) return;

    saveBusiness({
        name: 'Deep',
        address: 'Surat 395101',
        phone: '6353374713',
        gstin: '',
        logo: null
    });

    const customers = [
        { id: 'cust_001', name: 'VIVAH VASTRAM', phone: '8128134341', gstin: '', address: 'Surat' },
        { id: 'cust_002', name: 'KRISHNA TEXTILES', phone: '9876543210', gstin: '24AABCT1234F1Z5', address: 'Ahmedabad' },
        { id: 'cust_003', name: 'SHREE FASHION', phone: '9988776655', gstin: '', address: 'Rajkot' }
    ];
    saveCustomers(customers);

    const products = [
        { id: 'prod_001', name: 'Reel', unit: 'NOS', defaultPrice: 300 },
        { id: 'prod_002', name: 'Banner Design', unit: 'PCS', defaultPrice: 500 },
        { id: 'prod_003', name: 'Video Editing', unit: 'NOS', defaultPrice: 1500 },
        { id: 'prod_004', name: 'Social Media Post', unit: 'NOS', defaultPrice: 200 },
        { id: 'prod_005', name: 'Logo Design', unit: 'NOS', defaultPrice: 5000 }
    ];
    saveProducts(products);

    const invoices = [
        {
            id: 'inv_demo_1',
            invoiceNumber: 101,
            date: '2025-12-15',
            customerId: 'cust_002',
            customerName: 'KRISHNA TEXTILES',
            customerPhone: '9876543210',
            customerGstin: '24AABCT1234F1Z5',
            items: [
                { name: 'Banner Design', pricePerUnit: 500, unit: 'PCS', qty: 4, total: 2000 },
                { name: 'Social Media Post', pricePerUnit: 200, unit: 'NOS', qty: 10, total: 2000 }
            ],
            subtotal: 4000,
            gstPercent: 0,
            gstAmount: 0,
            discount: 0,
            grandTotal: 4000,
            amountInWords: 'Four Thousand Rupees Only',
            status: 'paid',
            paymentMode: 'upi',
            notes: '',
            createdAt: '2025-12-15T10:00:00Z'
        },
        {
            id: 'inv_demo_2',
            invoiceNumber: 102,
            date: '2025-12-18',
            customerId: 'cust_001',
            customerName: 'VIVAH VASTRAM',
            customerPhone: '8128134341',
            customerGstin: '',
            items: [
                { name: 'Reel', pricePerUnit: 300, unit: 'NOS', qty: 9, total: 2700 }
            ],
            subtotal: 2700,
            gstPercent: 0,
            gstAmount: 0,
            discount: 0,
            grandTotal: 2700,
            amountInWords: 'Two Thousand Seven Hundred Rupees Only',
            status: 'paid',
            paymentMode: 'cash',
            notes: '',
            createdAt: '2025-12-18T10:00:00Z'
        },
        {
            id: 'inv_demo_3',
            invoiceNumber: 103,
            date: '2026-01-05',
            customerId: 'cust_003',
            customerName: 'SHREE FASHION',
            customerPhone: '9988776655',
            customerGstin: '',
            items: [
                { name: 'Video Editing', pricePerUnit: 1500, unit: 'NOS', qty: 2, total: 3000 },
                { name: 'Reel', pricePerUnit: 300, unit: 'NOS', qty: 5, total: 1500 }
            ],
            subtotal: 4500,
            gstPercent: 18,
            gstAmount: 810,
            discount: 0,
            grandTotal: 5310,
            amountInWords: 'Five Thousand Three Hundred Ten Rupees Only',
            status: 'unpaid',
            paymentMode: '',
            notes: 'Pending payment',
            createdAt: '2026-01-05T10:00:00Z'
        },
        {
            id: 'inv_demo_4',
            invoiceNumber: 104,
            date: '2026-02-10',
            customerId: 'cust_002',
            customerName: 'KRISHNA TEXTILES',
            customerPhone: '9876543210',
            customerGstin: '24AABCT1234F1Z5',
            items: [
                { name: 'Logo Design', pricePerUnit: 5000, unit: 'NOS', qty: 1, total: 5000 },
                { name: 'Banner Design', pricePerUnit: 500, unit: 'PCS', qty: 6, total: 3000 }
            ],
            subtotal: 8000,
            gstPercent: 18,
            gstAmount: 1440,
            discount: 500,
            grandTotal: 8940,
            amountInWords: 'Eight Thousand Nine Hundred Forty Rupees Only',
            status: 'paid',
            paymentMode: 'bank',
            notes: '',
            createdAt: '2026-02-10T10:00:00Z'
        }
    ];
    saveInvoices(invoices);

    setStore(STORAGE_KEYS.counter, { lastInvoiceNumber: 104 });
    setStore(STORAGE_KEYS.initialized, true);
}
