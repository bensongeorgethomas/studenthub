document.addEventListener('DOMContentLoaded', () => {
    // 1. Protection layer: Ensure user has token AND admin flag
    const token = localStorage.getItem('access_token');
    const isAdminFlag = localStorage.getItem('is_admin');

    if (!token || isAdminFlag !== 'true') {
        alert('Access Denied. Redirecting to login.');
        window.location.href = 'index.html';
        return;
    }

    const logoutBtn = document.getElementById('logoutBtn');

    // Logout handler
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('is_admin');
        window.location.href = 'index.html';
    });

    // In a full implementation, you'd fetch /admin/users or similar protected endpoints here
    // using the Bearer token.
});
