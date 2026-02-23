// ========================================
// DASHBOARD.JS — Dashboard Page
// ========================================

function renderDashboard() {
    const stats = getStats();
    const invoices = getInvoices().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

    const app = document.getElementById('app');
    app.innerHTML = `
    <div class="page-enter">
      <div class="page-header">
        <div>
          <h2>Dashboard</h2>
          <p class="subtitle">Overview of your billing activity</p>
        </div>
        <button class="btn btn-primary" onclick="navigateTo('new')">
          <span>＋</span> New Invoice
        </button>
      </div>

      <!-- Stats -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">💰</div>
          <div class="stat-value">${formatCurrency(stats.totalRevenue)}</div>
          <div class="stat-label">Total Revenue</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📄</div>
          <div class="stat-value">${stats.invoiceCount}</div>
          <div class="stat-label">Total Invoices</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">✅</div>
          <div class="stat-value">${stats.paidCount}</div>
          <div class="stat-label">Paid (${formatCurrency(stats.paidAmount)})</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">⏳</div>
          <div class="stat-value">${stats.unpaidCount}</div>
          <div class="stat-label">Unpaid (${formatCurrency(stats.unpaidAmount)})</div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions">
        <button class="quick-action-btn" onclick="navigateTo('new')">
          <span class="qa-icon">📝</span>
          <span>Create Invoice</span>
        </button>
        <button class="quick-action-btn" onclick="navigateTo('history')">
          <span class="qa-icon">📋</span>
          <span>View All Invoices</span>
        </button>
        <button class="quick-action-btn" onclick="navigateTo('settings')">
          <span class="qa-icon">⚙️</span>
          <span>Settings</span>
        </button>
      </div>

      <!-- Recent Invoices -->
      <div class="card">
        <h3 style="margin-bottom: 16px; font-size: 1.05rem;">Recent Invoices</h3>
        ${invoices.length === 0 ? `
          <div class="empty-state">
            <div class="empty-icon">📄</div>
            <div class="empty-title">No invoices yet</div>
            <div class="empty-text">Create your first invoice to get started</div>
            <button class="btn btn-primary" onclick="navigateTo('new')">Create Invoice</button>
          </div>
        ` : `
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th class="text-right">Amount</th>
                  <th class="text-center">Status</th>
                  <th class="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                ${invoices.map(inv => `
                  <tr>
                    <td><strong>#${inv.invoiceNumber}</strong></td>
                    <td>${inv.customerName}</td>
                    <td>${formatDate(inv.date)}</td>
                    <td class="text-right"><strong>${formatCurrency(inv.grandTotal)}</strong></td>
                    <td class="text-center">
                      <span class="badge badge-${inv.status}">${inv.status === 'paid' ? '✓ Paid' : '◷ Unpaid'}</span>
                    </td>
                    <td class="text-center">
                      <button class="btn-icon" onclick="navigateTo('preview/${inv.id}')" title="View">👁</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>
    </div>
  `;
}
