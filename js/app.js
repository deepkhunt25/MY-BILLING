// ========================================
// APP.JS — Router & App Controller
// ========================================

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    seedDemoData();
    initRouter();
    initMobileMenu();
    updateSidebarBrand();
});

// ─── Hash Router ────────────────────────
function initRouter() {
    window.addEventListener('hashchange', handleRoute);
    handleRoute();
}

function navigateTo(page) {
    window.location.hash = page;
}

function handleRoute() {
    const hash = window.location.hash.slice(1) || 'dashboard';
    const parts = hash.split('/');
    const page = parts[0];
    const param = parts.slice(1).join('/');

    // Update active nav
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === page ||
            (page === 'new' && item.dataset.page === 'new') ||
            (page === 'edit' && item.dataset.page === 'new') ||
            (page === 'preview' && item.dataset.page === 'history')) {
            item.classList.add('active');
        }
    });

    // Close mobile menu
    closeMobileMenu();

    // Route to page
    switch (page) {
        case 'dashboard':
            renderDashboard();
            break;
        case 'new':
            renderInvoiceForm();
            break;
        case 'edit':
            renderInvoiceForm(param);
            break;
        case 'preview':
            renderInvoicePreview(param);
            break;
        case 'history':
            renderHistory();
            break;
        case 'recycle-bin':
            renderRecycleBin();
            break;
        case 'settings':
            renderSettings();
            break;
        default:
            renderDashboard();
    }

    // Scroll to top
    window.scrollTo(0, 0);
}

// ─── Mobile Menu ────────────────────────
function initMobileMenu() {
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const overlay = document.querySelector('.mobile-overlay');

    if (menuBtn) {
        menuBtn.addEventListener('click', toggleMobileMenu);
    }
    if (overlay) {
        overlay.addEventListener('click', closeMobileMenu);
    }
}

function toggleMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.mobile-overlay');
    sidebar.classList.toggle('sidebar-open');
    overlay.classList.toggle('show');
}

function closeMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.mobile-overlay');
    if (sidebar) sidebar.classList.remove('sidebar-open');
    if (overlay) overlay.classList.remove('show');
}
