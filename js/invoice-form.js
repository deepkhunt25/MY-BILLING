// ========================================
// INVOICE-FORM.JS — Create / Edit Invoice
// ========================================

let currentItems = [];
let editingInvoiceId = null;

function renderInvoiceForm(invoiceId) {
  editingInvoiceId = invoiceId || null;
  const customers = getCustomers();
  const products = getProducts();
  const upiAccounts = getUpiAccounts();
  const isEdit = !!editingInvoiceId;
  let invoice = null;

  if (isEdit) {
    invoice = getInvoiceById(editingInvoiceId);
    if (!invoice) {
      showToast('Invoice not found', 'error');
      navigateTo('history');
      return;
    }
    currentItems = [...invoice.items];
  } else {
    currentItems = [{ name: '', pricePerUnit: 0, unit: 'NOS', qty: 1, total: 0 }];
  }

  // Use peekNextInvoiceNumber (read-only) for new invoices
  const invNumber = isEdit ? invoice.invoiceNumber : peekNextInvoiceNumber();

  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="page-enter">
      <div class="page-header">
        <div>
          <h2>${isEdit ? 'Edit Invoice #' + invoice.invoiceNumber : 'Create New Invoice'}</h2>
          <p class="subtitle">${isEdit ? 'Modify invoice details' : 'Fill in the details to generate an invoice'}</p>
        </div>
        <button class="btn btn-outline" onclick="navigateTo('${isEdit ? 'preview/' + editingInvoiceId : 'dashboard'}')">
          ← Back
        </button>
      </div>

      <form id="invoiceForm" onsubmit="handleSaveInvoice(event)">
        <!-- Invoice Meta -->
        <div class="card" style="margin-bottom: 20px;">
          <div class="form-row">
            <div class="form-group">
              <label>Invoice Number</label>
              <input type="text" class="form-control" id="invNumber" 
                value="${invNumber}" readonly
                style="opacity: 0.7; cursor: not-allowed;">
            </div>
            <div class="form-group">
              <label>Invoice Date</label>
              <input type="date" class="form-control" id="invDate" 
                value="${isEdit ? invoice.date : getTodayDate()}" required>
            </div>
            <div class="form-group">
              <label>Payment Status</label>
              <select class="form-control" id="invStatus" onchange="togglePaymentDate()">
                <option value="unpaid" ${isEdit && invoice.status === 'unpaid' ? 'selected' : ''}>Unpaid</option>
                <option value="paid" ${(!isEdit || invoice.status === 'paid') ? 'selected' : ''}>Paid</option>
              </select>
            </div>
            <div class="form-group" id="paymentDateGroup" style="display: ${(!isEdit || invoice.status === 'paid') ? 'block' : 'none'};">
              <label>Payment Date <span style="font-size:0.75rem; color:var(--text-muted); font-weight:400;">(select date)</span></label>
              <input type="date" class="form-control" id="invPaymentDate"
                value="${isEdit && invoice.paymentDate ? invoice.paymentDate : ''}">
            </div>
            <div class="form-group">
              <label>Payment Mode</label>
              <select class="form-control" id="invPaymentMode">
                <option value="" ${isEdit && !invoice.paymentMode ? 'selected' : ''}>-- Select --</option>
                <option value="cash" ${isEdit && invoice.paymentMode === 'cash' ? 'selected' : ''}>Cash</option>
                <option value="upi" ${isEdit && invoice.paymentMode === 'upi' ? 'selected' : ''}>UPI</option>
                <option value="bank" ${isEdit && invoice.paymentMode === 'bank' ? 'selected' : ''}>Bank Transfer</option>
                <option value="other" ${isEdit && invoice.paymentMode === 'other' ? 'selected' : ''}>Other</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Customer -->
        <div class="card" style="margin-bottom: 20px;">
          <h3 style="margin-bottom: 16px; font-size: 1rem;">Customer Details</h3>
          <div class="form-row">
            <div class="form-group">
              <label>Select Customer</label>
              <select class="form-control" id="custSelect" onchange="handleCustomerSelect()">
                <option value="">-- New Customer --</option>
                ${customers.map(c => `
                  <option value="${c.id}" ${isEdit && invoice.customerId === c.id ? 'selected' : ''}>${c.name}</option>
                `).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Customer Name *</label>
              <input type="text" class="form-control" id="custName" 
                value="${isEdit ? invoice.customerName : ''}" required placeholder="Enter customer name">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Phone</label>
              <input type="text" class="form-control" id="custPhone" 
                value="${isEdit ? invoice.customerPhone : ''}" placeholder="Phone number">
            </div>
            <div class="form-group">
              <label>GSTIN</label>
              <input type="text" class="form-control" id="custGstin"
                value="${isEdit ? (invoice.customerGstin || '') : ''}" placeholder="GST Number (optional)">
            </div>
          </div>
        </div>

        <!-- Items -->
        <div class="card" style="margin-bottom: 20px;">
          <h3 style="margin-bottom: 16px; font-size: 1rem;">Items</h3>
          <div style="overflow-x: auto;">
            <table class="items-table" id="itemsTable">
              <thead>
                <tr>
                  <th class="col-num">#</th>
                  <th class="col-name">Item Name</th>
                  <th class="col-price">Price/Unit</th>
                  <th class="col-unit">Unit</th>
                  <th class="col-qty">Qty</th>
                  <th class="col-total">Total</th>
                  <th class="col-action"></th>
                </tr>
              </thead>
              <tbody id="itemsBody">
              </tbody>
            </table>
          </div>
          <button type="button" class="add-item-btn" onclick="addItemRow()">
            ＋ Add Item
          </button>

          <!-- Product Quick Pick -->
          ${products.length > 0 ? `
            <div style="margin-top: 12px;">
              <label style="font-size: 0.78rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.8px;">Quick Add Product:</label>
              <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 6px;">
                ${products.map(p => `
                  <button type="button" class="btn btn-sm btn-secondary" onclick="addProductItem('${p.id}')">
                    ${p.name} (₹${p.defaultPrice})
                  </button>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>

        <!-- GST & Totals + Payment QR -->
        <div class="card" style="margin-bottom: 20px;">
          <div class="form-row">
            <div class="form-group">
              <label>GST %</label>
              <select class="form-control" id="invGst" onchange="recalculateTotals()">
                <option value="0" ${isEdit && invoice.gstPercent === 0 ? 'selected' : ''}>No GST</option>
                <option value="5" ${isEdit && invoice.gstPercent === 5 ? 'selected' : ''}>5%</option>
                <option value="12" ${isEdit && invoice.gstPercent === 12 ? 'selected' : ''}>12%</option>
                <option value="18" ${isEdit && invoice.gstPercent === 18 ? 'selected' : ''}>18%</option>
                <option value="28" ${isEdit && invoice.gstPercent === 28 ? 'selected' : ''}>28%</option>
              </select>
            </div>
            <div class="form-group">
              <label>Discount (₹)</label>
              <input type="number" class="form-control" id="invDiscount" 
                value="${isEdit ? invoice.discount : 0}" min="0" step="1" onchange="recalculateTotals()">
            </div>
            <div class="form-group">
              <label>Payment QR Code</label>
              <select class="form-control" id="invPaymentQr">
                <option value="">None</option>
                ${upiAccounts.map(a => `
                  <option value="${a.id}" ${isEdit && invoice.paymentQrId === a.id ? 'selected' : ''}>${a.label}</option>
                `).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Received Amount (₹)</label>
              <input type="number" class="form-control" id="invReceived"
                value="${isEdit ? (invoice.receivedAmount || 0) : 0}" min="0" step="1" onchange="recalculateTotals()" placeholder="0">
            </div>
            <div class="form-group" id="receivedDateGroup" style="display: ${isEdit && invoice.receivedAmount > 0 ? 'block' : 'none'};">
              <label>Received Date <span style="font-size:0.75rem; color:var(--text-muted); font-weight:400;">(select date)</span></label>
              <input type="date" class="form-control" id="invReceivedDate"
                value="${isEdit && invoice.receivedDate ? invoice.receivedDate : ''}">
            </div>
            <div class="form-group">
              <label>Notes</label>
              <input type="text" class="form-control" id="invNotes" 
                value="${isEdit ? (invoice.notes || '') : ''}" placeholder="Optional notes">
            </div>
          </div>

          <div class="totals-section">
            <div class="totals-box">
              <div class="totals-row">
                <span>Sub Total</span>
                <span id="displaySubtotal">₹0</span>
              </div>
              <div class="totals-row" id="gstRow" style="display: none;">
                <span id="gstLabel">GST (0%)</span>
                <span id="displayGst">₹0</span>
              </div>
              <div class="totals-row" id="discountRow" style="display: none;">
                <span>Discount</span>
                <span id="displayDiscount">-₹0</span>
              </div>
              <div class="totals-row total-final">
                <span>Grand Total</span>
                <span id="displayGrandTotal">₹0</span>
              </div>
              <div id="receivedRow" class="totals-row" style="color: var(--success, #22c55e);">
                <span>Received</span>
                <span id="displayReceived">₹0</span>
              </div>
              <div id="balanceRow" class="totals-row" style="color: var(--danger, #ef4444); font-weight: 700;">
                <span>Balance Due</span>
                <span id="displayBalance">₹0</span>
              </div>
              <div style="text-align: right; font-size: 0.78rem; color: var(--text-muted); margin-top: 4px; font-style: italic;">
                <span id="displayAmountWords"></span>
              </div>
            </div>
          </div>
        </div>

        <!-- Submit -->
        <div style="display: flex; gap: 12px; justify-content: flex-end;">
          <button type="button" class="btn btn-outline" onclick="navigateTo('${isEdit ? 'preview/' + editingInvoiceId : 'dashboard'}')">
            Cancel
          </button>
          <button type="submit" class="btn btn-primary btn-lg">
            ${isEdit ? '💾 Update Invoice' : '🧾 Create Invoice'}
          </button>
        </div>
      </form>
    </div>
  `;

  renderItemRows();
  recalculateTotals();

  // Auto-fill customer if editing
  if (isEdit && invoice.customerId) {
    document.getElementById('custSelect').value = invoice.customerId;
  }
}

function renderItemRows() {
  const tbody = document.getElementById('itemsBody');
  if (!tbody) return;

  tbody.innerHTML = currentItems.map((item, i) => `
    <tr>
      <td>${String(i + 1).padStart(2, '0')}</td>
      <td>
        <input type="text" class="form-control" placeholder="Item name" 
          value="${item.name}" onchange="updateItem(${i}, 'name', this.value)" required>
      </td>
      <td>
        <input type="number" class="form-control" placeholder="Price" 
          value="${item.pricePerUnit || ''}" min="0" step="0.01" 
          onchange="updateItem(${i}, 'pricePerUnit', parseFloat(this.value) || 0)">
      </td>
      <td>
        <input type="text" class="form-control" placeholder="Unit" 
          value="${item.unit}" onchange="updateItem(${i}, 'unit', this.value)">
      </td>
      <td>
        <input type="number" class="form-control" placeholder="Qty" 
          value="${item.qty}" min="1" step="1" 
          onchange="updateItem(${i}, 'qty', parseInt(this.value) || 1)">
      </td>
      <td style="font-weight: 600; padding: 8px 12px;">
        ${formatCurrency(item.total)}
      </td>
      <td>
        ${currentItems.length > 1 ? `
          <button type="button" class="remove-item-btn" onclick="removeItem(${i})">×</button>
        ` : ''}
      </td>
    </tr>
  `).join('');
}

function addItemRow() {
  currentItems.push({ name: '', pricePerUnit: 0, unit: 'NOS', qty: 1, total: 0 });
  renderItemRows();
}

function addProductItem(productId) {
  const product = getProducts().find(p => p.id === productId);
  if (!product) return;
  currentItems.push({
    name: product.name,
    pricePerUnit: product.defaultPrice,
    unit: product.unit,
    qty: 1,
    total: product.defaultPrice
  });
  renderItemRows();
  recalculateTotals();
}

function removeItem(index) {
  if (currentItems.length <= 1) return;
  currentItems.splice(index, 1);
  renderItemRows();
  recalculateTotals();
}

function updateItem(index, field, value) {
  currentItems[index][field] = value;
  if (field === 'pricePerUnit' || field === 'qty') {
    currentItems[index].total = currentItems[index].pricePerUnit * currentItems[index].qty;
    renderItemRows();
  }
  recalculateTotals();
}

function recalculateTotals() {
  const subtotal = currentItems.reduce((sum, item) => sum + (item.pricePerUnit * item.qty), 0);
  const gstPercent = parseInt(document.getElementById('invGst')?.value || 0);
  const discount = parseFloat(document.getElementById('invDiscount')?.value || 0);
  const received = parseFloat(document.getElementById('invReceived')?.value || 0);

  const gstAmount = (subtotal * gstPercent) / 100;
  const grandTotal = subtotal + gstAmount - discount;
  const balance = Math.max(0, grandTotal - received);

  // Update totals in items array
  currentItems.forEach(item => {
    item.total = item.pricePerUnit * item.qty;
  });

  // Update display
  const elSub = document.getElementById('displaySubtotal');
  const elGst = document.getElementById('displayGst');
  const elGstLabel = document.getElementById('gstLabel');
  const elGstRow = document.getElementById('gstRow');
  const elDisc = document.getElementById('displayDiscount');
  const elDiscRow = document.getElementById('discountRow');
  const elTotal = document.getElementById('displayGrandTotal');
  const elWords = document.getElementById('displayAmountWords');
  const elReceived = document.getElementById('displayReceived');
  const elReceivedRow = document.getElementById('receivedRow');
  const elBalance = document.getElementById('displayBalance');
  const elBalanceRow = document.getElementById('balanceRow');

  if (elSub) elSub.textContent = formatCurrency(subtotal);
  if (elGst) elGst.textContent = formatCurrency(gstAmount);
  if (elGstLabel) elGstLabel.textContent = `GST (${gstPercent}%)`;
  if (elGstRow) elGstRow.style.display = gstPercent > 0 ? 'flex' : 'none';
  if (elDisc) elDisc.textContent = `-${formatCurrency(discount)}`;
  if (elDiscRow) elDiscRow.style.display = discount > 0 ? 'flex' : 'none';
  if (elTotal) elTotal.textContent = formatCurrency(grandTotal);
  if (elWords) elWords.textContent = numberToWords(grandTotal);
  if (elReceived) elReceived.textContent = formatCurrency(received);
  if (elReceivedRow) elReceivedRow.style.display = received > 0 ? 'flex' : 'none';
  if (elBalance) elBalance.textContent = formatCurrency(balance);
  if (elBalanceRow) elBalanceRow.style.display = received > 0 ? 'flex' : 'none';

  // Show/hide received date field
  const elReceivedDateGroup = document.getElementById('receivedDateGroup');
  if (elReceivedDateGroup) {
    elReceivedDateGroup.style.display = received > 0 ? 'block' : 'none';
  }
}

function handleCustomerSelect() {
  const sel = document.getElementById('custSelect');
  if (!sel.value) {
    document.getElementById('custName').value = '';
    document.getElementById('custPhone').value = '';
    document.getElementById('custGstin').value = '';
    return;
  }
  const customer = getCustomerById(sel.value);
  if (customer) {
    document.getElementById('custName').value = customer.name;
    document.getElementById('custPhone').value = customer.phone || '';
    document.getElementById('custGstin').value = customer.gstin || '';
  }
}

function togglePaymentDate() {
  const status = document.getElementById('invStatus')?.value;
  const group = document.getElementById('paymentDateGroup');
  if (group) group.style.display = status === 'paid' ? 'block' : 'none';
}

function handleSaveInvoice(e) {
  e.preventDefault();

  const invoiceNumber = parseInt(document.getElementById('invNumber').value);
  const date = document.getElementById('invDate').value;
  const status = document.getElementById('invStatus').value;
  const paymentDate = status === 'paid' ? (document.getElementById('invPaymentDate')?.value || '') : '';
  const paymentMode = document.getElementById('invPaymentMode').value;
  const paymentQrId = document.getElementById('invPaymentQr').value || '';
  const customerName = document.getElementById('custName').value.trim();
  const customerPhone = document.getElementById('custPhone').value.trim();
  const customerGstin = document.getElementById('custGstin').value.trim();
  const customerId = document.getElementById('custSelect').value || '';
  const gstPercent = parseInt(document.getElementById('invGst').value || 0);
  const discount = parseFloat(document.getElementById('invDiscount').value || 0);
  const receivedAmount = parseFloat(document.getElementById('invReceived').value || 0);
  const receivedDate = receivedAmount > 0 ? (document.getElementById('invReceivedDate').value || '') : '';
  const notes = document.getElementById('invNotes').value.trim();

  // Validate items
  const validItems = currentItems.filter(item => item.name.trim());
  if (validItems.length === 0) {
    showToast('Please add at least one item', 'error');
    return;
  }

  const subtotal = validItems.reduce((sum, item) => sum + item.total, 0);
  const gstAmount = (subtotal * gstPercent) / 100;
  const grandTotal = subtotal + gstAmount - discount;

  const balanceDue = Math.max(0, grandTotal - receivedAmount);

  const invoiceData = {
    invoiceNumber,
    date,
    customerId,
    customerName,
    customerPhone,
    customerGstin,
    items: validItems,
    subtotal,
    gstPercent,
    gstAmount,
    discount,
    grandTotal,
    receivedAmount,
    receivedDate,
    balanceDue,
    paymentDate,
    amountInWords: numberToWords(grandTotal),
    status,
    paymentMode,
    paymentQrId,
    notes
  };

  // Save customer if new
  if (!customerId && customerName) {
    const newCust = addCustomer({
      name: customerName,
      phone: customerPhone,
      gstin: customerGstin,
      address: ''
    });
    invoiceData.customerId = newCust.id;
  }

  if (editingInvoiceId) {
    updateInvoice(editingInvoiceId, invoiceData);
    showToast('Invoice updated successfully!');
    navigateTo('preview/' + editingInvoiceId);
  } else {
    // Commit the invoice number only on actual save
    commitInvoiceNumber(invoiceNumber);
    const saved = addInvoice(invoiceData);
    showToast('Invoice created successfully!');
    navigateTo('preview/' + saved.id);
  }
}
