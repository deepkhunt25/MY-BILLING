// ========================================
// INVOICE-PREVIEW.JS — Preview & PDF
// ========================================

function renderInvoicePreview(invoiceId) {
    const invoice = getInvoiceById(invoiceId);
    if (!invoice) {
        showToast('Invoice not found', 'error');
        navigateTo('history');
        return;
    }

    const business = getBusiness();
    const totalQty = invoice.items.reduce((s, item) => s + item.qty, 0);

    const app = document.getElementById('app');
    app.innerHTML = `
    <div class="page-enter">
      <div class="page-header">
        <div>
          <h2>Invoice #${invoice.invoiceNumber}</h2>
          <p class="subtitle">${invoice.customerName} · ${formatDate(invoice.date)}</p>
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="btn btn-outline" onclick="navigateTo('history')">← Back</button>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="preview-actions">
        <button class="btn btn-primary" onclick="downloadInvoicePDF('${invoiceId}')">
          📥 Download PDF
        </button>
        <button class="btn btn-secondary" onclick="window.print()">
          🖨 Print
        </button>
        <button class="btn btn-secondary" onclick="navigateTo('edit/${invoiceId}')">
          ✏️ Edit
        </button>
        <button class="btn btn-secondary" onclick="shareWhatsApp('${invoiceId}')">
          💬 Share WhatsApp
        </button>
      </div>

      <!-- Invoice Preview -->
      <div class="invoice-preview-container">
        <div class="invoice-preview" id="invoicePrintArea">
          
          <!-- Header -->
          <div class="inv-header">
            <div class="inv-business">
              <div class="inv-name">
                <span class="inv-avatar">${business.name.charAt(0).toUpperCase()}</span>
                ${business.name}
              </div>
              <div class="inv-detail">${business.address}</div>
              <div class="inv-detail" style="font-style: italic;">Phone: ${business.phone}</div>
            </div>
            <div class="inv-meta">
              <div class="inv-number">Invoice No.${invoice.invoiceNumber}</div>
              <div class="inv-date">Invoice Date: ${formatDate(invoice.date)}</div>
            </div>
          </div>

          <!-- Customer + Paid -->
          <div class="inv-customer-section">
            <div class="inv-customer">
              <div class="inv-cust-label">Bill and Ship To</div>
              <div class="inv-cust-name">${invoice.customerName}</div>
              <div class="inv-cust-detail"><strong>Phone:</strong> ${invoice.customerPhone || '—'}</div>
              <div class="inv-cust-detail" style="font-style: italic;">GSTIN: ${invoice.customerGstin || '—'}</div>
            </div>
            <div class="inv-paid-stamp">
              ${invoice.status === 'paid' ? `
                <div class="paid-badge">
                  <span class="paid-text-top">THANK YOU</span>
                  <span class="paid-text-main">PAID</span>
                  <span class="paid-text-bottom">✮ ✮ ✮</span>
                </div>
              ` : ''}
              <div class="inv-paid-info">
                <div class="inv-total-label">Total amount</div>
                <div class="inv-total-big">${formatCurrency(invoice.grandTotal)}</div>
                <div class="inv-total-words">${invoice.amountInWords}</div>
              </div>
            </div>
          </div>

          <!-- Items Table -->
          <div class="inv-items">
            <table class="inv-items-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Item Details</th>
                  <th>Price/Unit</th>
                  <th class="text-right">Qty</th>
                  <th class="text-right">Rate</th>
                  <th class="text-right text-bold">Total</th>
                </tr>
              </thead>
              <tbody>
                ${invoice.items.map((item, i) => `
                  <tr>
                    <td>${String(i + 1).padStart(2, '0')}</td>
                    <td>${item.name}</td>
                    <td>${item.pricePerUnit}/${item.unit}</td>
                    <td class="text-right">${item.qty}</td>
                    <td class="text-right">${formatCurrency(item.total)}</td>
                    <td class="text-right text-bold">${formatCurrency(item.total)}</td>
                  </tr>
                `).join('')}
                <tr class="inv-subtotal-row">
                  <td colspan="3"><strong>Sub-total Amount</strong></td>
                  <td class="text-right"><strong>${totalQty}</strong></td>
                  <td class="text-right"><strong>${formatCurrency(invoice.subtotal)}</strong></td>
                  <td class="text-right"><strong>${formatCurrency(invoice.subtotal)}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Tax Rows if GST -->
          ${invoice.gstPercent > 0 || invoice.discount > 0 ? `
            <div class="inv-tax-rows">
              ${invoice.gstPercent > 0 ? `
                <div class="inv-tax-row">
                  <span>GST (${invoice.gstPercent}%)</span>
                  <span>${formatCurrency(invoice.gstAmount)}</span>
                </div>
              ` : ''}
              ${invoice.discount > 0 ? `
                <div class="inv-tax-row">
                  <span>Discount</span>
                  <span>-${formatCurrency(invoice.discount)}</span>
                </div>
              ` : ''}
            </div>
          ` : ''}

          <!-- Grand Total -->
          <div class="inv-grand-total">
            <div class="gt-label">Total amount</div>
            <div class="gt-value">${formatCurrency(invoice.grandTotal)}</div>
            <div class="gt-words">${invoice.amountInWords}</div>
          </div>

          <!-- Footer -->
          <div class="inv-footer">
            <div class="inv-digital">~ THIS IS A DIGITALLY CREATED INVOICE ~</div>
            <div class="inv-signature">AUTHORISED SIGNATURE</div>
            <div class="inv-thankyou">Thank you for the business.</div>
          </div>
          <div class="inv-footer-bar"></div>
        </div>
      </div>
    </div>
  `;
}

function downloadInvoicePDF(invoiceId) {
    const invoice = getInvoiceById(invoiceId);
    if (!invoice) return;

    const element = document.getElementById('invoicePrintArea');
    if (!element) return;

    const opt = {
        margin: [0, 0, 0, 0],
        filename: `Invoice_${invoice.invoiceNumber}_${invoice.customerName.replace(/\s+/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Check if html2pdf is available
    if (typeof html2pdf !== 'undefined') {
        showToast('Generating PDF...', 'info');
        html2pdf().set(opt).from(element).save().then(() => {
            showToast('PDF downloaded successfully!');
        }).catch(err => {
            console.error('PDF error:', err);
            showToast('PDF generation failed. Try printing instead.', 'error');
        });
    } else {
        showToast('PDF library not loaded. Using print dialog instead.', 'info');
        window.print();
    }
}

function shareWhatsApp(invoiceId) {
    const invoice = getInvoiceById(invoiceId);
    if (!invoice) return;

    const business = getBusiness();
    const message = encodeURIComponent(
        `*Invoice #${invoice.invoiceNumber}*\n` +
        `From: ${business.name}\n` +
        `To: ${invoice.customerName}\n` +
        `Date: ${formatDate(invoice.date)}\n` +
        `Amount: ${formatCurrency(invoice.grandTotal)}\n` +
        `Status: ${invoice.status.toUpperCase()}\n\n` +
        `Items:\n` +
        invoice.items.map((item, i) => `${i + 1}. ${item.name} x${item.qty} = ${formatCurrency(item.total)}`).join('\n') +
        `\n\nThank you for your business!`
    );

    const phone = invoice.customerPhone ? invoice.customerPhone.replace(/\D/g, '') : '';
    const url = phone
        ? `https://wa.me/91${phone}?text=${message}`
        : `https://wa.me/?text=${message}`;

    window.open(url, '_blank');
}
