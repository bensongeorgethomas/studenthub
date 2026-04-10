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

    async function fetchStats() {
        try {
            const res = await fetch('http://127.0.0.1:8000/admin/stats', { headers: authHeaders });
            if (res.status === 401 || res.status === 403) {
                 alert('Session expired or access denied.');
                 if(logoutBtn) logoutBtn.click();
                 return;
            }
            if (!res.ok) throw new Error('Failed to fetch stats');
            
            const data = await res.json();
            document.getElementById('totalUsersStat').textContent = data.total_users;
            document.getElementById('totalDocsStat').textContent = data.total_documents;
            document.getElementById('storageUsedStat').textContent = data.storage_used;
        } catch (error) {
            console.error(error);
            document.getElementById('totalUsersStat').textContent = 'Error';
            document.getElementById('totalDocsStat').textContent = 'Error';
            document.getElementById('storageUsedStat').textContent = 'Error';
        }
    }
    fetchStats();
});
