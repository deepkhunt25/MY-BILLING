// ========================================
// HISTORY.JS — Invoice History Page
// ========================================

function renderHistory() {
    const invoices = filterInvoices();

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

      <!-- Filters -->
      <div class="filter-bar">
        <div class="search-input">
          <input type="text" id="historySearch" placeholder="Search by customer or invoice number..." 
            oninput="handleHistorySearch(this.value)">
        </div>
        <select class="filter-select" id="historyStatusFilter" onchange="handleHistoryFilter()">
          <option value="all">All Status</option>
          <option value="paid">Paid</option>
          <option value="unpaid">Unpaid</option>
        </select>
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
        <div class="empty-text">Try adjusting your search or create a new invoice</div>
      </div>
    `;
    }

    return `
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Invoice #</th>
            <th>Customer</th>
            <th>Date</th>
            <th class="text-right">Amount</th>
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

function handleHistorySearch(query) {
    const status = document.getElementById('historyStatusFilter')?.value || 'all';
    let results = searchInvoices(query);
    if (status !== 'all') {
        results = results.filter(inv => inv.status === status);
    }
    results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    document.getElementById('historyList').innerHTML = renderHistoryTable(results);
}

function handleHistoryFilter() {
    const query = document.getElementById('historySearch')?.value || '';
    handleHistorySearch(query);
}

async function handleDeleteInvoice(id) {
    const invoice = getInvoiceById(id);
    if (!invoice) return;

    const confirmed = await showConfirm(`Delete Invoice #${invoice.invoiceNumber} for ${invoice.customerName}?`);
    if (confirmed) {
        deleteInvoice(id);
        showToast('Invoice deleted');
        renderHistory();
    }
}
