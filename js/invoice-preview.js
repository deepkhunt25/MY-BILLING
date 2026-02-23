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

  // Get QR code if selected
  let qrAccount = null;
  if (invoice.paymentQrId) {
    qrAccount = getUpiAccountById(invoice.paymentQrId);
  }

  // Business logo
  const logoHtml = business.logo
    ? `<img src="${business.logo}" alt="${business.name}" class="inv-logo-img">`
    : `<span class="inv-avatar">${business.name.charAt(0).toUpperCase()}</span>`;

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
        <button class="btn btn-secondary" onclick="showShareModal('${invoiceId}')">
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
                ${logoHtml}
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

          <!-- Customer + Status Badge -->
          <div class="inv-customer-section">
            <div class="inv-customer">
              <div class="inv-cust-label">Bill and Ship To</div>
              <div class="inv-cust-name">${invoice.customerName}</div>
              <div class="inv-cust-detail"><strong>Phone:</strong> ${invoice.customerPhone || '—'}</div>
              <div class="inv-cust-detail" style="font-style: italic;">GSTIN: ${invoice.customerGstin || '—'}</div>
            </div>
            <div class="inv-paid-stamp">
              ${invoice.status === 'paid' ? `
                <div class="status-badge paid-badge">
                  <span class="badge-text-top">THANK YOU</span>
                  <span class="badge-text-main">PAID</span>
                  <span class="badge-text-bottom">✮ ✮ ✮</span>
                </div>
              ` : `
                <div class="status-badge unpaid-badge">
                  <span class="badge-text-top">PAYMENT</span>
                  <span class="badge-text-main">DUE</span>
                  <span class="badge-text-bottom">⚠ ⚠ ⚠</span>
                </div>
              `}
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

          <!-- Grand Total + QR Code (inline) -->
          <div class="inv-grand-total ${qrAccount && qrAccount.qrDataUrl ? 'inv-grand-total-with-qr' : ''}">
            ${qrAccount && qrAccount.qrDataUrl ? `
              <div class="inv-qr-box">
                <img src="${qrAccount.qrDataUrl}" alt="Payment QR" class="inv-qr-img">
                <div class="inv-qr-label">Scan to Pay</div>
                <div class="inv-qr-detail">${qrAccount.label}</div>
                ${qrAccount.upiId ? `<div class="inv-qr-detail">${qrAccount.upiId}</div>` : ''}
              </div>
            ` : ''}
            <div class="gt-content">
              <div class="gt-label">Total amount</div>
              <div class="gt-value">${formatCurrency(invoice.grandTotal)}</div>
              <div class="gt-words">${invoice.amountInWords}</div>
            </div>
          </div>

          <!-- Footer -->
          <div class="inv-footer">
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
    filename: `Invoice_${invoice.invoiceNumber}.pdf`,
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

function downloadInvoiceImage(invoiceId) {
  const invoice = getInvoiceById(invoiceId);
  if (!invoice) return;

  const element = document.getElementById('invoicePrintArea');
  if (!element) return;

  if (typeof html2pdf !== 'undefined') {
    showToast('Generating image...', 'info');
    // Use html2canvas directly from html2pdf's bundle
    import('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js').catch(() => { });
    // html2pdf bundles html2canvas, so we can use it
    const worker = html2pdf().set({
      image: { type: 'png', quality: 1 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true }
    }).from(element);

    worker.toCanvas().then(canvas => {
      const link = document.createElement('a');
      link.download = `Invoice_${invoice.invoiceNumber}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      showToast('Image downloaded successfully!');
    }).catch(err => {
      console.error('Image error:', err);
      showToast('Image generation failed.', 'error');
    });
  } else {
    showToast('Library not loaded.', 'error');
  }
}

// ─── Share Modal (Change 8) ─────────────
function showShareModal(invoiceId) {
  const invoice = getInvoiceById(invoiceId);
  if (!invoice) return;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
      <div class="modal-box" style="max-width: 440px;">
        <div class="modal-icon">💬</div>
        <p class="modal-message">How would you like to share this invoice via WhatsApp?</p>
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <button class="btn btn-primary" onclick="shareWhatsAppText('${invoiceId}'); this.closest('.modal-overlay').remove();">
            📝 Send Text Summary
          </button>
          <button class="btn btn-secondary" onclick="shareWhatsAppWithPDF('${invoiceId}'); this.closest('.modal-overlay').remove();">
            📄 Download PDF + Open WhatsApp
          </button>
          <button class="btn btn-secondary" onclick="shareWhatsAppWithImage('${invoiceId}'); this.closest('.modal-overlay').remove();">
            🖼 Download Image + Open WhatsApp
          </button>
          <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove();">
            Cancel
          </button>
        </div>
      </div>
    `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('modal-show'));
}

function getWhatsAppUrl(invoice) {
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
  return phone
    ? `https://wa.me/91${phone}?text=${message}`
    : `https://wa.me/?text=${message}`;
}

function shareWhatsAppText(invoiceId) {
  const invoice = getInvoiceById(invoiceId);
  if (!invoice) return;
  window.open(getWhatsAppUrl(invoice), '_blank');
}

function shareWhatsAppWithPDF(invoiceId) {
  downloadInvoicePDF(invoiceId);
  const invoice = getInvoiceById(invoiceId);
  if (!invoice) return;
  setTimeout(() => {
    showToast('PDF downloaded! Opening WhatsApp — please attach the PDF manually.', 'info');
    window.open(getWhatsAppUrl(invoice), '_blank');
  }, 2000);
}

function shareWhatsAppWithImage(invoiceId) {
  downloadInvoiceImage(invoiceId);
  const invoice = getInvoiceById(invoiceId);
  if (!invoice) return;
  setTimeout(() => {
    showToast('Image downloaded! Opening WhatsApp — please attach the image manually.', 'info');
    window.open(getWhatsAppUrl(invoice), '_blank');
  }, 2000);
}
