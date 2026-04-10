document.addEventListener('DOMContentLoaded', () => {
    // 1. Protection layer: Ensure user has token AND admin flag
    const token = localStorage.getItem('access_token');
    const isAdminFlag = localStorage.getItem('is_admin');
    const userRole = localStorage.getItem('user_role');

    if (!token || isAdminFlag !== 'true' || (userRole && userRole !== 'admin')) {
        alert('Access Denied. Redirecting to login.');
        window.location.href = '../index.html';
        return;
    }

    const authHeaders = {
        'Authorization': `Bearer ${token}`
    };

    // --- Logout Handler ---
    const logoutBtn = document.getElementById('logoutBtn');
    if(logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('access_token');
            localStorage.removeItem('is_admin');
            localStorage.removeItem('user_role');
            window.location.href = '../index.html';
        });
    }

    // --- Global Modal Functions ---
    window.openModal = function(modalId) {
        const m = document.getElementById(modalId);
        if(m) m.classList.add('active');
    };

    window.closeModal = function(modalId) {
        const m = document.getElementById(modalId);
        if(m) m.classList.remove('active');
    };

    // Close modal when clicking outside
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.classList.remove('active');
            }
        });
    });
});