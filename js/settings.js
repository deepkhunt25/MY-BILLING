// ========================================
// SETTINGS.JS — Business Profile & Data
// ========================================

function renderSettings() {
  const business = getBusiness();
  const customers = getCustomers();
  const products = getProducts();
  const upiAccounts = getUpiAccounts();

  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="page-enter">
      <div class="page-header">
        <div>
          <h2>Settings</h2>
          <p class="subtitle">Manage your business profile, customers, products, and payment QR codes</p>
        </div>
      </div>

      <div class="settings-tabs">
        <button class="settings-tab active" onclick="switchSettingsTab('profile')" id="tab-btn-profile">🏢 Profile</button>
        <button class="settings-tab" onclick="switchSettingsTab('upi')" id="tab-btn-upi">💳 UPI/QR</button>
        <button class="settings-tab" onclick="switchSettingsTab('customers')" id="tab-btn-customers">👤 Customers (${customers.length})</button>
        <button class="settings-tab" onclick="switchSettingsTab('products')" id="tab-btn-products">📦 Products (${products.length})</button>
        <button class="settings-tab" onclick="switchSettingsTab('data')" id="tab-btn-data">💾 Data Backup</button>
      </div>

      <div class="settings-grid">
        <!-- Business Profile -->
        <div class="settings-content active" id="settings-content-profile">
          <div class="card settings-card">
            <div class="card-title">🏢 Business Profile</div>
            <form id="businessForm" onsubmit="handleSaveBusiness(event)">
              <!-- Logo Upload -->
              <div class="form-group">
                <label>Business Logo</label>
                <div class="logo-upload-area" id="logoUploadArea" onclick="document.getElementById('logoFileInput').click()">
                  ${business.logo
      ? `<img src="${business.logo}" alt="Logo" class="logo-preview-img">`
      : `<div class="logo-placeholder">
                          <span style="font-size: 2rem;">📷</span>
                          <span style="font-size: 0.82rem; color: var(--text-muted);">Click to upload logo</span>
                        </div>`
    }
                </div>
                <input type="file" id="logoFileInput" accept="image/*" style="display: none;" onchange="handleLogoUpload(event)">
                ${business.logo ? `
                  <button type="button" class="btn btn-sm btn-outline" style="margin-top: 8px;" onclick="handleRemoveLogo()">
                    ✕ Remove Logo
                  </button>
                ` : ''}
                <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">Recommended: Square image, under 200KB</p>
              </div>
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
        </div>

        <!-- UPI / Payment QR Codes -->
        <div class="settings-content" id="settings-content-upi">
          <div class="card settings-card">
            <div class="card-title">💳 UPI / Payment QR Codes</div>
            <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 12px;">
              Add your UPI QR codes here. You can select one while creating an invoice to display it on the PDF.
            </p>
            <div id="upiAccountsList">
              ${upiAccounts.length === 0 ? '<p style="color: var(--text-muted); font-size: 0.85rem;">No UPI accounts added yet</p>' : ''}
              ${upiAccounts.map(a => `
                <div class="settings-list-item">
                  <div class="item-info" style="display: flex; align-items: center; gap: 12px;">
                    ${a.qrDataUrl ? `<img src="${a.qrDataUrl}" alt="QR" style="width: 40px; height: 40px; border-radius: 4px; object-fit: cover;">` : ''}
                    <div>
                      <span class="item-name">${a.label}</span>
                      <span class="item-detail">${a.upiId || 'No UPI ID'}</span>
                    </div>
                  </div>
                  <div class="item-actions">
                    <button class="btn-icon" onclick="handleEditUpi('${a.id}')" title="Edit">✏️</button>
                    <button class="btn-icon" onclick="handleDeleteUpi('${a.id}')" title="Delete">🗑️</button>
                  </div>
                </div>
              `).join('')}
            </div>
            <button class="add-item-btn" style="margin-top: 12px;" onclick="showAddUpiModal()">＋ Add UPI Account</button>
          </div>
        </div>

        <!-- Customers -->
        <div class="settings-content" id="settings-content-customers">
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
        </div>

        <!-- Products -->
        <div class="settings-content" id="settings-content-products">
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
        </div>

        <!-- Data Management -->
        <div class="settings-content" id="settings-content-data">
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
    </div>
  `;

  // Retain active tab state if available
  if (window.activeSettingsTab) {
    switchSettingsTab(window.activeSettingsTab);
  }
}

// ─── Settings Tab Navigation ─────────────
function switchSettingsTab(tabId) {
  window.activeSettingsTab = tabId;

  // Update Buttons
  document.querySelectorAll('.settings-tab').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.getElementById('tab-btn-' + tabId);
  if (activeBtn) activeBtn.classList.add('active');

  // Update Content
  document.querySelectorAll('.settings-content').forEach(content => content.classList.remove('active'));
  const activeContent = document.getElementById('settings-content-' + tabId);
  if (activeContent) activeContent.classList.add('active');
}


// ─── Business Profile ─────────────
async function handleSaveBusiness(e) {
  e.preventDefault();
  const current = getBusiness();
  await saveBusiness({
    name: document.getElementById('bizName').value.trim(),
    address: document.getElementById('bizAddress').value.trim(),
    phone: document.getElementById('bizPhone').value.trim(),
    gstin: document.getElementById('bizGstin').value.trim(),
    logo: current.logo // preserve logo
  });
  showToast('Business profile saved!');
  updateSidebarBrand();
}

function handleLogoUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  // Check file size (warn if > 500KB)
  if (file.size > 500 * 1024) {
    showToast('Logo is large (>500KB). Consider using a smaller image.', 'info');
  }

  const reader = new FileReader();
  reader.onload = async function (event) {
    const business = getBusiness();
    business.logo = event.target.result;
    await saveBusiness(business);
    showToast('Logo uploaded!');
    renderSettings();
  };
  reader.readAsDataURL(file);
}

async function handleRemoveLogo() {
  const business = getBusiness();
  business.logo = null;
  await saveBusiness(business);
  showToast('Logo removed');
  renderSettings();
}

function updateSidebarBrand() {
  const business = getBusiness();
  const brandName = document.querySelector('.sidebar-brand h1');
  if (brandName) brandName.textContent = business.name || 'Billing App';
}

// ─── UPI Account CRUD ─────────────
function showAddUpiModal(editId) {
  const existing = editId ? getUpiAccountById(editId) : null;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'upiModal';
  overlay.innerHTML = `
      <div class="modal-box" style="max-width: 460px; text-align: left;">
        <h3 style="margin-bottom: 16px; font-size: 1.05rem;">${existing ? 'Edit' : 'Add'} UPI Account</h3>
        <div class="form-group">
          <label>Label / Name</label>
          <input type="text" class="form-control" id="upiLabel" value="${existing ? existing.label : ''}" placeholder="e.g., UPI 1 - SBI">
        </div>
        <div class="form-group">
          <label>UPI ID (optional)</label>
          <input type="text" class="form-control" id="upiIdField" value="${existing ? (existing.upiId || '') : ''}" placeholder="e.g., yourname@sbi">
        </div>
        <div class="form-group">
          <label>QR Code Image</label>
          <div class="logo-upload-area" id="qrUploadArea" onclick="document.getElementById('qrFileInput').click()" style="height: 120px;">
            ${existing && existing.qrDataUrl
      ? `<img src="${existing.qrDataUrl}" alt="QR" style="max-height: 100px; max-width: 100px; object-fit: contain;">`
      : `<div class="logo-placeholder"><span style="font-size: 1.5rem;">📷</span><span style="font-size: 0.78rem; color: var(--text-muted);">Click to upload QR code</span></div>`
    }
          </div>
          <input type="file" id="qrFileInput" accept="image/*" style="display: none;" onchange="handleQrImageSelect(event)">
        </div>
        <input type="hidden" id="qrDataUrlHidden" value="${existing && existing.qrDataUrl ? existing.qrDataUrl : ''}">
        <div class="modal-actions" style="justify-content: flex-end;">
          <button class="btn btn-outline" onclick="document.getElementById('upiModal').remove()">Cancel</button>
          <button class="btn btn-primary" onclick="handleSaveUpi('${editId || ''}')">${existing ? 'Update' : 'Add'}</button>
        </div>
      </div>
    `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('modal-show'));
}

function handleQrImageSelect(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (event) {
    document.getElementById('qrDataUrlHidden').value = event.target.result;
    const area = document.getElementById('qrUploadArea');
    area.innerHTML = `<img src="${event.target.result}" alt="QR" style="max-height: 100px; max-width: 100px; object-fit: contain;">`;
  };
  reader.readAsDataURL(file);
}

async function handleSaveUpi(editId) {
  const label = document.getElementById('upiLabel').value.trim();
  if (!label) { showToast('Please enter a label', 'error'); return; }

  const upiId = document.getElementById('upiIdField').value.trim();
  const qrDataUrl = document.getElementById('qrDataUrlHidden').value;

  if (editId) {
    await updateUpiAccount(editId, { label, upiId, qrDataUrl });
    showToast('UPI account updated!');
  } else {
    await addUpiAccount({ label, upiId, qrDataUrl });
    showToast('UPI account added!');
  }

  document.getElementById('upiModal')?.remove();
  renderSettings();
}

function handleEditUpi(id) {
  showAddUpiModal(id);
}

async function handleDeleteUpi(id) {
  const account = getUpiAccountById(id);
  if (!account) return;
  const confirmed = await showConfirm(`Delete UPI account "${account.label}"?`);
  if (confirmed) {
    await deleteUpiAccount(id);
    showToast('UPI account deleted');
    renderSettings();
  }
}

// ─── Customer CRUD ─────────────
async function handleAddCustomer() {
  const name = prompt('Customer Name:');
  if (!name) return;
  const phone = prompt('Phone Number:') || '';
  const gstin = prompt('GSTIN (optional):') || '';
  await addCustomer({ name, phone, gstin, address: '' });
  showToast('Customer added!');
  renderSettings();
}

async function handleEditCustomer(id) {
  const cust = getCustomerById(id);
  if (!cust) return;
  const name = prompt('Customer Name:', cust.name);
  if (!name) return;
  const phone = prompt('Phone:', cust.phone) || '';
  const gstin = prompt('GSTIN:', cust.gstin) || '';
  await updateCustomer(id, { name, phone, gstin });
  showToast('Customer updated!');
  renderSettings();
}

async function handleDeleteCustomer(id) {
  const cust = getCustomerById(id);
  if (!cust) return;
  const confirmed = await showConfirm(`Delete customer "${cust.name}"?`);
  if (confirmed) {
    await deleteCustomer(id);
    showToast('Customer deleted');
    renderSettings();
  }
}

// ─── Product CRUD ─────────────
async function handleAddProduct() {
  const name = prompt('Product Name:');
  if (!name) return;
  const price = parseFloat(prompt('Default Price:', '0')) || 0;
  const unit = prompt('Unit (e.g., NOS, PCS, HRS):', 'NOS') || 'NOS';
  await addProduct({ name, defaultPrice: price, unit });
  showToast('Product added!');
  renderSettings();
}

async function handleEditProduct(id) {
  const prod = getProducts().find(p => p.id === id);
  if (!prod) return;
  const name = prompt('Product Name:', prod.name);
  if (!name) return;
  const price = parseFloat(prompt('Price:', prod.defaultPrice)) || prod.defaultPrice;
  const unit = prompt('Unit:', prod.unit) || prod.unit;
  await updateProduct(id, { name, defaultPrice: price, unit });
  showToast('Product updated!');
  renderSettings();
}

async function handleDeleteProduct(id) {
  const prod = getProducts().find(p => p.id === id);
  if (!prod) return;
  const confirmed = await showConfirm(`Delete product "${prod.name}"?`);
  if (confirmed) {
    await deleteProduct(id);
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
  reader.onload = async function (event) {
    const success = await importAllData(event.target.result);
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
    // Reset server data via import with empty data
    await importAllData(JSON.stringify({
      business: { name: 'Your Business', address: '', phone: '', gstin: '', logo: null },
      customers: [], products: [], invoices: [], upiAccounts: [],
      counter: { lastInvoiceNumber: 100 }
    }));
    showToast('Data has been reset to defaults');
    renderSettings();
    updateSidebarBrand();
  }
}
