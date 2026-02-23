// ========================================
// RECYCLE-BIN.JS — Deleted Invoices
// ========================================

function renderRecycleBin() {
    const deleted = getDeletedInvoices().sort((a, b) => new Date(b.deletedAt) - new Date(a.deletedAt));

    const app = document.getElementById('app');
    app.innerHTML = `
    <div class="page-enter">
      <div class="page-header">
        <div>
          <h2>🗑️ Recycle Bin</h2>
          <p class="subtitle">${deleted.length} deleted invoice${deleted.length !== 1 ? 's' : ''}</p>
        </div>
        ${deleted.length > 0 ? `
          <button class="btn btn-outline" style="color:#ef4444; border-color:#ef4444;" onclick="handleEmptyBin()">
            🗑️ Empty Bin
          </button>
        ` : ''}
      </div>

      <div class="card" id="binList">
        ${renderBinTable(deleted)}
      </div>
    </div>
  `;
}

function renderBinTable(deleted) {
    if (deleted.length === 0) {
        return `
      <div class="empty-state">
        <div class="empty-icon">🗑️</div>
        <div class="empty-title">Recycle Bin is empty</div>
        <div class="empty-text">Deleted invoices will appear here and can be restored</div>
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
            <th>Invoice Date</th>
            <th class="text-right">Amount</th>
            <th class="text-center">Status</th>
            <th class="text-center">Deleted On</th>
            <th class="text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${deleted.map(inv => `
            <tr style="opacity: 0.8;">
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
              <td class="text-center" style="font-size:0.8rem; color:var(--text-muted);">
                ${formatDate(inv.deletedAt ? inv.deletedAt.substring(0, 10) : '')}
              </td>
              <td class="text-center">
                <div style="display: flex; gap: 4px; justify-content: center;">
                  <button class="btn btn-sm btn-secondary" onclick="handleRestoreInvoice('${inv.id}')" title="Restore">
                    ♻️ Restore
                  </button>
                  <button class="btn-icon" onclick="handlePermanentDelete('${inv.id}')" title="Delete Forever" style="color:#ef4444;">✕</button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

async function handleRestoreInvoice(id) {
    const bin = getDeletedInvoices();
    const invoice = bin.find(inv => inv.id === id);
    if (!invoice) return;
    restoreInvoice(id);
    showToast(`Invoice #${invoice.invoiceNumber} restored successfully!`);
    renderRecycleBin();
}

async function handlePermanentDelete(id) {
    const bin = getDeletedInvoices();
    const invoice = bin.find(inv => inv.id === id);
    if (!invoice) return;
    const confirmed = await showConfirm(`Permanently delete Invoice #${invoice.invoiceNumber}? This cannot be undone.`);
    if (confirmed) {
        permanentlyDeleteInvoice(id);
        showToast('Invoice permanently deleted');
        renderRecycleBin();
    }
}

async function handleEmptyBin() {
    const confirmed = await showConfirm('Empty the entire recycle bin? All deleted invoices will be permanently removed and cannot be recovered.');
    if (confirmed) {
        emptyRecycleBin();
        showToast('Recycle bin emptied');
        renderRecycleBin();
    }
}
