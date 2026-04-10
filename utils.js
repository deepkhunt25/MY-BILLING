// ========================================
// UTILS.JS — Utility Functions
// ========================================

/**
 * Convert number to Indian words
 * e.g., 2700 → "Two Thousand Seven Hundred Rupees Only"
 */
function numberToWords(num) {
  if (num === 0) return 'Zero Rupees Only';

  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen',
    'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertGroup(n) {
    if (n === 0) return '';
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convertGroup(n % 100) : '');
  }

  let result = '';
  const absNum = Math.abs(Math.floor(num));

  // Indian system: Crore, Lakh, Thousand, Hundred
  if (absNum >= 10000000) {
    result += convertGroup(Math.floor(absNum / 10000000)) + ' Crore ';
  }
  const remaining1 = absNum % 10000000;
  if (remaining1 >= 100000) {
    result += convertGroup(Math.floor(remaining1 / 100000)) + ' Lakh ';
  }
  const remaining2 = remaining1 % 100000;
  if (remaining2 >= 1000) {
    result += convertGroup(Math.floor(remaining2 / 1000)) + ' Thousand ';
  }
  const remaining3 = remaining2 % 1000;
  if (remaining3 > 0) {
    result += convertGroup(remaining3);
  }

  result = result.trim();
  if (!result) result = 'Zero';

  // Handle paise
  const paise = Math.round((num - Math.floor(num)) * 100);
  if (paise > 0) {
    result += ' Rupees and ' + convertGroup(paise) + ' Paise Only';
  } else {
    result += ' Rupees Only';
  }

  return result;
}

/**
 * Format date: "18 Dec 2025"
 */
function formatDate(dateStr) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const d = new Date(dateStr);
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Format date for input: "2025-12-18"
 */
function formatDateInput(dateStr) {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Format currency: ₹2,700 (Indian comma system)
 */
function formatCurrency(amount) {
  const num = parseFloat(amount) || 0;
  const isNegative = num < 0;
  const absNum = Math.abs(num);

  // Indian comma system: 1,00,000
  const parts = absNum.toFixed(2).split('.');
  let intPart = parts[0];
  const decPart = parts[1];

  if (intPart.length > 3) {
    const last3 = intPart.slice(-3);
    let remaining = intPart.slice(0, -3);
    let formatted = '';
    while (remaining.length > 2) {
      formatted = ',' + remaining.slice(-2) + formatted;
      remaining = remaining.slice(0, -2);
    }
    intPart = remaining + formatted + ',' + last3;
  }

  const result = decPart === '00' ? intPart : intPart + '.' + decPart;
  return (isNegative ? '-' : '') + '₹' + result;
}

/**
 * Generate a unique ID with prefix
 */
function generateId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
}

/**
 * Get today's date as YYYY-MM-DD
 */
function getTodayDate() {
  return formatDateInput(new Date());
}

/**
 * Show toast notification
 */
function showToast(message, type = 'success') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ'}</span>
    <span class="toast-message">${message}</span>
  `;
  document.body.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('toast-show'));

  setTimeout(() => {
    toast.classList.remove('toast-show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/**
 * Show confirmation modal
 */
function showConfirm(message) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-box">
        <div class="modal-icon">⚠️</div>
        <p class="modal-message">${message}</p>
        <div class="modal-actions">
          <button class="btn btn-outline modal-cancel">Cancel</button>
          <button class="btn btn-danger modal-confirm">Delete</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('modal-show'));

    overlay.querySelector('.modal-cancel').onclick = () => {
      overlay.classList.remove('modal-show');
      setTimeout(() => overlay.remove(), 200);
      resolve(false);
    };
    overlay.querySelector('.modal-confirm').onclick = () => {
      overlay.classList.remove('modal-show');
      setTimeout(() => overlay.remove(), 200);
      resolve(true);
    };
  });
}
