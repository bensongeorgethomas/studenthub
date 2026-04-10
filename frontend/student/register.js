document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const submitBtn = document.getElementById('submitBtn');

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const department = document.getElementById('department').value;
        const passoutYear = document.getElementById('passoutYear').value;
        const idCardImage = document.getElementById('idCardImage').files[0];

        const formData = new FormData();
        formData.append('email', email);
        formData.append('password', password);
        formData.append('department', department);
        formData.append('passout_year', passoutYear);
        if (idCardImage) {
            formData.append('id_card_image', idCardImage);
        }

        const originalBtnText = submitBtn.textContent;
        submitBtn.textContent = 'Registering...';
        submitBtn.disabled = true;

        try {
            const response = await fetch('http://127.0.0.1:8000/register', {
                method: 'POST',
                body: formData // Let the browser set the Content-Type with boundary for FormData
            });

            const data = await response.json();

            if (response.ok) {
                alert('Registration successful! Please login.');
                window.location.href = 'login.html';
            } else {
                console.error('Error Response:', data);
                alert(data.detail || 'Registration failed.');
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
