document.addEventListener('DOMContentLoaded', () => {
    const adminLoginForm = document.getElementById('adminLoginForm');
    const submitBtn = document.getElementById('submitBtn');
    if (!adminLoginForm || !submitBtn) {
        return;
    }

    const loginRole = adminLoginForm.dataset.loginRole || document.body.dataset.loginRole || 'admin';
    const redirectTarget = loginRole === 'teacher' ? 'teacher-dashboard.html' : 'dashboard.html';
    const roleLabel = loginRole === 'teacher' ? 'teacher' : 'admin';

    adminLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        const originalBtnText = submitBtn.textContent;
        submitBtn.textContent = 'Authenticating...';
        submitBtn.disabled = true;

        try {
            const formData = new URLSearchParams();
            formData.append('username', email); // FASTAPI OAuth2 format
            formData.append('password', password);

            const response = await fetch('http://127.0.0.1:8000/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                if (roleLabel === 'admin') {
                    // EXPLICIT ADMIN CHECK
                    if (data.is_admin === true) {
                        localStorage.setItem('access_token', data.access_token);
                        localStorage.setItem('is_admin', 'true');
                        localStorage.setItem('user_role', 'admin');
                        window.location.href = redirectTarget;
                    } else {
                        alert('Access Denied: You do not have administrator privileges.');
                        localStorage.removeItem('access_token');
                        localStorage.removeItem('is_admin');
                        localStorage.removeItem('user_role');
                    }
                } else if (roleLabel === 'teacher') {
                    if (data.is_teacher === true) {
                        localStorage.setItem('access_token', data.access_token);
                        localStorage.removeItem('is_admin');
                        localStorage.setItem('user_role', 'teacher');
                        window.location.href = redirectTarget;
                    } else {
                        alert('Access Denied: Teacher access requires staff approval.');
                        localStorage.removeItem('access_token');
                        localStorage.removeItem('is_admin');
                        localStorage.removeItem('user_role');
                    }
                }
            } else {
                console.error('Error Response:', data);
                alert(data.detail || 'Login failed. Please check your credentials.');
            }
        } catch (error) {
            console.error('Network Error:', error);
            alert('A network error occurred. Is the FastAPI server running?');
        } finally {
            submitBtn.textContent = originalBtnText;
            submitBtn.disabled = false;
        }
    });
});
