// ========================================
// HISTORY.JS — Invoice History Page
// ========================================

function renderHistory() {
  const allInvoices = getInvoices();
  const invoices = filterInvoices();

  // Build unique values for filter dropdowns
  const uniqueCustomers = [...new Set(allInvoices.map(inv => inv.customerName))].sort();
  const uniqueYears = [...new Set(allInvoices.map(inv => inv.date ? inv.date.substring(0, 4) : '').filter(Boolean))].sort().reverse();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="page-enter">
      <div class="page-header">
        <div>
          <h2>Invoice History</h2>
          <p class="subtitle">${invoices.length} invoice${invoices.length !== 1 ? 's' : ''} found</p>
        </div>
        <button class="btn btn-primary" onclick="navigateTo('new')">
          <span>＋</span> New Invoice
        </button>
      </div>

      <!-- Search Bar -->
      <div class="filter-bar">
        <div class="search-input">
          <input type="text" id="historySearch" placeholder="Search by customer, invoice #, phone, or payment mode..." 
            oninput="handleHistorySearch()">
        </div>
      </div>

      <!-- Extended Filters -->
      <div class="card" style="margin-bottom: 20px; padding: 16px 20px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
          <span style="font-size: 0.82rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.8px;">Filters</span>
          <button class="btn btn-sm btn-outline" onclick="clearHistoryFilters()">Clear All</button>
        </div>
        <div class="form-row" style="margin-bottom: 0;">
          <div class="form-group" style="margin-bottom: 0;">
            <label>Customer</label>
            <select class="form-control" id="filterCustomer" onchange="handleHistoryFilter()">
              <option value="all">All Customers</option>
              ${uniqueCustomers.map(c => `<option value="${c}">${c}</option>`).join('')}
            </select>
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label>Year</label>
            <select class="form-control" id="filterYear" onchange="handleHistoryFilter()">
              <option value="all">All Years</option>
              ${uniqueYears.map(y => `<option value="${y}">${y}</option>`).join('')}
            </select>
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label>Month</label>
            <select class="form-control" id="filterMonth" onchange="handleHistoryFilter()">
              <option value="all">All Months</option>
              ${monthNames.map((m, i) => `<option value="${i + 1}">${m}</option>`).join('')}
            </select>
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label>Payment Mode</label>
            <select class="form-control" id="filterPaymentMode" onchange="handleHistoryFilter()">
              <option value="all">All Modes</option>
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="bank">Bank Transfer</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label>Status</label>
            <select class="form-control" id="filterStatus" onchange="handleHistoryFilter()">
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Invoice List -->
      <div class="card" id="historyList">
        ${renderHistoryTable(invoices)}
      </div>
    </div>
  `;
}

function renderHistoryTable(invoices) {
  if (invoices.length === 0) {
    return `
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <div class="empty-title">No invoices found</div>
        <div class="empty-text">Try adjusting your search or filters</div>
      </div>
    `;
  }

  const modeIcons = { cash: '💵', upi: '📱', bank: '🏦', other: '📋' };

  return `
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Invoice #</th>
            <th>Customer</th>
            <th>Date</th>
            <th class="text-right">Amount</th>
            <th class="text-center">Payment Mode</th>
            <th class="text-center">Status</th>
            <th class="text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${invoices.map(inv => `
            <tr>
              <td><strong>#${inv.invoiceNumber}</strong></td>
              <td>
                <div>${inv.customerName}</div>
                <div style="font-size: 0.78rem; color: var(--text-muted);">${inv.customerPhone || ''}</div>
              </td>
              <td>${formatDate(inv.date)}</td>
              <td class="text-right"><strong>${formatCurrency(inv.grandTotal)}</strong></td>
              <td class="text-center">
                <span style="font-size: 0.85rem;">${modeIcons[inv.paymentMode] || ''} ${getPaymentModeLabel(inv.paymentMode)}</span>
              </td>
              <td class="text-center">
                <span class="badge badge-${inv.status}">${inv.status === 'paid' ? '✓ Paid' : '◷ Unpaid'}</span>
              </td>
              <td class="text-center">
                <div style="display: flex; gap: 4px; justify-content: center;">
                  <button class="btn-icon" onclick="navigateTo('preview/${inv.id}')" title="View">👁</button>
                  <button class="btn-icon" onclick="navigateTo('edit/${inv.id}')" title="Edit">✏️</button>
                  <button class="btn-icon" onclick="handleDeleteInvoice('${inv.id}')" title="Delete">🗑️</button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function getFilterValues() {
  return {
    status: document.getElementById('filterStatus')?.value || 'all',
    paymentMode: document.getElementById('filterPaymentMode')?.value || 'all',
    customer: document.getElementById('filterCustomer')?.value || 'all',
    year: document.getElementById('filterYear')?.value || 'all',
    month: document.getElementById('filterMonth')?.value || 'all'
  };
}

function handleHistorySearch() {
  const query = document.getElementById('historySearch')?.value || '';
  const filters = getFilterValues();

  let results = searchInvoices(query);

  // Apply additional filters
  if (filters.status !== 'all') results = results.filter(inv => inv.status === filters.status);
  if (filters.paymentMode !== 'all') results = results.filter(inv => inv.paymentMode === filters.paymentMode);
  if (filters.customer !== 'all') results = results.filter(inv => inv.customerName === filters.customer);
  if (filters.year !== 'all') results = results.filter(inv => inv.date && inv.date.startsWith(filters.year));
  if (filters.month !== 'all' && filters.year !== 'all') {
    const mm = String(filters.month).padStart(2, '0');
    results = results.filter(inv => inv.date && inv.date.substring(5, 7) === mm);
  }

  results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Update subtitle count
  const subtitle = document.querySelector('.page-header .subtitle');
  if (subtitle) subtitle.textContent = `${results.length} invoice${results.length !== 1 ? 's' : ''} found`;

  document.getElementById('historyList').innerHTML = renderHistoryTable(results);
}

function handleHistoryFilter() {
  handleHistorySearch();
}

function clearHistoryFilters() {
  const ids = ['historySearch', 'filterCustomer', 'filterYear', 'filterMonth', 'filterPaymentMode', 'filterStatus'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      if (el.tagName === 'SELECT') el.value = 'all';
      else el.value = '';
    }
  });
  handleHistorySearch();
}

async function handleDeleteInvoice(id) {
  const invoice = getInvoiceById(id);
  if (!invoice) return;

  const confirmed = await showConfirm(`Move Invoice #${invoice.invoiceNumber} to Recycle Bin?`);
  if (confirmed) {
    deleteInvoice(id);
    showToast('Invoice moved to Recycle Bin — can be restored anytime', 'info');
    renderHistory();
  }
}
