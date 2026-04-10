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

    // --- Analytics Data Fetching & Charting ---
    async function loadAnalytics() {
        try {
            // Fetch platform stats
            const statsRes = await fetch('/admin/stats', { headers: authHeaders });
            if (!statsRes.ok) throw new Error('Failed to load stats');
            const stats = await statsRes.json();

            // Fetch users for detailed demographics
            const usersRes = await fetch('/admin/users', { headers: authHeaders });
            if (!usersRes.ok) throw new Error('Failed to load users');
            const users = await usersRes.json();

            // Calculate Role Distribution
            let adminCount = 0;
            let teacherCount = 0;
            let studentCount = 0;
            
            users.forEach(u => {
                if (u.is_admin) adminCount++;
                else if (u.is_teacher) teacherCount++;
                else studentCount++;
            });

            // Overview Bar Chart
            const overviewCtx = document.getElementById('overviewChart').getContext('2d');
            new Chart(overviewCtx, {
                type: 'bar',
                data: {
                    labels: ['Users', 'Documents'],
                    datasets: [{
                        label: 'Total Count',
                        data: [stats.total_users, stats.total_documents],
                        backgroundColor: [
                            'rgba(59, 130, 246, 0.5)', // blue
                            'rgba(239, 68, 68, 0.5)'  // red
                        ],
                        borderColor: [
                            'rgb(59, 130, 246)',
                            'rgb(239, 68, 68)'
                        ],
                        borderWidth: 1,
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    },
                    plugins: {
                        legend: { display: false }
                    }
                }
            });

            // Roles Distribution Pie Chart
            const rolesCtx = document.getElementById('rolesChart').getContext('2d');
            new Chart(rolesCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Admins', 'Teachers', 'Students'],
                    datasets: [{
                        data: [adminCount, teacherCount, studentCount],
                        backgroundColor: [
                            'rgba(239, 68, 68, 0.7)',  // red for admin
                            'rgba(16, 185, 129, 0.7)', // green for teacher
                            'rgba(59, 130, 246, 0.7)'  // blue for student
                        ],
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { position: 'bottom' }
                    }
                }
            });

        } catch (error) {
            console.error('Error loading analytics:', error);
            // Optionally handle error visually
        }
    }

    loadAnalytics();

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