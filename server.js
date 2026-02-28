// ========================================
// SERVER.JS — Node.js + Express Backend
// Data stored in: data/db.json
// ========================================

const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = 80;
const DB_FILE = path.join(__dirname, 'data', 'db.json');

// ─── Middleware ─────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname)); // Serve frontend files

// ─── DB Helpers ─────────────────────────
function readDB() {
    try {
        if (!fs.existsSync(DB_FILE)) return getDefaultDB();
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(raw);
    } catch (e) {
        return getDefaultDB();
    }
}

function writeDB(data) {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function getDefaultDB() {
    return {
        business: { name: 'Your Business', address: '', phone: '', gstin: '', logo: null },
        customers: [],
        products: [],
        invoices: [],
        deletedInvoices: [],
        upiAccounts: [],
        counter: { lastInvoiceNumber: 100 }
    };
}

function generateId(prefix) {
    return `${prefix}_${crypto.randomBytes(4).toString('hex')}`;
}

// ─── Business ─────────────────────────
app.get('/api/business', (req, res) => {
    const db = readDB();
    res.json(db.business);
});

app.put('/api/business', (req, res) => {
    const db = readDB();
    db.business = { ...db.business, ...req.body };
    writeDB(db);
    res.json(db.business);
});

// ─── Customers ─────────────────────────
app.get('/api/customers', (req, res) => {
    res.json(readDB().customers);
});

app.post('/api/customers', (req, res) => {
    const db = readDB();
    const customer = { ...req.body, id: req.body.id || generateId('cust') };
    db.customers.push(customer);
    writeDB(db);
    res.json(customer);
});

app.put('/api/customers/:id', (req, res) => {
    const db = readDB();
    db.customers = db.customers.map(c => c.id === req.params.id ? { ...c, ...req.body } : c);
    writeDB(db);
    res.json({ ok: true });
});

app.delete('/api/customers/:id', (req, res) => {
    const db = readDB();
    db.customers = db.customers.filter(c => c.id !== req.params.id);
    writeDB(db);
    res.json({ ok: true });
});

// ─── Products ─────────────────────────
app.get('/api/products', (req, res) => {
    res.json(readDB().products);
});

app.post('/api/products', (req, res) => {
    const db = readDB();
    const product = { ...req.body, id: req.body.id || generateId('prod') };
    db.products.push(product);
    writeDB(db);
    res.json(product);
});

app.put('/api/products/:id', (req, res) => {
    const db = readDB();
    db.products = db.products.map(p => p.id === req.params.id ? { ...p, ...req.body } : p);
    writeDB(db);
    res.json({ ok: true });
});

app.delete('/api/products/:id', (req, res) => {
    const db = readDB();
    db.products = db.products.filter(p => p.id !== req.params.id);
    writeDB(db);
    res.json({ ok: true });
});

// ─── Invoices ─────────────────────────
app.get('/api/invoices', (req, res) => {
    res.json(readDB().invoices);
});

app.get('/api/invoices/:id', (req, res) => {
    const inv = readDB().invoices.find(i => i.id === req.params.id);
    if (!inv) return res.status(404).json({ error: 'Not found' });
    res.json(inv);
});

app.post('/api/invoices', (req, res) => {
    const db = readDB();
    const invoice = {
        ...req.body,
        id: req.body.id || generateId('inv'),
        createdAt: req.body.createdAt || new Date().toISOString()
    };
    db.invoices.push(invoice);
    writeDB(db);
    res.json(invoice);
});

app.put('/api/invoices/:id', (req, res) => {
    const db = readDB();
    db.invoices = db.invoices.map(inv => inv.id === req.params.id ? { ...inv, ...req.body } : inv);
    writeDB(db);
    res.json({ ok: true });
});

// Delete → Move to recycle bin
app.delete('/api/invoices/:id', (req, res) => {
    const db = readDB();
    const invoice = db.invoices.find(inv => inv.id === req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Not found' });
    invoice.deletedAt = new Date().toISOString();
    db.deletedInvoices.push(invoice);
    db.invoices = db.invoices.filter(inv => inv.id !== req.params.id);
    writeDB(db);
    res.json({ ok: true });
});

// ─── Recycle Bin ─────────────────────────
app.get('/api/deleted-invoices', (req, res) => {
    res.json(readDB().deletedInvoices);
});

app.post('/api/deleted-invoices/:id/restore', (req, res) => {
    const db = readDB();
    const invoice = db.deletedInvoices.find(inv => inv.id === req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Not found' });
    delete invoice.deletedAt;
    db.invoices.push(invoice);
    db.deletedInvoices = db.deletedInvoices.filter(inv => inv.id !== req.params.id);
    writeDB(db);
    res.json({ ok: true });
});

app.delete('/api/deleted-invoices/:id', (req, res) => {
    const db = readDB();
    db.deletedInvoices = db.deletedInvoices.filter(inv => inv.id !== req.params.id);
    writeDB(db);
    res.json({ ok: true });
});

app.delete('/api/deleted-invoices', (req, res) => {
    const db = readDB();
    db.deletedInvoices = [];
    writeDB(db);
    res.json({ ok: true });
});

// ─── UPI Accounts ─────────────────────────
app.get('/api/upi-accounts', (req, res) => {
    res.json(readDB().upiAccounts);
});

app.post('/api/upi-accounts', (req, res) => {
    const db = readDB();
    const account = { ...req.body, id: req.body.id || generateId('upi') };
    db.upiAccounts.push(account);
    writeDB(db);
    res.json(account);
});

app.put('/api/upi-accounts/:id', (req, res) => {
    const db = readDB();
    db.upiAccounts = db.upiAccounts.map(a => a.id === req.params.id ? { ...a, ...req.body } : a);
    writeDB(db);
    res.json({ ok: true });
});

app.delete('/api/upi-accounts/:id', (req, res) => {
    const db = readDB();
    db.upiAccounts = db.upiAccounts.filter(a => a.id !== req.params.id);
    writeDB(db);
    res.json({ ok: true });
});

// ─── Counter ─────────────────────────
app.get('/api/counter', (req, res) => {
    res.json(readDB().counter);
});

app.put('/api/counter', (req, res) => {
    const db = readDB();
    db.counter = { ...db.counter, ...req.body };
    writeDB(db);
    res.json(db.counter);
});

// ─── Stats ─────────────────────────
app.get('/api/stats', (req, res) => {
    const { invoices } = readDB();
    const total = invoices.reduce((s, inv) => s + inv.grandTotal, 0);
    const paid = invoices.filter(inv => inv.status === 'paid');
    const due = invoices.filter(inv => inv.status === 'due');
    const unpaid = invoices.filter(inv => inv.status === 'unpaid');
    res.json({
        totalRevenue: total,
        invoiceCount: invoices.length,
        paidCount: paid.length,
        dueCount: due.length,
        unpaidCount: unpaid.length,
        paidAmount: paid.reduce((s, inv) => s + inv.grandTotal, 0),
        dueAmount: due.reduce((s, inv) => s + (inv.balanceDue || Math.max(0, inv.grandTotal - (inv.receivedAmount || 0))), 0),
        unpaidAmount: unpaid.reduce((s, inv) => s + inv.grandTotal, 0)
    });
});

// ─── Export / Import ─────────────────────────
app.get('/api/export', (req, res) => {
    const db = readDB();
    res.setHeader('Content-Disposition', 'attachment; filename="invoice-backup.json"');
    res.json({ ...db, exportedAt: new Date().toISOString() });
});

app.post('/api/import', (req, res) => {
    try {
        const data = req.body;
        const db = readDB();
        if (data.business) db.business = data.business;
        if (data.customers) db.customers = data.customers;
        if (data.products) db.products = data.products;
        if (data.invoices) db.invoices = data.invoices;
        if (data.upiAccounts) db.upiAccounts = data.upiAccounts;
        if (data.counter) db.counter = data.counter;
        writeDB(db);
        res.json({ ok: true });
    } catch (e) {
        res.status(400).json({ error: 'Import failed' });
    }
});

// ─── Start Server ─────────────────────────
app.listen(PORT, () => {
    console.log(`\n✅ Invoice Generator Server running!`);
    console.log(`🌐 Open: http://localhost\n`);
});
