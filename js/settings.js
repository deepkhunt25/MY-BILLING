// ========================================
// SETTINGS.JS — Business Profile & Data
// ========================================

function renderSettings() {
    const business = getBusiness();
    const customers = getCustomers();
    const products = getProducts();

    const app = document.getElementById('app');
    app.innerHTML = `
    <div class="page-enter">
      <div class="page-header">
        <div>
          <h2>Settings</h2>
          <p class="subtitle">Manage your business profile, customers, and products</p>
        </div>
      </div>

      <div class="settings-grid">
        <!-- Business Profile -->
        <div class="card settings-card">
          <div class="card-title">🏢 Business Profile</div>
          <form id="businessForm" onsubmit="handleSaveBusiness(event)">
            <div class="form-group">
              <label>Business Name</label>
              <input type="text" class="form-control" id="bizName" value="${business.name}" required>
            </div>
            <div class="form-group">
              <label>Address</label>
              <input type="text" class="form-control" id="bizAddress" value="${business.address}">
            </div>
            <div class="form-group">
              <label>Phone</label>
              <input type="text" class="form-control" id="bizPhone" value="${business.phone}">
            </div>
            <div class="form-group">
              <label>GSTIN</label>
              <input type="text" class="form-control" id="bizGstin" value="${business.gstin || ''}">
            </div>
            <button type="submit" class="btn btn-primary">💾 Save Profile</button>
          </form>
        </div>

        <!-- Customers -->
        <div class="card settings-card">
          <div class="card-title">👤 Customers (${customers.length})</div>
          <div id="customerList">
            ${customers.length === 0 ? '<p style="color: var(--text-muted); font-size: 0.85rem;">No customers saved yet</p>' : ''}
            ${customers.map(c => `
              <div class="settings-list-item">
                <div class="item-info">
                  <span class="item-name">${c.name}</span>
                  <span class="item-detail">${c.phone || 'No phone'} ${c.gstin ? '· ' + c.gstin : ''}</span>
                </div>
                <div class="item-actions">
                  <button class="btn-icon" onclick="handleEditCustomer('${c.id}')" title="Edit">✏️</button>
                  <button class="btn-icon" onclick="handleDeleteCustomer('${c.id}')" title="Delete">🗑️</button>
                </div>
              </div>
            `).join('')}
          </div>
          <button class="add-item-btn" style="margin-top: 12px;" onclick="handleAddCustomer()">＋ Add Customer</button>
        </div>

        <!-- Products -->
        <div class="card settings-card">
          <div class="card-title">📦 Products (${products.length})</div>
          <div id="productList">
            ${products.length === 0 ? '<p style="color: var(--text-muted); font-size: 0.85rem;">No products saved yet</p>' : ''}
            ${products.map(p => `
              <div class="settings-list-item">
                <div class="item-info">
                  <span class="item-name">${p.name}</span>
                  <span class="item-detail">₹${p.defaultPrice} / ${p.unit}</span>
                </div>
                <div class="item-actions">
                  <button class="btn-icon" onclick="handleEditProduct('${p.id}')" title="Edit">✏️</button>
                  <button class="btn-icon" onclick="handleDeleteProduct('${p.id}')" title="Delete">🗑️</button>
                </div>
              </div>
            `).join('')}
          </div>
          <button class="add-item-btn" style="margin-top: 12px;" onclick="handleAddProduct()">＋ Add Product</button>
        </div>

        <!-- Data Management -->
        <div class="card settings-card">
          <div class="card-title">💾 Data Management</div>
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 16px;">
            Your data is stored locally in this browser. Export a backup to keep it safe.
          </p>
          <div style="display: flex; gap: 12px; flex-wrap: wrap;">
            <button class="btn btn-secondary" onclick="handleExportData()">📤 Export Backup</button>
            <button class="btn btn-outline" onclick="handleImportData()">📥 Import Data</button>
            <button class="btn btn-danger" onclick="handleResetData()">🔄 Reset All Data</button>
          </div>
          <input type="file" id="importFileInput" accept=".json" style="display: none;" onchange="processImport(event)">
        </div>
      </div>
    </div>
  `;
}

function handleSaveBusiness(e) {
    e.preventDefault();
    saveBusiness({
        name: document.getElementById('bizName').value.trim(),
        address: document.getElementById('bizAddress').value.trim(),
        phone: document.getElementById('bizPhone').value.trim(),
        gstin: document.getElementById('bizGstin').value.trim(),
        logo: null
    });
    showToast('Business profile saved!');
    // Update sidebar brand
    updateSidebarBrand();
}

function updateSidebarBrand() {
    const business = getBusiness();
    const brandName = document.querySelector('.sidebar-brand h1');
    if (brandName) brandName.textContent = business.name || 'Billing App';
}

// ─── Customer CRUD ─────────────
function handleAddCustomer() {
    const name = prompt('Customer Name:');
    if (!name) return;
    const phone = prompt('Phone Number:') || '';
    const gstin = prompt('GSTIN (optional):') || '';
    addCustomer({ name, phone, gstin, address: '' });
    showToast('Customer added!');
    renderSettings();
}

function handleEditCustomer(id) {
    const cust = getCustomerById(id);
    if (!cust) return;
    const name = prompt('Customer Name:', cust.name);
    if (!name) return;
    const phone = prompt('Phone:', cust.phone) || '';
    const gstin = prompt('GSTIN:', cust.gstin) || '';
    updateCustomer(id, { name, phone, gstin });
    showToast('Customer updated!');
    renderSettings();
}

async function handleDeleteCustomer(id) {
    const cust = getCustomerById(id);
    if (!cust) return;
    const confirmed = await showConfirm(`Delete customer "${cust.name}"?`);
    if (confirmed) {
        deleteCustomer(id);
        showToast('Customer deleted');
        renderSettings();
    }
}

// ─── Product CRUD ─────────────
function handleAddProduct() {
    const name = prompt('Product Name:');
    if (!name) return;
    const price = parseFloat(prompt('Default Price:', '0')) || 0;
    const unit = prompt('Unit (e.g., NOS, PCS, HRS):', 'NOS') || 'NOS';
    addProduct({ name, defaultPrice: price, unit });
    showToast('Product added!');
    renderSettings();
}

function handleEditProduct(id) {
    const prod = getProducts().find(p => p.id === id);
    if (!prod) return;
    const name = prompt('Product Name:', prod.name);
    if (!name) return;
    const price = parseFloat(prompt('Price:', prod.defaultPrice)) || prod.defaultPrice;
    const unit = prompt('Unit:', prod.unit) || prod.unit;
    updateProduct(id, { name, defaultPrice: price, unit });
    showToast('Product updated!');
    renderSettings();
}

async function handleDeleteProduct(id) {
    const prod = getProducts().find(p => p.id === id);
    if (!prod) return;
    const confirmed = await showConfirm(`Delete product "${prod.name}"?`);
    if (confirmed) {
        deleteProduct(id);
        showToast('Product deleted');
        renderSettings();
    }
}

// ─── Data Management ─────────────
function handleExportData() {
    const json = exportAllData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `billing_backup_${getTodayDate()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Backup exported successfully!');
}

function handleImportData() {
    document.getElementById('importFileInput').click();
}

function processImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (event) {
        const success = importAllData(event.target.result);
        if (success) {
            showToast('Data imported successfully!');
            renderSettings();
            updateSidebarBrand();
        } else {
            showToast('Failed to import data. Invalid file.', 'error');
        }
    };
    reader.readAsText(file);
}

async function handleResetData() {
    const confirmed = await showConfirm('This will DELETE all your data including invoices, customers, and products. This cannot be undone!');
    if (confirmed) {
        Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
        seedDemoData();
        showToast('Data has been reset to defaults');
        renderSettings();
        updateSidebarBrand();
    }
}
